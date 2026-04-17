from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from _lib.land_registry import fetch_transactions_by_postcode
from _lib.postcodes import reverse_geocode


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        qs = parse_qs(urlparse(self.path).query)
        try:
            lat = float(qs.get("lat", [""])[0])
            lng = float(qs.get("lng", [""])[0])
        except (ValueError, IndexError):
            self._send(400, {"detail": "lat and lng query params required"})
            return

        try:
            radius = int(qs.get("radius", ["500"])[0])
        except ValueError:
            radius = 500
        radius = max(100, min(radius, 2000))

        nearby_postcodes = reverse_geocode(lat, lng, radius)
        if not nearby_postcodes:
            self._send(404, {"detail": "No postcodes near this location"})
            return

        all_properties = []
        for pc_info in nearby_postcodes[:3]:  # limit to 3 postcodes for serverless time budget
            pc = pc_info["postcode"].replace(" ", "").upper()
            pc_lat = pc_info.get("latitude")
            pc_lng = pc_info.get("longitude")
            props = fetch_transactions_by_postcode(pc)
            # Attach postcode-level lat/lng to each property so the frontend
            # can calculate bearings/distances for the AR view.
            for p in props:
                p["latitude"] = pc_lat
                p["longitude"] = pc_lng
                p["postcode_distance"] = pc_info.get("distance", 0)
            all_properties.extend(props)

        all_properties.sort(key=lambda p: p.get("transaction_date") or "", reverse=True)

        self._send(200, {
            "latitude": lat,
            "longitude": lng,
            "radius": radius,
            "properties": all_properties[:50],
            "count": min(len(all_properties), 50),
        })

    def _send(self, status, body):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(body).encode("utf-8"))
