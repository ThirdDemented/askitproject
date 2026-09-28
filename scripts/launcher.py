from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
out=root/'app/src/main/res/drawable/lwh_icon.png'
with Image.open(root/'art-source/icon.png') as im:im.convert('RGB').resize((512,512),Image.Resampling.NEAREST).save(out)
