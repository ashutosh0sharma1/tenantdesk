export type User = {id:string; name:string; email:string; role:'admin'|'client'; company:string; initials:string};
export type Project = {id:string; tenant:string; name:string; category:string; description:string; status:'In progress'|'In review'|'Completed'|'On hold'; progress:number; priority:'Normal'|'High'; due:string; color:string; initials:string; files:{id:string; name:string; kind:string; size:string; date:string}[]; milestones:{name:string; done:boolean; date:string}[]};
export type Activity = {id:string; projectId:string; actor:string; text:string; at:string};
