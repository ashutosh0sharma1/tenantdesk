import fs from 'node:fs';
import path from 'node:path';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Activity, Project, User } from './types';

export const users: User[] = [
  {id:'admin',name:'Alex Morgan',email:'admin@tenantdesk.demo',role:'admin',company:'TenantDesk Studio',initials:'AM'},
  {id:'northstar',name:'Jamie Chen',email:'jamie@northstar.demo',role:'client',company:'Northstar Studio',initials:'JC'},
  {id:'meridian',name:'Sam Rivera',email:'sam@meridian.demo',role:'client',company:'Meridian Labs',initials:'SR'},
];
export const DEMO_PASSWORD = 'DemoAccess!2026';
const salt = 'tenantdesk-public-synthetic-demo';
const passwordHash = scryptSync(DEMO_PASSWORD,salt,64);
export function validPassword(password:string) { const test=scryptSync(password,salt,64); return timingSafeEqual(test,passwordHash); }
const seed: Project[] = [
  {id:'brand-refresh',tenant:'northstar',name:'Brand identity refresh',category:'BRAND & STRATEGY',description:'A fresh visual language for Northstar’s next chapter. Strategy, identity, and a complete system built to grow with your team.',status:'In review',progress:82,priority:'High',due:'Nov 12, 2026',color:'violet',initials:'Br',files:[{id:'brand-guidelines',name:'Brand guidelines v2.txt',kind:'TXT',size:'1 KB',date:'Nov 02, 2026'},{id:'brand-directions',name:'Creative directions.csv',kind:'CSV',size:'1 KB',date:'Oct 30, 2026'}],milestones:[{name:'Discovery & positioning',done:true,date:'Oct 18'},{name:'Visual exploration',done:true,date:'Oct 25'},{name:'Identity review',done:false,date:'Nov 06'},{name:'Final brand handoff',done:false,date:'Nov 12'}]},
  {id:'website-experience',tenant:'northstar',name:'Website experience',category:'DESIGN & DEVELOPMENT',description:'A considered digital home for the Northstar brand, with accessible components and a fast, responsive experience.',status:'In progress',progress:56,priority:'Normal',due:'Nov 20, 2026',color:'blue',initials:'We',files:[{id:'website-scope',name:'Website project scope.txt',kind:'TXT',size:'1 KB',date:'Nov 01, 2026'}],milestones:[{name:'Sitemap & content',done:true,date:'Oct 21'},{name:'Interface design',done:true,date:'Oct 30'},{name:'Development',done:false,date:'Nov 12'},{name:'Quality assurance',done:false,date:'Nov 20'}]},
  {id:'launch-campaign',tenant:'northstar',name:'Launch campaign',category:'CONTENT & MARKETING',description:'A clear story and a coordinated launch. Campaign messaging, a channel plan, and reusable content templates.',status:'In progress',progress:34,priority:'Normal',due:'Nov 28, 2026',color:'orange',initials:'Lc',files:[{id:'launch-plan',name:'Launch channel plan.csv',kind:'CSV',size:'1 KB',date:'Oct 29, 2026'}],milestones:[{name:'Campaign strategy',done:true,date:'Oct 28'},{name:'Messaging system',done:false,date:'Nov 08'},{name:'Content production',done:false,date:'Nov 18'},{name:'Launch handoff',done:false,date:'Nov 28'}]},
  {id:'product-platform',tenant:'meridian',name:'Product platform',category:'PRODUCT & ENGINEERING',description:'A streamlined operations dashboard for Meridian Labs with clear reporting and a modular interface.',status:'In progress',progress:67,priority:'High',due:'Nov 16, 2026',color:'green',initials:'Pp',files:[{id:'platform-spec',name:'Platform specification.txt',kind:'TXT',size:'1 KB',date:'Nov 02, 2026'}],milestones:[{name:'Requirements',done:true,date:'Oct 14'},{name:'Core workflows',done:true,date:'Oct 27'},{name:'Integration review',done:false,date:'Nov 09'},{name:'Release candidate',done:false,date:'Nov 16'}]},
  {id:'research-library',tenant:'meridian',name:'Research library',category:'RESEARCH & INSIGHTS',description:'A searchable knowledge library that turns research findings into useful, shared team insights.',status:'Completed',progress:100,priority:'Normal',due:'Oct 31, 2026',color:'rose',initials:'Rl',files:[{id:'research-summary',name:'Research summary.txt',kind:'TXT',size:'1 KB',date:'Oct 31, 2026'}],milestones:[{name:'Interviews',done:true,date:'Oct 09'},{name:'Synthesis',done:true,date:'Oct 18'},{name:'Library build',done:true,date:'Oct 26'},{name:'Team handoff',done:true,date:'Oct 31'}]},
];
type Database = {version:1;projects:Project[];activity:Activity[]};
const dir=path.join(process.cwd(),'.data');
const filename=path.join(dir,'tenantdesk.json');
const initial:Database={version:1,projects:seed,activity:[
  {id:'a1',projectId:'brand-refresh',actor:'Alex Morgan',text:'shared Brand guidelines v2 for your review',at:'2026-11-03T08:20:00.000Z'},
  {id:'a2',projectId:'website-experience',actor:'Alex Morgan',text:'completed the interface design milestone',at:'2026-11-02T15:10:00.000Z'},
  {id:'a3',projectId:'launch-campaign',actor:'Alex Morgan',text:'added the launch channel plan',at:'2026-11-02T11:30:00.000Z'},
  {id:'a4',projectId:'product-platform',actor:'Alex Morgan',text:'updated product platform progress to 67%',at:'2026-11-02T09:30:00.000Z'},
]};
function write(db:Database) { fs.mkdirSync(dir,{recursive:true}); const temp=filename+'.'+randomBytes(6).toString('hex')+'.tmp'; fs.writeFileSync(temp,JSON.stringify(db,null,2),{mode:0o600}); fs.renameSync(temp,filename); }
export function database():Database { if(!fs.existsSync(filename)) write(initial); const db=JSON.parse(fs.readFileSync(filename,'utf8')); if(db.version!==1||!Array.isArray(db.projects)||!Array.isArray(db.activity)) throw new Error('Invalid local data file'); return db; }
export function canAccess(user:User,project:Project) { return user.role==='admin'||user.id===project.tenant; }
export function visibleData(user:User) { const db=database();const projects=db.projects.filter(p=>canAccess(user,p));const ids=new Set(projects.map(p=>p.id));return {projects,activity:db.activity.filter(a=>ids.has(a.projectId)).slice(0,20)}; }
export function updateProject(user:User,id:string,patch:Pick<Project,'status'|'progress'|'priority'>) { const db=database();const item=db.projects.find(p=>p.id===id);if(!item)return null;Object.assign(item,patch);db.activity.unshift({id:randomBytes(8).toString('hex'),projectId:id,actor:user.name,text:`updated the project: ${patch.status.toLowerCase()}, ${patch.progress}% complete`,at:new Date().toISOString()});db.activity=db.activity.slice(0,200);write(db);return item; }
type Session={userId:string;expires:number};
const globalSessions=globalThis as typeof globalThis & {tenantdeskSessions?:Map<string,Session>;tenantdeskAttempts?:Map<string,{count:number;until:number}>};
const sessions=globalSessions.tenantdeskSessions??=new Map<string,Session>();
const attempts=globalSessions.tenantdeskAttempts??=new Map<string,{count:number;until:number}>();
export const SESSION_SECONDS=60*60*8;
export function createSession(user:User){for(const [key,session] of sessions)if(session.expires<Date.now())sessions.delete(key);const token=randomBytes(32).toString('hex');sessions.set(token,{userId:user.id,expires:Date.now()+SESSION_SECONDS*1000});return token;}
export function sessionUser(token:string|undefined){if(!token)return null;const session=sessions.get(token);if(!session)return null;if(session.expires<Date.now()){sessions.delete(token);return null;}return users.find(u=>u.id===session.userId)??null;}
export function removeSession(token:string|undefined){if(token)sessions.delete(token);}
export function allowAttempt(email:string){const now=Date.now();for(const[key,entry]of attempts)if(entry.until<now)attempts.delete(key);const current=attempts.get(email);if(current&&current.count>=12)return false;attempts.set(email,{count:(current?.count??0)+1,until:current?.until??now+15*60*1000});return true;}
