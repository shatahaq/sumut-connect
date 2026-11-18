import csv
import json
import math
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

from qgis.core import (
    QgsApplication, QgsCoordinateReferenceSystem, QgsCoordinateTransform,
    QgsDistanceArea, QgsFeature, QgsFeatureRequest, QgsField, QgsFillSymbol,
    Qgis, QgsReferencedRectangle, QgsGeometry, QgsGraduatedSymbolRenderer, QgsMarkerSymbol, QgsPointXY,
    QgsProject, QgsRectangle, QgsRendererRange, QgsSpatialIndex, QgsVectorFileWriter,
    QgsVectorLayer, QgsWkbTypes,
)
from qgis.PyQt.QtCore import QVariant

ROOT = Path(__file__).resolve().parents[1]
GIS = ROOT / 'gis'
DATA = ROOT / 'public/data'
INPUT = Path(sys.argv[1]).resolve()
DATE = '2026-11-18'
BOUNDARY = 'https://www.geoboundaries.org/api/current/gbOpen/IDN/ADM2/'
OSM = 'https://download.geofabrik.de/asia/indonesia/sumatra.html'
CATEGORIES = {'health':'Kesehatan', 'education':'Pendidikan', 'economy':'Ekonomi'}
COLORS = {'health':'#ad3e35','education':'#1e6191','economy':'#936021'}
NAMES = (
    'Nias|Mandailing Natal|Tapanuli Selatan|Tapanuli Tengah|Tapanuli Utara|Toba|'
    'Labuhanbatu|Asahan|Simalungun|Dairi|Karo|Deli Serdang|Langkat|Nias Selatan|'
    'Humbang Hasundutan|Pakpak Bharat|Samosir|Serdang Bedagai|Batu Bara|Padang Lawas Utara|'
    'Padang Lawas|Labuhanbatu Selatan|Labuhanbatu Utara|Nias Utara|Nias Barat|'
    'Sibolga|Tanjungbalai|Pematangsiantar|Tebing Tinggi|Medan|Binjai|Padangsidimpuan|Gunungsitoli'
).split('|')
def key(value):
    return re.sub(r'[^a-z0-9]+','',unicodedata.normalize('NFKC',value).casefold())

app = QgsApplication([], False)
app.initQgis()
project = QgsProject.instance()
crs = QgsCoordinateReferenceSystem('EPSG:4326')
project.setCrs(crs)
project.setEllipsoid('WGS84')
dist = QgsDistanceArea()
dist.setSourceCrs(crs, project.transformContext())
dist.setEllipsoid('WGS84')
counts = Counter()

def layer(name, geometry, cols):
    v = QgsVectorLayer(f'{geometry}?crs=EPSG:4326',name,'memory')
    types = {'s':QVariant.String,'i':QVariant.Int,'d':QVariant.Double}
    v.dataProvider().addAttributes([QgsField(n,types[t]) for n,t in (col.split(':') for col in cols.split(','))])
    v.updateFields()
    return v

def feature(v, geom, attrs):
    f = QgsFeature(v.fields())
    f.setGeometry(geom)
    f.setAttributes(attrs)
    return f

def add(v, features):
    success, rows = v.dataProvider().addFeatures(features)
    assert success and len(rows) == len(features), v.name()
    v.updateExtents()
    return rows

def write(v, file, name, fmt='GPKG', append=False):
    opts = QgsVectorFileWriter.SaveVectorOptions()
    opts.driverName = fmt
    opts.layerName = name
    opts.fileEncoding = 'UTF-8'
    if fmt == 'GeoJSON':
        opts.layerOptions = ['RFC7946=YES','COORDINATE_PRECISION=6']
    if append:
        opts.actionOnExistingFile = QgsVectorFileWriter.CreateOrOverwriteLayer
    error, message, *_ = QgsVectorFileWriter.writeAsVectorFormatV3(v,str(file),project.transformContext(),opts)
    if error != QgsVectorFileWriter.NoError:
        raise RuntimeError(message)

def parse(row):
    g = row['geometry']
    if g['type'] == 'Point':
        return QgsGeometry.fromPointXY(QgsPointXY(*g['coordinates']))
    return QgsGeometry.fromWkt(f"{g['type']}({wkt_coords(g['coordinates'])})")

def wkt_coords(coords):
    if isinstance(coords[0][0],list):
        return ','.join('('+wkt_coords(ring)+')' for ring in coords)
    return ','.join(f'{x} {y}' for x,y in coords)

def ndjson(name):
    with (INPUT/name).open(encoding='utf-8') as handle:
        yield from map(json.loads,handle)

print('Memeriksa ADM2',flush=True)
src = QgsVectorLayer(str(INPUT/'adm2.geojson'),'ADM2','ogr')
assert src.isValid(), 'ADM2 tidak dapat dibaca'
region_fields = 'code:s,name:s,source_id:s,area_km2:d,health:i,education:i,economy:i,total:i'
regions = layer('Kabupaten dan kota','MultiPolygon',region_fields)
reference = {}
for i, name in enumerate(NAMES):
    code = f'12{(i+1 if i<25 else i+46):02}'
    reference[key(name)] = reference[key(('Kabupaten ' if i<25 else 'Kota ')+name)] = (code,('Kabupaten ' if i<25 else 'Kota ')+name)
reference['tobasamosir'] = reference['kabupatentobasamosir'] = reference['toba']
reference['kepadangsidimpuan'] = reference['padangsidimpuan']
region_data = {}
for f in src.getFeatures(QgsFeatureRequest().setFilterRect(QgsRectangle(96.2,-0.8,100.9,4.8))):
    name = key(f['shapeName'])
    match = reference.get(name) or reference.get(name.removesuffix('regency')) or reference.get(name.removesuffix('city'))
    if not match:
        continue
    code, label = match
    g = f.geometry()
    if not g.isGeosValid():
        g = g.makeValid()
        counts['repaired_regions'] += 1
    g.convertToMultiType()
    assert not g.isEmpty() and g.isGeosValid() and code not in region_data, (code,label)
    region_data[code] = (label,f['shapeID'],g,round(dist.measureArea(g)/1e6,2))
assert len(region_data)==33, sorted(set(reference.values())-{(k,v[0]) for k,v in region_data.items()})
index = QgsSpatialIndex()
engines = {}
codes = {}
for i,(code,(name,source_id,g,area)) in enumerate(sorted(region_data.items())):
    f = QgsFeature(i)
    f.setGeometry(g)
    index.addFeature(f)
    engine = QgsGeometry.createGeometryEngine(g.constGet())
    engine.prepareGeometry()
    engines[i] = engine
    codes[i] = code

print('Gabung spasial fasilitas',flush=True)
pools = defaultdict(list)
candidates = []
for row in ndjson('facilities.ndjson'):
    counts['candidate_facilities'] += 1
    g = parse(row)
    if g.type() == QgsWkbTypes.PolygonGeometry:
        if not g.isGeosValid():
            g = g.makeValid()
        g = g.pointOnSurface()
    elif g.type() == QgsWkbTypes.LineGeometry:
        g = g.interpolate(g.length()/2)
    if g.isEmpty():
        counts['invalid_facilities'] += 1
        continue
    p = g.asPoint()
    matches = [codes[i] for i in index.intersects(g.boundingBox()) if engines[i].intersects(g.constGet())]
    if not matches:
        counts['outside_facilities'] += 1
        continue
    if len(matches)>1:
        counts['ambiguous_facilities'] += 1
    candidates.append((row,g,p,min(matches)))
locations = {}
subtotals = defaultdict(Counter)
fcols = 'id:s,name:s,category:s,subtype:s,region_code:s,osm_type:s'
facilities = layer('Fasilitas OSM','Point',fcols)
features = {cat:[] for cat in CATEGORIES}
for row,g,p,code in sorted(candidates,key=lambda v:(v[0]['id'][0]!='n',v[0]['id'])):
    name = ' '.join((row['name'] or '').split())
    cat = row['category']
    if name:
        ix,iy = math.floor(p.x()*1000),math.floor(p.y()*1000)
        prefix = (cat,row['subtype'],key(name))
        if any(dist.measureLine(p,other)<60 for i in (-1,0,1) for j in (-1,0,1)
               for other in pools[(*prefix,ix+i,iy+j)]):
            counts['duplicate_facilities'] += 1
            continue
        pools[(*prefix,ix,iy)].append(p)
    osm_type = 'node' if row['id'][0]=='n' else 'way'
    attrs = [row['id'],name or None,cat,row['subtype'],code,osm_type]
    features[cat].append(feature(facilities,g,attrs))
    subtotals[code][cat]+=1
    locations[row['id']]=p

all_facilities = sum(features.values(),[])
add(facilities,all_facilities)
assert all(features.values()) and len(locations)==len(all_facilities)
write(facilities,GIS/'sumut_master.gpkg','facilities')
for cat,label in CATEGORIES.items():
    v = layer(label,'Point',fcols)
    add(v,features[cat])
    write(v,DATA/f'facilities_{cat}.geojson',f'facilities_{cat}','GeoJSON')

full, web = [], []
web_regions = layer('Wilayah publikasi','MultiPolygon',region_fields)
stats = []
for code,(name,source_id,g,area) in sorted(region_data.items()):
    values = [subtotals[code][c] for c in CATEGORIES]
    attrs = [code,name,source_id,area,*values,sum(values)]
    full.append(feature(regions,g,attrs))
    simp = g.simplify(.00065)
    if simp.isEmpty() or not simp.isGeosValid():
        simp = QgsGeometry(g)
    simp.convertToMultiType()
    web.append(feature(web_regions,simp,attrs))
    stats.append(dict(zip(['code','name','source_id','area_km2','health','education','economy','total'],attrs)))
add(regions,full)
add(web_regions,web)
write(regions,GIS/'sumut_master.gpkg','regions',append=True)
write(web_regions,DATA/'sumut_regions.geojson','regions','GeoJSON')

print('Klip jaringan jalan utama',flush=True)
union = QgsGeometry.unaryUnion([r[2] for r in region_data.values()])
engine = QgsGeometry.createGeometryEngine(union.constGet())
engine.prepareGeometry()
roads = layer('Jalan utama OSM','MultiLineString','id:s,name:s,road_class:s,ref:s,length_km:d')
road_features=[]
for row in ndjson('roads.ndjson'):
    counts['candidate_roads'] += 1
    g = parse(row)
    if not engine.intersects(g.constGet()):
        continue
    if not engine.contains(g.constGet()):
        g = union.intersection(g)
        if g.wkbType() == QgsWkbTypes.GeometryCollection:
            g = QgsGeometry.collectGeometry([p for p in g.asGeometryCollection() if p.type()==QgsWkbTypes.LineGeometry])
    if g.isEmpty() or g.type()!=QgsWkbTypes.LineGeometry:
        continue
    g.convertToMultiType()
    if not g.isGeosValid():
        counts['invalid_roads'] += 1
        continue
    road_features.append(feature(roads,g,[row['id'],row['name'], row['road_class'],row['ref'],round(dist.measureLength(g)/1000,6)]))
add(roads,road_features)
assert roads.featureCount()>0
write(roads,GIS/'road_network.gpkg','roads')

print('Menghitung lingkaran dan titik dalam radius',flush=True)
center = QgsPointXY(98.6722,3.5952)
radius = 5000
within = []
for f in all_facilities:
    meters = dist.measureLine(center,locations[f['id']])
    if meters <= radius:
        within.append((f,meters))
polygon = [dist.computeSpheroidProject(center,radius,math.radians(bearing)) for bearing in range(360)]
buffer = layer('Radius Medan 5 km','Polygon','radius_m:i,count:i,method:s')
add(buffer,[feature(buffer,QgsGeometry.fromPolygonXY([polygon+[polygon[0]]]),[radius,len(within),'WGS84 geodesik'])])
radius_points = layer('Fasilitas dalam radius','Point',fcols+',distance_m:d')
add(radius_points,[feature(radius_points,f.geometry(),f.attributes()+[round(m,3)]) for f,m in within])
write(buffer,GIS/'analysis_outputs.gpkg','radius_zone')
write(radius_points,GIS/'analysis_outputs.gpkg','radius_facilities',append=True)

def persisted(file,table,title):
    v = QgsVectorLayer(f'{GIS/file}|layername={table}',title,'ogr')
    assert v.isValid(),title
    project.addMapLayer(v)
    return v

r = persisted('sumut_master.gpkg','regions','Kabupaten/kota · fasilitas terpetakan')
colors = ['#ecf3ed','#cde4d3','#96c9ac','#51a484','#236550']
ranges=[]
low=0
maximum=max(v['total'] for v in stats)
for high,color in zip((0,25,75,150,max(151,maximum)),colors):
    symbol=QgsFillSymbol.createSimple({'color':color,'outline_color':'#375f58','outline_width':'0.18'})
    ranges.append(QgsRendererRange(low,high,symbol,f'{int(low)+(1 if low else 0)}–{high}'))
    low=high
r.setRenderer(QgsGraduatedSymbolRenderer('total',ranges))
for cat,label in CATEGORIES.items():
    v=QgsVectorLayer(f'{GIS/"sumut_master.gpkg"}|layername=facilities|subset=category = \'{cat}\'',label,'ogr')
    assert v.isValid() and v.featureCount()==len(features[cat]), (cat,v.featureCount())
    marker=['circle','square','diamond'][list(CATEGORIES).index(cat)]
    v.renderer().setSymbol(QgsMarkerSymbol.createSimple({'name':marker,'color':COLORS[cat],'outline_color':'white','outline_width':'0.12','size':'1.55'}))
    project.addMapLayer(v)
for file,table,title in [('road_network.gpkg','roads','Jaringan jalan utama OSM'),('analysis_outputs.gpkg','radius_zone','Contoh radius 5 km · Medan'),('analysis_outputs.gpkg','radius_facilities','Hasil radius · Medan')]:
    v=persisted(file,table,title)
    project.layerTreeRoot().findLayer(v.id()).setItemVisibilityChecked(False)
project.setFilePathStorage(Qgis.FilePathType.Relative)
project.setTitle('SUMUT CONNECT | Infrastruktur dan aksesibilitas Sumatera Utara')
project.viewSettings().setDefaultViewExtent(QgsReferencedRectangle(regions.extent(),crs))
assert project.write(str(GIS/'SUMUT_CONNECT.qgz'))

snapshot = (INPUT/'osm-version.txt').read_text(encoding='utf-8').strip()
assert snapshot, 'Snapshot OSM harus tercatat'
manifest=[
    {'id':'adm2','title':'Batas kabupaten/kota Sumatera Utara','publisher':'geoBoundaries, BPS / WFP / OCHA ROAP','url':BOUNDARY,'license':'CC BY 3.0 IGO','accessed':DATE,'observed':'2020','updated':DATE,'crs':'EPSG:4326','unit':'kabupaten/kota','count':33,'validation':'33 geometri valid setelah seleksi/perbaikan','limits':'Batas referensi 2020. Geometri publik disederhanakan untuk tampilan.'},
    {'id':'osm-facilities','title':'Fasilitas kesehatan, pendidikan dan ekonomi','publisher':'© OpenStreetMap contributors, ekstrak Geofabrik','url':OSM,'license':'ODbL 1.0','accessed':DATE,'observed':snapshot,'updated':DATE,'crs':'EPSG:4326','unit':'titik fasilitas terpetakan','count':len(all_facilities),'validation':'Kategori baku, posisi diperiksa, ID unik, uji gabung spasial','limits':'Node dan way OSM terpilih. Cakupan dan kelengkapan nama bervariasi, sebagian fasilitas mungkin belum terpetakan.'},
    {'id':'osm-roads','title':'Jaringan jalan utama Sumatera Utara','publisher':'© OpenStreetMap contributors, ekstrak Geofabrik','url':OSM,'license':'ODbL 1.0','accessed':DATE,'observed':snapshot,'updated':DATE,'crs':'EPSG:4326','unit':'segmen OSM','count':len(road_features),'validation':'Diklip ke batas ADM2, geometri garis diperiksa','limits':'Motorway, trunk, primary, secondary dan penghubungnya. Topologi rute belum diuji.'},
]
report={'osm_snapshot':snapshot,'regions':33,'facilities':{cat:len(rows) for cat,rows in features.items()},'roads':len(road_features),'processing':dict(counts),'named_facilities':sum(bool(f['name']) for f in all_facilities),'sample':{'center':[center.x(),center.y()],'radius_km':5,'count':len(within),'categories':dict(Counter(f['category'] for f,_ in within))}}
def dump(file,obj):
    file.write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
dump(DATA/'datasets.json',manifest)
dump(GIS/'validation.json',report)
with (GIS/'source_manifest.csv').open('w',encoding='utf-8-sig',newline='') as handle:
    writer=csv.DictWriter(handle,fieldnames=list(manifest[0]))
    writer.writeheader()
    writer.writerows(manifest)
print(json.dumps(report),flush=True)
