"""Assemble store artwork and unaltered, actual game screenshots."""
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageFont
import shutil,zipfile
root=Path(__file__).resolve().parents[1]
out=root/'store/generated';out.mkdir(parents=True,exist_ok=True)
with Image.open(root/'art-source/icon.png') as im:im.convert('RGB').resize((512,512),Image.Resampling.NEAREST).save(out/'icon-512.png')
with Image.open(root/'art-source/title.png') as im:feature=ImageOps.fit(im.convert('RGB'),(1024,500),method=Image.Resampling.NEAREST)
overlay=Image.new('RGBA',feature.size,(0,0,0,0));d=ImageDraw.Draw(overlay);d.rectangle((0,340,1024,500),fill=(9,14,19,235));feature=Image.alpha_composite(feature.convert('RGBA'),overlay)
fonts=[Path('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'),Path('C:/Windows/Fonts/courbd.ttf')]
font_path=next(p for p in fonts if p.exists())
d=ImageDraw.Draw(feature);d.text((30,358),'THE LONG WAY HOME',font=ImageFont.truetype(str(font_path),62),fill='#f4ecd9');d.text((35,441),'SAME ROADS. DIFFERENT YOU.',font=ImageFont.truetype(str(font_path),22),fill='#f2bc65');feature.convert('RGB').save(out/'feature-graphic-1024x500.png')
for name in ['road-landscape','seller-landscape','road-portrait','title-portrait','resume-portrait','rotation-landscape']:
    source=root/(name+'.png')
    if source.exists():shutil.copy2(source,out/('android-'+name+'.png'))
for p in (root/'qa/captures').glob('store-*.png'):shutil.copy2(p,out/p.name)
for p in (root/'store').glob('*.md'):shutil.copy2(p,out/p.name)
shutil.copy2(root/'PRIVACY.md',out/'PRIVACY.md')
with zipfile.ZipFile(root/'The-Long-Way-Home-Play-Store-Kit.zip','w',zipfile.ZIP_DEFLATED) as z:
    for p in out.iterdir():z.write(p,p.name)
print('Store package assembled from original illustration sources and actual screenshots')
