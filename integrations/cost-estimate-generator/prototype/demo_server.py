from __future__ import annotations

import mimetypes
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen


HOST = "127.0.0.1"
PORT = 8766
UPSTREAM = "http://127.0.0.1:8080"
ROOT = Path(__file__).resolve().parent

STATIC_FILES = {
    "/": "showcase.html",
    "/showcase.css": "showcase.css",
    "/showcase.js": "showcase.js",
    "/overlay.css": "overlay.css",
    "/overlay.js": "overlay.js",
    "/cone-bot.png": "cone-bot.png",
}


class DemoHandler(BaseHTTPRequestHandler):
    server_version = "CostestDemo/1.0"

    def do_GET(self) -> None:
        self._handle()

    def do_POST(self) -> None:
        self._handle()

    def do_HEAD(self) -> None:
        self._handle(head_only=True)

    def _handle(self, head_only: bool = False) -> None:
        path = urlsplit(self.path).path
        if path.startswith("/estimator"):
            self._proxy(path.removeprefix("/estimator") or "/", head_only=head_only)
            return
        if path.startswith("/api/"):
            self._proxy(path, head_only=head_only)
            return
        filename = STATIC_FILES.get(path)
        if filename:
            self._serve_static(ROOT / filename, head_only=head_only)
            return
        self.send_error(404, "Not found")

    def _serve_static(self, file_path: Path, *, head_only: bool) -> None:
        if not file_path.exists():
            self.send_error(404, "Not found")
            return
        content_type, _ = mimetypes.guess_type(str(file_path))
        data = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        if not head_only:
            self.wfile.write(data)

    def _proxy(self, upstream_path: str, *, head_only: bool) -> None:
        target = f"{UPSTREAM}{upstream_path}"
        content_length = int(self.headers.get("Content-Length", "0") or "0")
        body = self.rfile.read(content_length) if content_length else None
        req = Request(target, data=body, method=self.command)
        for key, value in self.headers.items():
            if key.lower() in {"host", "connection", "content-length"}:
                continue
            req.add_header(key, value)
        try:
            with urlopen(req, timeout=240) as resp:
                payload = resp.read()
                self.send_response(resp.status)
                for key, value in resp.headers.items():
                    lower = key.lower()
                    if lower in {"transfer-encoding", "connection", "content-encoding"}:
                        continue
                    if lower == "location" and value.startswith("/"):
                        value = f"/estimator{value}"
                    self.send_header(key, value)
                self.end_headers()
                if not head_only:
                    self.wfile.write(payload)
        except HTTPError as exc:
            payload = exc.read()
            self.send_response(exc.code)
            for key, value in exc.headers.items():
                if key.lower() in {"transfer-encoding", "connection", "content-encoding"}:
                    continue
                self.send_header(key, value)
            self.end_headers()
            if not head_only and payload:
                self.wfile.write(payload)
        except URLError as exc:
            self.send_error(502, f"Upstream unavailable: {exc.reason}")


def main() -> None:
    os.chdir(ROOT)
    httpd = ThreadingHTTPServer((HOST, PORT), DemoHandler)
    print(f"Demo server running at http://{HOST}:{PORT}", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
