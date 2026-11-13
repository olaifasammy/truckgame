import { LocationInfo } from '../world';

export const AFRICA_PART_2_LOCATIONS: Record<string, LocationInfo> = {
  // 28. Liberia
  MONROVIA: {
    name: 'Monrovia',
    region: 'Africa',
    country: 'Liberia',
    coords: [92, 162],
    latLng: [6.3156, -10.8072],
    elevation: 15,
    typicalWeather: 'rain',
    terrain: 'wet_pavement',
    avgTemp: 27,
    roadGrade: 1.0,
    description: 'Atlantic coastal capital and free port of Liberia.'
  },
  GBARNGA: {
    name: 'Gbarnga',
    region: 'Africa',
    country: 'Liberia',
    coords: [98, 154],
    latLng: [6.9958, -9.4722],
    elevation: 250,
    typicalWeather: 'rain',
    terrain: 'highway',
    avgTemp: 26,
    roadGrade: 2.2,
    description: 'Central interior trading and agricultural hub.'
  },

  // 29. Libya
  TRIPOLI: {
    name: 'Tripoli',
    region: 'Africa',
    country: 'Libya',
    coords: [140, 45],
    latLng: [32.8872, 13.1913],
    elevation: 12,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 23,
    roadGrade: 1.5,
    description: 'Mediterranean capital and North African trade port.'
  },
  BENGHAZI: {
    name: 'Benghazi',
    region: 'Africa',
    country: 'Libya',
    coords: [158, 52],
    latLng: [32.1194, 20.0667],
    elevation: 15,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 24,
    roadGrade: 1.2,
    description: 'Eastern coastal commercial port and industrial hub.'
  },

  // 30. Madagascar
  ANTANANARIVO: {
    name: 'Antananarivo',
    region: 'Africa',
    country: 'Madagascar',
    coords: [280, 280],
    latLng: [-18.8792, 47.5079],
    elevation: 1276,
    typicalWeather: 'fog',
    terrain: 'mountain_pass',
    avgTemp: 20,
    roadGrade: 6.1,
    description: 'Highland plateau capital of the island nation.'
  },
  TOAMASINA: {
    name: 'Toamasina',
    region: 'Africa',
    country: 'Madagascar',
    coords: [292, 285],
    latLng: [-18.1492, 49.4023],
    elevation: 8,
    typicalWeather: 'rain',
    terrain: 'wet_pavement',
    avgTemp: 25,
    roadGrade: 1.4,
    description: 'Primary Indian Ocean seaport of Madagascar.'
  },

  // 31. Malawi
  LILONGWE: {
    name: 'Lilongwe',
    region: 'Africa',
    country: 'Malawi',
    coords: [220, 270],
    latLng: [-13.9626, 33.7741],
    elevation: 1050,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 22,
    roadGrade: 2.5,
    description: 'Central plateau capital and tobacco trade center.'
  },
  BLANTYRE: {
    name: 'Blantyre',
    region: 'Africa',
    country: 'Malawi',
    coords: [225, 285],
    latLng: [-15.7861, 35.0058],
    elevation: 1000,
    typicalWeather: 'rain',
    terrain: 'mountain_pass',
    avgTemp: 21,
    roadGrade: 5.0,
    description: 'Southern commercial and financial capital.'
  },

  // 32. Mali
  BAMAKO: {
    name: 'Bamako',
    region: 'Africa',
    country: 'Mali',
    coords: [100, 140],
    latLng: [12.6392, -8.0029],
    elevation: 349,
    typicalWeather: 'heatwave',
    terrain: 'highway',
    avgTemp: 32,
    roadGrade: 1.5,
    description: 'Niger river capital and regional transit center.'
  },
  SEGOU: {
    name: 'Ségou',
    region: 'Africa',
    country: 'Mali',
    coords: [112, 138],
    latLng: [13.4317, -6.2157],
    elevation: 287,
    typicalWeather: 'heatwave',
    terrain: 'highway',
    avgTemp: 33,
    roadGrade: 1.0,
    description: 'Historic agricultural trading city along the Niger.'
  },

  // 33. Mauritania
  NOUAKCHOTT: {
    name: 'Nouakchott',
    region: 'Africa',
    country: 'Mauritania',
    coords: [78, 120],
    latLng: [18.0735, -15.9582],
    elevation: 6,
    typicalWeather: 'heatwave',
    terrain: 'desert_corridor',
    avgTemp: 29,
    roadGrade: 0.8,
    description: 'Atlantic coastal capital situated on the Sahara fringe.'
  },
  NOUADHIBOU: {
    name: 'Nouadhibou',
    region: 'Africa',
    country: 'Mauritania',
    coords: [70, 95],
    latLng: [20.9310, -17.0347],
    elevation: 5,
    typicalWeather: 'heatwave',
    terrain: 'desert_corridor',
    avgTemp: 27,
    roadGrade: 0.6,
    description: 'Peninsula iron-ore export port and fishing hub.'
  },

  // 34. Mauritius
  PORT_LOUIS: {
    name: 'Port Louis',
    region: 'Africa',
    country: 'Mauritius',
    coords: [310, 310],
    latLng: [-20.1609, 57.5012],
    elevation: 13,
    typicalWeather: 'rain',
    terrain: 'mountain_pass',
    avgTemp: 25,
    roadGrade: 4.0,
    description: 'Indian Ocean island capital and commercial harbor.'
  },
  CUREPIPE: {
    name: 'Curepipe',
    region: 'Africa',
    country: 'Mauritius',
    coords: [312, 312],
    latLng: [-20.3167, 57.5333],
    elevation: 550,
    typicalWeather: 'fog',
    terrain: 'mountain_pass',
    avgTemp: 21,
    roadGrade: 5.2,
    description: 'Highland plateau town on Mauritius.'
  },

  // 35. Morocco
  CASABLANCA: {
    name: 'Casablanca',
    region: 'Africa',
    country: 'Morocco',
    coords: [85, 30],
    latLng: [33.5731, -7.5898],
    elevation: 20,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 21,
    roadGrade: 1.5,
    description: 'Major Atlantic commercial port and industrial metropolis.'
  },
  MARRAKECH: {
    name: 'Marrakech',
    region: 'Africa',
    country: 'Morocco',
    coords: [92, 38],
    latLng: [31.6295, -7.9811],
    elevation: 466,
    typicalWeather: 'clear',
    terrain: 'mountain_pass',
    avgTemp: 24,
    roadGrade: 5.8,
    description: 'Inland imperial city near the Atlas mountains.'
  },

  // 36. Mozambique
  MAPUTO: {
    name: 'Maputo',
    region: 'Africa',
    country: 'Mozambique',
    coords: [210, 320],
    latLng: [-25.9692, 32.5732],
    elevation: 45,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 24,
    roadGrade: 1.2,
    description: 'Southern Indian Ocean port capital.'
  },
  BEIRA: {
    name: 'Beira',
    region: 'Africa',
    country: 'Mozambique',
    coords: [225, 290],
    latLng: [-19.8436, 34.8389],
    elevation: 12,
    typicalWeather: 'rain',
    terrain: 'wet_pavement',
    avgTemp: 26,
    roadGrade: 0.9,
    description: 'Central coastal gateway port for inland nations.'
  },

  // 37. Namibia
  WINDHOEK: {
    name: 'Windhoek',
    region: 'Africa',
    country: 'Namibia',
    coords: [165, 300],
    latLng: [-22.5609, 17.0658],
    elevation: 1655,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 21,
    roadGrade: 2.1,
    description: 'Highland plateau capital surrounded by desert corridors.'
  },
  WALVIS_BAY: {
    name: 'Walvis Bay',
    region: 'Africa',
    country: 'Namibia',
    coords: [155, 295],
    latLng: [-22.9575, 14.5053],
    elevation: 5,
    typicalWeather: 'clear',
    terrain: 'desert_corridor',
    avgTemp: 19,
    roadGrade: 0.5,
    description: 'Deep-water Atlantic logistics port of Namibia.'
  },

  // 38. Niger
  NIAMEY: {
    name: 'Niamey',
    region: 'Africa',
    country: 'Niger',
    coords: [130, 120],
    latLng: [13.5116, 2.1254],
    elevation: 207,
    typicalWeather: 'heatwave',
    terrain: 'desert_corridor',
    avgTemp: 36,
    roadGrade: 0.8,
    description: 'Niger river capital and Sahelian crossroads.'
  },
  ZINDER: {
    name: 'Zinder',
    region: 'Africa',
    country: 'Niger',
    coords: [150, 110],
    latLng: [13.8072, 8.9881],
    elevation: 445,
    typicalWeather: 'heatwave',
    terrain: 'desert_corridor',
    avgTemp: 37,
    roadGrade: 1.0,
    description: 'Historic eastern trans-Saharan trading city.'
  },

  // 39. Nigeria
  LAGOS: {
    name: 'Lagos',
    region: 'Africa',
    country: 'Nigeria',
    coords: [140, 160],
    latLng: [6.5244, 3.3792],
    elevation: 12,
    typicalWeather: 'rain',
    terrain: 'wet_pavement',
    avgTemp: 31,
    roadGrade: 1.2,
    description: 'Atlantic deep-water port, dense humid traffic corridors, coastal rainstorms.'
  },
  IBADAN: {
    name: 'Ibadan',
    region: 'Africa',
    country: 'Nigeria',
    coords: [136, 145],
    latLng: [7.3775, 3.9470],
    elevation: 230,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 29,
    roadGrade: 2.5,
    description: 'Rolling southwestern hills and industrial logistics distribution centers.'
  },
  ENUGU: {
    name: 'Enugu',
    region: 'Africa',
    country: 'Nigeria',
    coords: [165, 162],
    latLng: [6.4584, 7.5464],
    elevation: 260,
    typicalWeather: 'rain',
    terrain: 'mountain_pass',
    avgTemp: 28,
    roadGrade: 4.8,
    description: 'Eastern coal city highland escarpment with sharp bends and steep climbs.'
  },
  ABUJA: {
    name: 'Abuja',
    region: 'Africa',
    country: 'Nigeria',
    coords: [152, 135],
    latLng: [9.0765, 7.3986],
    elevation: 480,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 33,
    roadGrade: 2.0,
    description: 'Central Federal Capital Territory expressway network and dry savanna plateau.'
  },
  KANO: {
    name: 'Kano',
    region: 'Africa',
    country: 'Nigeria',
    coords: [156, 110],
    latLng: [12.0022, 8.5919],
    elevation: 488,
    typicalWeather: 'heatwave',
    terrain: 'desert_corridor',
    avgTemp: 38,
    roadGrade: 1.0,
    description: 'Ancient trans-Saharan trade hub, intense heat waves and dry sandy road surfaces.'
  },
  MAIDUGURI: {
    name: 'Maiduguri',
    region: 'Africa',
    country: 'Nigeria',
    coords: [185, 115],
    latLng: [11.8333, 13.1500],
    elevation: 320,
    typicalWeather: 'heatwave',
    terrain: 'desert_corridor',
    avgTemp: 39,
    roadGrade: 0.8,
    description: 'Northeastern Lake Chad basin transit terminus with desert crosswinds.'
  },
  PORT_HARCOURT: {
    name: 'Port Harcourt',
    region: 'Africa',
    country: 'Nigeria',
    coords: [155, 175],
    latLng: [4.8156, 7.0498],
    elevation: 18,
    typicalWeather: 'rain',
    terrain: 'wet_pavement',
    avgTemp: 30,
    roadGrade: 0.5,
    description: 'Oil and gas capital of the Niger Delta, high humidity and frequent heavy tropical downpours.'
  },
  SOKOTO: {
    name: 'Sokoto',
    region: 'Africa',
    country: 'Nigeria',
    coords: [135, 105],
    latLng: [13.0674, 5.2323],
    elevation: 270,
    typicalWeather: 'heatwave',
    terrain: 'desert_corridor',
    avgTemp: 40,
    roadGrade: 0.7,
    description: 'The Seat of the Caliphate, extreme northern heat waves and dry Sahelian winds.'
  },
  JOS: {
    name: 'Jos',
    region: 'Africa',
    country: 'Nigeria',
    coords: [168, 130],
    latLng: [9.8965, 8.8583],
    elevation: 1200,
    typicalWeather: 'fog',
    terrain: 'mountain_pass',
    avgTemp: 22,
    roadGrade: 6.2,
    description: 'The Tin City of the Plateau, high altitude temperate climate with steep climbs and misty mornings.'
  },
  BENIN_CITY: {
    name: 'Benin City',
    region: 'Africa',
    country: 'Nigeria',
    coords: [148, 160],
    latLng: [6.3350, 5.6037],
    elevation: 80,
    typicalWeather: 'rain',
    terrain: 'highway',
    avgTemp: 29,
    roadGrade: 1.5,
    description: 'Ancient historical gateway between the Western and Eastern commercial zones.'
  },
  KADUNA: {
    name: 'Kaduna',
    region: 'Africa',
    country: 'Nigeria',
    coords: [154, 120],
    latLng: [10.5105, 7.4165],
    elevation: 612,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 31,
    roadGrade: 1.8,
    description: 'Major northern industrial rail-road junction and logistics heart of the Savannah.'
  },
  ILORIN: {
    name: 'Ilorin',
    region: 'Africa',
    country: 'Nigeria',
    coords: [142, 138],
    latLng: [8.4799, 4.5418],
    elevation: 305,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 32,
    roadGrade: 1.1,
    description: 'The Gateway between North and South, where the Sahel meets the forest zone.'
  },
  MAKURDI: {
    name: 'Makurdi',
    region: 'Africa',
    country: 'Nigeria',
    coords: [162, 148],
    latLng: [7.7322, 8.5391],
    elevation: 104,
    typicalWeather: 'rain',
    terrain: 'wet_pavement',
    avgTemp: 33,
    roadGrade: 0.9,
    description: 'Major Benue River port and agricultural transit point for food security logistics.'
  },
  BAUCHI: {
    name: 'Bauchi',
    region: 'Africa',
    country: 'Nigeria',
    coords: [168, 118],
    latLng: [10.3103, 9.8439],
    elevation: 616,
    typicalWeather: 'heatwave',
    terrain: 'highway',
    avgTemp: 34,
    roadGrade: 2.3,
    description: 'Northern gateway to the Yankari plateau and eastern Sahelian trade routes.'
  },
  LOKOJA: {
    name: 'Lokoja',
    region: 'Africa',
    country: 'Nigeria',
    coords: [150, 146],
    latLng: [7.8023, 6.7333],
    elevation: 55,
    typicalWeather: 'rain',
    terrain: 'wet_pavement',
    avgTemp: 32,
    roadGrade: 1.4,
    description: 'The Confluence City where the Niger and Benue rivers meet, a critical national transit bottleneck.'
  },
  CALABAR: {
    name: 'Calabar',
    region: 'Africa',
    country: 'Nigeria',
    coords: [168, 172],
    latLng: [4.9757, 8.3417],
    elevation: 32,
    typicalWeather: 'rain',
    terrain: 'wet_pavement',
    avgTemp: 28,
    roadGrade: 1.1,
    description: 'Historic Atlantic port city and tourism hub, located in the lush rainforest zone.'
  },
  UYO: {
    name: 'Uyo',
    region: 'Africa',
    country: 'Nigeria',
    coords: [163, 175],
    latLng: [5.0374, 7.9128],
    elevation: 38,
    typicalWeather: 'rain',
    terrain: 'highway',
    avgTemp: 29,
    roadGrade: 0.8,
    description: 'Modern administrative capital with well-developed road networks and oil-sector logistics.'
  },
  KATSINA: {
    name: 'Katsina',
    region: 'Africa',
    country: 'Nigeria',
    coords: [148, 98],
    latLng: [12.9894, 7.6000],
    elevation: 464,
    typicalWeather: 'heatwave',
    terrain: 'desert_corridor',
    avgTemp: 38,
    roadGrade: 0.9,
    description: 'Northern frontier commercial hub with ancient trade links across the Sahel.'
  },
  YOLA: {
    name: 'Yola',
    region: 'Africa',
    country: 'Nigeria',
    coords: [188, 135],
    latLng: [9.2035, 12.4850],
    elevation: 190,
    typicalWeather: 'heatwave',
    terrain: 'highway',
    avgTemp: 36,
    roadGrade: 1.5,
    description: 'Major Benue river valley logistics node and eastern Nigerian administrative center.'
  },
  MINNA: {
    name: 'Minna',
    region: 'Africa',
    country: 'Nigeria',
    coords: [145, 130],
    latLng: [9.6139, 6.5569],
    elevation: 299,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 32,
    roadGrade: 2.1,
    description: 'Strategic central railway town and major gateway to the northwestern territories.'
  },

  // 40. Rwanda
  KIGALI: {
    name: 'Kigali',
    region: 'Africa',
    country: 'Rwanda',
    coords: [215, 235],
    latLng: [-1.9441, 30.0619],
    elevation: 1567,
    typicalWeather: 'fog',
    terrain: 'mountain_pass',
    avgTemp: 21,
    roadGrade: 6.2,
    description: 'The Land of a Thousand Hills capital city.'
  },
  BUTARE: {
    name: 'Butare',
    region: 'Africa',
    country: 'Rwanda',
    coords: [218, 240],
    latLng: [-2.6, 29.7333],
    elevation: 1768,
    typicalWeather: 'fog',
    terrain: 'mountain_pass',
    avgTemp: 20,
    roadGrade: 6.5,
    description: 'Southern intellectual and cultural center of Rwanda.'
  },

  // 41. Sao Tome and Principe
  SAO_TOME: {
    name: 'São Tomé',
    region: 'Africa',
    country: 'Sao Tome and Principe',
    coords: [150, 205],
    latLng: [0.3302, 6.7333],
    elevation: 15,
    typicalWeather: 'rain',
    terrain: 'mountain_pass',
    avgTemp: 27,
    roadGrade: 4.0,
    description: 'Equatorial island port and capital.'
  },
  SANTO_ANTONIO: {
    name: 'Santo António',
    region: 'Africa',
    country: 'Sao Tome and Principe',
    coords: [153, 208],
    latLng: [1.6386, 7.4233],
    elevation: 20,
    typicalWeather: 'rain',
    terrain: 'mountain_pass',
    avgTemp: 27,
    roadGrade: 4.5,
    description: 'Principal town on Príncipe island.'
  },

  // 42. Senegal
  DAKAR: {
    name: 'Dakar',
    region: 'Africa',
    country: 'Senegal',
    coords: [75, 148],
    latLng: [14.7167, -17.4677],
    elevation: 22,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 26,
    roadGrade: 1.1,
    description: 'Westernmost Atlantic seaport and capital of Senegal.'
  },
  THIES: {
    name: 'Thiès',
    region: 'Africa',
    country: 'Senegal',
    coords: [82, 149],
    latLng: [14.7910, -16.9259],
    elevation: 70,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 27,
    roadGrade: 1.3,
    description: 'Inland railway and transport junction.'
  },

  // 43. Seychelles
  VICTORIA: {
    name: 'Victoria',
    region: 'Africa',
    country: 'Seychelles',
    coords: [300, 240],
    latLng: [-4.6191, 55.4513],
    elevation: 10,
    typicalWeather: 'rain',
    terrain: 'mountain_pass',
    avgTemp: 28,
    roadGrade: 4.8,
    description: 'Compact island capital on Mahé.'
  },
  ANSE_BOILEAU: {
    name: 'Anse Boileau',
    region: 'Africa',
    country: 'Seychelles',
    coords: [302, 242],
    latLng: [-4.7214, 55.4858],
    elevation: 15,
    typicalWeather: 'rain',
    terrain: 'mountain_pass',
    avgTemp: 28,
    roadGrade: 5.0,
    description: 'Southern coastal settlement on Mahé island.'
  },

  // 44. Sierra Leone
  FREETOWN: {
    name: 'Freetown',
    region: 'Africa',
    country: 'Sierra Leone',
    coords: [85, 158],
    latLng: [8.4657, -13.2317],
    elevation: 50,
    typicalWeather: 'rain',
    terrain: 'mountain_pass',
    avgTemp: 27,
    roadGrade: 5.2,
    description: 'Atlantic coastal estuary natural harbor capital.'
  },
  BO: {
    name: 'Bo',
    region: 'Africa',
    country: 'Sierra Leone',
    coords: [92, 154],
    latLng: [7.9647, -11.7425],
    elevation: 105,
    typicalWeather: 'rain',
    terrain: 'highway',
    avgTemp: 28,
    roadGrade: 1.8,
    description: 'Southern commercial and educational center.'
  },

  // 45. Somalia
  MOGADISHU: {
    name: 'Mogadishu',
    region: 'Africa',
    country: 'Somalia',
    coords: [265, 175],
    latLng: [2.0469, 45.3182],
    elevation: 9,
    typicalWeather: 'heatwave',
    terrain: 'highway',
    avgTemp: 28,
    roadGrade: 1.0,
    description: 'Indian Ocean coastal capital and trade port.'
  },
  HARGEISA: {
    name: 'Hargeisa',
    region: 'Africa',
    country: 'Somalia',
    coords: [255, 140],
    latLng: [9.5600, 44.0650],
    elevation: 1330,
    typicalWeather: 'clear',
    terrain: 'mountain_pass',
    avgTemp: 23,
    roadGrade: 4.5,
    description: 'Highland commercial hub of northern Somalia.'
  },

  // 46. South Africa
  JOHANNESBURG: {
    name: 'Johannesburg',
    region: 'Africa',
    country: 'South Africa',
    coords: [190, 310],
    latLng: [-26.2041, 28.0473],
    elevation: 1753,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 19,
    roadGrade: 2.2,
    description: 'Economic heartland and gold mining metropolis.'
  },
  CAPE_TOWN: {
    name: 'Cape Town',
    region: 'Africa',
    country: 'South Africa',
    coords: [165, 345],
    latLng: [-33.9249, 18.4241],
    elevation: 25,
    typicalWeather: 'clear',
    terrain: 'mountain_pass',
    avgTemp: 17,
    roadGrade: 6.0,
    description: 'Legislative capital and premier southern maritime port.'
  },

  // 47. South Sudan
  JUBA: {
    name: 'Juba',
    region: 'Africa',
    country: 'South Sudan',
    coords: [205, 185],
    latLng: [4.8594, 31.5713],
    elevation: 550,
    typicalWeather: 'rain',
    terrain: 'highway',
    avgTemp: 31,
    roadGrade: 1.8,
    description: 'White Nile port capital and southern trade nexus.'
  },
  WAU: {
    name: 'Wau',
    region: 'Africa',
    country: 'South Sudan',
    coords: [190, 170],
    latLng: [7.7029, 27.9953],
    elevation: 430,
    typicalWeather: 'heatwave',
    terrain: 'highway',
    avgTemp: 32,
    roadGrade: 1.2,
    description: 'Northwestern railway and agricultural trading town.'
  },

  // 48. Sudan
  KHARTOUM: {
    name: 'Khartoum',
    region: 'Africa',
    country: 'Sudan',
    coords: [195, 100],
    latLng: [15.5007, 32.5599],
    elevation: 380,
    typicalWeather: 'heatwave',
    terrain: 'desert_corridor',
    avgTemp: 34,
    roadGrade: 1.0,
    description: 'Confluence of the Blue and White Nile capital.'
  },
  PORT_SUDAN: {
    name: 'Port Sudan',
    region: 'Africa',
    country: 'Sudan',
    coords: [215, 90],
    latLng: [19.6175, 37.2164],
    elevation: 3,
    typicalWeather: 'heatwave',
    terrain: 'desert_corridor',
    avgTemp: 32,
    roadGrade: 1.1,
    description: 'Primary Red Sea import and export shipping gateway.'
  },

  // 49. Tanzania
  DAR_ES_SALAAM: {
    name: 'Dar es Salaam',
    region: 'Africa',
    country: 'Tanzania',
    coords: [245, 255],
    latLng: [-6.7924, 39.2083],
    elevation: 24,
    typicalWeather: 'rain',
    terrain: 'highway',
    avgTemp: 26,
    roadGrade: 1.5,
    description: 'Major Indian Ocean port and commercial capital.'
  },
  DODOMA: {
    name: 'Dodoma',
    region: 'Africa',
    country: 'Tanzania',
    coords: [235, 245],
    latLng: [-6.1630, 35.7516],
    elevation: 1148,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 23,
    roadGrade: 2.8,
    description: 'Central designated national capital of Tanzania.'
  },

  // 50. Togo
  LOME: {
    name: 'Lomé',
    region: 'Africa',
    country: 'Togo',
    coords: [115, 168],
    latLng: [6.1375, 1.2123],
    elevation: 10,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 31,
    roadGrade: 0.6,
    description: 'Deep-water Atlantic port and trade hub.'
  },
  KARA: {
    name: 'Kara',
    region: 'Africa',
    country: 'Togo',
    coords: [120, 142],
    latLng: [9.5511, 1.1861],
    elevation: 312,
    typicalWeather: 'heatwave',
    terrain: 'highway',
    avgTemp: 33,
    roadGrade: 2.1,
    description: 'Northern regional commercial center.'
  },

  // 51. Tunisia
  TUNIS: {
    name: 'Tunis',
    region: 'Africa',
    country: 'Tunisia',
    coords: [135, 30],
    latLng: [36.8065, 10.1815],
    elevation: 4,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 21,
    roadGrade: 1.2,
    description: 'Mediterranean northern capital and port.'
  },
  SFAX: {
    name: 'Sfax',
    region: 'Africa',
    country: 'Tunisia',
    coords: [142, 36],
    latLng: [34.7406, 10.7603],
    elevation: 10,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 22,
    roadGrade: 1.0,
    description: 'Major industrial and phosphate export port.'
  },

  // 52. Uganda
  KAMPALA: {
    name: 'Kampala',
    region: 'Africa',
    country: 'Uganda',
    coords: [220, 220],
    latLng: [0.3476, 32.5825],
    elevation: 1200,
    typicalWeather: 'rain',
    terrain: 'highway',
    avgTemp: 23,
    roadGrade: 3.2,
    description: 'Lake Victoria basin capital and logistics center.'
  },
  JINJA: {
    name: 'Jinja',
    region: 'Africa',
    country: 'Uganda',
    coords: [228, 225],
    latLng: [0.4479, 33.2026],
    elevation: 1145,
    typicalWeather: 'rain',
    terrain: 'highway',
    avgTemp: 23,
    roadGrade: 2.5,
    description: 'Source of the Nile industrial and transport town.'
  },

  // 53. Zambia
  LUSAKA: {
    name: 'Lusaka',
    region: 'Africa',
    country: 'Zambia',
    coords: [195, 280],
    latLng: [-15.3875, 28.3228],
    elevation: 1279,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 22,
    roadGrade: 2.0,
    description: 'Southern African plateau capital and crossroads.'
  },
  NDOLA: {
    name: 'Ndola',
    region: 'Africa',
    country: 'Zambia',
    coords: [200, 265],
    latLng: [-12.9587, 28.6366],
    elevation: 1300,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 21,
    roadGrade: 2.3,
    description: 'Copperbelt industrial and commercial hub.'
  },

  // 54. Zimbabwe
  HARARE: {
    name: 'Harare',
    region: 'Africa',
    country: 'Zimbabwe',
    coords: [205, 295],
    latLng: [-17.8252, 31.0335],
    elevation: 1480,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 20,
    roadGrade: 2.4,
    description: 'Highveld capital and commercial agricultural market.'
  },
  BULAWAYO: {
    name: 'Bulawayo',
    region: 'Africa',
    country: 'Zimbabwe',
    coords: [198, 305],
    latLng: [-20.1500, 28.5833],
    elevation: 1358,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 21,
    roadGrade: 2.1,
    description: 'Major southern railway junction and industrial city.'
  }
};
