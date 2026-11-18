import type { ReactNode } from 'react';
import {
  categories, categoryKeys, decimal, facilityName, indicators, number, ramp, ranges, types,
} from './data';
import type { Atlas, Facility, Indicator, Region } from './data';

export function Legend({ indicator }: { indicator: Indicator | null }) {
  if (indicator) return <div className="legend" aria-label="Legenda koroplet">
    <b>{indicators[indicator]} · jumlah titik</b>
    <div className="ramp">{ranges(indicator).map((label, i) => <span key={label}><i style={{ background: ramp[i] }} />{label}</span>)}</div>
    <small>Abu-abu: data belum tersedia</small>
  </div>;
  return <div className="legend" aria-label="Legenda fasilitas">
    <b>Legenda</b>
    <ul>{categoryKeys.map(cat => <li key={cat}><i className={'symbol ' + categories[cat].shape} style={{ background: categories[cat].color }} />{categories[cat].name}</li>)}
      <li><i className="boundary-symbol" /> Batas kabupaten/kota</li>
    </ul>
  </div>;
}

export function Bars({ values, maximum }: { values: { label: string; value: number; color?: string }[]; maximum?: number }) {
  const max = maximum ?? Math.max(1, ...values.map(x => x.value));
  return <div className="bars">{values.map(({ label, value, color }) => <div className="bar-row" key={label}>
    <span>{label}</span><div className="track" aria-hidden="true"><i style={{ width: (value / max * 100) + '%', background: color }} /></div>
    <strong>{number.format(value)}</strong>
  </div>)}</div>;
}

export function RegionPicker({ regions, value, change, all }: { regions: Region[]; value: string; change: (v: string) => void; all?: boolean }) {
  return <select value={value} onChange={e => change(e.target.value)}>
    {all && <option value="">Seluruh Sumatera Utara</option>}
    {regions.map(f => <option key={f.properties.code} value={f.properties.code}>{f.properties.name}</option>)}
  </select>;
}

export function Detail({ f, region, observed, close }: { f: Facility; region: string; observed?: string; close: () => void }) {
  const [x, y] = f.geometry.coordinates;
  return <section className="detail" aria-label="Detail fasilitas">
    <div className="line-heading"><h3>{facilityName(f)}</h3><button className="plain" onClick={close} aria-label="Tutup detail">×</button></div>
    <p>{types[f.properties.subtype] ?? f.properties.subtype} · {region}</p>
    <p>{y.toFixed(5)}° lintang · {x.toFixed(5)}° bujur</p>
    <a href={'https://www.openstreetmap.org/' + f.properties.osm_type + '/' + encodeURIComponent(f.properties.id.slice(1))}>Rekaman OpenStreetMap</a>
    {observed && <p className="muted">Snapshot {observed.slice(0, 10)} · ODbL 1.0</p>}
  </section>;
}

export function Overview({ atlas, onInsight }: { atlas: Atlas; onInsight: () => void }) {
  const tally = categoryKeys.map(cat => ({ label: categories[cat].name, color: categories[cat].color,
    value: atlas.facilities.filter(f => f.properties.category === cat).length }));
  const regions = [...atlas.regions].sort((a,b) => b.properties.total - a.properties.total);
  const snapshot = atlas.datasets.find(d => d.id === 'osm-facilities')?.observed;
  return <div className="editorial">
    <div className="metric-line">
      <div><strong>{number.format(atlas.regions.length)}</strong><span>Kabupaten/kota</span></div>
      <div><strong>{number.format(atlas.facilities.length)}</strong><span>Fasilitas terpetakan</span></div>
      <div><strong>{atlas.datasets.length}</strong><span>Dataset terdokumentasi</span></div>
    </div>
    <div className="content-columns">
      <section className="paper"><h2>Fasilitas menurut kategori</h2><Bars values={tally} />
        <p className="muted">Satuan: titik fasilitas dalam snapshot OSM {snapshot?.slice(0,10)}.</p></section>
      <section className="paper"><h2>Konsentrasi fasilitas</h2><Bars values={regions.slice(0,5).map(r => ({ label:r.properties.name, value:r.properties.total }))} />
        <button className="action" onClick={onInsight}>Lihat peta koroplet</button></section>
    </div>
    <section className="paper metadata-note"><h2>Kelengkapan nama</h2>
      <p>{number.format(atlas.facilities.filter(f => !f.properties.name).length)} objek fasilitas memiliki nama yang belum tersedia. Jumlah fasilitas mencerminkan catatan yang ditemukan dalam ekstrak.</p>
    </section>
  </div>;
}

export function Compare({ regions }: { regions: Region[] }) {
  return <CompareContent regions={regions} />;
}

import { useState } from 'react';
function CompareContent({ regions }: { regions: Region[] }) {
  const [a, setA] = useState(regions.find(r => r.properties.name === 'Kota Medan')?.properties.code ?? regions[0]?.properties.code ?? '');
  const [b, setB] = useState(regions.find(r => r.properties.name === 'Kabupaten Deli Serdang')?.properties.code ?? regions[1]?.properties.code ?? '');
  const left = regions.find(r => r.properties.code === a)?.properties;
  const right = regions.find(r => r.properties.code === b)?.properties;
  return <div className="editorial">
    <section className="paper compare-input">
      <label>Wilayah A<RegionPicker regions={regions} value={a} change={setA} /></label>
      <label>Wilayah B<RegionPicker regions={regions} value={b} change={setB} /></label>
    </section>
    {a === b ? <p role="status" className="paper">Pilih dua wilayah berbeda untuk dibandingkan.</p> : left && right && <>
      <div className="content-columns">
        {[left,right].map(r => <section className="paper" key={r.code}><h2>{r.name}</h2>
          <Bars maximum={Math.max(1,...categoryKeys.flatMap(c => [left[c],right[c]]))}
            values={categoryKeys.map(c => ({ label:categories[c].name, color:categories[c].color, value:r[c] }))} />
        </section>)}
      </div>
      <section className="paper"><h2>Selisih A terhadap B</h2>
        <DataTable head={['Indikator', 'A', 'B', 'A − B']}>
          {[...categoryKeys, 'total' as const].map(c => <tr key={c}><th scope="row">{indicators[c]}</th><td>{number.format(left[c])}</td><td>{number.format(right[c])}</td><td>{number.format(left[c]-right[c])}</td></tr>)}
          <tr><th scope="row">Luas referensi (km²)</th><td>{decimal.format(left.area_km2)}</td><td>{decimal.format(right.area_km2)}</td><td>{decimal.format(left.area_km2-right.area_km2)}</td></tr>
        </DataTable>
        <p className="muted">A dan B memakai snapshot fasilitas yang sama. Luas dihitung secara elipsoidal dari batas referensi 2020. Jumlah penduduk dan waktu tempuh belum tersedia.</p>
      </section>
    </>}
  </div>;
}

function DataTable({ head, children }: { head: string[]; children: ReactNode }) {
  return <div className="table-wrap"><table><thead><tr>{head.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}

export function Catalog({ atlas }: { atlas: Atlas }) {
  return <div className="editorial">
    {atlas.datasets.map(d => <section className="paper dataset" key={d.id}><h2>{d.title}</h2>
      <p>{d.publisher} · <a href={d.url}>Lihat sumber</a></p>
      <dl><div><dt>Versi observasi</dt><dd>{d.observed}</dd></div><div><dt>Tanggal akses</dt><dd>{d.accessed}</dd></div>
        <div><dt>Pembaruan internal</dt><dd>{d.updated}</dd></div><div><dt>Lisensi</dt><dd>{d.license}</dd></div>
        <div><dt>Unit analisis</dt><dd>{d.unit}</dd></div><div><dt>CRS</dt><dd>{d.crs}</dd></div>
        <div><dt>Jumlah</dt><dd>{number.format(d.count)}</dd></div><div><dt>Validasi</dt><dd>{d.validation}</dd></div>
      </dl><p>{d.limits}</p>
    </section>)}
    <section className="paper"><h2>Metode dan interpretasi</h2>
      <p>Titik OSM dihubungkan ke kabupaten/kota melalui pencocokan spasial di QGIS. Koroplet menunjukkan jumlah titik sesuai kategori dan rentang pada legenda. Nilai nol berarti ekstrak ini tidak memiliki titik tercatat pada kelas dan wilayah tersebut.</p>
      <p>Radius menyeleksi tujuan dari jarak garis lurus. Kajian lanjutan memerlukan data penduduk, jaringan yang dapat dilalui, dan pemeriksaan lapangan. Atlas mendukung eksplorasi infrastruktur (SDG 9) dan pemerataan layanan (SDG 11).</p>
    </section>
  </div>;
}
