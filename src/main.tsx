import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './style.css';
import { AtlasMap } from './Map';
import type { Base, Mode } from './Map';
import {
  apiBase, categories, categoryKeys, decimal, facilityName, indicators, loadAtlas, medan, number, types,
} from './data';
import type { Atlas, Category, Center, Facility, Indicator } from './data';
import { area, distance, radiusQuery } from './spatial';
import type { Hit } from './spatial';
import { Bars, Catalog, Compare, Detail, Legend, Overview, RegionPicker } from './panels';

const views = {
  peta: { tab: 'Peta', title: 'Atlas infrastruktur Sumatera Utara', desc: 'Telusuri fasilitas kesehatan, pendidikan, dan ekonomi di 33 kabupaten dan kota.' },
  ringkasan: { tab: 'Ringkasan', title: 'Infrastruktur dalam angka', desc: 'Persebaran fasilitas yang tercatat dalam ekstrak OpenStreetMap.' },
  akses: { tab: 'Akses', title: 'Jangkauan fasilitas', desc: 'Pilih titik asal untuk mencari fasilitas menurut jarak garis lurus.' },
  bandingkan: { tab: 'Bandingkan', title: 'Bandingkan dua wilayah', desc: 'Lihat selisih jumlah fasilitas dan luas wilayah referensi.' },
  data: { tab: 'Data', title: 'Sumber dan metode', desc: 'Jejak data dari sumber, pengolahan QGIS, hingga publikasi atlas.' },
} as const;
type View = keyof typeof views;
const viewKeys = Object.keys(views) as View[];
function readView(): View {
  const id = window.location.hash.slice(1);
  return viewKeys.includes(id as View) ? id as View : 'peta';
}

const baseLabels: Record<Base, string> = { osm: 'OpenStreetMap', carto: 'CARTO Positron', vector: 'Batas wilayah (lokal)' };
const modeLabels: Record<Mode, string> = { browse: 'Jelajahi', center: 'Pilih pusat', point: 'Tambah titik', distance: 'Ukur jarak', area: 'Ukur luas' };
const fmtMeters = (m: number) => m >= 1000 ? decimal.format(m / 1000) + ' km' : decimal.format(m) + ' m';
const fmtArea = (m: number) => m >= 1e6 ? decimal.format(m / 1e6) + ' km²' : decimal.format(m) + ' m²';
const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' });

function App() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [view, setView] = useState<View>(readView);
  const [base, setBase] = useState<Base>('osm');
  const [failedTiles, setFailedTiles] = useState(false);
  const [active, setActive] = useState<Category[]>(categoryKeys);
  const [regionsOn, setRegionsOn] = useState(true);
  const [region, setRegion] = useState('');
  const [search, setSearch] = useState('');
  const [indicator, setIndicator] = useState<Indicator | null>(null);
  const [selected, setSelected] = useState<Facility | null>(null);
  const [focus, setFocus] = useState<{ center: Center; zoom: number } | null>(null);
  const [reset, setReset] = useState(0);
  const [mode, setMode] = useState<Mode>('browse');
  const [points, setPoints] = useState<Center[]>([]);
  const [location, setLocation] = useState<Center | null>(null);
  const [notice, setNotice] = useState('');
  const [lat, setLat] = useState(String(medan[1]));
  const [lng, setLng] = useState(String(medan[0]));
  const [radius, setRadius] = useState('5');
  const [analysisCategory, setAnalysisCategory] = useState<Category | ''>('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ center: Center; radius: number; hits: Hit[]; total: number; date: Date; method: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadAtlas(controller.signal)
      .then(data => { setAtlas(data); setStatus('ready'); })
      .catch(() => { if (!controller.signal.aborted) setStatus('error'); });
    return () => { controller.abort(); };
  }, [attempt]);
  useEffect(() => {
    function changed() { setView(readView()); }
    window.addEventListener('hashchange', changed);
    return () => window.removeEventListener('hashchange', changed);
  }, []);

  const regions = useMemo(() => [...(atlas?.regions ?? [])].sort((a, b) => a.properties.name.localeCompare(b.properties.name, 'id')), [atlas]);
  const regionNames = useMemo(() => new Map(regions.map(r => [r.properties.code, r.properties.name])), [regions]);
  const searchTerm = search.trim().toLocaleLowerCase('id');
  const facilities = useMemo(() => (atlas?.facilities ?? []).filter(f =>
    active.includes(f.properties.category) && (!region || f.properties.region_code === region) &&
    (!searchTerm || facilityName(f).toLocaleLowerCase('id').includes(searchTerm) ||
      types[f.properties.subtype]?.toLocaleLowerCase('id').includes(searchTerm) ||
      regionNames.get(f.properties.region_code)?.toLocaleLowerCase('id').includes(searchTerm))), [atlas, active, region, searchTerm, regionNames]);
  const results = useMemo(() => [...facilities].sort((a, b) =>
    Number(!a.properties.name) - Number(!b.properties.name) || facilityName(a).localeCompare(facilityName(b), 'id')), [facilities]);
  const mapFacilities = useMemo(() => view === 'akses' ? (result?.hits.map(hit => hit.facility) ?? []) :
    indicator === null ? facilities : [], [view, result, indicator, facilities]);
  const shownRegion = regions.find(r => r.properties.code === region)?.properties;
  const snapshot = atlas?.datasets.find(d => d.id === 'osm-facilities')?.observed;
  const onSelect = useCallback((f: Facility) => setSelected(f), []);
  const onTileError = useCallback(() => setFailedTiles(true), []);
  const chooseRegion = useCallback((code: string) => {
    if (mode !== 'browse' || view !== 'peta') return;
    setRegion(code);
    setSelected(null);
  }, [mode, view]);
  const onPoint = useCallback(([x, y]: Center) => {
    if (mode === 'center' && view !== 'akses') return;
    if (mode === 'center') {
      setLat(y.toFixed(6)); setLng(x.toFixed(6)); setNotice('Pusat dipilih. Jalankan analisis untuk melihat hasil.');
      setMode('browse');
    } else if (mode !== 'browse') {
      setPoints(old => [...old, [x, y]]);
    }
  }, [mode, view]);

  function go(next: View) {
    setMode('browse'); setPoints([]); setNotice(''); setSelected(null); setFocus(null);
    setView(next);
    if (window.location.hash !== '#' + next) window.location.hash = next;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function showFacility(f: Facility) {
    setSelected(f);
    setFocus({ center: f.geometry.coordinates as Center, zoom: 17 });
  }
  function locate() {
    if (!navigator.geolocation) { setNotice('Lokasi perangkat tidak tersedia. Gunakan klik peta atau koordinat manual.'); return; }
    setNotice('Mencari lokasi perangkat…');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const point: Center = [coords.longitude, coords.latitude];
      if (point[0] < 88 || point[0] > 111 || point[1] < -8 || point[1] > 13) {
        setNotice('Lokasi perangkat berada di luar cakupan atlas. Pilih titik lain di peta.'); return;
      }
      setLocation(point);
      setFocus({ center: point, zoom: 14 });
      if (view === 'akses') { setLng(String(point[0])); setLat(String(point[1])); }
      setNotice('Lokasi ditemukan · akurasi sekitar ' + fmtMeters(coords.accuracy) + '.');
    }, error => {
      setNotice((error.code === 1 ? 'Izin lokasi ditolak.' : 'Lokasi belum ditemukan.') + ' Gunakan klik peta atau koordinat manual.');
    }, { timeout: 9000, maximumAge: 20000 });
  }
  async function analyze(e: FormEvent) {
    e.preventDefault();
    const center: Center = [Number(lng), Number(lat)];
    const kilometers = Number(radius);
    if (!lat.trim() || !lng.trim() || !radius.trim() || !center.every(Number.isFinite) ||
        center[0] < 95 || center[0] > 102 || center[1] < -2 || center[1] > 6 ||
        !Number.isFinite(kilometers) || kilometers < .1 || kilometers > 100) {
      setNotice('Gunakan bujur 95–102°, lintang −2–6°, dan radius 0,1–100 km.'); return;
    }
    setProcessing(true); setNotice(''); setMode('browse'); setSelected(null);
    try {
      let hits: Hit[];
      let total: number;
      let method: string;
      if (apiBase) {
        const response = await fetch(apiBase + '/analysis/radius', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ center, radiusKm: kilometers, category: analysisCategory || undefined, limit: 5000 }),
          signal: AbortSignal.timeout(12000),
        });
        if (!response.ok) throw new Error('Analisis gagal');
        ({ hits, total, method } = await response.json());
      } else {
        hits = radiusQuery((atlas?.facilities ?? []).filter(f => !analysisCategory || f.properties.category === analysisCategory), center, kilometers * 1000);
        total = hits.length;
        method = 'Haversine · garis lurus pada bumi bulat';
      }
      setResult({ center, radius: kilometers * 1000, hits, total, date: new Date(), method });
      setFocus({ center, zoom: Math.min(14, Math.max(7, Math.floor(15 - Math.log2(kilometers * 2)))) });
    } catch {
      setNotice('Analisis belum dapat dijalankan. Periksa koneksi API lalu ulangi.');
    } finally { setProcessing(false); }
  }

  const measure = points.reduce((sum, point, i) => i > 0 ? sum + distance(points[i - 1], point) : sum, 0);
  const measuredText = mode === 'area' && points.length >= 3 ? 'Luas perkiraan ' + fmtArea(area(points)) :
    mode === 'distance' && points.length >= 2 ? 'Jarak total ' + fmtMeters(measure) :
    mode === 'point' && points.length ? points.length + ' titik · ' + points.at(-1)!.slice().reverse().map(x => x.toFixed(5)).join(', ') :
    mode === 'area' ? 'Pilih minimal tiga titik berurutan.' :
    mode === 'distance' ? 'Pilih minimal dua titik pada peta.' :
    mode === 'point' ? 'Klik pada peta untuk menempatkan titik.' :
    mode === 'center' ? 'Klik pada peta untuk memilih pusat.' : '';

  return <>
    <a className="skip" href="#konten" onClick={e => { e.preventDefault(); document.getElementById('konten')?.focus(); }}>Ke isi utama</a>
    <header className="site-header">
      <div className="brand"><span className="brand-mark" aria-hidden="true">N</span><span>SUMUT <b>CONNECT</b></span></div>
      <nav aria-label="Navigasi utama">{viewKeys.map(id => <a key={id} href={'#' + id} aria-current={view === id ? 'page' : undefined}
        onClick={e => { e.preventDefault(); go(id); }}>{views[id].tab}</a>)}</nav>
    </header>
    <main id="konten" tabIndex={-1}>
      <div className="intro">
        <div><h1>{views[view].title}</h1><p>{views[view].desc}</p></div>
        {snapshot && <div className="snapshot"><span>SNAPSHOT OPENSTREETMAP · UTC</span><strong>{snapshot.slice(0,10)}</strong></div>}
      </div>
      {status === 'loading' && <p className="paper standing" role="status">Memuat batas dan fasilitas Sumatera Utara…</p>}
      {status === 'error' && <div className="paper standing" role="alert"><p>Atlas gagal dimuat. Periksa koneksi, lalu coba lagi.</p>
        <button className="action" onClick={() => { setStatus('loading'); setAttempt(n => n + 1); }}>Muat ulang data</button></div>}
      {atlas && (view === 'peta' || view === 'akses') && <div className="workspace">
        <section className="map-sheet" aria-label="Kanvas dan alat peta">
          <div className="map-tools">
            <label>Peta dasar<select value={base} onChange={e => { setBase(e.target.value as Base); setFailedTiles(false); }}>
              {(Object.keys(baseLabels) as Base[]).map(b => <option value={b} key={b}>{baseLabels[b]}</option>)}
            </select></label>
            <label>Alat<select value={mode} onChange={e => { setMode(e.target.value as Mode); setPoints([]); setNotice(''); }}>
              {(Object.keys(modeLabels) as Mode[]).filter(m => m !== 'center' || view === 'akses').map(m => <option value={m} key={m}>{modeLabels[m]}</option>)}
            </select></label>
            <button onClick={locate}>Lokasi saya</button>
            <button onClick={() => { setPoints([]); setSelected(null); setFocus(null); setLocation(null); setReset(n => n + 1); setNotice('Tampilan peta dikembalikan.'); }}>Atur ulang</button>
          </div>
          {(notice || measuredText || failedTiles) && <div className="map-note" role="status">
            {notice || measuredText || 'Sebagian ubin peta dasar gagal dimuat.'}
            {failedTiles && base !== 'vector' && <button onClick={() => { setBase('vector'); setFailedTiles(false); }}>Pakai batas lokal</button>}
            {points.length > 0 && <button onClick={() => setPoints(old => old.slice(0, -1))}>Urungkan titik</button>}
          </div>}
          <div className="map-wrap">
            <AtlasMap key={view} base={base} regions={regions} facilities={mapFacilities} regionNames={regionNames}
              showRegions={view === 'akses' || regionsOn || indicator !== null} indicator={view === 'peta' ? indicator : null}
              regionCode={view === 'peta' ? region : ''} mode={mode} points={points} result={view === 'akses' ? result : null}
              selected={selected} locate={location} focus={focus} reset={reset} onPoint={onPoint}
              onSelect={onSelect} onRegion={chooseRegion} tileError={onTileError} />
            <Legend indicator={view === 'peta' ? indicator : null} />
          </div>
          <div className="credit">
            <span><a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>{base === 'carto' && <> · <a href="https://carto.com/attributions">© CARTO</a></>} · <a href="https://www.geoboundaries.org/api/current/gbOpen/IDN/ADM2/">geoBoundaries · BPS/WFP/OCHA</a></span>
            <a href="https://leafletjs.com/">Leaflet</a>
          </div>
        </section>
        <aside className="field-panel" aria-label={view === 'peta' ? 'Jelajahi data peta' : 'Masukan dan hasil analisis'}>
          {view === 'peta' ? <>
            <h2>Jelajahi peta</h2>
            <label className="field">Nama fasilitas atau wilayah<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari, mis. Puskesmas" /></label>
            <label className="field">Kabupaten/kota<RegionPicker regions={regions} value={region} change={chooseRegion} all /></label>
            <label className="field">Tampilan peta<select value={indicator ?? ''} onChange={e => setIndicator((e.target.value || null) as Indicator | null)}>
              <option value="">Titik fasilitas</option>
              {Object.entries(indicators).map(([key,label]) => <option value={key} key={key}>Koroplet · {label}</option>)}
            </select></label>
            {!indicator && <fieldset><legend>Lapisan</legend>
              {categoryKeys.map(cat => <label className="check" key={cat}>
                <input type="checkbox" checked={active.includes(cat)} onChange={e => setActive(old => e.target.checked ? [...old, cat] : old.filter(x => x !== cat))} />
                <i className={'symbol ' + categories[cat].shape} style={{ background: categories[cat].color }} />{categories[cat].name}
              </label>)}
              <label className="check"><input type="checkbox" checked={regionsOn} onChange={e => setRegionsOn(e.target.checked)} /> Batas kabupaten/kota</label>
            </fieldset>}
            {shownRegion && <section className="detail" aria-label="Detail wilayah"><h3>{shownRegion.name}</h3>
              <p>{number.format(shownRegion.total)} fasilitas · {decimal.format(shownRegion.area_km2)} km²</p>
              <Bars values={categoryKeys.map(c => ({ label:categories[c].name, value:shownRegion[c], color:categories[c].color }))} />
            </section>}
            {indicator ? <div className="result-list">
              <h3>Jumlah terpetakan menurut wilayah</h3>
              <ul>{[...regions].sort((a,b) => b.properties[indicator] - a.properties[indicator]).map(r => <li key={r.properties.code}>
                <button onClick={() => chooseRegion(r.properties.code)}>{r.properties.name}<strong>{number.format(r.properties[indicator])}</strong></button>
              </li>)}</ul>
            </div> : <>
              <div className="line-heading">
                <h3 aria-live="polite">{number.format(facilities.length)} fasilitas</h3>
                <button className="plain" onClick={() => { setSearch(''); setRegion(''); setActive(categoryKeys); setRegionsOn(true); setSelected(null); }}>Reset filter</button>
              </div>
              {selected && <Detail f={selected} region={regionNames.get(selected.properties.region_code) ?? 'Wilayah belum tersedia'} observed={snapshot} close={() => setSelected(null)} />}
              {results.length === 0 ? <p role="status">Tidak ada fasilitas yang sesuai. Ubah pencarian atau filter.</p> :
                <div className="result-list"><p>Menampilkan {Math.min(30, results.length)} hasil pertama.</p>
                  <ul>{results.slice(0,30).map(f => <li key={f.properties.id}>
                    <button onClick={() => showFacility(f)}>{facilityName(f)}<small>{regionNames.get(f.properties.region_code)}</small></button>
                  </li>)}</ul>
                </div>}
            </>}
          </> : <>
            <h2>Analisis radius</h2>
            <form onSubmit={analyze} noValidate>
              <div className="coord-fields">
                <label className="field">Lintang<input type="number" step="any" value={lat} onChange={e => setLat(e.target.value)} /></label>
                <label className="field">Bujur<input type="number" step="any" value={lng} onChange={e => setLng(e.target.value)} /></label>
              </div>
              <button type="button" onClick={() => { setMode('center'); setPoints([]); setNotice(''); }}>Pilih pusat di peta</button>
              <label className="field">Radius (km)<input type="number" min=".1" max="100" step="any" value={radius} onChange={e => setRadius(e.target.value)} /></label>
              <label className="field">Kategori tujuan<select value={analysisCategory} onChange={e => setAnalysisCategory(e.target.value as Category | '')}>
                <option value="">Semua kategori</option>
                {categoryKeys.map(c => <option key={c} value={c}>{categories[c].name}</option>)}
              </select></label>
              <button className="action" disabled={processing}>{processing ? 'Menghitung…' : 'Jalankan analisis'}</button>
            </form>
            {result && <section className="result-list" aria-label="Hasil radius">
              <h3 aria-live="polite">{number.format(result.total)} fasilitas dalam {fmtMeters(result.radius)}</h3>
              <p>{result.method} · {dateFormat.format(result.date)} WIB.</p>
              <p>Sumber: OpenStreetMap {snapshot?.slice(0,10)}. Urutan dari hasil terdekat. Jarak jaringan dan waktu tempuh memerlukan data tambahan.</p>
              {result.hits.length === 0 && <p role="status">Tidak ada titik terpetakan di dalam radius ini.</p>}
              {result.hits.length > 30 && <p>Daftar menampilkan 30 hasil terdekat.</p>}
              {selected && <Detail f={selected} region={regionNames.get(selected.properties.region_code) ?? ''} observed={snapshot} close={() => setSelected(null)} />}
              <ul>{result.hits.slice(0,30).map(hit => <li key={hit.facility.properties.id}><button onClick={() => showFacility(hit.facility)}>{facilityName(hit.facility)}<strong>{fmtMeters(hit.meters)}</strong></button></li>)}</ul>
            </section>}
          </>}
        </aside>
      </div>}
      {atlas && view === 'ringkasan' && <Overview atlas={atlas} onInsight={() => { setIndicator('total'); go('peta'); }} />}
      {atlas && view === 'bandingkan' && <Compare regions={regions} />}
      {atlas && view === 'data' && <Catalog atlas={atlas} />}
    </main>
    <footer><span>SUMUT CONNECT · Atlas akademik</span><span>SDG 9 Infrastruktur · SDG 11 Permukiman berkelanjutan</span></footer>
  </>;
}

createRoot(document.getElementById('root')!).render(<App />);
