"""Blow the backdrop out to white without touching the subject.

The backdrop is found spatially — the bright region connected to the frame
edge — so the white object and the hand keep their own tone.
"""
from PIL import Image, ImageDraw, ImageFilter, ImageMath
import sys
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from flatten import field

WHITE = 262.0      # >255 so the flattened backdrop clips clean
TOL = 34           # flood-fill tolerance
FEATHER = 6        # px, softens the mask edge

def backdrop_mask(im):
    lum = im.convert('L').filter(ImageFilter.GaussianBlur(3))
    w, h = lum.size
    seeds = [(2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3),
             (w // 2, 2), (2, h // 2), (w - 3, h // 2), (w // 2, h - 3)]
    px = lum.load()
    for s in seeds:
        if px[s] > 150:                       # only seed on bright edge pixels
            ImageDraw.floodfill(lum, s, 0, thresh=TOL)
    mask = lum.point(lambda v: 255 if v == 0 else 0)
    return mask.filter(ImageFilter.GaussianBlur(FEATHER))

def whiten(im):
    f = field(im)
    peak = max(f.getdata())
    fbig = f.resize(im.size, Image.BICUBIC).convert('F')
    s = WHITE / max(peak, 1)
    lifted = [ImageMath.unsafe_eval("min(c*(p/max(b,1.0))*s,255.0)",
                                    c=ch.convert('F'), b=fbig, p=float(peak), s=s)
              for ch in im.split()]
    m = backdrop_mask(im).convert('F')
    chans = [ImageMath.unsafe_eval("convert(c*(1.0-m/255.0)+l*(m/255.0),'L')",
                                   c=ch.convert('F'), l=lf, m=m)
             for ch, lf in zip(im.split(), lifted)]
    return Image.merge('RGB', chans)

if __name__ == '__main__':
    import os
    out_dir = sys.argv[1]
    os.makedirs(out_dir, exist_ok=True)
    for p in sys.argv[2:]:
        im = Image.open(p).convert('RGB')
        dst = os.path.join(out_dir, os.path.basename(p))
        whiten(im).save(dst, 'JPEG', quality=92, subsampling=0, optimize=True)
        print(os.path.basename(p), '->', dst)
