import { LocationInfo } from '../world';

export const AFRICA_PART_1_LOCATIONS: Record<string, LocationInfo> = {
  // 1. Algeria
  ALGIERS: {
    name: 'Algiers',
    region: 'Africa',
    country: 'Algeria',
    coords: [120, 40],
    latLng: [36.7538, 3.0588],
    elevation: 20,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 22,
    roadGrade: 3.1,
    description: 'Mediterranean capital and major North African shipping port.'
  },
  ORAN: {
    name: 'Oran',
    region: 'Africa',
    country: 'Algeria',
    coords: [105, 42],
    latLng: [35.6971, -0.6309],
    elevation: 90,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 23,
    roadGrade: 2.0,
    description: 'Major industrial port and commercial hub of western Algeria.'
  },

  // 2. Angola
  LUANDA: {
    name: 'Luanda',
    region: 'Africa',
    country: 'Angola',
    coords: [150, 240],
    latLng: [-8.8390, 13.2894],
    elevation: 60,
    typicalWeather: 'rain',
    terrain: 'wet_pavement',
    avgTemp: 26,
    roadGrade: 1.5,
    description: 'Atlantic coastal capital and petroleum logistics hub.'
  },
  LOBITO: {
    name: 'Lobito',
    region: 'Africa',
    country: 'Angola',
    coords: [145, 260],
    latLng: [-12.3644, 13.5383],
    elevation: 15,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 25,
    roadGrade: 1.2,
    description: 'Strategic Atlantic terminus of the Benguela railway corridor.'
  },

  // 3. Benin
  COTONOU: {
    name: 'Cotonou',
    region: 'Africa',
    country: 'Benin',
    coords: [125, 165],
    latLng: [6.3654, 2.4183],
    elevation: 7,
    typicalWeather: 'rain',
    terrain: 'wet_pavement',
    avgTemp: 31,
    roadGrade: 0.4,
    description: 'Vital West African deep-water port city.'
  },
  PORTO_NOVO: {
    name: 'Porto-Novo',
    region: 'Africa',
    country: 'Benin',
    coords: [130, 166],
    latLng: [6.4969, 2.6288],
    elevation: 35,
    typicalWeather: 'rain',
    terrain: 'highway',
    avgTemp: 30,
    roadGrade: 1.0,
    description: 'Official historic capital near the Nokoué lake.'
  },

  // 4. Botswana
  GABORONE: {
    name: 'Gaborone',
    region: 'Africa',
    country: 'Botswana',
    coords: [180, 310],
    latLng: [-24.6282, 25.9231],
    elevation: 1014,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 24,
    roadGrade: 1.1,
    description: 'Capital city surrounded by mineral-rich Kalahari plateau routes.'
  },
  FRANCISTOWN: {
    name: 'Francistown',
    region: 'Africa',
    country: 'Botswana',
    coords: [195, 295],
    latLng: [-21.1736, 27.5057],
    elevation: 1001,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 23,
    roadGrade: 0.9,
    description: 'Northern mining and railway transit city of Botswana.'
  },

  // 5. Burkina Faso
  OUAGADOUGOU: {
    name: 'Ouagadougou',
    region: 'Africa',
    country: 'Burkina Faso',
    coords: [115, 130],
    latLng: [12.3714, -1.5197],
    elevation: 305,
    typicalWeather: 'heatwave',
    terrain: 'desert_corridor',
    avgTemp: 34,
    roadGrade: 0.8,
    description: 'Inland Sahelian transport nexus and capital.'
  },
  BOBO_DIOULASSO: {
    name: 'Bobo-Dioulasso',
    region: 'Africa',
    country: 'Burkina Faso',
    coords: [105, 138],
    latLng: [11.1771, -4.2979],
    elevation: 450,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 32,
    roadGrade: 1.2,
    description: 'Economic and agricultural hub of western Burkina Faso.'
  },

  // 6. Burundi
  BUJUMBURA: {
    name: 'Bujumbura',
    region: 'Africa',
    country: 'Burundi',
    coords: [220, 230],
    latLng: [-3.3614, 29.3599],
    elevation: 785,
    typicalWeather: 'rain',
    terrain: 'mountain_pass',
    avgTemp: 24,
    roadGrade: 5.2,
    description: 'Major port city on Lake Tanganyika surrounded by rugged mountain passes.'
  },
  GITEGA: {
    name: 'Gitega',
    region: 'Africa',
    country: 'Burundi',
    coords: [228, 235],
    latLng: [-3.4272, 29.9246],
    elevation: 1730,
    typicalWeather: 'fog',
    terrain: 'mountain_pass',
    avgTemp: 20,
    roadGrade: 6.0,
    description: 'Central political capital located in the East African highlands.'
  },

  // 7. Cabo Verde
  PRAIA: {
    name: 'Praia',
    region: 'Africa',
    country: 'Cabo Verde',
    coords: [60, 180],
    latLng: [14.9330, -23.5133],
    elevation: 30,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 26,
    roadGrade: 2.5,
    description: 'Atlantic island capital and maritime port.'
  },
  MINDELO: {
    name: 'Mindelo',
    region: 'Africa',
    country: 'Cabo Verde',
    coords: [55, 172],
    latLng: [16.8901, -24.9972],
    elevation: 10,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 25,
    roadGrade: 1.8,
    description: 'Deep-water volcanic harbor and cultural seaport.'
  },

  // 8. Cameroon
  DOUALA: {
    name: 'Douala',
    region: 'Africa',
    country: 'Cameroon',
    coords: [160, 195],
    latLng: [4.0511, 9.7679],
    elevation: 13,
    typicalWeather: 'rain',
    terrain: 'wet_pavement',
    avgTemp: 28,
    roadGrade: 1.0,
    description: 'Primary economic engine and seaport of Cameroon.'
  },
  YAOUNDE: {
    name: 'Yaoundé',
    region: 'Africa',
    country: 'Cameroon',
    coords: [168, 202],
    latLng: [3.8480, 11.5021],
    elevation: 750,
    typicalWeather: 'rain',
    terrain: 'mountain_pass',
    avgTemp: 24,
    roadGrade: 4.5,
    description: 'Hilly forested inland capital city.'
  },

  // 9. Central African Republic
  BANGUI: {
    name: 'Bangui',
    region: 'Africa',
    country: 'Central African Republic',
    coords: [190, 210],
    latLng: [4.3947, 18.5582],
    elevation: 369,
    typicalWeather: 'rain',
    terrain: 'highway',
    avgTemp: 27,
    roadGrade: 2.2,
    description: 'Ubangi river port and central continental logistics node.'
  },
  BIMBO: {
    name: 'Bimbo',
    region: 'Africa',
    country: 'Central African Republic',
    coords: [188, 213],
    latLng: [4.2533, 18.4233],
    elevation: 380,
    typicalWeather: 'rain',
    terrain: 'highway',
    avgTemp: 27,
    roadGrade: 2.0,
    description: 'Southwestern commercial distribution hub near the capital.'
  },

  // 10. Chad
  NDJAMENA: {
    name: "N'Djamena",
    region: 'Africa',
    country: 'Chad',
    coords: [150, 115],
    latLng: [12.1348, 15.0557],
    elevation: 298,
    typicalWeather: 'heatwave',
    terrain: 'desert_corridor',
    avgTemp: 35,
    roadGrade: 0.8,
    description: 'Chari river port city on the southern edge of the Sahara.'
  },
  MOUNDOU: {
    name: 'Moundou',
    region: 'Africa',
    country: 'Chad',
    coords: [155, 145],
    latLng: [8.5670, 16.0833],
    elevation: 410,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 32,
    roadGrade: 1.5,
    description: 'Southern industrial and cotton processing center.'
  },

  // 11. Comoros
  MORONI: {
    name: 'Moroni',
    region: 'Africa',
    country: 'Comoros',
    coords: [260, 260],
    latLng: [-11.7172, 43.2551],
    elevation: 20,
    typicalWeather: 'rain',
    terrain: 'mountain_pass',
    avgTemp: 27,
    roadGrade: 5.5,
    description: 'Volcanic island capital on Grande Comore.'
  },
  MUTSAMUDU: {
    name: 'Mutsamudu',
    region: 'Africa',
    country: 'Comoros',
    coords: [265, 265],
    latLng: [-12.1678, 44.4011],
    elevation: 15,
    typicalWeather: 'rain',
    terrain: 'mountain_pass',
    avgTemp: 27,
    roadGrade: 5.8,
    description: 'Deep-water port on Anjouan island.'
  },

  // 12. Congo (Republic of the Congo)
  BRAZZAVILLE: {
    name: 'Brazzaville',
    region: 'Africa',
    country: 'Congo',
    coords: [175, 230],
    latLng: [-4.2634, 15.2429],
    elevation: 320,
    typicalWeather: 'rain',
    terrain: 'highway',
    avgTemp: 25,
    roadGrade: 1.8,
    description: 'Congo river capital facing Kinshasa across the water.'
  },
  POINTE_NOIRE: {
    name: 'Pointe-Noire',
    region: 'Africa',
    country: 'Congo',
    coords: [160, 238],
    latLng: [-4.7777, 11.8635],
    elevation: 15,
    typicalWeather: 'rain',
    terrain: 'wet_pavement',
    avgTemp: 26,
    roadGrade: 0.9,
    description: 'Major Atlantic commercial port and oil terminal.'
  },

  // 13. Democratic Republic of the Congo
  KINSHASA: {
    name: 'Kinshasa',
    region: 'Africa',
    country: 'Democratic Republic of the Congo',
    coords: [177, 232],
    latLng: [-4.4419, 15.2663],
    elevation: 240,
    typicalWeather: 'rain',
    terrain: 'highway',
    avgTemp: 26,
    roadGrade: 2.0,
    description: 'Mega-city capital and vast central African river port.'
  },
  LUBUMBASHI: {
    name: 'Lubumbashi',
    region: 'Africa',
    country: 'Democratic Republic of the Congo',
    coords: [210, 275],
    latLng: [-11.6647, 27.4794],
    elevation: 1208,
    typicalWeather: 'clear',
    terrain: 'mountain_pass',
    avgTemp: 22,
    roadGrade: 4.2,
    description: 'Copper mining capital of the southern mineral belt.'
  },

  // 14. Djibouti
  DJIBOUTI_CITY: {
    name: 'Djibouti City',
    region: 'Africa',
    country: 'Djibouti',
    coords: [250, 130],
    latLng: [11.5821, 43.1450],
    elevation: 15,
    typicalWeather: 'heatwave',
    terrain: 'desert_corridor',
    avgTemp: 32,
    roadGrade: 1.0,
    description: 'Strategic Bab-el-Mandeb Red Sea transit port and logistics gateway.'
  },
  ALI_SABIEH: {
    name: 'Ali Sabieh',
    region: 'Africa',
    country: 'Djibouti',
    coords: [255, 138],
    latLng: [11.1558, 42.7128],
    elevation: 756,
    typicalWeather: 'heatwave',
    terrain: 'desert_corridor',
    avgTemp: 34,
    roadGrade: 3.5,
    description: 'Southern railway junction on the Ethiopia-Djibouti trade route.'
  },

  // 15. Egypt
  CAIRO: {
    name: 'Cairo',
    region: 'Africa',
    country: 'Egypt',
    coords: [170, 60],
    latLng: [30.0444, 31.2357],
    elevation: 23,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 25,
    roadGrade: 1.2,
    description: 'Nile metropolis and North African logistics nexus.'
  },
  ALEXANDRIA: {
    name: 'Alexandria',
    region: 'Africa',
    country: 'Egypt',
    coords: [160, 50],
    latLng: [31.2001, 29.9187],
    elevation: 10,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 24,
    roadGrade: 0.8,
    description: 'Historic Mediterranean port city of Egypt.'
  },

  // 16. Equatorial Guinea
  MALABO: {
    name: 'Malabo',
    region: 'Africa',
    country: 'Equatorial Guinea',
    coords: [155, 190],
    latLng: [3.7504, 8.7731],
    elevation: 50,
    typicalWeather: 'rain',
    terrain: 'mountain_pass',
    avgTemp: 26,
    roadGrade: 5.0,
    description: 'Volcanic island capital on Bioko.'
  },
  BATA: {
    name: 'Bata',
    region: 'Africa',
    country: 'Equatorial Guinea',
    coords: [160, 198],
    latLng: [1.8550, 9.7656],
    elevation: 10,
    typicalWeather: 'rain',
    terrain: 'wet_pavement',
    avgTemp: 27,
    roadGrade: 1.1,
    description: 'Mainland port city and commercial center.'
  },

  // 17. Eritrea
  ASMARA: {
    name: 'Asmara',
    region: 'Africa',
    country: 'Eritrea',
    coords: [240, 120],
    latLng: [15.3229, 38.9251],
    elevation: 2325,
    typicalWeather: 'fog',
    terrain: 'mountain_pass',
    avgTemp: 18,
    roadGrade: 7.2,
    description: 'Highland capital known for Italian modernist architecture and winding mountain roads.'
  },
  MASSAWA: {
    name: 'Massawa',
    region: 'Africa',
    country: 'Eritrea',
    coords: [248, 118],
    latLng: [15.6087, 39.4754],
    elevation: 5,
    typicalWeather: 'heatwave',
    terrain: 'desert_corridor',
    avgTemp: 35,
    roadGrade: 6.8,
    description: 'Red Sea port connected to the highlands by steep escarpment routes.'
  },

  // 18. Eswatini
  MBABANE: {
    name: 'Mbabane',
    region: 'Africa',
    country: 'Eswatini',
    coords: [200, 325],
    latLng: [-26.3167, 31.1333],
    elevation: 1200,
    typicalWeather: 'fog',
    terrain: 'mountain_pass',
    avgTemp: 19,
    roadGrade: 6.5,
    description: 'Highveld administrative capital nestled in the Dlangamlomo mountains.'
  },
  MANZINI: {
    name: 'Manzini',
    region: 'Africa',
    country: 'Eswatini',
    coords: [205, 327],
    latLng: [-26.5, 31.3667],
    elevation: 600,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 22,
    roadGrade: 3.0,
    description: 'Commercial and industrial hub of Eswatini.'
  },

  // 19. Ethiopia
  ADDIS_ABABA: {
    name: 'Addis Ababa',
    region: 'Africa',
    country: 'Ethiopia',
    coords: [230, 150],
    latLng: [9.03, 38.74],
    elevation: 2355,
    typicalWeather: 'fog',
    terrain: 'mountain_pass',
    avgTemp: 17,
    roadGrade: 6.8,
    description: 'Highland diplomatic capital and continental transport hub.'
  },
  DIRE_DAWA: {
    name: 'Dire Dawa',
    region: 'Africa',
    country: 'Ethiopia',
    coords: [245, 145],
    latLng: [9.5936, 41.8661],
    elevation: 1276,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 26,
    roadGrade: 3.5,
    description: 'Major eastern commercial city and railway hub.'
  },

  // 20. Gabon
  LIBREVILLE: {
    name: 'Libreville',
    region: 'Africa',
    country: 'Gabon',
    coords: [150, 190],
    latLng: [0.3901, 9.4544],
    elevation: 15,
    typicalWeather: 'rain',
    terrain: 'wet_pavement',
    avgTemp: 27,
    roadGrade: 1.0,
    description: 'Atlantic coastal capital and timber export port.'
  },
  PORT_GENTIL: {
    name: 'Port-Gentil',
    region: 'Africa',
    country: 'Gabon',
    coords: [144, 195],
    latLng: [-0.7193, 8.7815],
    elevation: 3,
    typicalWeather: 'rain',
    terrain: 'wet_pavement',
    avgTemp: 27,
    roadGrade: 0.5,
    description: 'Economic capital and petroleum extraction center.'
  },

  // 21. Gambia
  BANJUL: {
    name: 'Banjul',
    region: 'Africa',
    country: 'Gambia',
    coords: [80, 150],
    latLng: [13.4549, -16.5790],
    elevation: 5,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 28,
    roadGrade: 0.6,
    description: 'Atlantic coastal estuary port capital.'
  },
  SERREKUNDA: {
    name: 'Serrekunda',
    region: 'Africa',
    country: 'Gambia',
    coords: [83, 152],
    latLng: [13.4385, -16.6780],
    elevation: 12,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 28,
    roadGrade: 0.8,
    description: 'Largest urban commercial center of Gambia.'
  },

  // 22. Ghana
  ACCRA: {
    name: 'Accra',
    region: 'Africa',
    country: 'Ghana',
    coords: [100, 170],
    latLng: [5.6037, -0.1870],
    elevation: 60,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 30,
    roadGrade: 1.2,
    description: 'Major Atlantic port and commercial hub.'
  },
  KUMASI: {
    name: 'Kumasi',
    region: 'Africa',
    country: 'Ghana',
    coords: [105, 160],
    latLng: [6.6885, -1.6244],
    elevation: 250,
    typicalWeather: 'rain',
    terrain: 'highway',
    avgTemp: 28,
    roadGrade: 2.1,
    description: 'The Garden City and historic trade center of the Ashanti region.'
  },

  // 23. Guinea
  CONAKRY: {
    name: 'Conakry',
    region: 'Africa',
    country: 'Guinea',
    coords: [88, 155],
    latLng: [9.5092, -13.7122],
    elevation: 10,
    typicalWeather: 'rain',
    terrain: 'wet_pavement',
    avgTemp: 27,
    roadGrade: 1.2,
    description: 'Atlantic port capital and bauxite export hub.'
  },
  KANKAN: {
    name: 'Kankan',
    region: 'Africa',
    country: 'Guinea',
    coords: [102, 145],
    latLng: [10.3854, -9.3056],
    elevation: 410,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 31,
    roadGrade: 1.9,
    description: 'Major inland commercial trading city of Upper Guinea.'
  },

  // 24. Guinea-Bissau
  BISSAU: {
    name: 'Bissau',
    region: 'Africa',
    country: 'Guinea-Bissau',
    coords: [84, 153],
    latLng: [11.8636, -15.5977],
    elevation: 8,
    typicalWeather: 'rain',
    terrain: 'wet_pavement',
    avgTemp: 28,
    roadGrade: 0.5,
    description: 'Atlantic estuarine capital and agricultural port.'
  },
  BAFATA: {
    name: 'Bafatá',
    region: 'Africa',
    country: 'Guinea-Bissau',
    coords: [90, 149],
    latLng: [12.2833, -14.6500],
    elevation: 35,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 30,
    roadGrade: 1.0,
    description: 'Central commercial and river crossing hub.'
  },

  // 25. Ivory Coast
  ABIDJAN: {
    name: 'Abidjan',
    region: 'Africa',
    country: 'Ivory Coast',
    coords: [108, 168],
    latLng: [5.3600, -4.0083],
    elevation: 25,
    typicalWeather: 'rain',
    terrain: 'wet_pavement',
    avgTemp: 28,
    roadGrade: 1.4,
    description: 'Economic capital and major West African lagoon port.'
  },
  YAMOUSSOUKRO: {
    name: 'Yamoussoukro',
    region: 'Africa',
    country: 'Ivory Coast',
    coords: [112, 158],
    latLng: [6.8276, -5.2893],
    elevation: 215,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 29,
    roadGrade: 1.8,
    description: 'Official political capital situated in the inland savannah.'
  },

  // 26. Kenya
  NAIROBI: {
    name: 'Nairobi',
    region: 'Africa',
    country: 'Kenya',
    coords: [240, 240],
    latLng: [-1.2921, 36.8219],
    elevation: 1795,
    typicalWeather: 'fog',
    terrain: 'mountain_pass',
    avgTemp: 20,
    roadGrade: 4.5,
    description: 'East African economic powerhouse and logistics hub.'
  },
  MOMBASA: {
    name: 'Mombasa',
    region: 'Africa',
    country: 'Kenya',
    coords: [255, 250],
    latLng: [-4.0435, 39.6682],
    elevation: 17,
    typicalWeather: 'rain',
    terrain: 'highway',
    avgTemp: 28,
    roadGrade: 1.2,
    description: 'Premier Indian Ocean port serving East and Central Africa.'
  },

  // 27. Lesotho
  MASERU: {
    name: 'Maseru',
    region: 'Africa',
    country: 'Lesotho',
    coords: [185, 320],
    latLng: [-29.3167, 27.4833],
    elevation: 1600,
    typicalWeather: 'fog',
    terrain: 'mountain_pass',
    avgTemp: 15,
    roadGrade: 7.5,
    description: 'Mountain capital city situated on the Caledon River.'
  },
  TEYATEYANENG: {
    name: 'Teyateyaneng',
    region: 'Africa',
    country: 'Lesotho',
    coords: [188, 318],
    latLng: [-29.1500, 27.7500],
    elevation: 1750,
    typicalWeather: 'fog',
    terrain: 'mountain_pass',
    avgTemp: 14,
    roadGrade: 7.8,
    description: 'Highland cultural and crafting center.'
  }
};
