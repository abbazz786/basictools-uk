import httpx
from functools import lru_cache
from datetime import datetime

SPARQL_ENDPOINT = "https://landregistry.data.gov.uk/app/root/qonsole"

# Property type mapping from Land Registry URIs
PROPERTY_TYPES = {
    "detached": "D",
    "semi-detached": "S",
    "terraced": "T",
    "flat-maisonette": "F",
    "other": "O",
}


def _build_sparql_query(postcode: str) -> str:
    """Build SPARQL query for Land Registry Price Paid Data."""
    # Format postcode with space for Land Registry (e.g. SW1A1AA -> SW1A 1AA)
    formatted = postcode[:-3] + " " + postcode[-3:] if len(postcode) > 3 else postcode

    return f"""
    PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
    PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>

    SELECT ?paon ?saon ?street ?town ?county ?postcode ?amount ?date ?category
    WHERE {{
        ?txn lrppi:pricePaid ?amount ;
             lrppi:transactionDate ?date ;
             lrppi:propertyAddress ?addr .

        OPTIONAL {{ ?txn lrppi:propertyType ?category . }}

        ?addr lrcommon:postcode "{formatted}" ;
              lrcommon:paon ?paon ;
              lrcommon:street ?street ;
              lrcommon:town ?town .

        OPTIONAL {{ ?addr lrcommon:saon ?saon . }}
        OPTIONAL {{ ?addr lrcommon:county ?county . }}
        OPTIONAL {{ ?addr lrcommon:postcode ?postcode . }}
    }}
    ORDER BY DESC(?date)
    LIMIT 100
    """


async def fetch_transactions_by_postcode(postcode: str) -> list[dict]:
    """Fetch property transactions from Land Registry SPARQL endpoint."""
    query = _build_sparql_query(postcode)

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(
                "https://landregistry.data.gov.uk/app/root/qonsole",
                params={"query": query, "output": "json"},
            )
            response.raise_for_status()
        except httpx.HTTPError:
            # Fallback: try the direct SPARQL endpoint
            try:
                response = await client.post(
                    "https://landregistry.data.gov.uk/landregistry/query",
                    data={"query": query, "output": "json"},
                    headers={"Accept": "application/sparql-results+json"},
                )
                response.raise_for_status()
            except httpx.HTTPError:
                return []

    try:
        data = response.json()
    except Exception:
        return []

    bindings = data.get("results", {}).get("bindings", [])
    properties = []
    seen = set()

    for b in bindings:
        paon = b.get("paon", {}).get("value", "")
        saon = b.get("saon", {}).get("value", "")
        street = b.get("street", {}).get("value", "")
        town = b.get("town", {}).get("value", "")
        amount = b.get("amount", {}).get("value", "0")
        date_str = b.get("date", {}).get("value", "")
        category_uri = b.get("category", {}).get("value", "")

        # Build address
        addr_parts = []
        if saon:
            addr_parts.append(saon)
        if paon:
            addr_parts.append(paon)
        if street:
            addr_parts.append(street)
        address = ", ".join(addr_parts) if addr_parts else "Unknown"

        # Parse property type from URI
        property_type = ""
        if category_uri:
            type_part = category_uri.rsplit("/", 1)[-1].lower()
            property_type = PROPERTY_TYPES.get(type_part, type_part[:1].upper())

        # Parse price
        try:
            price = int(float(amount))
        except (ValueError, TypeError):
            price = 0

        # Dedup key
        key = f"{address}|{date_str}|{price}"
        if key in seen:
            continue
        seen.add(key)

        properties.append({
            "id": f"{postcode}-{len(properties)}",
            "address": address,
            "city": town.title() if town else "",
            "postcode": postcode[:-3] + " " + postcode[-3:] if len(postcode) > 3 else postcode,
            "price": price,
            "transaction_date": date_str.split("T")[0] if date_str else None,
            "property_type": property_type,
            "tenure": "",
            "new_build": False,
        })

    return properties


async def fetch_transactions_nearby(lat: float, lng: float, radius: int = 500) -> list[dict]:
    """Fetch nearby transactions. Currently delegates to postcode-based lookup
    via the main endpoint (reverse geocode → fetch by postcode)."""
    # This is a placeholder — the /api/v1/properties/nearby endpoint
    # handles the reverse geocoding + multi-postcode fetch itself
    return []
