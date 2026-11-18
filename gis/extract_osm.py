import json
import osmium
import sys
from pathlib import Path

source, output = map(Path, sys.argv[1:])
box = (96.55, -0.75, 100.8, 4.45)
categories = dict.fromkeys(('hospital', 'clinic', 'doctors'), 'health')
categories.update(dict.fromkeys(('school', 'college', 'university'), 'education'))
categories.update(dict.fromkeys(('marketplace', 'bank'), 'economy'))
road_classes = {base + suffix for base in ('motorway','trunk','primary','secondary') for suffix in ('', '_link')}

def inside(x, y):
    return box[0] <= x <= box[2] and box[1] <= y <= box[3]

def emit(handle, osm, kind, coords, attrs):
    row = dict(id=f'{osm.type_str()}{osm.id}', name=osm.tags.get('name'),
               geometry={'type':kind,'coordinates':coords}, **attrs)
    handle.write(json.dumps(row, ensure_ascii=False, separators=(',',':'))+'\n')

class Extract(osmium.SimpleHandler):
    def node(self, obj):
        amenity = obj.tags.get('amenity')
        if amenity in categories and inside(obj.lon, obj.lat):
            emit(facilities, obj, 'Point', [obj.lon,obj.lat], dict(category=categories[amenity], subtype=amenity))

    def way(self, obj):
        amenity = obj.tags.get('amenity')
        highway = obj.tags.get('highway')
        if amenity not in categories and highway not in road_classes:
            return
        coords = [[n.lon,n.lat] for n in obj.nodes if n.location.valid()]
        if len(coords) < 2 or not any(inside(*p) for p in coords):
            return
        if highway in road_classes:
            emit(roads, obj, 'LineString', coords, dict(road_class=highway, ref=obj.tags.get('ref')))
        if amenity in categories:
            closed = coords[0] == coords[-1] and len(coords) >= 4
            emit(facilities, obj, 'Polygon' if closed else 'LineString',
                 [coords] if closed else coords, dict(category=categories[amenity], subtype=amenity))

with (output/'facilities.ndjson').open('w',encoding='utf-8') as facilities, (output/'roads.ndjson').open('w',encoding='utf-8') as roads:
    tags = [('amenity',tag) for tag in categories] + [('highway',tag) for tag in sorted(road_classes)]
    processor = osmium.FileProcessor(str(source), osmium.osm.NODE | osmium.osm.WAY).with_locations()
    processor.with_filter(osmium.filter.TagFilter(*tags))
    handler = Extract()
    for obj in processor:
        if obj.is_node():
            handler.node(obj)
        elif obj.is_way():
            handler.way(obj)
header = osmium.io.Reader(str(source)).header()
print('Snapshot', header.get('osmosis_replication_timestamp'))
(output/'osm-version.txt').write_text(header.get('osmosis_replication_timestamp'),encoding='utf-8')
