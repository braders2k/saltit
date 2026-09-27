"""Source for the Salt IT logo files in site/assets/. Run: python3 scripts/logo.py

Needs fontTools and brotli (pip install fonttools brotli). The letters are outlined from the
site's own Barlow 600, so the logo and the headings share one typeface. The A loses its crossbar
and gets a square salt grain in its place; the icon is that A alone on an ink tile.
"""
from pathlib import Path

from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "site" / "assets"
font = TTFont(ASSETS / "fonts" / "barlow-600.woff2")
glyphs = font.getGlyphSet()

INK = "#122028"
PAPER = "#F6F1E8"
LIDO = "#3EC6CF"

TRACK = 150          # letter-spacing in font units (0.15em), a touch tighter than the old 0.2em text
WORD_GAP = 540       # T to I, measured ink to ink with tracking included
TOP, BOTTOM = 708, -8  # S overshoot, so nothing is clipped
GRAIN = 112          # square, between the crossbar (101) and stem (116) weights
GRAIN_Y = 110        # bottom of the grain; centres it on Barlow's crossbar height


def lambda_a():
    """Barlow 600 'A' with the crossbar cut out: the counter's straight legs run to the feet."""
    pen = RecordingPen()
    pen.moveTo((494, 10))
    pen.lineTo((326, 553))
    pen.qCurveTo((325, 557), (321, 557), (320, 553))
    pen.lineTo((154, 10))
    pen.qCurveTo((151, 0), (141, 0))
    pen.lineTo((41, 0))
    pen.qCurveTo((35, 0), (29, 7), (31, 14))
    pen.lineTo((248, 690))
    pen.qCurveTo((251, 700), (261, 700))
    pen.lineTo((386, 700))
    pen.qCurveTo((396, 700), (399, 690))
    pen.lineTo((617, 14))
    pen.qCurveTo((618, 12), (618, 9))
    pen.qCurveTo((618, 0), (607, 0))
    pen.lineTo((507, 0))
    pen.qCurveTo((497, 0), (494, 10))
    pen.closePath()
    return pen


def grain(cx):
    pen = RecordingPen()
    x0, y0 = cx - GRAIN / 2, GRAIN_Y
    pen.moveTo((x0, y0))
    pen.lineTo((x0 + GRAIN, y0))
    pen.lineTo((x0 + GRAIN, y0 + GRAIN))
    pen.lineTo((x0, y0 + GRAIN))
    pen.closePath()
    return pen


def glyph(name):
    pen = RecordingPen()
    glyphs[name].draw(pen)
    return pen


A_CENTRE = 324  # apex centre of the A, in its own coordinates


def to_path(rec, dx, scale, oy):
    svg = SVGPathPen(None, ntos=lambda v: f"{round(v, 1):g}")
    rec.replay(TransformPen(svg, (scale, 0, 0, -scale, dx, oy)))
    return svg.getCommands()


def wordmark():
    # Each letter: (name, outline, advance, ink xMin, ink xMax). None marks the word space.
    letters = [
        ("S", glyph("S"), 591, 42, 547),
        ("A", lambda_a(), 648, 29, 618),
        ("L", glyph("L"), 571, 73, 541),
        ("T", glyph("T"), 579, 34, 545),
        None,
        ("I", glyph("I"), 262, 73, 189),
        ("T", glyph("T"), 579, 34, 545),
    ]
    kern = {("L", "T"): -86}  # Barlow's own LT pair
    s = 0.1
    paths, grain_d = [], ""
    pen_x, prev, ink_right, new_word = None, None, 0.0, False
    for item in letters:
        if item is None:
            new_word = True
            continue
        name, rec, adv, xmin, xmax = item
        if pen_x is None:
            pen_x = -xmin
        elif new_word:
            pen_x = ink_right + WORD_GAP - xmin
            new_word = False
        else:
            pen_x += kern.get((prev, name), 0)
        paths.append(to_path(rec, pen_x * s, s, TOP * s))
        if name == "A":
            grain_d = to_path(grain(A_CENTRE), pen_x * s, s, TOP * s)
        ink_right = pen_x + xmax
        prev = name
        pen_x += adv + TRACK
    return ink_right * s, (TOP - BOTTOM) * s, "".join(paths), grain_d


def write_wordmark(path, fill_letters, fill_grain):
    w, h, letters, grain_d = wordmark()
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:g} {h:g}" role="img" aria-labelledby="t">'
        f'<title id="t">Salt IT</title>'
        f'<path fill="{fill_letters}" d="{letters}"/>'
        f'<path fill="{fill_grain}" d="{grain_d}"/>'
        f"</svg>\n"
    )
    path.write_text(svg)
    return w, h


def write_icon(path):
    # 128 tile, sharp corners like the site's buttons. The A is 84 units tall, 1 unit below centre.
    size, cap = 128, 84
    s = cap / 700
    ox = size / 2 - A_CENTRE * s
    oy = (size + cap) / 2 + 1
    a = to_path(lambda_a(), ox, s, oy)
    g = to_path(grain(A_CENTRE), ox, s, oy)
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" role="img" aria-labelledby="t">'
        f'<title id="t">Salt IT</title>'
        f'<rect width="{size}" height="{size}" fill="{INK}"/>'
        f'<path fill="{PAPER}" d="{a}"/>'
        f'<path fill="{LIDO}" d="{g}"/>'
        f"</svg>\n"
    )
    path.write_text(svg)


if __name__ == "__main__":
    w, h = write_wordmark(ASSETS / "logo.svg", INK, LIDO)
    write_icon(ASSETS / "icon.svg")
    print(f"logo.svg {w:g}x{h:g} (aspect {w / h:.3f}), icon.svg 128x128")
