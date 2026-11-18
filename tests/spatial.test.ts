import assert from 'node:assert/strict';
import { test } from 'node:test';
import { area, distance, radiusQuery, ring } from '../src/spatial.js';
import type { Center, Facility } from '../src/data.js';

test('Haversine menghitung contoh layanan darurat dan normalisasi bujur', () => {
  assert.ok(Math.abs(distance([98.67,3.59],[98.71,3.62]) - 5552.7156) < .01);
  assert.ok(Math.abs(distance([179.5,0],[-179.5,0]) - 111195.0802) < .01);
  assert.equal(distance([0,0],[0,0]),0);
});
test('luas poligon lokal dan poligon yang melintasi antimeridian', () => {
  const local: Center[] = [[98.66,3.56],[98.68,3.56],[98.685,3.57],[98.675,3.58],[98.66,3.575]];
  assert.ok(Math.abs(area(local) / 1e6 - 4.781892) < .0001);
  const seam: Center[] = [[179.5,-1],[-179.5,-1],[-179.5,1],[179.5,1]];
  assert.ok(Math.abs(area(seam) / 1e6 - 24727.43629) < .001);
  assert.ok(Math.abs(area(seam) - area([...seam].reverse())) < 1e-4);
});
test('cincin visual memakai satuan meter dan radius mengurutkan hasil', () => {
  const pusat: Center = [98.6722,3.5952];
  assert.equal(ring(pusat,5000).length,96);
  for (const edge of ring(pusat,5000)) assert.ok(Math.abs(distance(pusat,edge)-5000) < 1e-6);
  const sample = (id: string, coordinates: Center): Facility => ({
    type:'Feature', geometry:{ type:'Point',coordinates },
    properties:{ id, name:null, category:'health', subtype:'clinic', region_code:'1275', osm_type:'node' },
  });
  const targets = [sample('n1',[98.6822,3.5952]), sample('n2',pusat), sample('n3',[100,5])];
  assert.deepEqual(radiusQuery(targets,pusat,5000).map(x=>x.facility.properties.id),['n2','n1']);
  assert.equal(radiusQuery(targets,[96,2],5).length,0);
});
