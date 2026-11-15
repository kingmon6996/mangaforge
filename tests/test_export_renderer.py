import io
import unittest
import zipfile
from unittest.mock import patch

from PIL import Image

from backend import create_app
from backend.handlers.export_renderer import ExportRenderError, render_export


class ExportRendererTests(unittest.TestCase):
    def setUp(self) -> None:
        self.app = create_app(
            {
                "TESTING": True,
                "SECRET_KEY": "test-secret",
                "SQLALCHEMY_DATABASE_URI": "sqlite://",
                "FRONTEND_ORIGIN": "http://localhost:3000",
            }
        )
        self.project = {
            "title": "Ink Chapter",
            "pages": [
                {
                    "id": "page-one",
                    "pageNumber": 1,
                    "chapterId": "chapter-one",
                    "backgroundColor": "#FFFFFF",
                    "elements": [],
                }
            ],
        }
        self.settings = {
            "format": "PDF",
            "resolution": "150 DPI",
            "pageSize": "B5 Manga",
            "scope": "Complete Chapter",
            "quality": "Standard",
            "includeDialogue": True,
            "colorMode": "Grayscale",
        }

    def tearDown(self) -> None:
        from backend.extensions import db

        with self.app.app_context():
            db.session.remove()
            db.drop_all()
            db.engine.dispose()

    def test_pdf_and_single_page_png_are_real_files(self) -> None:
        with self.app.app_context():
            pdf_data, pdf_type, pdf_name = render_export(self.project, self.settings, "ink")
            png_settings = {**self.settings, "format": "PNG"}
            png_data, png_type, png_name = render_export(self.project, png_settings, "ink")

        self.assertTrue(pdf_data.startswith(b"%PDF"))
        self.assertEqual(pdf_type, "application/pdf")
        self.assertEqual(pdf_name, "ink.pdf")
        self.assertTrue(png_data.startswith(b"\x89PNG\r\n\x1a\n"))
        self.assertEqual(png_type, "image/png")
        self.assertEqual(png_name, "ink.png")
        with Image.open(io.BytesIO(png_data)) as image:
            self.assertEqual(image.size, (1040, 1476))

    def test_multi_page_raster_exports_are_zipped_and_external_images_are_blocked(self) -> None:
        project = {
            **self.project,
            "pages": [
                *self.project["pages"],
                {
                    "id": "page-two",
                    "pageNumber": 2,
                    "chapterId": "chapter-one",
                    "backgroundColor": "#FFFFFF",
                    "elements": [],
                },
            ],
        }
        settings = {**self.settings, "format": "JPEG"}
        with self.app.app_context():
            archive_data, content_type, filename = render_export(project, settings, "ink")
            malicious_project = {
                **self.project,
                "pages": [
                    {
                        **self.project["pages"][0],
                        "elements": [
                            {
                                "type": "panel",
                                "x": 0,
                                "y": 0,
                                "width": 100,
                                "height": 100,
                                "imageUrl": "https://example.invalid/track",
                            }
                        ],
                    }
                ],
            }
            with self.assertRaises(ExportRenderError):
                render_export(malicious_project, self.settings, "ink")

        self.assertEqual(content_type, "application/zip")
        self.assertEqual(filename, "ink.zip")
        with zipfile.ZipFile(io.BytesIO(archive_data)) as archive:
            self.assertEqual(archive.namelist(), ["page-001.jpg", "page-002.jpg"])

    def test_uploaded_image_elements_are_rendered(self) -> None:
        source = io.BytesIO()
        Image.new("RGB", (4, 4), (220, 20, 20)).save(source, format="PNG")
        project = {
            **self.project,
            "pages": [
                {
                    **self.project["pages"][0],
                    "elements": [
                        {
                            "type": "image",
                            "x": 0,
                            "y": 0,
                            "width": 720,
                            "height": 1020,
                            "imageUrl": "http://localhost:3000/assets/panel.png",
                            "brightness": 100,
                            "contrast": 100,
                            "flipX": False,
                        }
                    ],
                }
            ],
        }
        settings = {**self.settings, "format": "PNG", "colorMode": "Color"}
        with self.app.app_context(), patch(
            "backend.handlers.export_renderer._source_image",
            return_value=source.getvalue(),
        ):
            png_data, _, _ = render_export(project, settings, "ink")
        with Image.open(io.BytesIO(png_data)) as rendered:
            red, green, blue = rendered.getpixel((520, 738))
        self.assertGreater(red, 180)
        self.assertLess(green, 80)
        self.assertLess(blue, 80)
