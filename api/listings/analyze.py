from http.server import BaseHTTPRequestHandler
import json


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length).decode("utf-8")) if length else {}
        except Exception:
            body = {}

        url = (body.get("url") or "").strip()

        response = {
            "url": url,
            "status": "limited",
            "message": "Full listing analysis requires scraping setup. Try searching by postcode instead.",
            "postcode": None,
            "asking_price": None,
            "last_sold_price": None,
            "area_average": None,
            "price_difference": None,
            "overpriced": False,
        }

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(response).encode("utf-8"))
