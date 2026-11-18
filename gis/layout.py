import json
import sys
from pathlib import Path

from qgis.core import (
    QgsApplication, QgsFillSymbol, QgsGraduatedSymbolRenderer, QgsLayoutExporter, QgsLayoutItemLabel,
    QgsLayoutItemMap, QgsLayoutItemPage, QgsLayoutItemScaleBar, QgsLayoutPoint, QgsLayoutSize,
    QgsPrintLayout, QgsProject, QgsRendererRange, QgsUnitTypes,
)
from qgis.PyQt.QtGui import QColor, QFont

root = Path(__file__).resolve().parents[1]
app = QgsApplication([], False)
app.initQgis()
project = QgsProject.instance()
qgz = root / 'gis/SUMUT_CONNECT.qgz'
assert project.read(str(qgz))
layers = list(project.mapLayers().values())
assert len(layers) == 7 and all(layer.isValid() for layer in layers)
regions = next(layer for layer in layers if layer.name().startswith('Kabupaten/kota'))
osm = [layer for layer in layers if layer.name() in ('Kesehatan','Pendidikan','Ekonomi')]
validation = json.loads((root / 'gis/validation.json').read_text(encoding='utf-8'))
counts = validation['facilities']
total = sum(counts.values())
assert regions.featureCount() == validation['regions'] and sum(layer.featureCount() for layer in osm) == total
print('Extent', regions.extent().toString(), flush=True)
colors = ['#ebf1ea', '#cedfcb', '#a1c4a6', '#599d80', '#236550']
labels = ['0', '1–25', '26–75', '76–150', '≥151']
ranges = []
low = -.5
for high, color, label in zip((.5,25.5,75.5,150.5,1000000), colors, labels):
    symbol = QgsFillSymbol.createSimple({'color':color,'outline_color':'#375f58','outline_width':'.18'})
    ranges.append(QgsRendererRange(low,high,symbol,label))
    low = high
regions.setRenderer(QgsGraduatedSymbolRenderer('total',ranges))

old = project.layoutManager().layoutByName('Atlas Sumatera Utara')
if old:
    project.layoutManager().removeLayout(old)

layout = QgsPrintLayout(project)
layout.initializeDefaults()
layout.setName('Atlas Sumatera Utara')
page = layout.pageCollection().pages()[0]
page.setPageSize('A4',QgsLayoutItemPage.Landscape)

def title(text,x,y,w,h,pts=11,face='Segoe UI',color='#25392f',bold=False):
    item = QgsLayoutItemLabel(layout)
    item.setText(text)
    font = QFont(face,pts)
    font.setBold(bold)
    item.setFont(font)
    item.setFontColor(QColor(color))
    item.setMargin(0)
    layout.addLayoutItem(item)
    item.attemptMove(QgsLayoutPoint(x,y))
    item.attemptResize(QgsLayoutSize(w,h))
    return item

title('SUMUT CONNECT  /  ANALISIS INFRASTRUKTUR',12,6,275,8,10,bold=True)
title('Fasilitas terpetakan di Sumatera Utara',12,16,275,15,25,'Georgia',bold=True)
title('Kabupaten dan kota · 33 wilayah · Snapshot OSM ' + validation['osm_snapshot'][:10] + ' UTC',12,32,275,9,11)
map_item = QgsLayoutItemMap(layout)
layout.addLayoutItem(map_item)
map_item.attemptMove(QgsLayoutPoint(12,44))
map_item.attemptResize(QgsLayoutSize(203,143))
map_item.setCrs(project.crs())
map_item.setLayers([regions])
map_item.setKeepLayerSet(True)
map_item.setBackgroundColor(QColor('#e5efed'))
map_item.setFrameEnabled(True)
map_item.setFrameStrokeColor(QColor('#93aa9d'))
map_item.zoomToExtent(regions.extent().buffered(.12))

title('U',202,46,8,7,11,bold=True)
title('↑',202,52,8,8,13,bold=True)

scale = QgsLayoutItemScaleBar(layout)
scale.setStyle('Single Box')
scale.setLinkedMap(map_item)
scale.applyDefaultSize()
scale.setUnits(QgsUnitTypes.DistanceKilometers)
scale.setUnitsPerSegment(25)
scale.setNumberOfSegments(2)
scale.setNumberOfSegmentsLeft(0)
scale.setUnitLabel('km')
layout.addLayoutItem(scale)
scale.attemptMove(QgsLayoutPoint(16,172))

title('Jumlah fasilitas',222,45,64,11,14,'Georgia',bold=True)
for i,(color,label) in enumerate(zip(colors,labels)):
    y=59+8*i
    sw=title('',222,y+1,9,5)
    sw.setBackgroundColor(QColor(color))
    sw.setBackgroundEnabled(True)
    sw.setFrameEnabled(True)
    sw.setFrameStrokeColor(QColor('#5d786b'))
    title(label,234,y,48,7,10)
title(f'{total:,} titik terpetakan'.replace(',','.'),222,108,64,10,12,bold=True)
title(f'{counts["health"]} kesehatan\n{counts["education"]} pendidikan\n{counts["economy"]} ekonomi',222,120,63,24,10)
title('Jumlah berasal dari catatan OSM.\nKelengkapan pemetaan berbeda\nantarwilayah.',222,151,65,27,9)
title('Batas 2020: geoBoundaries, BPS / WFP / OCHA ROAP (CC BY 3.0 IGO).',12,190,275,7,8)
title('Fasilitas: © OpenStreetMap contributors, Geofabrik (ODbL 1.0). Peta EPSG:4326.',12,197,275,7,8)

assert project.layoutManager().addLayout(layout)
assert project.write()
directory = Path(sys.argv[1]) if len(sys.argv)>1 else root / 'docs/screenshots'
directory.mkdir(parents=True,exist_ok=True)
exporter = QgsLayoutExporter(layout)
pdf = QgsLayoutExporter.PdfExportSettings()
pdf.dpi = 160
assert exporter.exportToPdf(str(directory/'Peta-Tematik-QGIS.pdf'),pdf) == QgsLayoutExporter.Success
image = QgsLayoutExporter.ImageExportSettings()
image.dpi = 130
assert exporter.exportToImage(str(directory/'05-peta-tematik-qgis.png'),image) == QgsLayoutExporter.Success
print('Layout Atlas Sumatera Utara berhasil diekspor.',flush=True)
