export const BASE_SLOTS=3;
export const PERKS={
 fuelcard:{label:'Fuel card',desc:'Fuel price -6% per level',icon:'fuel',base:5000,max:3,per:.06},
 service:{label:'Service contract',desc:'Repair cost -6% per level',icon:'wrench',base:6000,max:3,per:.06},
 scanner:{label:'Diagnostic scanner',desc:'Inspection cost -25% per level',icon:'search',base:3000,max:3,per:.25}};
export const OFFICES={
 lagos:{name:'Lagos Depot',city:'LAGOS',price:25000,slots:3,vip:0},
 ibadan:{name:'Ibadan Depot',city:'IBADAN',price:40000,slots:3,vip:5},
 kano:{name:'Kano Hub',city:'KANO',price:60000,slots:4,vip:7},
 maiduguri:{name:'Maiduguri Hub',city:'MAIDUGURI',price:90000,slots:5,vip:8}};
export const GOLD={
 refresh:{label:'Refresh job board',desc:'Roll a new set of offers',cost:1,icon:'pin'},
 vipjobs:{label:'VIP freight pass',desc:'Adds 2 VIP jobs to the board',cost:2,icon:'box'},
 xp:{label:'XP boost',desc:'+400 experience',cost:3,icon:'up'}};
export const EXCH=15000;
