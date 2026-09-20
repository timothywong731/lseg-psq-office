"""Deterministic illustrative market graphics, not live financial data."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import random

OUT = Path(__file__).resolve().parent.parent / 'assets' / 'textures'
OUT.mkdir(parents=True, exist_ok=True)
FONT = 'C:/Windows/Fonts/arial.ttf'
BOLD = 'C:/Windows/Fonts/arialbd.ttf'

def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else FONT, size)

random.seed(731)
im = Image.new('RGB', (1536, 768), '#101623')
d = ImageDraw.Draw(im)
d.text((60, 42), 'LSEG', font=font(105, True), fill='white')
d.text((66, 158), 'P A T E R N O S T E R   S Q U A R E', font=font(19), fill='#b2bbce')
d.line((60, 219, 1476, 219), fill='#41485a', width=2)
d.text((64, 244), 'WORLD MARKETS', font=font(26, True), fill='#dfe6fa')
for i in range(13):
    r = 200 - i*10
    d.ellipse((342-r, 491-r, 342+r, 491+r), outline=(31+i*3, 85+i*5, 139+i*4), width=2)
points = [(105+x*5, 485+int(28*random.uniform(-1,1))-x//3) for x in range(94)]
d.line(points, fill='#70d9cf', width=4)
for i, name in enumerate(['LONDON', 'NEW YORK', 'EUROPE', 'ASIA PACIFIC', 'GLOBAL']):
    y = 292+i*77
    d.text((746,y),name,font=font(29,True),fill='#dee6f0')
    d.text((1160,y),f'{(i+1)*1327:,.2f}',font=font(27),fill='#8de0c2')
    d.line((740,y+50,1450,y+50),fill='#273444',width=1)
d.text((70,716),'SPATIAL STUDY  /  ILLUSTRATIVE DISPLAY',font=font(18),fill='#9fa9bd')
im.save(OUT/'market.png')

im = Image.new('RGB', (4096, 160), '#10121c'); d = ImageDraw.Draw(im)
labels=['LSEG.L','SHEL.L','AZN.L','HSBA.L','ULVR.L','RIO.L','BP.L','FTSE 100']
for i,label in enumerate(labels):
    x=42+i*510
    d.text((x,22),label,font=font(29,True),fill='#eef2f7')
    change=(0.16+i*.12)*(-1 if i in [1,4,6] else 1)
    d.text((x,77),f'{1024+i*439:,.2f}  {change:+.2f}%',font=font(29),fill='#e97677' if change<0 else '#94d8a6')
im.save(OUT/'ticker.png')

im=Image.new('RGB',(768,768),'#141829');d=ImageDraw.Draw(im)
d.polygon([(0,610),(768,450),(768,768),(0,768)],fill='#7c2346')
d.polygon([(0,768),(768,602),(768,768)],fill='#cf536b')
d.text((82,165),'LSEG',font=font(102,True),fill='white')
d.text((85,308),'LONDON',font=font(40),fill='#e5d7e5')
d.text((85,382),'10,642.31',font=font(69,True),fill='#ff9daf')
d.text((85,490),'MARKET PLACE',font=font(30),fill='white')
im.save(OUT/'cube.png')
print('Wrote 3 illustrative screen textures')
