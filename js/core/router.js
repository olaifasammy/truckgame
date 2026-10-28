const views=[];
export const register=v=>{if(!views.some(x=>x.id===v.id))views.push(v)};
export const list=()=>views;
export const find=id=>views.find(v=>v.id===id)||views[0];
