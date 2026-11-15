import io
import logging
import zipfile
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urljoin, urlsplit
from urllib.request import urlopen

from flask import current_app
from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageOps, UnidentifiedImageError
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from .storage import StorageError, download_object, storage_path_from_url

logger = logging.getLogger(__name__)
CANVAS_WIDTH = 720
CANVAS_HEIGHT = 1020
MAX_EXPORT_PAGES = 30
MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024
PAGE_SIZES_INCHES = {
    "B5 Manga": (6.93, 9.84),
    "A4 Editorial": (8.27, 11.69),
    "US Tankobon": (5.0, 7.5),
    "Webtoon Vertical": (6.0, 18.0),
}
DPI_VALUES = {"150 DPI": 150, "300 DPI": 300, "600 DPI": 600}


class ExportRenderError(RuntimeError):
    pass


def _source_image(url: str, cache: dict[str, bytes]) -> bytes:
    if url in cache:
        return cache[url]
    storage_path = storage_path_from_url(url)
    if storage_path:
        data = download_object(storage_path)
    else:
        frontend_origin = current_app.config["FRONTEND_ORIGIN"].rstrip("/")
        resolved_url = urljoin(f"{frontend_origin}/", url)
        parsed = urlsplit(resolved_url)
        expected = urlsplit(frontend_origin)
        if (
            parsed.scheme not in {"http", "https"}
            or (parsed.scheme, parsed.netloc) != (expected.scheme, expected.netloc)
            or not unquote(parsed.path).startswith("/assets/")
            or ".." in unquote(parsed.path).split("/")
        ):
            raise ExportRenderError("A page contains an image URL outside the configured frontend or storage.")
        try:
            with urlopen(resolved_url, timeout=15) as response:
                data = response.read(MAX_SOURCE_IMAGE_BYTES + 1)
        except (HTTPError, URLError, TimeoutError, OSError):
            logger.exception("Could not retrieve an artwork image for export")
            raise ExportRenderError("An artwork image could not be loaded for export.") from None
    if len(data) > MAX_SOURCE_IMAGE_BYTES:
        raise ExportRenderError("An artwork image is too large to include in this export.")
    cache[url] = data
    return data


def _font(size: int) -> ImageFont.ImageFont:
    candidates = (
        Path("C:/Windows/Fonts/arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf"),
    )
    for candidate in candidates:
        if candidate.is_file():
            return ImageFont.truetype(str(candidate), size=max(8, size))
    return ImageFont.load_default(size=max(8, size))


def _wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, max_width: int) -> list[str]:
    lines: list[str] = []
    for paragraph in text.splitlines() or [""]:
        line = ""
        for word in paragraph.split(" "):
            candidate = word if not line else f"{line} {word}"
            if line and draw.textbbox((0, 0), candidate, font=font)[2] > max_width:
                lines.append(line)
                line = word
            else:
                line = candidate
        lines.append(line)
    return lines


def _image_for_panel(
    image_url: str,
    width: int,
    height: int,
    brightness: float,
    contrast: float,
    flip_x: bool,
    grayscale: bool,
    cache: dict[str, bytes],
) -> Image.Image:
    image_data = _source_image(image_url, cache)
    try:
        with Image.open(io.BytesIO(image_data)) as source:
            if source.width * source.height > 40_000_000:
                raise ExportRenderError("An artwork image has too many pixels to include in this export.")
            image = ImageOps.exif_transpose(source).convert("RGB")
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise ExportRenderError("An artwork image is invalid or could not be decoded.") from None

    image = ImageOps.fit(image, (max(1, width), max(1, height)), method=Image.Resampling.LANCZOS)
    image = ImageEnhance.Brightness(image).enhance(max(0, brightness) / 100)
    image = ImageEnhance.Contrast(image).enhance(max(0, contrast) / 100)
    if flip_x:
        image = ImageOps.mirror(image)
    if grayscale:
        image = ImageOps.grayscale(image).convert("RGB")
    return image


def _hex_color(value, fallback: str = "#FFFFFF") -> tuple[int, int, int]:
    color = value if isinstance(value, str) else fallback
    if len(color) == 4 and color.startswith("#"):
        color = "#" + "".join(character * 2 for character in color[1:])
    if len(color) != 7 or not color.startswith("#"):
        color = fallback
    try:
        return tuple(int(color[index : index + 2], 16) for index in (1, 3, 5))
    except ValueError:
        return tuple(int(fallback[index : index + 2], 16) for index in (1, 3, 5))


def _draw_screentone(
    image: Image.Image,
    bounds: tuple[int, int, int, int],
    scale: float,
    mode: str,
) -> None:
    left, top, right, bottom = bounds
    overlay = Image.new("RGBA", (max(1, right - left), max(1, bottom - top)), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    if mode == "speedlines":
        step = max(24, int(42 * scale))
        overlay_width, overlay_height = overlay.size
        for offset in range(-overlay_height, overlay_width, step):
            draw.line(
                (offset, overlay_height, offset + overlay_height, 0),
                fill=(65, 65, 65, 90),
                width=max(1, round(scale)),
            )
    elif mode in {"light", "dense"}:
        step = max(6, int((20 if mode == "light" else 11) * scale))
        radius = max(1, int(scale))
        for y in range(step // 2, overlay.height, step):
            for x in range(step // 2, overlay.width, step):
                draw.ellipse(
                    (x - radius, y - radius, x + radius, y + radius),
                    fill=(65, 65, 65, 65),
                )
    else:
        return
    image.paste(overlay, (left, top), overlay)


def _render_raster_page(
    page: dict,
    size: tuple[int, int],
    include_dialogue: bool,
    grayscale: bool,
    cache: dict[str, bytes],
) -> Image.Image:
    image = Image.new("RGB", size, _hex_color(page.get("backgroundColor"), "#FFFFFF"))
    draw = ImageDraw.Draw(image)
    scale_x = size[0] / CANVAS_WIDTH
    scale_y = size[1] / CANVAS_HEIGHT
    scale = min(scale_x, scale_y)
    elements = sorted(
        (element for element in page.get("elements", []) if element.get("visible", True)),
        key=lambda element: element.get("zIndex", 0),
    )

    for element in elements:
        element_type = element.get("type")
        x = round(float(element.get("x", 0)) * scale_x)
        y = round(float(element.get("y", 0)) * scale_y)
        width = max(1, round(float(element.get("width", 0)) * scale_x))
        height = max(1, round(float(element.get("height", 0)) * scale_y))
        bounds = (x, y, x + width, y + height)

        if element_type == "panel":
            fill = _hex_color(element.get("backgroundColor"), "#FFFFFF")
            draw.rectangle(bounds, fill=fill)
            image_url = element.get("imageUrl")
            if image_url:
                panel_image = _image_for_panel(
                    image_url,
                    width,
                    height,
                    float(element.get("imageBrightness", 100)),
                    float(element.get("imageContrast", 100)),
                    bool(element.get("imageFlipX", False)),
                    grayscale,
                    cache,
                )
                image.paste(panel_image, (x, y))
                draw = ImageDraw.Draw(image)
            _draw_screentone(image, bounds, scale, element.get("screentone", "none"))
            draw = ImageDraw.Draw(image)
            border_style = element.get("borderStyle", "solid")
            if border_style != "none":
                border = _hex_color(element.get("borderColor"), "#222222")
                border_width = max(1, round(float(element.get("borderWidth", 2)) * scale))
                if border_style == "dashed":
                    dash = max(3, round(7 * scale))
                    for start in range(x, x + width, dash * 2):
                        draw.line((start, y, min(start + dash, x + width), y), fill=border, width=border_width)
                        draw.line((start, y + height, min(start + dash, x + width), y + height), fill=border, width=border_width)
                    for start in range(y, y + height, dash * 2):
                        draw.line((x, start, x, min(start + dash, y + height)), fill=border, width=border_width)
                        draw.line((x + width, start, x + width, min(start + dash, y + height)), fill=border, width=border_width)
                else:
                    draw.rectangle(bounds, outline=border, width=border_width)
        elif element_type == "image":
            image_url = element.get("imageUrl")
            if image_url:
                artwork = _image_for_panel(
                    image_url,
                    width,
                    height,
                    float(element.get("brightness", 100)),
                    float(element.get("contrast", 100)),
                    bool(element.get("flipX", False)),
                    grayscale,
                    cache,
                )
                image.paste(artwork, (x, y))
                draw = ImageDraw.Draw(image)
        elif element_type == "bubble" and include_dialogue:
            fill = (255, 255, 255)
            border = _hex_color(element.get("color"), "#171717")
            if element.get("bubbleStyle") in {"speech", "thought", "whisper"}:
                draw.ellipse(bounds, fill=fill, outline=border, width=max(1, round(scale * 2)))
            else:
                draw.rectangle(bounds, fill=fill, outline=border, width=max(1, round(scale * 2)))
            text = str(element.get("text", ""))
            font_size = max(9, round(float(element.get("fontSize", 13)) * scale))
            font = _font(font_size)
            lines = _wrap_text(draw, text, font, max(1, width - round(20 * scale)))
            line_height = max(10, round(font_size * 1.25))
            text_height = len(lines) * line_height
            text_y = y + max(2, (height - text_height) // 2)
            for line in lines:
                line_width = draw.textbbox((0, 0), line, font=font)[2]
                align = element.get("textAlign", "center")
                text_x = x + round(10 * scale)
                if align == "center":
                    text_x = x + max(2, (width - line_width) // 2)
                elif align == "right":
                    text_x = x + max(2, width - line_width - round(10 * scale))
                draw.text((text_x, text_y), line, font=font, fill=(23, 23, 23))
                text_y += line_height
        elif element_type == "text" and include_dialogue:
            font_size = max(9, round(float(element.get("fontSize", 16)) * scale))
            font = _font(font_size)
            text = str(element.get("text", ""))
            lines = _wrap_text(draw, text, font, max(1, width))
            line_height = max(10, round(font_size * 1.2))
            text_y = y
            for line in lines:
                line_width = draw.textbbox((0, 0), line, font=font)[2]
                align = element.get("textAlign", "left")
                text_x = x if align == "left" else (x + (width - line_width) // 2 if align == "center" else x + width - line_width)
                draw.text((text_x, text_y), line, font=font, fill=_hex_color(element.get("color"), "#171717"))
                text_y += line_height
        elif element_type == "effect":
            effect = element.get("effectKind")
            color = _hex_color(element.get("color"), "#171717")
            if effect == "speed-lines":
                _draw_screentone(image, bounds, scale, "speedlines")
            elif effect == "impact-burst":
                draw.ellipse(bounds, outline=color, width=max(1, round(scale * 2)))
            else:
                _draw_screentone(image, bounds, scale, "light")
            draw = ImageDraw.Draw(image)

    if grayscale:
        image = ImageOps.grayscale(image).convert("RGB")
    return image


def _selected_pages(project: dict, settings: dict) -> list[dict]:
    pages = project.get("pages")
    if not isinstance(pages, list) or not pages:
        raise ExportRenderError("This project has no pages to export.")
    pages = sorted(pages, key=lambda page: page.get("pageNumber", 0))
    if settings["scope"] == "Single Page":
        selected = pages[:1]
    else:
        first_chapter_id = pages[0].get("chapterId")
        selected = [page for page in pages if page.get("chapterId") == first_chapter_id]
    if not selected:
        raise ExportRenderError("The selected chapter has no pages to export.")
    if len(selected) > MAX_EXPORT_PAGES:
        raise ExportRenderError(f"An export is limited to {MAX_EXPORT_PAGES} pages at a time.")
    return selected


def render_export(project: dict, settings: dict, slug: str) -> tuple[bytes, str, str]:
    pages = _selected_pages(project, settings)
    width_inches, height_inches = PAGE_SIZES_INCHES[settings["pageSize"]]
    dpi = DPI_VALUES[settings["resolution"]]
    dimensions = (round(width_inches * dpi), round(height_inches * dpi))
    if dimensions[0] * dimensions[1] > 40_000_000:
        raise ExportRenderError("The selected page size and resolution exceed the export pixel limit.")
    grayscale = settings["colorMode"] == "Grayscale"
    cache: dict[str, bytes] = {}
    extension = "jpg" if settings["format"] == "JPEG" else settings["format"].lower()

    if settings["format"] == "PDF":
        output = io.BytesIO()
        pdf = canvas.Canvas(
            output,
            pagesize=(width_inches * 72, height_inches * 72),
            pageCompression=1,
        )
        pdf.setTitle(f"{project.get('title', 'MangaForge')} export")
        for page in pages:
            rendered = _render_raster_page(page, dimensions, settings["includeDialogue"], grayscale, cache)
            page_data = io.BytesIO()
            rendered.save(page_data, format="JPEG", quality=95, dpi=(dpi, dpi))
            page_data.seek(0)
            pdf.drawImage(
                ImageReader(page_data),
                0,
                0,
                width=width_inches * 72,
                height=height_inches * 72,
            )
            pdf.showPage()
        pdf.save()
        return output.getvalue(), "application/pdf", f"{slug}.pdf"

    rendered_pages = []
    for index, page in enumerate(pages, start=1):
        rendered = _render_raster_page(page, dimensions, settings["includeDialogue"], grayscale, cache)
        image_data = io.BytesIO()
        if settings["format"] == "PNG":
            rendered.save(image_data, format="PNG", optimize=True, dpi=(dpi, dpi))
        else:
            rendered.save(
                image_data,
                format="JPEG",
                quality=95 if settings["quality"] == "Print Master" else 88,
                dpi=(dpi, dpi),
            )
        rendered_pages.append((f"page-{index:03d}.{extension}", image_data.getvalue()))

    if len(rendered_pages) == 1:
        media_type = "image/png" if settings["format"] == "PNG" else "image/jpeg"
        return rendered_pages[0][1], media_type, f"{slug}.{extension}"

    archive = io.BytesIO()
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as bundle:
        for name, data in rendered_pages:
            bundle.writestr(name, data)
    return archive.getvalue(), "application/zip", f"{slug}.zip"
