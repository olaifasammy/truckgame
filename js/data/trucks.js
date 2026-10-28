export const TRAILERS={box:'Box trailer',tipper:'Tipper',carrier:'Car carrier',hazmat:'Hazmat tanker'};
export const MODELS={
 s1:{name:'Hauler S1',cls:'Medium-duty tractor',price:12000,speed:1,wear:1,haul:['box','tipper','carrier'],
  spec:{axle:'4x2',engine:'8.0 L I6 diesel',power:380,torque:1800,trans:'9-speed manual',gvw:18,payload:12,tank:400,cons:30,emis:'Euro 5'}},
 r2:{name:'Ranger R2',cls:'Heavy-duty tractor',price:30000,speed:1.2,wear:.8,haul:['box','tipper','carrier','hazmat'],
  spec:{axle:'6x4',engine:'11.9 L I6 diesel',power:450,torque:2200,trans:'12-speed AMT',gvw:40,payload:26,tank:600,cons:33,emis:'Euro 6'}},
 h3:{name:'Titan H3',cls:'Long-haul flagship',price:75000,speed:1.4,wear:.6,haul:['box','tipper','carrier','hazmat'],
  spec:{axle:'6x4',engine:'15.6 L V8 diesel',power:620,torque:3000,trans:'16-speed AMT',gvw:60,payload:38,tank:900,cons:36,emis:'Euro 6'}},
 actros:{name:'Mercedes-Benz Actros 1863',cls:'Heavy-duty tractor',price:45000,speed:1.25,wear:.75,haul:['box','tipper','carrier','hazmat'],
  spec:{axle:'4x2',engine:'15.6 L OM 473 diesel',power:625,torque:3000,trans:'12-speed PowerShift',gvw:40,payload:26,tank:800,cons:32,emis:'Euro 6'}},
 fh16:{name:'Volvo FH16 750',cls:'Long-haul flagship',price:95000,speed:1.45,wear:.55,haul:['box','tipper','carrier','hazmat'],
  spec:{axle:'6x4',engine:'16.1 L D16K diesel',power:750,torque:3550,trans:'12-speed I-Shift',gvw:65,payload:42,tank:950,cons:37,emis:'Euro 6'}},
 scania:{name:'Scania R730 V8',cls:'Heavy transport tractor',price:88000,speed:1.42,wear:.58,haul:['box','tipper','carrier','hazmat'],
  spec:{axle:'6x4',engine:'16.4 L V8 DC16 diesel',power:730,torque:3500,trans:'12-speed Opticruise',gvw:60,payload:40,tank:900,cons:38,emis:'Euro 6'}},
 man:{name:'MAN TGX 18.560',cls:'Heavy-duty tractor',price:52000,speed:1.28,wear:.72,haul:['box','tipper','carrier','hazmat'],
  spec:{axle:'4x2',engine:'15.2 L D3876 diesel',power:560,torque:2800,trans:'12-speed TipMatic',gvw:42,payload:28,tank:750,cons:31,emis:'Euro 6'}},
 daf:{name:'DAF XF 530',cls:'Long-haul tractor',price:48000,speed:1.22,wear:.78,haul:['box','tipper','carrier','hazmat'],
  spec:{axle:'4x2',engine:'12.9 L PACCAR MX-13',power:530,torque:2600,trans:'12-speed TraXon',gvw:44,payload:29,tank:850,cons:30,emis:'Euro 6'}}};
export const UPGRADES={
 engine:{label:'Engine tune',desc:'+6% speed per level',base:4000},
 tires:{label:'Tires & axles',desc:'-8% wear per level',base:3000},
 eco:{label:'Fuel system',desc:'-7% fuel use per level',base:3500}};
export const MAX_UP=3;
