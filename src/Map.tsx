import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { GeoJSON, MapContainer, Polygon, Polyline, TileLayer, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import 'leaflet.markercluster';
import type { Center, Facility, Indicator, Region } from './data';
import { band, categories, categoryKeys, facilityName, initialBounds, ramp, types } from './data';
import { ring } from './spatial';

export type Base = 'osm' | 'carto' | 'vector';
export type Mode = 'browse' | 'center' | 'distance' | 'area' | 'point';

const tileSets = {
  osm: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' },
  carto: { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', maxZoom: 20,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' },
};
const latlng = ([x, y]: Center): [number, number] => [y, x];

function popup(facility: Facility, label: string) {
  const feature = facility.properties;
  const node = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = facilityName(facility);
  const detail = document.createElement('p');
  const [x, y] = facility.geometry.coordinates;
  detail.textContent = categories[feature.category].name + ' · ' + (types[feature.subtype] ?? feature.subtype)
    + ' · ' + label + ' · ' + y.toFixed(5) + ', ' + x.toFixed(5);
  const source = document.createElement('a');
  source.textContent = 'Objek OpenStreetMap';
  source.href = 'https://www.openstreetmap.org/' + feature.osm_type + '/' + encodeURIComponent(feature.id.slice(1));
  node.append(title, detail, source);
  return node;
}

function Markers({ facilities, regionNames, onSelect }: {
  facilities: Facility[]; regionNames: Map<string, string>; onSelect: (f: Facility) => void;
}) {
  const map = useMap();
  useEffect(() => {
    const clusters = L.markerClusterGroup({
      maxClusterRadius: 46, showCoverageOnHover: false, spiderfyOnMaxZoom: true, animate: false,
      iconCreateFunction(cluster) {
        return L.divIcon({ className: 'cluster', html: '<span>' + cluster.getChildCount() + '</span>', iconSize: [34, 34] });
      },
    });
    const icons = Object.fromEntries(categoryKeys.map(cat => [cat, L.divIcon({
      className: 'map-facility', html: '<span class="symbol ' + categories[cat].shape + '" style="--symbol:' + categories[cat].color + '"></span>',
      iconSize: [20, 20], iconAnchor: [10, 10],
    })]));
    clusters.addLayers(facilities.map(f => {
      const name = facilityName(f);
      return L.marker(latlng(f.geometry.coordinates as Center), { icon: icons[f.properties.category], title: name, alt: name, bubblingMouseEvents: false })
        .bindPopup(() => popup(f, regionNames.get(f.properties.region_code) ?? 'Wilayah tidak tersedia'))
        .on('click', () => onSelect(f));
    }));
    map.addLayer(clusters);
    return () => { map.removeLayer(clusters); };
  }, [map, facilities, regionNames, onSelect]);
  return null;
}

function ViewControl({ focus, reset, onPoint, selected }: {
  focus: { center: Center; zoom: number } | null; reset: number; onPoint: (p: Center) => void; selected: Facility | null;
}) {
  const map = useMapEvents({ click: event => onPoint([event.latlng.lng, event.latlng.lat]) });
  useEffect(() => {
    const scale = L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);
    const element = map.getContainer();
    element.setAttribute('aria-label', 'Peta interaktif Sumatera Utara');
    const resize = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    resize.observe(element);
    return () => { scale.remove(); resize.disconnect(); };
  }, [map]);
  useEffect(() => { if (focus) map.setView(latlng(focus.center), focus.zoom, { animate: false }); }, [focus, map]);
  useEffect(() => { if (reset) map.fitBounds(initialBounds, { padding: [18, 15], animate: false }); }, [reset, map]);
  useEffect(() => {
    if (!selected) return;
    const point = latlng(selected.geometry.coordinates as Center);
    const anchor = L.circleMarker(point, { radius: 11, weight: 2, color: '#213c34', fillOpacity: 0, interactive: false }).addTo(map);
    return () => { anchor.remove(); };
  }, [selected, map]);
  return null;
}

type Props = {
  base: Base; regions: Region[]; facilities: Facility[]; regionNames: Map<string, string>; showRegions: boolean;
  indicator: Indicator | null; regionCode: string; mode: Mode; points: Center[];
  result: { center: Center; radius: number } | null; selected: Facility | null; locate: Center | null;
  focus: { center: Center; zoom: number } | null; reset: number;
  onPoint: (point: Center) => void; onSelect: (facility: Facility) => void; onRegion: (code: string) => void; tileError: () => void;
};

export function AtlasMap(p: Props) {
  const vector = p.base === 'vector';
  const regionHandler = useRef(p.onRegion);
  useEffect(() => { regionHandler.current = p.onRegion; }, [p.onRegion]);
  const regionCollection = { type: 'FeatureCollection' as const, features: p.regions };
  return <MapContainer className={'atlas-map ' + (p.mode === 'browse' ? '' : 'map-drawing')}
    bounds={initialBounds} boundsOptions={{ padding: [18, 15] }} minZoom={4} maxZoom={19}
    maxBounds={[[ -8, 88 ], [ 13, 111 ]]} zoomControl={false} zoomSnap={0.25} scrollWheelZoom={false}
    attributionControl={false} fadeAnimation={false} preferCanvas={false}>
    {p.base !== 'vector' && <TileLayer key={p.base} {...tileSets[p.base]} eventHandlers={{ tileerror: p.tileError }} />}
    <ZoomControl position="topright" />
    {p.showRegions && <GeoJSON key={p.indicator ?? 'boundaries'} data={regionCollection}
      style={f => {
        const props = f?.properties;
        const active = props?.code === p.regionCode;
        return {
          color: active ? '#133e32' : '#376957', opacity: .92,
          weight: active ? 2.8 : 1.1, dashArray: active && !p.indicator ? '5 3' : undefined,
          fillColor: p.indicator ? (props?.[p.indicator] == null ? '#ddd9cd' : ramp[band(p.indicator, props[p.indicator])]) : '#7ba98e',
          fillOpacity: p.indicator ? .76 : vector ? .38 : .11,
        };
      }} onEachFeature={(feature, layer) => {
        const path = layer as L.Path;
        const code = feature.properties.code;
        const label = document.createElement('span');
        label.textContent = feature.properties.name + (p.indicator ? ' · ' + feature.properties[p.indicator] + ' fasilitas' : '');
        path.bindTooltip(label, { sticky: true });
        path.on('click', () => regionHandler.current(code));
      }} />}
    <Markers facilities={p.facilities} regionNames={p.regionNames} onSelect={p.onSelect} />
    {p.result && <Polygon positions={ring(p.result.center, p.result.radius).map(latlng)}
      pathOptions={{ color: '#9c4527', weight: 2, fillOpacity: .14, interactive: false }} />}
    {p.points.length > 1 && p.mode === 'area' && p.points.length > 2 && <Polygon positions={p.points.map(latlng)} pathOptions={{ color: '#9c4527', interactive: false }} />}
    {p.points.length > 1 && (p.mode === 'distance' || (p.mode === 'area' && p.points.length < 3)) && <Polyline positions={p.points.map(latlng)} pathOptions={{ color: '#9c4527', interactive: false }} />}
    <Sketch points={p.points} location={p.locate} />
    <ViewControl reset={p.reset} focus={p.focus} onPoint={p.onPoint} selected={p.selected} />
  </MapContainer>;
}

function Sketch({ points, location }: { points: Center[]; location: Center | null }) {
  const map = useMap();
  useEffect(() => {
    const layer = L.layerGroup(points.map(p => L.circleMarker(latlng(p), {
      radius: 5, color: '#843b25', fillColor: '#fffaf0', fillOpacity: 1, interactive: false,
    }))).addTo(map);
    if (location) L.circleMarker(latlng(location), { radius: 8, color: '#215548', fillColor: 'white', fillOpacity: .8, interactive: false }).addTo(layer);
    return () => { layer.remove(); };
  }, [map, points, location]);
  return null;
}
