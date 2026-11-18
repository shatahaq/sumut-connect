
import type { Center, Facility } from './data.js';

const R = 6371008.8;
const rad = (angle: number) => angle * Math.PI / 180;
const deg = (angle: number) => angle * 180 / Math.PI;
const norm = (angle: number) => ((angle + 180) % 360 + 360) % 360 - 180;

export function distance([x1, y1]: Center, [x2, y2]: Center) {
  const a = Math.sin(rad(y2 - y1) / 2) ** 2 +
    Math.cos(rad(y1)) * Math.cos(rad(y2)) * Math.sin(rad(norm(x2 - x1)) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(Math.max(0, Math.min(1, a))));
}

export function area(points: Center[]) {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    sum += rad(norm(x2 - x1)) * (Math.sin(rad(y1)) + Math.sin(rad(y2)));
  }
  return Math.abs(sum) * R ** 2 / 2;
}

export function ring([lng, lat]: Center, radius: number): Center[] {
  const delta = radius / R;
  const φ = rad(lat);
  return Array.from({ length: 96 }, (_, i) => {
    const bearing = i * Math.PI / 48;
    const next = Math.asin(Math.sin(φ) * Math.cos(delta) + Math.cos(φ) * Math.sin(delta) * Math.cos(bearing));
    const x = rad(lng) + Math.atan2(Math.sin(bearing) * Math.sin(delta) * Math.cos(φ), Math.cos(delta) - Math.sin(φ) * Math.sin(next));
    return [norm(deg(x)), deg(next)];
  });
}

export type Hit = { facility: Facility; meters: number };
export function radiusQuery(facilities: Facility[], center: Center, radiusMeters: number): Hit[] {
  return facilities.map(facility => ({ facility, meters: distance(center, facility.geometry.coordinates as Center) }))
    .filter(hit => hit.meters <= radiusMeters)
    .sort((a, b) => a.meters - b.meters || a.facility.properties.id.localeCompare(b.facility.properties.id));
}
