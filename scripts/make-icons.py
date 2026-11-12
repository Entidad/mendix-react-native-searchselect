"""Toolbox artwork for NativeSearchSelect.

Mendix draws widget icons as a line sketch of what the widget looks like on a page, in a
fixed palette sampled from the platform's own native widgets. The sketch here is the closed
field with its chevron, the open list under it with one option picked out in the accent
colour, and a magnifier over the corner to say that the list is searchable.
"""

from PIL import Image, ImageDraw

SS = 8  # supersample factor; the canvas is drawn large and resized down to antialias

LIGHT = {
    "outline": (83, 89, 101, 255),
    "fill": (194, 226, 255, 255),
    "accent": (20, 111, 244, 255),
}
DARK = {
    "outline": (164, 164, 164, 255),
    "fill": (60, 100, 230, 51),
    "accent": (87, 155, 249, 255),
}


def draw(width, height, theme):
    image = Image.new("RGBA", (width * SS, height * SS), (0, 0, 0, 0))
    pen = ImageDraw.Draw(image)

    # A 3:4 portrait content box centred on the canvas, so the square icon and the landscape
    # tile hold the same drawing at different scales.
    ch = height * 0.84
    cw = ch * 0.75
    x0 = (width - cw) / 2
    y0 = (height - ch) / 2

    def px(nx, ny):
        return ((x0 + nx * cw) * SS, (y0 + ny * ch) * SS)

    def box(nx0, ny0, nx1, ny1):
        return [px(nx0, ny0), px(nx1, ny1)]

    stroke = max(1, round(0.026 * ch * SS))
    radius = 0.04 * ch * SS
    outline = theme["outline"]
    accent = theme["accent"]

    # Closed field, with the value it is showing and the chevron that opens the list.
    pen.rounded_rectangle(box(0, 0, 1, 0.165), radius=radius, outline=outline, width=stroke)
    pen.rounded_rectangle(box(0.09, 0.058, 0.52, 0.107), radius=stroke, fill=outline)
    pen.polygon([px(0.79, 0.065), px(0.93, 0.065), px(0.86, 0.118)], fill=outline)

    # The open list.
    pen.rounded_rectangle(box(0, 0.245, 1, 1), radius=radius, outline=outline, width=stroke)
    # Search box.
    pen.rounded_rectangle(box(0.09, 0.30, 0.91, 0.40), radius=radius * 0.7, fill=theme["fill"])
    pen.rounded_rectangle(box(0.15, 0.333, 0.50, 0.368), radius=stroke, fill=outline)
    # Options, the first one picked out as the current selection.
    pen.rounded_rectangle(box(0.09, 0.48, 0.66, 0.528), radius=stroke, fill=accent)
    pen.rounded_rectangle(box(0.09, 0.60, 0.50, 0.648), radius=stroke, fill=outline)
    pen.rounded_rectangle(box(0.09, 0.72, 0.57, 0.768), radius=stroke, fill=outline)

    # Magnifier over the lower corner. Its radius is taken from the height so it stays round
    # on both canvases, and the lens is cleared first so the option bars do not read through.
    cx, cy = px(0.76, 0.775)
    r = 0.10 * ch * SS
    lens = [cx - r, cy - r, cx + r, cy + r]
    pen.ellipse(lens, fill=(0, 0, 0, 0))
    handle = 1.75
    pen.line(
        [cx + r * 0.72, cy + r * 0.72, cx + r * handle * 0.72, cy + r * handle * 0.72],
        fill=accent,
        width=stroke,
    )
    pen.ellipse(lens, outline=accent, width=stroke)

    return image.resize((width, height), Image.LANCZOS)


TARGETS = [("icon", 64, 64), ("tile", 256, 192)]
OUT = "C:/mx/widgets/mendix-react-native-searchselect/src/NativeSearchSelect"

for kind, w, h in TARGETS:
    draw(w, h, LIGHT).save(f"{OUT}.{kind}.png")
    draw(w, h, DARK).save(f"{OUT}.{kind}.dark.png")
    print(f"{OUT}.{kind}.png  {w}x{h}")
