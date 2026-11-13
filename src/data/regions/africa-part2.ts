import { LocationInfo, loc } from '../types';

export const AFRICA_PART_2_LOCATIONS: Record<string, LocationInfo> = {
  // 28. Liberia
  MONROVIA: loc('Monrovia', 'Liberia', 6.3156, -10.8072, 'Africa', {"elevation":15,"typicalWeather":"rain","terrain":"wet_pavement","avgTemp":27,"roadGrade":1,"description":"Atlantic coastal capital and free port of Liberia."}),
  GBARNGA: loc('Gbarnga', 'Liberia', 6.9958, -9.4722, 'Africa', {"elevation":250,"typicalWeather":"rain","avgTemp":26,"roadGrade":2.2,"description":"Central interior trading and agricultural hub."}),
  // 29. Libya
  TRIPOLI: loc('Tripoli', 'Libya', 32.8872, 13.1913, 'Africa', {"elevation":12,"avgTemp":23,"description":"Mediterranean capital and North African trade port."}),
  BENGHAZI: loc('Benghazi', 'Libya', 32.1194, 20.0667, 'Africa', {"elevation":15,"avgTemp":24,"roadGrade":1.2,"description":"Eastern coastal commercial port and industrial hub."}),
  // 30. Madagascar
  ANTANANARIVO: loc('Antananarivo', 'Madagascar', -18.8792, 47.5079, 'Africa', {"elevation":1276,"typicalWeather":"fog","terrain":"mountain_pass","avgTemp":20,"roadGrade":6.1,"description":"Highland plateau capital of the island nation."}),
  TOAMASINA: loc('Toamasina', 'Madagascar', -18.1492, 49.4023, 'Africa', {"elevation":8,"typicalWeather":"rain","terrain":"wet_pavement","roadGrade":1.4,"description":"Primary Indian Ocean seaport of Madagascar."}),
  // 31. Malawi
  LILONGWE: loc('Lilongwe', 'Malawi', -13.9626, 33.7741, 'Africa', {"elevation":1050,"avgTemp":22,"roadGrade":2.5,"description":"Central plateau capital and tobacco trade center."}),
  BLANTYRE: loc('Blantyre', 'Malawi', -15.7861, 35.0058, 'Africa', {"elevation":1000,"typicalWeather":"rain","terrain":"mountain_pass","avgTemp":21,"roadGrade":5,"description":"Southern commercial and financial capital."}),
  // 32. Mali
  BAMAKO: loc('Bamako', 'Mali', 12.6392, -8.0029, 'Africa', {"elevation":349,"typicalWeather":"heatwave","avgTemp":32,"description":"Niger river capital and regional transit center."}),
  SEGOU: loc('Ségou', 'Mali', 13.4317, -6.2157, 'Africa', {"elevation":287,"typicalWeather":"heatwave","avgTemp":33,"roadGrade":1,"description":"Historic agricultural trading city along the Niger."}),
  // 33. Mauritania
  NOUAKCHOTT: loc('Nouakchott', 'Mauritania', 18.0735, -15.9582, 'Africa', {"elevation":6,"typicalWeather":"heatwave","terrain":"desert_corridor","avgTemp":29,"roadGrade":0.8,"description":"Atlantic coastal capital situated on the Sahara fringe."}),
  NOUADHIBOU: loc('Nouadhibou', 'Mauritania', 20.931, -17.0347, 'Africa', {"elevation":5,"typicalWeather":"heatwave","terrain":"desert_corridor","avgTemp":27,"roadGrade":0.6,"description":"Peninsula iron-ore export port and fishing hub."}),
  // 34. Mauritius
  PORT_LOUIS: loc('Port Louis', 'Mauritius', -20.1609, 57.5012, 'Africa', {"elevation":13,"typicalWeather":"rain","terrain":"mountain_pass","roadGrade":4,"description":"Indian Ocean island capital and commercial harbor."}),
  CUREPIPE: loc('Curepipe', 'Mauritius', -20.3167, 57.5333, 'Africa', {"elevation":550,"typicalWeather":"fog","terrain":"mountain_pass","avgTemp":21,"roadGrade":5.2,"description":"Highland plateau town on Mauritius."}),
  // 35. Morocco
  CASABLANCA: loc('Casablanca', 'Morocco', 33.5731, -7.5898, 'Africa', {"elevation":20,"avgTemp":21,"description":"Major Atlantic commercial port and industrial metropolis."}),
  MARRAKECH: loc('Marrakech', 'Morocco', 31.6295, -7.9811, 'Africa', {"elevation":466,"terrain":"mountain_pass","avgTemp":24,"roadGrade":5.8,"description":"Inland imperial city near the Atlas mountains."}),
  // 36. Mozambique
  MAPUTO: loc('Maputo', 'Mozambique', -25.9692, 32.5732, 'Africa', {"elevation":45,"avgTemp":24,"roadGrade":1.2,"description":"Southern Indian Ocean port capital."}),
  BEIRA: loc('Beira', 'Mozambique', -19.8436, 34.8389, 'Africa', {"elevation":12,"typicalWeather":"rain","terrain":"wet_pavement","avgTemp":26,"roadGrade":0.9,"description":"Central coastal gateway port for inland nations."}),
  // 37. Namibia
  WINDHOEK: loc('Windhoek', 'Namibia', -22.5609, 17.0658, 'Africa', {"elevation":1655,"avgTemp":21,"roadGrade":2.1,"description":"Highland plateau capital surrounded by desert corridors."}),
  WALVIS_BAY: loc('Walvis Bay', 'Namibia', -22.9575, 14.5053, 'Africa', {"elevation":5,"terrain":"desert_corridor","avgTemp":19,"roadGrade":0.5,"description":"Deep-water Atlantic logistics port of Namibia."}),
  // 38. Niger
  NIAMEY: loc('Niamey', 'Niger', 13.5116, 2.1254, 'Africa', {"elevation":207,"typicalWeather":"heatwave","terrain":"desert_corridor","avgTemp":36,"roadGrade":0.8,"description":"Niger river capital and Sahelian crossroads."}),
  ZINDER: loc('Zinder', 'Niger', 13.8072, 8.9881, 'Africa', {"elevation":445,"typicalWeather":"heatwave","terrain":"desert_corridor","avgTemp":37,"roadGrade":1,"description":"Historic eastern trans-Saharan trading city."}),
  // 39. Nigeria
  LAGOS: loc('Lagos', 'Nigeria', 6.5244, 3.3792, 'Africa', {"elevation":12,"typicalWeather":"rain","terrain":"wet_pavement","avgTemp":31,"roadGrade":1.2,"description":"Atlantic deep-water port, dense humid traffic corridors, coastal rainstorms."}),
  IBADAN: loc('Ibadan', 'Nigeria', 7.3775, 3.947, 'Africa', {"elevation":230,"avgTemp":29,"roadGrade":2.5,"description":"Rolling southwestern hills and industrial logistics distribution centers."}),
  ENUGU: loc('Enugu', 'Nigeria', 6.4584, 7.5464, 'Africa', {"elevation":260,"typicalWeather":"rain","terrain":"mountain_pass","avgTemp":28,"roadGrade":4.8,"description":"Eastern coal city highland escarpment with sharp bends and steep climbs."}),
  ABUJA: loc('Abuja', 'Nigeria', 9.0765, 7.3986, 'Africa', {"elevation":480,"avgTemp":33,"roadGrade":2,"description":"Central Federal Capital Territory expressway network and dry savanna plateau."}),
  KANO: loc('Kano', 'Nigeria', 12.0022, 8.5919, 'Africa', {"elevation":488,"typicalWeather":"heatwave","terrain":"desert_corridor","avgTemp":38,"roadGrade":1,"description":"Ancient trans-Saharan trade hub, intense heat waves and dry sandy road surfaces."}),
  MAIDUGURI: loc('Maiduguri', 'Nigeria', 11.8333, 13.15, 'Africa', {"elevation":320,"typicalWeather":"heatwave","terrain":"desert_corridor","avgTemp":39,"roadGrade":0.8,"description":"Northeastern Lake Chad basin transit terminus with desert crosswinds."}),
  PORT_HARCOURT: loc('Port Harcourt', 'Nigeria', 4.8156, 7.0498, 'Africa', {"elevation":18,"typicalWeather":"rain","terrain":"wet_pavement","avgTemp":30,"roadGrade":0.5,"description":"Oil and gas capital of the Niger Delta, high humidity and frequent heavy tropical downpours."}),
  SOKOTO: loc('Sokoto', 'Nigeria', 13.0674, 5.2323, 'Africa', {"elevation":270,"typicalWeather":"heatwave","terrain":"desert_corridor","avgTemp":40,"roadGrade":0.7,"description":"The Seat of the Caliphate, extreme northern heat waves and dry Sahelian winds."}),
  JOS: loc('Jos', 'Nigeria', 9.8965, 8.8583, 'Africa', {"elevation":1200,"typicalWeather":"fog","terrain":"mountain_pass","avgTemp":22,"roadGrade":6.2,"description":"The Tin City of the Plateau, high altitude temperate climate with steep climbs and misty mornings."}),
  BENIN_CITY: loc('Benin City', 'Nigeria', 6.335, 5.6037, 'Africa', {"elevation":80,"typicalWeather":"rain","avgTemp":29,"description":"Ancient historical gateway between the Western and Eastern commercial zones."}),
  KADUNA: loc('Kaduna', 'Nigeria', 10.5105, 7.4165, 'Africa', {"elevation":612,"avgTemp":31,"roadGrade":1.8,"description":"Major northern industrial rail-road junction and logistics heart of the Savannah."}),
  ILORIN: loc('Ilorin', 'Nigeria', 8.4799, 4.5418, 'Africa', {"elevation":305,"avgTemp":32,"roadGrade":1.1,"description":"The Gateway between North and South, where the Sahel meets the forest zone."}),
  MAKURDI: loc('Makurdi', 'Nigeria', 7.7322, 8.5391, 'Africa', {"elevation":104,"typicalWeather":"rain","terrain":"wet_pavement","avgTemp":33,"roadGrade":0.9,"description":"Major Benue River port and agricultural transit point for food security logistics."}),
  BAUCHI: loc('Bauchi', 'Nigeria', 10.3103, 9.8439, 'Africa', {"elevation":616,"typicalWeather":"heatwave","avgTemp":34,"roadGrade":2.3,"description":"Northern gateway to the Yankari plateau and eastern Sahelian trade routes."}),
  LOKOJA: loc('Lokoja', 'Nigeria', 7.8023, 6.7333, 'Africa', {"elevation":55,"typicalWeather":"rain","terrain":"wet_pavement","avgTemp":32,"roadGrade":1.4,"description":"The Confluence City where the Niger and Benue rivers meet, a critical national transit bottleneck."}),
  CALABAR: loc('Calabar', 'Nigeria', 4.9757, 8.3417, 'Africa', {"elevation":32,"typicalWeather":"rain","terrain":"wet_pavement","avgTemp":28,"roadGrade":1.1,"description":"Historic Atlantic port city and tourism hub, located in the lush rainforest zone."}),
  UYO: loc('Uyo', 'Nigeria', 5.0374, 7.9128, 'Africa', {"elevation":38,"typicalWeather":"rain","avgTemp":29,"roadGrade":0.8,"description":"Modern administrative capital with well-developed road networks and oil-sector logistics."}),
  KATSINA: loc('Katsina', 'Nigeria', 12.9894, 7.6, 'Africa', {"elevation":464,"typicalWeather":"heatwave","terrain":"desert_corridor","avgTemp":38,"roadGrade":0.9,"description":"Northern frontier commercial hub with ancient trade links across the Sahel."}),
  YOLA: loc('Yola', 'Nigeria', 9.2035, 12.485, 'Africa', {"elevation":190,"typicalWeather":"heatwave","avgTemp":36,"description":"Major Benue river valley logistics node and eastern Nigerian administrative center."}),
  MINNA: loc('Minna', 'Nigeria', 9.6139, 6.5569, 'Africa', {"elevation":299,"avgTemp":32,"roadGrade":2.1,"description":"Strategic central railway town and major gateway to the northwestern territories."}),
  // 40. Rwanda
  KIGALI: loc('Kigali', 'Rwanda', -1.9441, 30.0619, 'Africa', {"elevation":1567,"typicalWeather":"fog","terrain":"mountain_pass","avgTemp":21,"roadGrade":6.2,"description":"The Land of a Thousand Hills capital city."}),
  BUTARE: loc('Butare', 'Rwanda', -2.6, 29.7333, 'Africa', {"elevation":1768,"typicalWeather":"fog","terrain":"mountain_pass","avgTemp":20,"roadGrade":6.5,"description":"Southern intellectual and cultural center of Rwanda."}),
  // 41. Sao Tome and Principe
  SAO_TOME: loc('São Tomé', 'Sao Tome and Principe', 0.3302, 6.7333, 'Africa', {"elevation":15,"typicalWeather":"rain","terrain":"mountain_pass","avgTemp":27,"roadGrade":4,"description":"Equatorial island port and capital."}),
  SANTO_ANTONIO: loc('Santo António', 'Sao Tome and Principe', 1.6386, 7.4233, 'Africa', {"elevation":20,"typicalWeather":"rain","terrain":"mountain_pass","avgTemp":27,"roadGrade":4.5,"description":"Principal town on Príncipe island."}),
  // 42. Senegal
  DAKAR: loc('Dakar', 'Senegal', 14.7167, -17.4677, 'Africa', {"elevation":22,"avgTemp":26,"roadGrade":1.1,"description":"Westernmost Atlantic seaport and capital of Senegal."}),
  THIES: loc('Thiès', 'Senegal', 14.791, -16.9259, 'Africa', {"elevation":70,"avgTemp":27,"roadGrade":1.3,"description":"Inland railway and transport junction."}),
  // 43. Seychelles
  VICTORIA: loc('Victoria', 'Seychelles', -4.6191, 55.4513, 'Africa', {"elevation":10,"typicalWeather":"rain","terrain":"mountain_pass","avgTemp":28,"roadGrade":4.8,"description":"Compact island capital on Mahé."}),
  ANSE_BOILEAU: loc('Anse Boileau', 'Seychelles', -4.7214, 55.4858, 'Africa', {"elevation":15,"typicalWeather":"rain","terrain":"mountain_pass","avgTemp":28,"roadGrade":5,"description":"Southern coastal settlement on Mahé island."}),
  // 44. Sierra Leone
  FREETOWN: loc('Freetown', 'Sierra Leone', 8.4657, -13.2317, 'Africa', {"elevation":50,"typicalWeather":"rain","terrain":"mountain_pass","avgTemp":27,"roadGrade":5.2,"description":"Atlantic coastal estuary natural harbor capital."}),
  BO: loc('Bo', 'Sierra Leone', 7.9647, -11.7425, 'Africa', {"elevation":105,"typicalWeather":"rain","avgTemp":28,"roadGrade":1.8,"description":"Southern commercial and educational center."}),
  // 45. Somalia
  MOGADISHU: loc('Mogadishu', 'Somalia', 2.0469, 45.3182, 'Africa', {"elevation":9,"typicalWeather":"heatwave","avgTemp":28,"roadGrade":1,"description":"Indian Ocean coastal capital and trade port."}),
  HARGEISA: loc('Hargeisa', 'Somalia', 9.56, 44.065, 'Africa', {"elevation":1330,"terrain":"mountain_pass","avgTemp":23,"roadGrade":4.5,"description":"Highland commercial hub of northern Somalia."}),
  // 46. South Africa
  JOHANNESBURG: loc('Johannesburg', 'South Africa', -26.2041, 28.0473, 'Africa', {"elevation":1753,"avgTemp":19,"roadGrade":2.2,"description":"Economic heartland and gold mining metropolis."}),
  CAPE_TOWN: loc('Cape Town', 'South Africa', -33.9249, 18.4241, 'Africa', {"elevation":25,"terrain":"mountain_pass","avgTemp":17,"roadGrade":6,"description":"Legislative capital and premier southern maritime port."}),
  // 47. South Sudan
  JUBA: loc('Juba', 'South Sudan', 4.8594, 31.5713, 'Africa', {"elevation":550,"typicalWeather":"rain","avgTemp":31,"roadGrade":1.8,"description":"White Nile port capital and southern trade nexus."}),
  WAU: loc('Wau', 'South Sudan', 7.7029, 27.9953, 'Africa', {"elevation":430,"typicalWeather":"heatwave","avgTemp":32,"roadGrade":1.2,"description":"Northwestern railway and agricultural trading town."}),
  // 48. Sudan
  KHARTOUM: loc('Khartoum', 'Sudan', 15.5007, 32.5599, 'Africa', {"elevation":380,"typicalWeather":"heatwave","terrain":"desert_corridor","avgTemp":34,"roadGrade":1,"description":"Confluence of the Blue and White Nile capital."}),
  PORT_SUDAN: loc('Port Sudan', 'Sudan', 19.6175, 37.2164, 'Africa', {"elevation":3,"typicalWeather":"heatwave","terrain":"desert_corridor","avgTemp":32,"roadGrade":1.1,"description":"Primary Red Sea import and export shipping gateway."}),
  // 49. Tanzania
  DAR_ES_SALAAM: loc('Dar es Salaam', 'Tanzania', -6.7924, 39.2083, 'Africa', {"elevation":24,"typicalWeather":"rain","avgTemp":26,"description":"Major Indian Ocean port and commercial capital."}),
  DODOMA: loc('Dodoma', 'Tanzania', -6.163, 35.7516, 'Africa', {"elevation":1148,"avgTemp":23,"roadGrade":2.8,"description":"Central designated national capital of Tanzania."}),
  // 50. Togo
  LOME: loc('Lomé', 'Togo', 6.1375, 1.2123, 'Africa', {"elevation":10,"avgTemp":31,"roadGrade":0.6,"description":"Deep-water Atlantic port and trade hub."}),
  KARA: loc('Kara', 'Togo', 9.5511, 1.1861, 'Africa', {"elevation":312,"typicalWeather":"heatwave","avgTemp":33,"roadGrade":2.1,"description":"Northern regional commercial center."}),
  // 51. Tunisia
  TUNIS: loc('Tunis', 'Tunisia', 36.8065, 10.1815, 'Africa', {"elevation":4,"avgTemp":21,"roadGrade":1.2,"description":"Mediterranean northern capital and port."}),
  SFAX: loc('Sfax', 'Tunisia', 34.7406, 10.7603, 'Africa', {"elevation":10,"avgTemp":22,"roadGrade":1,"description":"Major industrial and phosphate export port."}),
  // 52. Uganda
  KAMPALA: loc('Kampala', 'Uganda', 0.3476, 32.5825, 'Africa', {"elevation":1200,"typicalWeather":"rain","avgTemp":23,"roadGrade":3.2,"description":"Lake Victoria basin capital and logistics center."}),
  JINJA: loc('Jinja', 'Uganda', 0.4479, 33.2026, 'Africa', {"elevation":1145,"typicalWeather":"rain","avgTemp":23,"roadGrade":2.5,"description":"Source of the Nile industrial and transport town."}),
  // 53. Zambia
  LUSAKA: loc('Lusaka', 'Zambia', -15.3875, 28.3228, 'Africa', {"elevation":1279,"avgTemp":22,"roadGrade":2,"description":"Southern African plateau capital and crossroads."}),
  NDOLA: loc('Ndola', 'Zambia', -12.9587, 28.6366, 'Africa', {"elevation":1300,"avgTemp":21,"roadGrade":2.3,"description":"Copperbelt industrial and commercial hub."}),
  // 54. Zimbabwe
  HARARE: loc('Harare', 'Zimbabwe', -17.8252, 31.0335, 'Africa', {"elevation":1480,"avgTemp":20,"roadGrade":2.4,"description":"Highveld capital and commercial agricultural market."}),
};
