#strandsagents/01_agents_with_tools/tools/accommodations.py
# Standard library imports
from typing import Dict, List, Any

# Third-party imports
from strands import tool

# Local application imports
# None required


@tool
def search_accommodations(location: str, check_in: str, check_out: str) -> Dict[str, List[Dict[str, Any]]]:
    """Searches for available accommodations in the specified location.

    Returns dummy accommodation data based on the provided location.
    Currently supports Tokyo, Kyoto, Osaka, and San Francisco. Note that while
    check_in and check_out parameters are accepted, they are not used in the
    current implementation.

    Args:
        location: The city to search for accommodations (e.g., "Tokyo").
        check_in: The check-in date in YYYY-MM-DD format.
        check_out: The check-out date in YYYY-MM-DD format.

    Returns:
        A dictionary with key "accommodations" containing a list of
        accommodation details for the specified location. Each accommodation is
        a dictionary with properties including:
            - name: Name of the accommodation
            - type: Type of property (Hotel, Apartment, Ryokan, etc.)
            - location: Specific area within the city
            - price_per_night: Cost per night in USD
            - rating: Guest rating from 1.0 to 5.0
            - amenities: List of available amenities
            - distance_to_center: Distance to city center
            - available_rooms: Number of rooms available
            - room_type: Type of available room
            - cancellation_policy: Cancellation terms
        
        If the location is not supported, returns an empty list under "accommodations".

    Examples:
        >>> search_accommodations("Tokyo", "2023-05-20", "2023-05-25")
        {"accommodations": [{"name": "Park Hyatt Tokyo", "type": "Luxury Hotel", ...}, ...]}

        >>> search_accommodations("Unknown", "2023-05-20", "2023-05-25")
        {"accommodations": []}
    """
    accommodations = {
        "Tokyo": [
            {
                "name": "Park Hyatt Tokyo",
                "type": "Luxury Hotel",
                "location": "Shinjuku, Tokyo",
                "price_per_night": 450.00,
                "rating": 4.8,
                "amenities": ["Pool", "Spa", "Free WiFi", "Restaurant", "Room Service"],
                "distance_to_center": "1.5 km",
                "available_rooms": 1,
                "room_type": "Family Suite",
                "cancellation_policy": "Free cancellation until 3 days before check-in",
            },
            {
                "name": "Residential Airbnb",
                "type": "Apartment",
                "location": "Shibuya, Tokyo",
                "price_per_night": 210.00,
                "rating": 4.6,
                "amenities": [
                    "Kitchen",
                    "Free WiFi",
                    "Washing Machine",
                    "Family-friendly",
                ],
                "distance_to_center": "0.8 km",
                "available_rooms": 1,
                "room_type": "2-Bedroom Apartment",
                "cancellation_policy": "Free cancellation until 1 week before check-in",
            },
            {
                "name": "Asakusa Traditional Inn",
                "type": "Ryokan",
                "location": "Asakusa, Tokyo",
                "price_per_night": 280.00,
                "rating": 4.7,
                "amenities": [
                    "Traditional Breakfast",
                    "Public Bath",
                    "Free WiFi",
                    "Cultural Experience",
                ],
                "distance_to_center": "3.2 km",
                "available_rooms": 1,
                "room_type": "Family Room with Tatami",
                "cancellation_policy": "Non-refundable",
            },
        ],
        "Kyoto": [
            {
                "name": "Traditional Kyoto Machiya",
                "type": "Traditional House",
                "location": "Gion District, Kyoto",
                "price_per_night": 320.00,
                "rating": 4.9,
                "amenities": [
                    "Traditional Architecture",
                    "Garden",
                    "Free WiFi",
                    "Cultural Experience",
                ],
                "distance_to_center": "1.2 km",
                "available_rooms": 1,
                "room_type": "Entire House",
                "cancellation_policy": "Free cancellation until 1 week before check-in",
            },
            {
                "name": "Kyoto Grand Hotel",
                "type": "Hotel",
                "location": "Central Kyoto",
                "price_per_night": 280.00,
                "rating": 4.5,
                "amenities": ["Restaurant", "Free WiFi", "Concierge", "Room Service"],
                "distance_to_center": "0.5 km",
                "available_rooms": 2,
                "room_type": "Family Room",
                "cancellation_policy": "Free cancellation until 2 days before check-in",
            },
        ],
        "Osaka": [
            {
                "name": "Osaka Family Hotel",
                "type": "Hotel",
                "location": "Namba, Osaka",
                "price_per_night": 220.00,
                "rating": 4.4,
                "amenities": [
                    "Free WiFi",
                    "Restaurant",
                    "Family Rooms",
                    "Convenience Store",
                ],
                "distance_to_center": "1.0 km",
                "available_rooms": 3,
                "room_type": "Quadruple Room",
                "cancellation_policy": "Free cancellation until 3 days before check-in",
            },
            {
                "name": "Osaka Bay View",
                "type": "Hotel",
                "location": "Osaka Bay, Osaka",
                "price_per_night": 250.00,
                "rating": 4.6,
                "amenities": ["Pool", "Free WiFi", "Restaurant", "Theme Park Shuttle"],
                "distance_to_center": "4.5 km",
                "available_rooms": 2,
                "room_type": "Family Suite with Bay View",
                "cancellation_policy": "Free cancellation until 1 week before check-in",
            },
        ],
        "San Francisco": [
            {
                "name": "The Fairmont San Francisco",
                "type": "Luxury Hotel",
                "location": "Nob Hill, San Francisco",
                "price_per_night": 399.00,
                "rating": 4.8,
                "amenities": [
                    "Spa",
                    "Fine Dining",
                    "Free WiFi",
                    "Concierge",
                    "Room Service",
                ],
                "distance_to_center": "0.8 km",
                "available_rooms": 1,
                "room_type": "King Suite with City View",
                "cancellation_policy": "Free cancellation until 3 days before check-in",
                "description": "Historic luxury hotel with stunning views of the city and bay. Perfect for anniversary celebrations.",
            },
            {
                "name": "Hotel Zetta",
                "type": "Boutique Hotel",
                "location": "SoMa, San Francisco",
                "price_per_night": 299.00,
                "rating": 4.7,
                "amenities": [
                    "Trendy Bar",
                    "Game Room",
                    "Free WiFi",
                    "Restaurant",
                    "Artsy Atmosphere",
                ],
                "distance_to_center": "0.4 km",
                "available_rooms": 2,
                "room_type": "King Deluxe Room",
                "cancellation_policy": "Free cancellation until 48 hours before check-in",
                "description": "Modern boutique hotel with a playful vibe and central location, perfect for couples who enjoy contemporary design.",
            },
            {
                "name": "The Huntington Hotel",
                "type": "Historic Hotel",
                "location": "Nob Hill, San Francisco",
                "price_per_night": 325.00,
                "rating": 4.6,
                "amenities": [
                    "Spa",
                    "Indoor Pool",
                    "Free WiFi",
                    "Fine Dining",
                    "Historic Charm",
                ],
                "distance_to_center": "1.2 km",
                "available_rooms": 1,
                "room_type": "Deluxe King Room",
                "cancellation_policy": "Free cancellation until 7 days before check-in",
                "description": "Elegant historic hotel with sophisticated atmosphere and renowned spa.",
            },
        ],
    }

    if location in accommodations:
        return {"accommodations": accommodations[location]}
    else:
        return {"accommodations": []}
