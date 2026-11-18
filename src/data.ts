import type { Feature, FeatureCollection, MultiPolygon, Point } from 'geojson';

export const categories = {
  health: { name: 'Kesehatan', color: '#ad3e35', shape: 'round' },
  education: { name: 'Pendidikan', color: '#1e6191', shape: 'square' },
  economy: { name: 'Ekonomi', color: '#936021', shape: 'diamond' },
} as const;
export type Category = keyof typeof categories;
export const categoryKeys = Object.keys(categories) as Category[];
export type Indicator = 'total' | Category;
export const number = new Intl.NumberFormat('id-ID');
export const decimal = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
export const types: Record<string, string> = {
  hospital: 'Rumah sakit', clinic: 'Klinik', doctors: 'Praktik dokter',
  school: 'Sekolah', college: 'Perguruan tinggi', university: 'Universitas',
  marketplace: 'Pasar', bank: 'Bank',
};
export type RegionProperties = {
  code: string; name: string; source_id: string; area_km2: number;
  health: number; education: number; economy: number; total: number;
};
export type FacilityProperties = {
  id: string; name: string | null; category: Category; subtype: string;
  region_code: string; osm_type: 'node' | 'way';
};
export type Region = Feature<MultiPolygon, RegionProperties>;
export type Facility = Feature<Point, FacilityProperties>;
export type Center = [number, number]; // lng, lat in GeoJSON order
export type Dataset = {
  id: string; title: string; publisher: string; url: string; license: string;
  accessed: string; observed: string; updated: string; crs: string;
  unit: string; count: number; validation: string; limits: string;
};
export type Atlas = { regions: Region[]; facilities: Facility[]; datasets: Dataset[] };
export const medan: Center = [98.6722, 3.5952];
export const initialBounds: [[number, number], [number, number]] = [[-.77, 96.92], [4.45, 100.56]];

export const indicators: Record<Indicator, string> = {
  total: 'Semua fasilitas', health: 'Kesehatan', education: 'Pendidikan', economy: 'Ekonomi',
};

export const asset = (file: string) => import.meta.env.BASE_URL + file;
export const apiBase = import.meta.env.VITE_API_BASE?.replace(/\/$/, '') ?? '';

export function facilityName(f: Facility) {
  return f.properties.name || (types[f.properties.subtype] ?? f.properties.subtype) + ' (nama belum tersedia)';
}

export async function loadAtlas(signal: AbortSignal): Promise<Atlas> {
  async function load<T>(url: string): Promise<T> {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error('Data atlas tidak dapat dimuat.');
    return res.json();
  }
  if (apiBase) {
    const [regions, datasets, ...collections] = await Promise.all([
      load<FeatureCollection<MultiPolygon, RegionProperties>>(apiBase + '/regions'),
      load<Dataset[]>(apiBase + '/datasets'),
      ...categoryKeys.map(async category => {
        const features: Facility[] = [];
        const limit = 1000;
        for (let offset = 0; ; offset += limit) {
          const page = await load<FeatureCollection<Point, FacilityProperties>>(
            apiBase + '/facilities?category=' + category + '&limit=' + limit + '&offset=' + offset);
          features.push(...page.features);
          if (page.features.length < limit) return features;
        }
      }),
    ]);
    return { regions: regions.features, facilities: collections.flat(), datasets };
  }
  const [regions, datasets, ...collections] = await Promise.all([
    load<FeatureCollection<MultiPolygon, RegionProperties>>(asset('data/sumut_regions.geojson')),
    load<Dataset[]>(asset('data/datasets.json')),
    ...categoryKeys.map(cat => load<FeatureCollection<Point, FacilityProperties>>(asset('data/facilities_' + cat + '.geojson'))),
  ]);
  return { regions: regions.features, facilities: collections.flatMap(fc => fc.features), datasets };
}

export const breaks: Record<Indicator, number[]> = {
  total: [0, 25, 75, 150],
  education: [0, 20, 60, 120],
  health: [0, 5, 20, 50],
  economy: [0, 5, 15, 35],
};
export const ramp = ['#ebf1ea', '#cedfcb', '#a1c4a6', '#599d80', '#236550'];
export function band(indicator: Indicator, value: number) {
  const index = breaks[indicator].findIndex(bound => value <= bound);
  return index < 0 ? ramp.length - 1 : index;
}
export function ranges(indicator: Indicator) {
  const limits = breaks[indicator];
  return ['0', ...limits.slice(1).map((hi, i) => (limits[i] + 1) + '–' + hi), '≥ ' + (limits.at(-1)! + 1)];
}