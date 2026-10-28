export const pushNote=(S,t)=>{S.notes.unshift({t,r:0});S.notes=S.notes.slice(0,20)};
