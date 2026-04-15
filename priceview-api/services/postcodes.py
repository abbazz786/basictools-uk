import httpx

POSTCODES_IO_URL = "https://api.postcodes.io/postcodes"


async def get_postcode_info(postcode: str) -> dict | None:
    """Get location and area info from postcodes.io (free, no API key needed)."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(f"{POSTCODES_IO_URL}/{postcode}")
            if response.status_code != 200:
                return None
            data = response.json()
        except httpx.HTTPError:
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


async def reverse_geocode(lat: float, lng: float, radius: int = 500) -> list[dict]:
    """Find postcodes near a GPS coordinate using postcodes.io reverse geocoding."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(
                f"{POSTCODES_IO_URL}",
                params={
                    "lon": lng,
                    "lat": lat,
                    "radius": min(radius, 2000),
                    "limit": 10,
                },
            )
            if response.status_code != 200:
                return []
            data = response.json()
        except httpx.HTTPError:
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


async def search_postcode_by_address(query: str) -> list[dict]:
    """Search for addresses/postcodes using postcodes.io autocomplete.

    postcodes.io supports postcode autocomplete. For address-level search,
    we try to extract a partial postcode and autocomplete it.
    """
    suggestions = []

    async with httpx.AsyncClient(timeout=10.0) as client:
        # Try postcode autocomplete if query looks like a partial postcode
        try:
            response = await client.get(
                f"{POSTCODES_IO_URL}/{query}/autocomplete",
            )
            if response.status_code == 200:
                data = response.json()
                results = data.get("result") or []
                for pc in results[:8]:
                    if pc:
                        suggestions.append({
                            "display": pc,
                            "address": pc,
                            "postcode": pc,
                        })
        except httpx.HTTPError:
            pass

        # Also try place/area lookup if we got no results
        if not suggestions:
            try:
                response = await client.get(
                    "https://api.postcodes.io/places",
                    params={"q": query, "limit": 8},
                )
                if response.status_code == 200:
                    data = response.json()
                    results = data.get("result") or []
                    for place in results:
                        name = place.get("name_1", "")
                        county = place.get("county_unitary", "")
                        display = f"{name}, {county}" if county else name
                        # Places don't have postcodes directly, but we can
                        # return the name for user to refine
                        suggestions.append({
                            "display": display,
                            "address": display,
                            "postcode": None,
                        })
            except httpx.HTTPError:
                pass

    return suggestions
