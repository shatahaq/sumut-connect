import json
import math
import sqlite3
import sys
from collections import Counter
from pathlib import Path

from qgis.core import QgsApplication, QgsDistanceArea, QgsFeatureRequest, QgsGeometry, QgsPointXY, QgsProject, QgsSpatialIndex, QgsVectorLayer

root = Path(sys.argv[1]).resolve()
gis = root / 'gis'
data = root / 'public/data'
app=QgsApplication([],False)
app.initQgis()
project=QgsProject.instance()
assert project.read(str(gis/'SUMUT_CONNECT.qgz'))
layers=project.mapLayers().values()
assert len(layers)==7
for layer in layers:
    assert layer.isValid() and layer.crs().authid()=='EPSG:4326',layer.name()
    source=Path(layer.source().split('|')[0])
    assert source.parent.resolve()==gis, (layer.name(),source)
assert project.layoutManager().layoutByName('Atlas Sumatera Utara') is not None

def read(file,table):
    layer=QgsVectorLayer(f'{gis/file}|layername={table}',table,'ogr')
    assert layer.isValid(),table
    return layer

for gpkg in gis.glob('*.gpkg'):
    with sqlite3.connect(gpkg) as db:
        assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok',gpkg
        assert not db.execute('PRAGMA foreign_key_check').fetchall(),gpkg

report=json.loads((gis/'validation.json').read_text(encoding='utf-8'))
regions=read('sumut_master.gpkg','regions')
facilities=read('sumut_master.gpkg','facilities')
roads=read('road_network.gpkg','roads')
radius=read('analysis_outputs.gpkg','radius_zone')
hits=read('analysis_outputs.gpkg','radius_facilities')
assert regions.featureCount()==33 and roads.featureCount()==report['roads']
assert all(row.geometry().isGeosValid() and row['length_km']>0 for row in roads.getFeatures())
assert all(row.geometry().isGeosValid() and row['area_km2']>0 for row in regions.getFeatures())
assert all(row.geometry().isGeosValid() for row in radius.getFeatures())

region_rows={f['code']:f for f in regions.getFeatures()}
sum_by_region=Counter()
by_id={}
dist=QgsDistanceArea()
dist.setSourceCrs(project.crs(),project.transformContext())
dist.setEllipsoid('WGS84')
sample=report['sample']
center=QgsPointXY(*sample['center'])
expected_hits={}
for f in facilities.getFeatures():
    assert f['id'] not in by_id and f.geometry().isGeosValid(),f['id']
    region=region_rows[f['region_code']]
    assert region.geometry().intersects(f.geometry()), (f['id'],f['region_code'])
    by_id[f['id']]=f
    sum_by_region[f['region_code'],f['category']]+=1
    d=dist.measureLine(center,f.geometry().asPoint())
    if d <= sample['radius_km']*1000:
        expected_hits[f['id']]=d

assert len(by_id)==sum(report['facilities'].values())
assert hits.featureCount()==sample['count']==len(expected_hits)
assert set(expected_hits)=={r['id'] for r in hits.getFeatures()}
assert all(abs(expected_hits[r['id']]-r['distance_m'])<=.001 for r in hits.getFeatures())

web_regions=json.loads((data/'sumut_regions.geojson').read_text(encoding='utf-8'))['features']
assert len(web_regions)==33
for feature in web_regions:
    p=feature['properties']
    assert p['code'] in region_rows
    for category in report['facilities']:
        assert p[category]==sum_by_region[p['code'],category]==region_rows[p['code']][category]
    assert p['total']==sum(p[k] for k in report['facilities'])
for category, count in report['facilities'].items():
    features=json.loads((data/f'facilities_{category}.geojson').read_text(encoding='utf-8'))['features']
    assert len(features)==count
    for f in features:
        p=f['properties']
        expected=by_id[p['id']]
        assert p['category']==category and p['region_code']==expected['region_code']
        point=expected.geometry().asPoint()
        assert math.isclose(f['geometry']['coordinates'][0],point.x(),abs_tol=1e-6)
        assert math.isclose(f['geometry']['coordinates'][1],point.y(),abs_tol=1e-6)
print('QGIS dan GeoPackage valid, 7 lapisan relatif, 33 wilayah, 1662 titik, 6849 jalan, radius geodesik 619.',flush=True)
