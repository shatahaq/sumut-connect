import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test('peta desktop, fasilitas, basemap, filter, pengukuran dan geolokasi', async ({page,context}) => {
  const errors: string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude:3.5952, longitude:98.6722, accuracy:25 });
  await page.setViewportSize({width:1440,height:940});
  await page.goto('');
  await expect(page.getByRole('heading',{name:'Jelajahi peta'})).toBeVisible();
  await expect(page.locator('.marker-cluster, .cluster').first()).toBeVisible();
  await expect(page.getByRole('link',{name:'© OpenStreetMap contributors'})).toBeVisible();
  await page.getByLabel('Peta dasar').selectOption('carto');
  await expect(page.getByRole('link',{name:'© CARTO'})).toBeVisible();
  await page.getByLabel('Peta dasar').selectOption('vector');
  await expect(page.locator('.leaflet-tile-pane img')).toHaveCount(0);
  await page.getByRole('combobox',{name:'Kabupaten/kota',exact:true}).selectOption('1275');
  await expect(page.getByRole('region',{name:'Detail wilayah'})).toContainText('Kota Medan');
  await page.getByLabel('Kesehatan',{exact:true}).uncheck();
  await page.getByLabel('Pendidikan',{exact:true}).uncheck();
  await page.getByLabel('Ekonomi',{exact:true}).uncheck();
  await expect(page.getByText('Tidak ada fasilitas yang sesuai.')).toBeVisible();
  await page.getByRole('button',{name:'Reset filter'}).click();
  await page.getByLabel('Nama fasilitas atau wilayah').fill('HASIL-TIDAK-ADA-XYZ');
  await expect(page.getByText('Tidak ada fasilitas yang sesuai.')).toBeVisible();
  await page.getByRole('button',{name:'Reset filter'}).click();
  const map = page.locator('.atlas-map');
  const locationButton = page.getByRole('button',{name:'Lokasi saya'});
  await locationButton.click();
  await expect(page.getByText('Lokasi ditemukan')).toBeVisible();
  await page.getByRole('button',{name:'Atur ulang'}).click();
  await page.getByRole('combobox',{name:'Alat',exact:true}).selectOption('distance');
  await map.click({position:{x:70,y:85}});
  await map.click({position:{x:130,y:100}});
  await expect(page.getByText('Jarak total')).toBeVisible();
  await page.getByRole('button',{name:'Urungkan titik'}).click();
  await expect(page.getByText('Pilih minimal dua titik')).toBeVisible();
  await page.getByRole('combobox',{name:'Alat',exact:true}).selectOption('area');
  for (const p of [{ x:60,y:65 }, { x:110,y:65 }, { x:110,y:100 }]) await map.click({position:p});
  await expect(page.getByText('Luas perkiraan')).toBeVisible();
  await page.getByRole('combobox',{name:'Alat',exact:true}).selectOption('point');
  await map.click({position:{x:62,y:72}});
  await expect(page.getByText('1 titik ·')).toBeVisible();
  await page.getByRole('combobox',{name:'Alat',exact:true}).selectOption('browse');
  await page.getByRole('combobox',{name:'Kabupaten/kota',exact:true}).selectOption('1275');
  await page.getByLabel('Nama fasilitas atau wilayah').fill('rumah sakit');
  await page.locator('.result-list li button').first().click();
  await expect(page.getByRole('region',{name:'Detail fasilitas'})).toBeVisible();
  const chosen = await page.getByRole('region',{name:'Detail fasilitas'}).getByRole('heading').innerText();
  await map.getByTitle(chosen,{exact:true}).click();
  await expect(page.locator('.leaflet-popup')).toContainText('Objek OpenStreetMap');
  await page.getByRole('button',{name:'Tutup detail'}).click();
  await page.getByRole('button',{name:'Reset filter'}).click();
  await page.getByRole('button',{name:'Atur ulang'}).click();
  await page.getByLabel('Peta dasar').selectOption('osm');
  const output = process.env.E2E_SCREENSHOTS;
  if (output) {
    await mkdir(output,{recursive:true});
    await page.waitForFunction(() => Array.from(document.querySelectorAll<HTMLImageElement>('.leaflet-tile-pane img')).some(img=>img.complete && img.naturalWidth>0),{},{timeout:20000});
    await page.screenshot({path:output+'/01-peta-desktop.png',animations:'disabled'});
  }
  expect(errors).toEqual([]);
});

test('radius, koroplet, perbandingan, metadata dan layout ponsel 375 px', async ({page}) => {
  const errors: string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:375,height:812});
  await page.goto('');
  await expect(page.getByRole('link',{name:'Ke isi utama'})).toBeAttached();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link',{name:'Ke isi utama'})).toBeFocused();
  const snapshotDir=process.env.E2E_SCREENSHOTS;
  await expect(page.getByRole('heading',{name:'Jelajahi peta'})).toBeVisible();
  const width=async()=>page.evaluate(() => document.documentElement.scrollWidth);
  expect(await width()).toBe(375);
  if (snapshotDir) {
    await mkdir(snapshotDir,{recursive:true});
    await page.waitForFunction(() => Array.from(document.querySelectorAll<HTMLImageElement>('.leaflet-tile-pane img')).some(img=>img.complete&&img.naturalWidth>0),{},{timeout:20000});
    await page.getByRole('heading',{level:1}).click();
    await page.screenshot({path:snapshotDir+'/02-peta-ponsel.png',animations:'disabled'});
  }
  await page.getByRole('link',{name:'Ringkasan',exact:true}).click();
  await expect(page.getByText('Kabupaten/kota',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Lihat peta koroplet'}).click();
  await expect(page.getByLabel('Legenda koroplet')).toBeVisible();
  await page.getByLabel('Tampilan peta').selectOption('health');
  await expect(page.getByLabel('Legenda koroplet')).toContainText('Kesehatan');
  await page.getByRole('link',{name:'Akses',exact:true}).click();
  await page.getByRole('button',{name:'Pilih pusat di peta'}).click();
  await expect(page.getByText('Klik pada peta untuk memilih pusat.')).toBeVisible();
  await page.locator('.atlas-map').click({position:{x:85,y:100}});
  await expect(page.getByText('Pusat dipilih.')).toBeVisible();
  await page.getByLabel('Lintang',{exact:true}).fill('3.5952');
  await page.getByLabel('Bujur',{exact:true}).fill('98.6722');
  await page.getByLabel('Radius (km)').fill('500');
  await page.getByRole('button',{name:'Jalankan analisis'}).click();
  await expect(page.getByText('Gunakan bujur')).toBeVisible();
  await page.getByLabel('Radius (km)').fill('5');
  await page.getByLabel('Kategori tujuan').selectOption('health');
  await page.getByRole('button',{name:'Jalankan analisis'}).click();
  await expect(page.getByRole('region',{name:'Hasil radius'})).toContainText('fasilitas dalam 5 km');
  await expect(page.getByRole('region',{name:'Hasil radius'})).toContainText('Haversine');
  expect(await width()).toBe(375);
  if (snapshotDir) {
    await page.setViewportSize({width:1440,height:940});
    await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:snapshotDir+'/03-akses.png',animations:'disabled'});
    await page.setViewportSize({width:375,height:812});
  }
  await page.getByRole('link',{name:'Bandingkan'}).click();
  await expect(page.getByRole('table')).toContainText('Luas referensi');
  expect(await width()).toBe(375);
  if (snapshotDir) {
    await page.setViewportSize({width:1440,height:940});
    await page.screenshot({path:snapshotDir+'/04-bandingkan.png',animations:'disabled'});
    await page.setViewportSize({width:375,height:812});
  }
  await page.getByLabel('Wilayah B').selectOption('1275');
  await expect(page.getByText('Pilih dua wilayah berbeda')).toBeVisible();
  await page.getByRole('link',{name:'Data',exact:true}).click();
  await expect(page.getByText('CC BY 3.0 IGO')).toBeVisible();
  await expect(page.getByText('ODbL 1.0').first()).toBeVisible();
  expect(await width()).toBe(375);
  expect(errors).toEqual([]);
});

test('dataset gagal dapat dimuat ulang dan gangguan ubin tetap menyisakan batas lokal', async ({page}) => {
  let blocked=true;
  await page.route('**/data/datasets.json',route=>blocked ? route.abort() : route.continue());
  await page.goto('');
  await expect(page.getByRole('alert')).toContainText('Atlas gagal dimuat');
  blocked=false;
  await page.route('https://tile.openstreetmap.org/**',route=>route.abort());
  await page.getByRole('button',{name:'Muat ulang data'}).click();
  await expect(page.getByRole('heading',{name:'Jelajahi peta'})).toBeVisible();
  await page.getByRole('button',{name:'Pakai batas lokal'}).click();
  await expect(page.getByRole('combobox',{name:'Peta dasar'})).toHaveValue('vector');
  await expect(page.locator('.leaflet-overlay-pane path').first()).toBeAttached();
  await page.getByRole('link',{name:'Akses',exact:true}).click();
  await page.getByLabel('Bujur',{exact:true}).fill('96');
  await page.getByLabel('Lintang',{exact:true}).fill('0');
  await page.getByLabel('Radius (km)').fill('0.1');
  await page.getByRole('button',{name:'Jalankan analisis'}).click();
  await expect(page.getByText('Tidak ada titik terpetakan')).toBeVisible();
  for (const width of [320,375,820,1024,1440]) {
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
  }
});
