from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import sys
import os
import traceback

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

_import_error = None
try:
    from _lib.land_registry import fetch_transactions_by_postcode
    from _lib.postcodes import get_postcode_info
except Exception as e:
    _import_error = f"{type(e).__name__}: {e}\n{traceback.format_exc()}"


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if _import_error:
            self._send(500, {"detail": "Import error", "error": _import_error})
            return

        qs = parse_qs(urlparse(self.path).query)
        postcode = (qs.get("postcode", [""])[0] or "").strip()
        debug = qs.get("debug", [""])[0] == "1"

        if len(postcode) < 5:
            self._send(400, {"detail": "postcode required (min 5 chars)"})
            return

        cleaned = postcode.replace(" ", "").upper()

        debug_info = {}
        try:
            location = get_postcode_info(cleaned)
            debug_info["location_ok"] = True
        except Exception as e:
            location = None
            debug_info["location_error"] = f"{type(e).__name__}: {e}"

        try:
            if debug:
                properties, sparql_debug = fetch_transactions_by_postcode(cleaned, return_debug=True)
                debug_info["sparql"] = sparql_debug
            else:
                properties = fetch_transactions_by_postcode(cleaned)
            debug_info["properties_ok"] = True
        except Exception as e:
            properties = []
            debug_info["properties_error"] = f"{type(e).__name__}: {e}"
            debug_info["traceback"] = traceback.format_exc()

        if not properties and not location:
            self._send(404, {"detail": "No data found for this postcode", "debug": debug_info if debug else None})
            return

        response = {
            "postcode": cleaned,
            "location": location,
            "properties": properties,
            "count": len(properties),
        }
        if debug:
            response["debug"] = debug_info
        self._send(200, response)

    def _send(self, status, body):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(body).encode("utf-8"))
