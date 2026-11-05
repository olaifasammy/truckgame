import { RegionName } from '../../data/world';

export const homeState = {
  openJobId: null as number | null,
  selectedRegion: 'All' as RegionName | 'All',
  inspectCity: null as string | null,
  mapLayer: 'all' as 'all' | 'active' | 'hubs' | 'weather',
  zoomLevel: 1 as number,
  panX: 0 as number,
  panY: 0 as number
};
