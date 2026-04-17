import urllib.request
import urllib.parse
import json


def get_postcode_info(postcode: str):
    """Get location info from postcodes.io (free, no API key)."""
    try:
        url = f"https://api.postcodes.io/postcodes/{urllib.parse.quote(postcode)}"
        with urllib.request.urlopen(url, timeout=10) as resp:
            if resp.status != 200:
                return None
            data = json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None

    result = data.get("result")
    if not result:
        return None

    return {
        "postcode": result.get("postcode", postcode),
        "latitude": result.get("latitude"),
        "longitude": result.get("longitude"),
        "admin_district": result.get("admin_district", ""),
        "parish": result.get("parish", ""),
        "region": result.get("region", ""),
        "country": result.get("country", ""),
    }


def reverse_geocode(lat: float, lng: float, radius: int = 500):
    """Find postcodes near a GPS coordinate."""
    try:
        params = urllib.parse.urlencode({
            "lon": lng,
            "lat": lat,
            "radius": min(radius, 2000),
            "limit": 10,
        })
        url = f"https://api.postcodes.io/postcodes?{params}"
        with urllib.request.urlopen(url, timeout=10) as resp:
            if resp.status != 200:
                return []
            data = json.loads(resp.read().decode("utf-8"))
    except Exception:
        return []

    results = data.get("result") or []
    return [
        {
            "postcode": r.get("postcode", ""),
            "latitude": r.get("latitude"),
            "longitude": r.get("longitude"),
            "distance": r.get("distance", 0),
            "admin_district": r.get("admin_district", ""),
        }
        for r in results
        if r.get("postcode")
    ]


def search_postcode_by_address(query: str):
    """Postcode autocomplete via postcodes.io."""
    suggestions = []

    try:
        url = f"https://api.postcodes.io/postcodes/{urllib.parse.quote(query)}/autocomplete"
        with urllib.request.urlopen(url, timeout=10) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                results = data.get("result") or []
                for pc in results[:8]:
                    if pc:
                        suggestions.append({
                            "display": pc,
                            "address": pc,
                            "postcode": pc,
                        })
    except Exception:
        pass

    if not suggestions:
        try:
            params = urllib.parse.urlencode({"q": query, "limit": 8})
            url = f"https://api.postcodes.io/places?{params}"
            with urllib.request.urlopen(url, timeout=10) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    results = data.get("result") or []
                    for place in results:
                        name = place.get("name_1", "")
                        county = place.get("county_unitary", "")
                        display = f"{name}, {county}" if county else name
                        suggestions.append({
                            "display": display,
                            "address": display,
                            "postcode": None,
                        })
        except Exception:
            pass

    return suggestions
