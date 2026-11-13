import { LocationInfo, loc } from '../types';

export const AFRICA_PART_1_LOCATIONS: Record<string, LocationInfo> = {
  // 1. Algeria
  ALGIERS: loc('Algiers', 'Algeria', 36.7538, 3.0588, 'Africa', {"elevation":20,"avgTemp":22,"roadGrade":3.1,"description":"Mediterranean capital and major North African shipping port."}),
  ORAN: loc('Oran', 'Algeria', 35.6971, -0.6309, 'Africa', {"elevation":90,"avgTemp":23,"roadGrade":2,"description":"Major industrial port and commercial hub of western Algeria."}),
  // 2. Angola
  LUANDA: loc('Luanda', 'Angola', -8.839, 13.2894, 'Africa', {"elevation":60,"typicalWeather":"rain","terrain":"wet_pavement","avgTemp":26,"description":"Atlantic coastal capital and petroleum logistics hub."}),
  LOBITO: loc('Lobito', 'Angola', -12.3644, 13.5383, 'Africa', {"elevation":15,"roadGrade":1.2,"description":"Strategic Atlantic terminus of the Benguela railway corridor."}),
  // 3. Benin
  COTONOU: loc('Cotonou', 'Benin', 6.3654, 2.4183, 'Africa', {"elevation":7,"typicalWeather":"rain","terrain":"wet_pavement","avgTemp":31,"roadGrade":0.4,"description":"Vital West African deep-water port city."}),
  PORTO_NOVO: loc('Porto-Novo', 'Benin', 6.4969, 2.6288, 'Africa', {"elevation":35,"typicalWeather":"rain","avgTemp":30,"roadGrade":1,"description":"Official historic capital near the Nokoué lake."}),
  // 4. Botswana
  GABORONE: loc('Gaborone', 'Botswana', -24.6282, 25.9231, 'Africa', {"elevation":1014,"avgTemp":24,"roadGrade":1.1,"description":"Capital city surrounded by mineral-rich Kalahari plateau routes."}),
  FRANCISTOWN: loc('Francistown', 'Botswana', -21.1736, 27.5057, 'Africa', {"elevation":1001,"avgTemp":23,"roadGrade":0.9,"description":"Northern mining and railway transit city of Botswana."}),
  // 5. Burkina Faso
  OUAGADOUGOU: loc('Ouagadougou', 'Burkina Faso', 12.3714, -1.5197, 'Africa', {"elevation":305,"typicalWeather":"heatwave","terrain":"desert_corridor","avgTemp":34,"roadGrade":0.8,"description":"Inland Sahelian transport nexus and capital."}),
  BOBO_DIOULASSO: loc('Bobo-Dioulasso', 'Burkina Faso', 11.1771, -4.2979, 'Africa', {"elevation":450,"avgTemp":32,"roadGrade":1.2,"description":"Economic and agricultural hub of western Burkina Faso."}),
  // 6. Burundi
  BUJUMBURA: loc('Bujumbura', 'Burundi', -3.3614, 29.3599, 'Africa', {"elevation":785,"typicalWeather":"rain","terrain":"mountain_pass","avgTemp":24,"roadGrade":5.2,"description":"Major port city on Lake Tanganyika surrounded by rugged mountain passes."}),
  GITEGA: loc('Gitega', 'Burundi', -3.4272, 29.9246, 'Africa', {"elevation":1730,"typicalWeather":"fog","terrain":"mountain_pass","avgTemp":20,"roadGrade":6,"description":"Central political capital located in the East African highlands."}),
  // 7. Cabo Verde
  PRAIA: loc('Praia', 'Cabo Verde', 14.933, -23.5133, 'Africa', {"elevation":30,"avgTemp":26,"roadGrade":2.5,"description":"Atlantic island capital and maritime port."}),
  MINDELO: loc('Mindelo', 'Cabo Verde', 16.8901, -24.9972, 'Africa', {"elevation":10,"roadGrade":1.8,"description":"Deep-water volcanic harbor and cultural seaport."}),
  // 8. Cameroon
  DOUALA: loc('Douala', 'Cameroon', 4.0511, 9.7679, 'Africa', {"elevation":13,"typicalWeather":"rain","terrain":"wet_pavement","avgTemp":28,"roadGrade":1,"description":"Primary economic engine and seaport of Cameroon."}),
  YAOUNDE: loc('Yaoundé', 'Cameroon', 3.848, 11.5021, 'Africa', {"elevation":750,"typicalWeather":"rain","terrain":"mountain_pass","avgTemp":24,"roadGrade":4.5,"description":"Hilly forested inland capital city."}),
  // 9. Central African Republic
  BANGUI: loc('Bangui', 'Central African Republic', 4.3947, 18.5582, 'Africa', {"elevation":369,"typicalWeather":"rain","avgTemp":27,"roadGrade":2.2,"description":"Ubangi river port and central continental logistics node."}),
  BIMBO: loc('Bimbo', 'Central African Republic', 4.2533, 18.4233, 'Africa', {"elevation":380,"typicalWeather":"rain","avgTemp":27,"roadGrade":2,"description":"Southwestern commercial distribution hub near the capital."}),
  // 10. Chad
  NDJAMENA: loc('undefined', 'Chad', 12.1348, 15.0557, 'Africa', {"elevation":298,"typicalWeather":"heatwave","terrain":"desert_corridor","avgTemp":35,"roadGrade":0.8,"description":"Chari river port city on the southern edge of the Sahara."}),
  MOUNDOU: loc('Moundou', 'Chad', 8.567, 16.0833, 'Africa', {"elevation":410,"avgTemp":32,"description":"Southern industrial and cotton processing center."}),
  // 11. Comoros
  MORONI: loc('Moroni', 'Comoros', -11.7172, 43.2551, 'Africa', {"elevation":20,"typicalWeather":"rain","terrain":"mountain_pass","avgTemp":27,"roadGrade":5.5,"description":"Volcanic island capital on Grande Comore."}),
  MUTSAMUDU: loc('Mutsamudu', 'Comoros', -12.1678, 44.4011, 'Africa', {"elevation":15,"typicalWeather":"rain","terrain":"mountain_pass","avgTemp":27,"roadGrade":5.8,"description":"Deep-water port on Anjouan island."}),
  // 12. Congo (Republic of the Congo)
  BRAZZAVILLE: loc('Brazzaville', 'Congo', -4.2634, 15.2429, 'Africa', {"elevation":320,"typicalWeather":"rain","roadGrade":1.8,"description":"Congo river capital facing Kinshasa across the water."}),
  POINTE_NOIRE: loc('Pointe-Noire', 'Congo', -4.7777, 11.8635, 'Africa', {"elevation":15,"typicalWeather":"rain","terrain":"wet_pavement","avgTemp":26,"roadGrade":0.9,"description":"Major Atlantic commercial port and oil terminal."}),
  // 13. Democratic Republic of the Congo
  KINSHASA: loc('Kinshasa', 'Democratic Republic of the Congo', -4.4419, 15.2663, 'Africa', {"elevation":240,"typicalWeather":"rain","avgTemp":26,"roadGrade":2,"description":"Mega-city capital and vast central African river port."}),
  LUBUMBASHI: loc('Lubumbashi', 'Democratic Republic of the Congo', -11.6647, 27.4794, 'Africa', {"elevation":1208,"terrain":"mountain_pass","avgTemp":22,"roadGrade":4.2,"description":"Copper mining capital of the southern mineral belt."}),
  // 14. Djibouti
  DJIBOUTI_CITY: loc('Djibouti City', 'Djibouti', 11.5821, 43.145, 'Africa', {"elevation":15,"typicalWeather":"heatwave","terrain":"desert_corridor","avgTemp":32,"roadGrade":1,"description":"Strategic Bab-el-Mandeb Red Sea transit port and logistics gateway."}),
  ALI_SABIEH: loc('Ali Sabieh', 'Djibouti', 11.1558, 42.7128, 'Africa', {"elevation":756,"typicalWeather":"heatwave","terrain":"desert_corridor","avgTemp":34,"roadGrade":3.5,"description":"Southern railway junction on the Ethiopia-Djibouti trade route."}),
  // 15. Egypt
  CAIRO: loc('Cairo', 'Egypt', 30.0444, 31.2357, 'Africa', {"elevation":23,"roadGrade":1.2,"description":"Nile metropolis and North African logistics nexus."}),
  ALEXANDRIA: loc('Alexandria', 'Egypt', 31.2001, 29.9187, 'Africa', {"elevation":10,"avgTemp":24,"roadGrade":0.8,"description":"Historic Mediterranean port city of Egypt."}),
  // 16. Equatorial Guinea
  MALABO: loc('Malabo', 'Equatorial Guinea', 3.7504, 8.7731, 'Africa', {"elevation":50,"typicalWeather":"rain","terrain":"mountain_pass","avgTemp":26,"roadGrade":5,"description":"Volcanic island capital on Bioko."}),
  BATA: loc('Bata', 'Equatorial Guinea', 1.855, 9.7656, 'Africa', {"elevation":10,"typicalWeather":"rain","terrain":"wet_pavement","avgTemp":27,"roadGrade":1.1,"description":"Mainland port city and commercial center."}),
  // 17. Eritrea
  ASMARA: loc('Asmara', 'Eritrea', 15.3229, 38.9251, 'Africa', {"elevation":2325,"typicalWeather":"fog","terrain":"mountain_pass","avgTemp":18,"roadGrade":7.2,"description":"Highland capital known for Italian modernist architecture and winding mountain roads."}),
  MASSAWA: loc('Massawa', 'Eritrea', 15.6087, 39.4754, 'Africa', {"elevation":5,"typicalWeather":"heatwave","terrain":"desert_corridor","avgTemp":35,"roadGrade":6.8,"description":"Red Sea port connected to the highlands by steep escarpment routes."}),
  // 18. Eswatini
  MBABANE: loc('Mbabane', 'Eswatini', -26.3167, 31.1333, 'Africa', {"elevation":1200,"typicalWeather":"fog","terrain":"mountain_pass","avgTemp":19,"roadGrade":6.5,"description":"Highveld administrative capital nestled in the Dlangamlomo mountains."}),
  MANZINI: loc('Manzini', 'Eswatini', -26.5, 31.3667, 'Africa', {"elevation":600,"avgTemp":22,"roadGrade":3,"description":"Commercial and industrial hub of Eswatini."}),
  // 19. Ethiopia
  ADDIS_ABABA: loc('Addis Ababa', 'Ethiopia', 9.03, 38.74, 'Africa', {"elevation":2355,"typicalWeather":"fog","terrain":"mountain_pass","avgTemp":17,"roadGrade":6.8,"description":"Highland diplomatic capital and continental transport hub."}),
  DIRE_DAWA: loc('Dire Dawa', 'Ethiopia', 9.5936, 41.8661, 'Africa', {"elevation":1276,"avgTemp":26,"roadGrade":3.5,"description":"Major eastern commercial city and railway hub."}),
  // 20. Gabon
  LIBREVILLE: loc('Libreville', 'Gabon', 0.3901, 9.4544, 'Africa', {"elevation":15,"typicalWeather":"rain","terrain":"wet_pavement","avgTemp":27,"roadGrade":1,"description":"Atlantic coastal capital and timber export port."}),
  PORT_GENTIL: loc('Port-Gentil', 'Gabon', -0.7193, 8.7815, 'Africa', {"elevation":3,"typicalWeather":"rain","terrain":"wet_pavement","avgTemp":27,"roadGrade":0.5,"description":"Economic capital and petroleum extraction center."}),
  // 21. Gambia
  BANJUL: loc('Banjul', 'Gambia', 13.4549, -16.579, 'Africa', {"elevation":5,"avgTemp":28,"roadGrade":0.6,"description":"Atlantic coastal estuary port capital."}),
  SERREKUNDA: loc('Serrekunda', 'Gambia', 13.4385, -16.678, 'Africa', {"elevation":12,"avgTemp":28,"roadGrade":0.8,"description":"Largest urban commercial center of Gambia."}),
  // 22. Ghana
  ACCRA: loc('Accra', 'Ghana', 5.6037, -0.187, 'Africa', {"elevation":60,"avgTemp":30,"roadGrade":1.2,"description":"Major Atlantic port and commercial hub."}),
  KUMASI: loc('Kumasi', 'Ghana', 6.6885, -1.6244, 'Africa', {"elevation":250,"typicalWeather":"rain","avgTemp":28,"roadGrade":2.1,"description":"The Garden City and historic trade center of the Ashanti region."}),
  // 23. Guinea
  CONAKRY: loc('Conakry', 'Guinea', 9.5092, -13.7122, 'Africa', {"elevation":10,"typicalWeather":"rain","terrain":"wet_pavement","avgTemp":27,"roadGrade":1.2,"description":"Atlantic port capital and bauxite export hub."}),
  KANKAN: loc('Kankan', 'Guinea', 10.3854, -9.3056, 'Africa', {"elevation":410,"avgTemp":31,"roadGrade":1.9,"description":"Major inland commercial trading city of Upper Guinea."}),
  // 24. Guinea-Bissau
  BISSAU: loc('Bissau', 'Guinea-Bissau', 11.8636, -15.5977, 'Africa', {"elevation":8,"typicalWeather":"rain","terrain":"wet_pavement","avgTemp":28,"roadGrade":0.5,"description":"Atlantic estuarine capital and agricultural port."}),
  BAFATA: loc('Bafatá', 'Guinea-Bissau', 12.2833, -14.65, 'Africa', {"elevation":35,"avgTemp":30,"roadGrade":1,"description":"Central commercial and river crossing hub."}),
  // 25. Ivory Coast
  ABIDJAN: loc('Abidjan', 'Ivory Coast', 5.36, -4.0083, 'Africa', {"elevation":25,"typicalWeather":"rain","terrain":"wet_pavement","avgTemp":28,"roadGrade":1.4,"description":"Economic capital and major West African lagoon port."}),
  YAMOUSSOUKRO: loc('Yamoussoukro', 'Ivory Coast', 6.8276, -5.2893, 'Africa', {"elevation":215,"avgTemp":29,"roadGrade":1.8,"description":"Official political capital situated in the inland savannah."}),
  // 26. Kenya
  NAIROBI: loc('Nairobi', 'Kenya', -1.2921, 36.8219, 'Africa', {"elevation":1795,"typicalWeather":"fog","terrain":"mountain_pass","avgTemp":20,"roadGrade":4.5,"description":"East African economic powerhouse and logistics hub."}),
  MOMBASA: loc('Mombasa', 'Kenya', -4.0435, 39.6682, 'Africa', {"elevation":17,"typicalWeather":"rain","avgTemp":28,"roadGrade":1.2,"description":"Premier Indian Ocean port serving East and Central Africa."}),
  // 27. Lesotho
  MASERU: loc('Maseru', 'Lesotho', -29.3167, 27.4833, 'Africa', {"elevation":1600,"typicalWeather":"fog","terrain":"mountain_pass","avgTemp":15,"roadGrade":7.5,"description":"Mountain capital city situated on the Caledon River."}),
};
