const views: any[] = [];
export const register = (v: any) => { if (!views.some(x => x.id === v.id)) views.push(v); };
export const list = () => views;
export const find = (id: string) => views.find(v => v.id === id) || views[0];
