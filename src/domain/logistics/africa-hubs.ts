import { RegionalHub } from './network';

export const AFRICA_REGIONAL_HUBS: RegionalHub[] = [
  // 1. Nigeria (Existing hubs + new ones)
  {
    id: 'hub_lagos',
    name: 'Lagos Atlantic Gateway Terminal',
    city: 'LAGOS',
    region: 'Africa',
    cost: 125000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Atlantic coastal industrial hub powering continental trade corridors.',
    icon: '⚓'
  },
  {
    id: 'hub_abuja',
    name: 'Abuja Federal Freight Depot',
    city: 'ABUJA',
    region: 'Africa',
    cost: 110000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Central dry port logistics depot serving FCT industrial zones.',
    icon: '🏛️'
  },
  {
    id: 'hub_kano',
    name: 'Kano Trans-Sahel Commercial Terminal',
    city: 'KANO',
    region: 'Africa',
    cost: 135000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Northern rail-road terminus linking commercial agriculture and livestock.',
    icon: '🏜️'
  },

  // 2. Algeria
  {
    id: 'hub_algiers',
    name: 'Algiers Mediterranean Hub',
    city: 'ALGIERS',
    region: 'Africa',
    cost: 130000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Major North African shipping and maritime logistics center.',
    icon: '🚢'
  },

  // 3. Angola
  {
    id: 'hub_luanda',
    name: 'Luanda Petroleum & Freight Terminal',
    city: 'LUANDA',
    region: 'Africa',
    cost: 125000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Atlantic coastal capital and petroleum logistics hub.',
    icon: '⛽'
  },

  // 4. Benin
  {
    id: 'hub_cotonou',
    name: 'Cotonou Deep-Water Port Hub',
    city: 'COTONOU',
    region: 'Africa',
    cost: 115000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Vital West African deep-water port and transit gateway.',
    icon: '⚓'
  },

  // 5. Botswana
  {
    id: 'hub_gaborone',
    name: 'Gaborone Kalahari Freight Center',
    city: 'GABORONE',
    region: 'Africa',
    cost: 115000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Mineral-rich plateau transit and distribution terminal.',
    icon: '💎'
  },

  // 6. Burkina Faso
  {
    id: 'hub_ouagadougou',
    name: 'Ouagadougou Sahel Transport Hub',
    city: 'OUAGADOUGOU',
    region: 'Africa',
    cost: 110000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Inland Sahelian transport nexus connecting West African trade.',
    icon: '🚛'
  },

  // 7. Burundi
  {
    id: 'hub_bujumbura',
    name: 'Bujumbura Tanganyika Depot',
    city: 'BUJUMBURA',
    region: 'Africa',
    cost: 105000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Lake Tanganyika port and highland mountain pass terminal.',
    icon: '🌊'
  },

  // 8. Cabo Verde
  {
    id: 'hub_praia',
    name: 'Praia Atlantic Island Terminal',
    city: 'PRAIA',
    region: 'Africa',
    cost: 100000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Atlantic island maritime and shipping hub.',
    icon: '🏝️'
  },

  // 9. Cameroon
  {
    id: 'hub_douala',
    name: 'Douala Seaport Logistics Hub',
    city: 'DOUALA',
    region: 'Africa',
    cost: 120000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Primary economic engine and seaport of Cameroon.',
    icon: '🚢'
  },

  // 10. Central African Republic
  {
    id: 'hub_bangui',
    name: 'Bangui Ubangi River Terminal',
    city: 'BANGUI',
    region: 'Africa',
    cost: 105000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Central continental river port and logistics node.',
    icon: '🛶'
  },

  // 11. Chad
  {
    id: 'hub_ndJAMENA',
    name: "N'Djamena Sahel Logistics Hub",
    city: 'NDJAMENA',
    region: 'Africa',
    cost: 110000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Chari river port city on the southern edge of the Sahara.',
    icon: '🏜️'
  },

  // 12. Comoros
  {
    id: 'hub_moroni',
    name: 'Moroni Island Port Terminal',
    city: 'MORONI',
    region: 'Africa',
    cost: 95000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Volcanic island capital port on Grande Comore.',
    icon: '🌋'
  },

  // 13. Congo
  {
    id: 'hub_brazzaville',
    name: 'Brazzaville Congo River Terminal',
    city: 'BRAZZAVILLE',
    region: 'Africa',
    cost: 115000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Congo river capital and central trade transit depot.',
    icon: '🌊'
  },

  // 14. Democratic Republic of the Congo
  {
    id: 'hub_kinshasa',
    name: 'Kinshasa Mega-City Freight Hub',
    city: 'KINSHASA',
    region: 'Africa',
    cost: 130000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Vast central African river port and industrial depot.',
    icon: '📦'
  },

  // 15. Djibouti
  {
    id: 'hub_djibouti_city',
    name: 'Djibouti Red Sea Gateway',
    city: 'DJIBOUTI_CITY',
    region: 'Africa',
    cost: 125000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Strategic Bab-el-Mandeb Red Sea transit and shipping hub.',
    icon: '⚓'
  },

  // 16. Egypt
  {
    id: 'hub_cairo',
    name: 'Cairo Nile Logistics Nexus',
    city: 'CAIRO',
    region: 'Africa',
    cost: 140000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Nile metropolis and major North African trade crossroads.',
    icon: '🏛️'
  },

  // 17. Equatorial Guinea
  {
    id: 'hub_malabo',
    name: 'Malabo Gulf Terminal',
    city: 'MALABO',
    region: 'Africa',
    cost: 110000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Volcanic island capital and oil-sector logistics port.',
    icon: '⛽'
  },

  // 18. Eritrea
  {
    id: 'hub_asmara',
    name: 'Asmara Highland Freight Depot',
    city: 'ASMARA',
    region: 'Africa',
    cost: 105000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Highland plateau transport hub connected to Red Sea ports.',
    icon: '⛰️'
  },

  // 19. Eswatini
  {
    id: 'hub_mbabane',
    name: 'Mbabane Highveld Terminal',
    city: 'MBABANE',
    region: 'Africa',
    cost: 100000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Highveld administrative capital and southern trade link.',
    icon: '🏔️'
  },

  // 20. Ethiopia
  {
    id: 'hub_addis_ababa',
    name: 'Addis Ababa Continental Hub',
    city: 'ADDIS_ABABA',
    region: 'Africa',
    cost: 130000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Highland diplomatic capital and East African freight hub.',
    icon: '🌐'
  },

  // 21. Gabon
  {
    id: 'hub_libreville',
    name: 'Libreville Timber & Port Terminal',
    city: 'LIBREVILLE',
    region: 'Africa',
    cost: 115000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Atlantic coastal capital and timber/oil export port.',
    icon: '🌲'
  },

  // 22. Gambia
  {
    id: 'hub_banjul',
    name: 'Banjul Estuary Freight Port',
    city: 'BANJUL',
    region: 'Africa',
    cost: 100000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Atlantic coastal estuary port and trade gateway.',
    icon: '⚓'
  },

  // 23. Ghana
  {
    id: 'hub_accra',
    name: 'Accra Atlantic Gateway Hub',
    city: 'ACCRA',
    region: 'Africa',
    cost: 120000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Major West African Atlantic port and commercial linehaul hub.',
    icon: '🚢'
  },

  // 24. Guinea
  {
    id: 'hub_conakry',
    name: 'Conakry Bauxite & Port Hub',
    city: 'CONAKRY',
    region: 'Africa',
    cost: 115000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Atlantic port capital and major bauxite export terminal.',
    icon: '⚓'
  },

  // 25. Guinea-Bissau
  {
    id: 'hub_bissau',
    name: 'Bissau Estuarine Terminal',
    city: 'BISSAU',
    region: 'Africa',
    cost: 100000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Atlantic estuarine port and agricultural distribution hub.',
    icon: '📦'
  },

  // 26. Ivory Coast
  {
    id: 'hub_abidjan',
    name: 'Abidjan Lagoon Port Terminal',
    city: 'ABIDJAN',
    region: 'Africa',
    cost: 125000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Economic capital and major West African lagoon seaport.',
    icon: '⚓'
  },

  // 27. Kenya
  {
    id: 'hub_nairobi',
    name: 'Nairobi East African Logistics Hub',
    city: 'NAIROBI',
    region: 'Africa',
    cost: 130000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'East African economic powerhouse and inland cargo hub.',
    icon: '🦒'
  },

  // 28. Lesotho
  {
    id: 'hub_maseru',
    name: 'Maseru Mountain Freight Depot',
    city: 'MASERU',
    region: 'Africa',
    cost: 100000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Mountain capital city terminal on the Caledon River.',
    icon: '⛰️'
  },

  // 29. Liberia
  {
    id: 'hub_monrovia',
    name: 'Monrovia Free Port Terminal',
    city: 'MONROVIA',
    region: 'Africa',
    cost: 110000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Atlantic coastal free port and rubber/mineral export hub.',
    icon: '⚓'
  },

  // 30. Libya
  {
    id: 'hub_tripoli',
    name: 'Tripoli Mediterranean Port Hub',
    city: 'TRIPOLI',
    region: 'Africa',
    cost: 120000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'North African Mediterranean trade and shipping port.',
    icon: '🚢'
  },

  // 31. Madagascar
  {
    id: 'hub_antananarivo',
    name: 'Antananarivo Plateau Terminal',
    city: 'ANTANANARIVO',
    region: 'Africa',
    cost: 115000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Highland plateau capital and island distribution center.',
    icon: '📦'
  },

  // 32. Malawi
  {
    id: 'hub_lilongwe',
    name: 'Lilongwe Central Plateau Hub',
    city: 'LILONGWE',
    region: 'Africa',
    cost: 110000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Central plateau capital and agricultural trade center.',
    icon: '🌾'
  },

  // 33. Mali
  {
    id: 'hub_bamako',
    name: 'Bamako Niger River Terminal',
    city: 'BAMAKO',
    region: 'Africa',
    cost: 110000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Niger river capital and regional transit center.',
    icon: '🌊'
  },

  // 34. Mauritania
  {
    id: 'hub_nouakchott',
    name: 'Nouakchott Atlantic Port Terminal',
    city: 'NOUAKCHOTT',
    region: 'Africa',
    cost: 110000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Atlantic coastal capital and Saharan trade hub.',
    icon: '⚓'
  },

  // 35. Mauritius
  {
    id: 'hub_port_louis',
    name: 'Port Louis Island Harbor Hub',
    city: 'PORT_LOUIS',
    region: 'Africa',
    cost: 105000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Indian Ocean island capital and commercial harbor.',
    icon: '🏝️'
  },

  // 36. Morocco
  {
    id: 'hub_casablanca',
    name: 'Casablanca Atlantic Port Terminal',
    city: 'CASABLANCA',
    region: 'Africa',
    cost: 135000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Major Atlantic commercial port and industrial metropolis.',
    icon: '🚢'
  },

  // 37. Mozambique
  {
    id: 'hub_maputo',
    name: 'Maputo Indian Ocean Port',
    city: 'MAPUTO',
    region: 'Africa',
    cost: 120000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Southern Indian Ocean port capital and transit hub.',
    icon: '⚓'
  },

  // 38. Namibia
  {
    id: 'hub_windhoek',
    name: 'Windhoek Plateau Freight Terminal',
    city: 'WINDHOEK',
    region: 'Africa',
    cost: 115000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Highland plateau capital and desert corridor logistics hub.',
    icon: '🏜️'
  },

  // 39. Niger
  {
    id: 'hub_niamey',
    name: 'Niamey Sahel Crossroads Hub',
    city: 'NIAMEY',
    region: 'Africa',
    cost: 110000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Niger river capital and Sahelian trade crossroads.',
    icon: '🐪'
  },

  // 40. Rwanda
  {
    id: 'hub_kigali',
    name: 'Kigali Highland Freight Terminal',
    city: 'KIGALI',
    region: 'Africa',
    cost: 115000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'The Land of a Thousand Hills capital and distribution hub.',
    icon: '⛰️'
  },

  // 41. Sao Tome and Principe
  {
    id: 'hub_sao_tome',
    name: 'São Tomé Island Port Terminal',
    city: 'SAO_TOME',
    region: 'Africa',
    cost: 95000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Equatorial island port and maritime terminal.',
    icon: '🏝️'
  },

  // 42. Senegal
  {
    id: 'hub_dakar',
    name: 'Dakar Atlantic Gateway Terminal',
    city: 'DAKAR',
    region: 'Africa',
    cost: 120000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Westernmost Atlantic seaport and major shipping hub.',
    icon: '⚓'
  },

  // 43. Seychelles
  {
    id: 'hub_victoria',
    name: 'Victoria Island Port Hub',
    city: 'VICTORIA',
    region: 'Africa',
    cost: 100000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Compact island capital and Indian Ocean maritime station.',
    icon: '🏝️'
  },

  // 44. Sierra Leone
  {
    id: 'hub_freetown',
    name: 'Freetown Natural Harbor Terminal',
    city: 'FREETOWN',
    region: 'Africa',
    cost: 110000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Atlantic coastal estuary natural harbor and shipping port.',
    icon: '⚓'
  },

  // 45. Somalia
  {
    id: 'hub_mogadishu',
    name: 'Mogadishu Coastal Port Terminal',
    city: 'MOGADISHU',
    region: 'Africa',
    cost: 115000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Indian Ocean coastal capital and regional trade port.',
    icon: '🌊'
  },

  // 46. South Africa
  {
    id: 'hub_johannesburg',
    name: 'Johannesburg Central Logistics Hub',
    city: 'JOHANNESBURG',
    region: 'Africa',
    cost: 140000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Economic heartland and gold mining metropolis freight terminal.',
    icon: '🪙'
  },

  // 47. South Sudan
  {
    id: 'hub_juba',
    name: 'Juba White Nile Freight Depot',
    city: 'JUBA',
    region: 'Africa',
    cost: 105000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'White Nile port capital and southern trade nexus.',
    icon: '🛶'
  },

  // 48. Sudan
  {
    id: 'hub_khartoum',
    name: 'Khartoum Nile Confluence Terminal',
    city: 'KHARTOUM',
    region: 'Africa',
    cost: 120000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Confluence of the Blue and White Nile trade capital.',
    icon: '🏛️'
  },

  // 49. Tanzania
  {
    id: 'hub_dar_es_salaam',
    name: 'Dar es Salaam Indian Ocean Hub',
    city: 'DAR_ES_SALAAM',
    region: 'Africa',
    cost: 125000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Major Indian Ocean port and commercial trade capital.',
    icon: '⚓'
  },

  // 50. Togo
  {
    id: 'hub_lome',
    name: 'Lomé Deep-Water Port Hub',
    city: 'LOME',
    region: 'Africa',
    cost: 115000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Deep-water Atlantic port and regional transit hub.',
    icon: '🚢'
  },

  // 51. Tunisia
  {
    id: 'hub_tunis',
    name: 'Tunis Mediterranean Port Hub',
    city: 'TUNIS',
    region: 'Africa',
    cost: 120000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Mediterranean northern capital and shipping port.',
    icon: '⚓'
  },

  // 52. Uganda
  {
    id: 'hub_kampala',
    name: 'Kampala Victoria Basin Terminal',
    city: 'KAMPALA',
    region: 'Africa',
    cost: 120000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Lake Victoria basin capital and logistics distribution center.',
    icon: '📦'
  },

  // 53. Zambia
  {
    id: 'hub_lusaka',
    name: 'Lusaka Plateau Crossroads Terminal',
    city: 'LUSAKA',
    region: 'Africa',
    cost: 115000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Southern African plateau capital and central transport crossroads.',
    icon: '🚛'
  },

  // 54. Zimbabwe
  {
    id: 'hub_harare',
    name: 'Harare Highveld Freight Terminal',
    city: 'HARARE',
    region: 'Africa',
    cost: 120000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Highveld capital and commercial agricultural market terminal.',
    icon: '🌾'
  }
];
