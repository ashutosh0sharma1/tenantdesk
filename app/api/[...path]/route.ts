import { NextRequest, NextResponse } from 'next/server';
import { allowAttempt, canAccess, createSession, database, removeSession, sessionUser, SESSION_SECONDS, updateProject, users, validPassword, visibleData } from '@/lib/store';
import type { Project } from '@/lib/types';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
const error=(message:string,status:number)=>json({error:message},status);
const safeId=(value:string)=>/^[a-z0-9-]{1,64}$/.test(value);
async function body(request:NextRequest){if(Number(request.headers.get('content-length')??0)>8192)throw new Error('Payload too large');const text=await request.text();if(text.length>8192)throw new Error('Payload too large');const result=JSON.parse(text);if(!result||typeof result!=='object'||Array.isArray(result))throw new Error('Invalid JSON object');return result as Record<string,unknown>;}
function allowedOrigin(request:NextRequest){const origins=process.env.TENANTDESK_ORIGIN?[process.env.TENANTDESK_ORIGIN]:['http://127.0.0.1:8808','http://localhost:8808'];return origins.includes(request.headers.get('origin')??'');}
async function handle(request:NextRequest,context:{params:Promise<{path:string[]}>}) {
  const parts=(await context.params).path;
  if(parts.some(p=>!safeId(p)))return error('Invalid resource identifier',400);
  const route=parts.join('/');
  const mutation=request.method!=='GET';
  if(mutation&&!allowedOrigin(request))return error('Request origin is not allowed',403);
  try {
    if(route==='login'&&request.method==='POST'){
      const input=await body(request);
      if(typeof input.email!=='string'||typeof input.password!=='string'||input.email.length>120||input.password.length>200)return error('Enter a valid email and password',400);
      const email=input.email.toLowerCase().trim();if(!allowAttempt(email))return error('Too many attempts. Try again in 15 minutes.',429);
      const valid=validPassword(input.password);const user=users.find(u=>u.email===email);
      if(!user||!valid)return error('Email or password is incorrect',401);
      const response=json({user});response.cookies.set('td_session',createSession(user),{httpOnly:true,sameSite:'strict',secure:false,path:'/',maxAge:SESSION_SECONDS});return response;
    }
    const token=request.cookies.get('td_session')?.value;
    const user=sessionUser(token);
    if(!user)return error('Please sign in to continue',401);
    if(route==='logout'&&request.method==='POST'){removeSession(token);const response=json({ok:true});response.cookies.set('td_session','',{httpOnly:true,sameSite:'strict',path:'/',maxAge:0});return response;}
    if(route==='me'&&request.method==='GET')return json({user});
    if(route==='projects'&&request.method==='GET')return json(visibleData(user));
    if(parts[0]==='projects'&&parts.length===2&&request.method==='GET'){
      const project=database().projects.find(p=>p.id===parts[1]);if(!project)return error('Project not found',404);if(!canAccess(user,project))return error('You do not have access to this project',403);return json({project});
    }
    if(parts[0]==='files'&&parts.length===2&&request.method==='GET'){
      const project=database().projects.find(p=>p.files.some(f=>f.id===parts[1]));if(!project)return error('File not found',404);if(!canAccess(user,project))return error('You do not have access to this file',403);const file=project.files.find(f=>f.id===parts[1])!;
      const content=file.kind==='CSV'?`item,status,project\nSynthetic planning example,For demonstration,${project.name}\nReview deliverables,Pending,${project.name}\n`:`TENANTDESK — SYNTHETIC DEMONSTRATION FILE\n\n${file.name}\nProject: ${project.name}\nClient: ${project.tenant}\n\n${project.description}\n\nThis is fictional portfolio content, not a real client deliverable.\n`;
      return new NextResponse(content,{headers:{'Content-Type':file.kind==='CSV'?'text/csv; charset=utf-8':'text/plain; charset=utf-8','Content-Disposition':`attachment; filename="${file.name}"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    }
    if(parts[0]==='admin'){
      if(user.role!=='admin')return error('Administrator access is required',403);
      if(route==='admin/clients'&&request.method==='GET')return json({clients:users.filter(u=>u.role==='client')});
      if(parts[1]==='projects'&&parts.length===3&&request.method==='PATCH'){
        const input=await body(request);const keys=Object.keys(input);if(keys.some(k=>!['status','progress','priority'].includes(k)))return error('Only status, progress, and priority can be updated',400);
        if(!['In progress','In review','Completed','On hold'].includes(input.status as string)||!['Normal','High'].includes(input.priority as string)||typeof input.progress!=='number'||!Number.isInteger(input.progress)||input.progress<0||input.progress>100)return error('Choose a valid status, priority, and progress from 0 to 100',400);
        if(input.status==='Completed'&&input.progress!==100)return error('Completed projects must have 100% progress',400);
        const project=updateProject(user,parts[2],input as Pick<Project,'status'|'progress'|'priority'>);if(!project)return error('Project not found',404);return json({project});
      }
    }
    return error('Resource not found',404);
  }catch(cause){if(cause instanceof SyntaxError||cause instanceof Error&&['Invalid JSON object','Payload too large'].includes(cause.message))return error(cause instanceof Error?cause.message:'Invalid request',400);console.error('TenantDesk request failed',cause instanceof Error?cause.message:'Unknown error');return error('The request could not be completed',500);}
}
export {handle as GET,handle as POST,handle as PATCH};
