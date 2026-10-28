const stores: any[] = [];
export const register = (s: any) => { if (!stores.some(x => x.id === s.id)) stores.push(s); };
export const list = () => stores;
export const find = (id: string) => stores.find(s => s.id === id && !s.soon);
