from PIL import Image, ImageEnhance
from flatten import flatten
import os

WHITE_TARGET = 243.0
GAMMA = 1.10
SAT = 1.10
OUT = (2000, 1500)

# manual 4:3 crops, as fractions of the frame (x0, y0, x1, y1)
CROPS = {
    '2538': (0.00, 0.00, 1.00, 1.00),   # full frame — the cards already reach both edges
    '2539': (0.00, 0.00, 1.00, 1.00),   # subject already fills the frame
    '2540': (0.00, 0.00, 1.00, 1.00),
    '2541': (0.00, 0.00, 1.00, 1.00),
    '2542': (0.035, 0.07, 0.965, 1.00), # trim the grey wall band above the table
}

def pct(h, p):
    tot = sum(h); acc = 0
    for i, v in enumerate(h):
        acc += v
        if acc >= tot * p: return i
    return 255

def grade(im):
    chans = []
    for ch in im.split():
        s = WHITE_TARGET / max(pct(ch.histogram(), 0.90), 1)
        lut = [min(255, round(255 * ((min(i * s, 255) / 255) ** (1 / GAMMA)))) for i in range(256)]
        chans.append(ch.point(lut))
    return ImageEnhance.Color(Image.merge('RGB', chans)).enhance(SAT)

def crop_43(im, box):
    x0, y0, x1, y1 = box
    x0, x1 = x0 * im.width, x1 * im.width
    y0, y1 = y0 * im.height, y1 * im.height
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    w, h = x1 - x0, y1 - y0
    if w / h > 4 / 3: w = h * 4 / 3
    else: h = w * 3 / 4
    x0 = min(max(cx - w / 2, 0), im.width - w)
    y0 = min(max(cy - h / 2, 0), im.height - h)
    return im.crop((round(x0), round(y0), round(x0 + w), round(y0 + h)))

if __name__ == '__main__':
  src = os.path.join(os.path.dirname(__file__), 'src')
  dst_dir = os.path.join(os.path.dirname(__file__), 'edited')
  for name, box in CROPS.items():
    im = grade(Image.open(os.path.join(src, name + '.png')).convert('RGB'))
    im = flatten(crop_43(im, box))          # blow the backdrop out to white
    out = im.resize(OUT, Image.LANCZOS)
    dst = os.path.join(dst_dir, name + '.jpg')
    out.save(dst, 'JPEG', quality=92, subsampling=0, optimize=True)
    print(name, box, '->', dst)
