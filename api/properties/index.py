from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from _lib.land_registry import fetch_transactions_by_postcode
from _lib.postcodes import get_postcode_info


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        qs = parse_qs(urlparse(self.path).query)
        postcode = (qs.get("postcode", [""])[0] or "").strip()

        if len(postcode) < 5:
            self._send(400, {"detail": "postcode required (min 5 chars)"})
            return

        cleaned = postcode.replace(" ", "").upper()
        location = get_postcode_info(cleaned)
        properties = fetch_transactions_by_postcode(cleaned)

        if not properties and not location:
            self._send(404, {"detail": "No data found for this postcode"})
            return

        self._send(200, {
            "postcode": cleaned,
            "location": location,
            "properties": properties,
            "count": len(properties),
        })

    def _send(self, status, body):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(body).encode("utf-8"))
