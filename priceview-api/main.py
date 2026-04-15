from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.land_registry import fetch_transactions_by_postcode, fetch_transactions_nearby
from services.postcodes import get_postcode_info, reverse_geocode, search_postcode_by_address

app = FastAPI(title="PriceView API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://basictools.uk",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request models ──────────────────────────────────

class AddressSearchRequest(BaseModel):
    query: str

class URLAnalyzeRequest(BaseModel):
    url: str

class PhotoIdentifyRequest(BaseModel):
    photo: str  # base64


# ── Endpoints ───────────────────────────────────────

@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}


@app.get("/api/v1/properties")
async def get_properties(postcode: str = Query(..., min_length=5, max_length=8)):
    """Get property sales for a UK postcode from Land Registry."""
    cleaned = postcode.replace(" ", "").upper()

    location = await get_postcode_info(cleaned)
    properties = await fetch_transactions_by_postcode(cleaned)

    if not properties and not location:
        raise HTTPException(status_code=404, detail="No data found for this postcode")

    return {
        "postcode": cleaned,
        "location": location,
        "properties": properties,
        "count": len(properties),
    }


@app.get("/api/v1/postcodes/{postcode}")
async def get_postcode(postcode: str):
    """Get location and area info for a UK postcode."""
    cleaned = postcode.replace(" ", "").upper()
    location = await get_postcode_info(cleaned)

    if not location:
        raise HTTPException(status_code=404, detail="Postcode not found")

    return location


@app.get("/api/v1/properties/nearby")
async def get_nearby_properties(
    lat: float = Query(...),
    lng: float = Query(...),
    radius: int = Query(500, ge=100, le=2000),
):
    """Find property sales near a GPS coordinate by reverse-geocoding to nearby postcodes."""
    # Get nearby postcodes from postcodes.io
    nearby_postcodes = await reverse_geocode(lat, lng, radius)

    if not nearby_postcodes:
        raise HTTPException(status_code=404, detail="No postcodes found near this location")

    # Fetch transactions for each nearby postcode
    all_properties = []
    for pc_info in nearby_postcodes[:5]:  # Limit to 5 postcodes
        pc = pc_info["postcode"].replace(" ", "").upper()
        props = await fetch_transactions_by_postcode(pc)
        all_properties.extend(props)

    # Sort by date descending
    all_properties.sort(key=lambda p: p.get("transaction_date") or "", reverse=True)

    return {
        "latitude": lat,
        "longitude": lng,
        "radius": radius,
        "properties": all_properties[:50],
        "count": min(len(all_properties), 50),
    }


@app.post("/api/v1/search/address")
async def search_address(req: AddressSearchRequest):
    """Search for property addresses and return matching postcodes."""
    query = req.query.strip()
    if len(query) < 3:
        return {"suggestions": []}

    suggestions = await search_postcode_by_address(query)
    return {"suggestions": suggestions}


@app.post("/api/v1/listings/analyze")
async def analyze_listing(req: URLAnalyzeRequest):
    """Analyze a property listing URL (Rightmove/Zoopla/etc).

    Note: Full scraping requires additional services. This MVP returns
    a structured response that the frontend can display.
    """
    url = req.url.strip()

    # For MVP, we extract the postcode from the URL if possible and
    # return Land Registry data for comparison
    return {
        "url": url,
        "status": "limited",
        "message": "Full listing analysis requires additional setup. Try searching by postcode instead.",
        "postcode": None,
        "asking_price": None,
        "last_sold_price": None,
        "area_average": None,
        "price_difference": None,
        "overpriced": False,
    }


@app.post("/api/v1/photo/identify")
async def identify_photo(req: PhotoIdentifyRequest):
    """Identify a property from a photo.

    Note: Full image recognition requires a vision AI service.
    This MVP returns a helpful message.
    """
    return {
        "status": "limited",
        "message": "Photo identification requires a vision AI service. Try searching by postcode or address instead.",
        "postcode": None,
        "suggestions": [],
    }
