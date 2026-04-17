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
    # Simplified query — fewer OPTIONALs, lower LIMIT for serverless speed
    return f"""PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
SELECT ?paon ?saon ?street ?town ?amount ?date ?category WHERE {{
  ?addr lrcommon:postcode "{formatted}" ;
        lrcommon:paon ?paon ;
        lrcommon:street ?street ;
        lrcommon:town ?town .
  ?txn lrppi:propertyAddress ?addr ;
       lrppi:pricePaid ?amount ;
       lrppi:transactionDate ?date .
  OPTIONAL {{ ?addr lrcommon:saon ?saon }}
  OPTIONAL {{ ?txn lrppi:propertyType ?category }}
}} ORDER BY DESC(?date) LIMIT 30"""


def fetch_transactions_by_postcode(postcode: str, return_debug: bool = False):
    """Fetch Land Registry sales data for a UK postcode (synchronous, stdlib-only)."""
    query = _build_sparql_query(postcode)
    url = "https://landregistry.data.gov.uk/landregistry/query"
    form_data = urllib.parse.urlencode({"query": query}).encode("utf-8")

    debug = {"url": url, "postcode_formatted": postcode[:-3] + " " + postcode[-3:] if len(postcode) > 3 else postcode}

    try:
        req = urllib.request.Request(
            url,
            data=form_data,
            method="POST",
            headers={
                "Accept": "application/sparql-results+json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            raw = resp.read().decode("utf-8")
            debug["http_status"] = resp.status
            debug["response_len"] = len(raw)
            debug["response_sample"] = raw[:500]
            data = json.loads(raw)
    except Exception as e:
        debug["fetch_error"] = f"{type(e).__name__}: {e}"
        if return_debug:
            return [], debug
        return []

    debug["bindings_count"] = len(data.get("results", {}).get("bindings", []))

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

    if return_debug:
        return properties, debug
    return properties
