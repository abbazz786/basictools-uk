import urllib.request
import urllib.parse
import json

PROPERTY_TYPES = {
    "detached": "D",
    "semi-detached": "S",
    "terraced": "T",
    "flat-maisonette": "F",
    "other": "O",
}


def _build_sparql_query(postcode: str) -> str:
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


def fetch_transactions_by_postcode(postcode: str) -> list:
    """Fetch Land Registry sales data for a UK postcode (synchronous, stdlib-only)."""
    query = _build_sparql_query(postcode)
    params = urllib.parse.urlencode({"query": query, "output": "json"})
    url = f"https://landregistry.data.gov.uk/landregistry/query?{params}"

    try:
        req = urllib.request.Request(
            url,
            headers={"Accept": "application/sparql-results+json"},
        )
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read().decode("utf-8"))
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

        addr_parts = []
        if saon:
            addr_parts.append(saon)
        if paon:
            addr_parts.append(paon)
        if street:
            addr_parts.append(street)
        address = ", ".join(addr_parts) if addr_parts else "Unknown"

        property_type = ""
        if category_uri:
            type_part = category_uri.rsplit("/", 1)[-1].lower()
            property_type = PROPERTY_TYPES.get(type_part, type_part[:1].upper() if type_part else "")

        try:
            price = int(float(amount))
        except (ValueError, TypeError):
            price = 0

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
