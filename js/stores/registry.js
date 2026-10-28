const stores=[];
export const register=s=>{if(!stores.some(x=>x.id===s.id))stores.push(s)};
export const list=()=>stores;
export const find=id=>stores.find(s=>s.id===id&&!s.soon);
