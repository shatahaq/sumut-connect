import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import type { Server } from 'node:http';
import type { Atlas, Facility, Region } from '../src/data.js';
import { createApp } from '../server/app.js';
import { openDatabase } from '../server/db.js';
import type { Database } from '../server/db.js';
import { radiusQuery } from '../src/spatial.js';

let db: Database;
let server: Server;
let url: string;
const jsonData = async (name: string) => JSON.parse(await readFile(new URL('../public/data/' + name,import.meta.url),'utf8'));
before(async () => {
  db = await openDatabase('');
  server = createApp(db).listen(0,'127.0.0.1');
  await once(server,'listening');
  const addr = server.address();
  assert.ok(addr && typeof addr !== 'string');
  url = 'http://127.0.0.1:' + addr.port + '/api/v1';
});
after(async () => {
  if (server) await new Promise<void>(resolve => server.close(() => resolve()));
  if (db) await db.close();
});
async function post(path: string, body: unknown) {
  return fetch(url+path,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
}

test('PostGIS aktif; statistik 33 wilayah setara dengan GeoJSON publik', async () => {
  const health = await fetch(url+'/health');
  assert.equal(health.status,200);
  assert.ok((await health.json()).postgis);
  const expected: Region[] = (await jsonData('sumut_regions.geojson')).features;
  const actual: Region[] = (await (await fetch(url+'/regions')).json()).features;
  assert.equal(actual.length,33);
  assert.deepEqual(actual.map(f=>f.properties),expected.map(f=>f.properties));
  const summary = await (await fetch(url+'/statistics/summary')).json();
  assert.equal(summary.facilities,expected.reduce((sum,f)=>sum+f.properties.total,0));
  const metadata: Atlas['datasets'] = await (await fetch(url+'/datasets')).json();
  assert.equal(metadata.length,3);
  assert.equal(metadata.find(d=>d.id==='osm-facilities')?.count,summary.facilities);
  const valid = await db.query<{ invalid:number }>('SELECT count(*)::int AS invalid FROM regions WHERE NOT ST_IsValid(geom)');
  assert.equal(valid.rows[0].invalid,0);
});
test('filter, pagination, bbox, detail, dan validasi input', async () => {
  const query = '/facilities?category=health&region=1275&bbox=98,3,99,4&limit=2';
  const page: Facility[] = (await (await fetch(url+query)).json()).features;
  const next: Facility[] = (await (await fetch(url+query+'&offset=2')).json()).features;
  assert.equal(page.length,2);
  assert.equal(next.length,2);
  assert.ok(page.every(f=>f.properties.region_code==='1275' && f.properties.category==='health'));
  assert.ok(next.every(f=>!page.some(old=>old.properties.id===f.properties.id)));
  assert.deepEqual(await (await fetch(url+'/facilities/'+page[0].properties.id)).json(),page[0]);
  assert.equal((await fetch(url+'/regions/1299')).status,404);
  const error = await fetch(url+'/facilities?limit=5001');
  assert.equal(error.status,400);
  assert.equal((await error.json()).requestId,error.headers.get('x-request-id'));
});
test('radius lokal dan PostGIS cocok, nearest terurut, compare menolak wilayah sama', async () => {
  const center: [number,number] = [98.6722,3.5952];
  const features: Facility[] = (await jsonData('facilities_health.geojson')).features;
  const local = radiusQuery(features,center,5000);
  const response = await post('/analysis/radius',{center,radiusKm:5,category:'health',limit:5});
  assert.equal(response.status,200);
  const result = await response.json();
  assert.ok(local.length>5);
  assert.equal(result.total,local.length);
  assert.deepEqual(result.hits.map((x: {facility:Facility})=>x.facility.properties.id),local.slice(0,5).map(x=>x.facility.properties.id));
  assert.ok(Math.abs(result.hits[0].meters-local[0].meters) < 1);
  assert.equal((await (await post('/analysis/radius',{center:[96,0],radiusKm:.1})).json()).total,0);
  assert.equal((await post('/analysis/radius',{center:[999,3],radiusKm:5})).status,400);
  const nearest = await (await post('/analysis/nearest',{center,category:'health',limit:5})).json();
  assert.deepEqual(nearest.hits.map((x: {facility:Facility})=>x.facility.properties.id),local.slice(0,5).map(x=>x.facility.properties.id));
  const comparison = await (await post('/analysis/compare',{a:'1275',b:'1212'})).json();
  assert.equal(comparison.difference.total,comparison.a.total-comparison.b.total);
  assert.equal((await post('/analysis/compare',{a:'1275',b:'1275'})).status,400);
});
