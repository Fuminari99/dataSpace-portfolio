"""Flatten the lighting falloff on the backdrop, then clip it to white."""
from PIL import Image, ImageFilter, ImageMath

SMALL = (96, 72)      # illumination field resolution
WIN = 8               # half-window (cells) for the local background estimate
PCT = 0.90            # local percentile taken as "background here"
MAX_GAIN = 1.8
MASK_LO, MASK_HI = 165.0, 225.0   # only bright pixels follow the gain

def field(im):
    """per-cell local-bright estimate of the backdrop, smoothed"""
    g = im.convert('L').resize(SMALL, Image.BOX)
    w, h = g.size
    src = list(g.getdata())
    out = []
    for y in range(h):
        for x in range(w):
            vals = [src[yy * w + xx]
                    for yy in range(max(0, y - WIN), min(h, y + WIN + 1))
                    for xx in range(max(0, x - WIN), min(w, x + WIN + 1))]
            vals.sort()
            out.append(vals[min(len(vals) - 1, int(len(vals) * PCT))])
    f = Image.new('L', SMALL); f.putdata(out)
    return f.filter(ImageFilter.GaussianBlur(6))

def flatten(im, white=268.0):
    f = field(im)
    peak = max(f.getdata())
    fbig = f.resize(im.size, Image.BICUBIC).convert('F')
    gain = ImageMath.unsafe_eval("min(p/max(b,1.0), m)", p=float(peak), b=fbig, m=MAX_GAIN)
    lum = im.convert('L').convert('F')
    mask = ImageMath.unsafe_eval("min(max((l-lo)/(hi-lo),0.0),1.0)", l=lum, lo=MASK_LO, hi=MASK_HI)
    g = ImageMath.unsafe_eval("1.0+(gn-1.0)*mk", gn=gain, mk=mask)
    s = white / max(peak, 1)
    chans = [ImageMath.unsafe_eval("convert(min(c*g*s,255.0),'L')", c=ch.convert('F'), g=g, s=s)
             for ch in im.split()]
    return Image.merge('RGB', chans)
