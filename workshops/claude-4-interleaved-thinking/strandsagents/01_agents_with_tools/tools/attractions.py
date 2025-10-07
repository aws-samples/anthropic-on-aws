# Standard library imports
from typing import Dict, List, Any, Optional, Union

# Third-party imports
from strands import tool

# Local application imports
# None required


@tool
def search_attractions(location: str, category: Optional[str] = None) -> Dict[str, Union[List[Dict[str, Any]], str]]:
    """Searches for tourist attractions in the specified location and category.

    Returns dummy attraction data based on the provided location, optionally filtered
    by category. Currently supports locations: Tokyo, Kyoto, Osaka, and San Francisco,
    with various categories for each location (e.g., Cultural, Family, Shopping, etc.).

    Args:
        location: The city to search for attractions (e.g., "Tokyo", "Kyoto").
        category: The type of attractions to filter by (e.g., "Cultural", "Family", 
            "Shopping"). If None, returns all attractions for the specified location.
            Defaults to None.

    Returns:
        A dictionary with one of the following structures:
        
        Success with category specified:
        {
            "attractions": List of attraction dictionaries with details including:
                - name: Name of the attraction
                - rating: Visitor rating from 1.0 to 5.0
                - visit_duration: Suggested time to visit
                - best_time: Recommended time of day
                - crowd_level: Expected crowd density
                - admission: Cost of entry
                - description: Brief description of the attraction
            "location": The requested location
            "category": The requested category
        }
        
        Success without category specified:
        {
            "attractions": List of all attractions across all categories
            "location": The requested location
        }
        
        Error case:
        {
            "error": Error message describing why the search failed
        }

    Examples:
        >>> search_attractions("Tokyo", "Cultural")
        {"attractions": [{"name": "Senso-ji Temple", "rating": 4.7, ...}, ...],
         "location": "Tokyo", "category": "Cultural"}

        >>> search_attractions("Tokyo")
        {"attractions": [{"name": "Senso-ji Temple", ...}, {"name": "Tokyo Disneyland", ...}, ...],
         "location": "Tokyo"}

        >>> search_attractions("Tokyo", "Unknown")
        {"error": "Category 'Unknown' not found for Tokyo"}

        >>> search_attractions("Unknown")
        {"error": "No attractions data available for Unknown"}
    """

    attractions_data = {
        "Tokyo": {
            "Cultural": [
                {
                    "name": "Senso-ji Temple",
                    "rating": 4.7,
                    "visit_duration": "1-2 hours",
                    "best_time": "Morning",
                    "crowd_level": "High",
                    "admission": "Free",
                    "description": "Tokyo's oldest temple with the famous Thunder Gate and shopping street.",
                },
                {
                    "name": "Meiji Shrine",
                    "rating": 4.6,
                    "visit_duration": "1-2 hours",
                    "best_time": "Morning",
                    "crowd_level": "Medium",
                    "admission": "Free",
                    "description": "Peaceful shrine set in a forest within Tokyo.",
                },
                {
                    "name": "Edo-Tokyo Museum",
                    "rating": 4.5,
                    "visit_duration": "2-3 hours",
                    "best_time": "Afternoon",
                    "crowd_level": "Medium",
                    "admission": "¥600",
                    "description": "Museum showcasing Tokyo's history from the Edo period.",
                },
            ],
            "Family": [
                {
                    "name": "Tokyo Disneyland",
                    "rating": 4.8,
                    "visit_duration": "Full day",
                    "best_time": "Weekday",
                    "crowd_level": "High",
                    "admission": "¥8,200",
                    "description": "World-famous theme park with attractions for all ages.",
                },
                {
                    "name": "Ueno Zoo",
                    "rating": 4.4,
                    "visit_duration": "3-4 hours",
                    "best_time": "Morning",
                    "crowd_level": "Medium",
                    "admission": "¥600",
                    "description": "Japan's oldest zoo featuring pandas and many other animals.",
                },
                {
                    "name": "TeamLab Borderless",
                    "rating": 4.7,
                    "visit_duration": "2-3 hours",
                    "best_time": "Morning",
                    "crowd_level": "High",
                    "admission": "¥3,200",
                    "description": "Interactive digital art museum popular with children and adults.",
                },
            ],
            "Shopping": [
                {
                    "name": "Shibuya Crossing & Center",
                    "rating": 4.5,
                    "visit_duration": "2-3 hours",
                    "best_time": "Evening",
                    "crowd_level": "Very High",
                    "admission": "Free",
                    "description": "Famous crossing and shopping district with fashion boutiques.",
                },
                {
                    "name": "Akihabara Electric Town",
                    "rating": 4.6,
                    "visit_duration": "2-4 hours",
                    "best_time": "Afternoon",
                    "crowd_level": "High",
                    "admission": "Free",
                    "description": "Electronics and anime shopping district.",
                },
                {
                    "name": "Toyosu Fish Market",
                    "rating": 4.3,
                    "visit_duration": "2 hours",
                    "best_time": "Early Morning",
                    "crowd_level": "Medium",
                    "admission": "Free",
                    "description": "The new fish market that replaced Tsukiji, with viewing platforms for the tuna auction.",
                },
            ],
        },
        "Kyoto": {
            "Cultural": [
                {
                    "name": "Fushimi Inari Shrine",
                    "rating": 4.8,
                    "visit_duration": "2-3 hours",
                    "best_time": "Early Morning",
                    "crowd_level": "High",
                    "admission": "Free",
                    "description": "Famous shrine with thousands of vermilion torii gates.",
                },
                {
                    "name": "Kinkaku-ji (Golden Pavilion)",
                    "rating": 4.7,
                    "visit_duration": "1 hour",
                    "best_time": "Morning",
                    "crowd_level": "Very High",
                    "admission": "¥400",
                    "description": "Zen temple covered in gold leaf with beautiful garden.",
                },
                {
                    "name": "Arashiyama Bamboo Grove",
                    "rating": 4.6,
                    "visit_duration": "1 hour",
                    "best_time": "Early Morning",
                    "crowd_level": "High",
                    "admission": "Free",
                    "description": "Picturesque bamboo forest path in western Kyoto.",
                },
            ],
            "Family": [
                {
                    "name": "Kyoto Railway Museum",
                    "rating": 4.5,
                    "visit_duration": "2-3 hours",
                    "best_time": "Afternoon",
                    "crowd_level": "Medium",
                    "admission": "¥1,200",
                    "description": "Interactive railway museum with historical trains.",
                },
                {
                    "name": "Kyoto Aquarium",
                    "rating": 4.3,
                    "visit_duration": "2 hours",
                    "best_time": "Afternoon",
                    "crowd_level": "Medium",
                    "admission": "¥2,050",
                    "description": "Modern aquarium featuring river and sea creatures.",
                },
                {
                    "name": "Toei Kyoto Studio Park",
                    "rating": 4.2,
                    "visit_duration": "3-4 hours",
                    "best_time": "Morning",
                    "crowd_level": "Medium",
                    "admission": "¥2,400",
                    "description": "Theme park with sets from samurai TV dramas and shows.",
                },
            ],
            "Nature": [
                {
                    "name": "Philosopher's Path",
                    "rating": 4.5,
                    "visit_duration": "1-2 hours",
                    "best_time": "Morning",
                    "crowd_level": "Medium",
                    "admission": "Free",
                    "description": "Cherry-tree lined canal path passing several temples.",
                },
                {
                    "name": "Arashiyama Monkey Park",
                    "rating": 4.4,
                    "visit_duration": "1-2 hours",
                    "best_time": "Morning",
                    "crowd_level": "Medium",
                    "admission": "¥550",
                    "description": "Park with panoramic views and Japanese macaques.",
                },
                {
                    "name": "Kyoto Botanical Garden",
                    "rating": 4.3,
                    "visit_duration": "2 hours",
                    "best_time": "Afternoon",
                    "crowd_level": "Low",
                    "admission": "¥200",
                    "description": "Large garden with various plant collections and a conservatory.",
                },
            ],
        },
        "Osaka": {
            "Family": [
                {
                    "name": "Universal Studios Japan",
                    "rating": 4.7,
                    "visit_duration": "Full day",
                    "best_time": "Weekday",
                    "crowd_level": "Very High",
                    "admission": "¥7,900",
                    "description": "Major theme park with Harry Potter, Nintendo World and other attractions.",
                },
                {
                    "name": "Osaka Aquarium Kaiyukan",
                    "rating": 4.6,
                    "visit_duration": "2-3 hours",
                    "best_time": "Morning",
                    "crowd_level": "High",
                    "admission": "¥2,300",
                    "description": "One of the world's largest aquariums featuring whale sharks.",
                },
                {
                    "name": "Kids Plaza Osaka",
                    "rating": 4.4,
                    "visit_duration": "2-3 hours",
                    "best_time": "Afternoon",
                    "crowd_level": "Medium",
                    "admission": "¥1,400",
                    "description": "Interactive children's museum with hands-on exhibits.",
                },
            ],
            "Cultural": [
                {
                    "name": "Osaka Castle",
                    "rating": 4.5,
                    "visit_duration": "2 hours",
                    "best_time": "Morning",
                    "crowd_level": "High",
                    "admission": "¥600",
                    "description": "Historic castle with museum inside and surrounding park.",
                },
                {
                    "name": "Shitennoji Temple",
                    "rating": 4.3,
                    "visit_duration": "1-2 hours",
                    "best_time": "Morning",
                    "crowd_level": "Medium",
                    "admission": "¥300",
                    "description": "Japan's oldest officially administered temple.",
                },
                {
                    "name": "National Museum of Ethnology",
                    "rating": 4.4,
                    "visit_duration": "2-3 hours",
                    "best_time": "Afternoon",
                    "crowd_level": "Low",
                    "admission": "¥580",
                    "description": "Museum showcasing cultures from around the world.",
                },
            ],
            "Food": [
                {
                    "name": "Dotonbori",
                    "rating": 4.7,
                    "visit_duration": "2-3 hours",
                    "best_time": "Evening",
                    "crowd_level": "Very High",
                    "admission": "Free",
                    "description": "Famous food district with iconic Glico Man sign and street food.",
                },
                {
                    "name": "Kuromon Ichiba Market",
                    "rating": 4.5,
                    "visit_duration": "1-2 hours",
                    "best_time": "Morning",
                    "crowd_level": "High",
                    "admission": "Free",
                    "description": "Food market known as 'Osaka's Kitchen' with fresh seafood and snacks.",
                },
                {
                    "name": "Shinsekai",
                    "rating": 4.4,
                    "visit_duration": "2 hours",
                    "best_time": "Evening",
                    "crowd_level": "Medium",
                    "admission": "Free",
                    "description": "Retro district famous for kushikatsu (deep-fried skewers) and nostalgic atmosphere.",
                },
            ],
        },
        "San Francisco": {
            "Romantic": [
                {
                    "name": "Golden Gate Bridge at Sunset",
                    "rating": 4.9,
                    "visit_duration": "1-2 hours",
                    "best_time": "Evening",
                    "crowd_level": "Medium",
                    "admission": "Free",
                    "description": "Take a romantic walk across the iconic bridge at sunset for breathtaking views of the bay.",
                },
                {
                    "name": "Dinner Cruise in the Bay",
                    "rating": 4.7,
                    "visit_duration": "3 hours",
                    "best_time": "Evening",
                    "crowd_level": "Low",
                    "admission": "$125 per person",
                    "description": "Enjoy a gourmet dinner with champagne while cruising past the city lights and under the Golden Gate Bridge.",
                },
                {
                    "name": "Twin Peaks View",
                    "rating": 4.8,
                    "visit_duration": "1 hour",
                    "best_time": "Evening",
                    "crowd_level": "Medium",
                    "admission": "Free",
                    "description": "Drive up for a panoramic vista of the entire city - especially beautiful at dusk.",
                },
            ],
            "Sightseeing": [
                {
                    "name": "Alcatraz Island",
                    "rating": 4.8,
                    "visit_duration": "3-4 hours",
                    "best_time": "Morning",
                    "crowd_level": "High",
                    "admission": "$45",
                    "description": "Historic former federal prison with fascinating audio tour and stunning bay views.",
                },
                {
                    "name": "Cable Car Ride",
                    "rating": 4.6,
                    "visit_duration": "1 hour",
                    "best_time": "Midday",
                    "crowd_level": "High",
                    "admission": "$8 per ride",
                    "description": "Iconic San Francisco experience, riding the historic cable cars up and down the city's hills.",
                },
                {
                    "name": "Fisherman's Wharf",
                    "rating": 4.5,
                    "visit_duration": "2-3 hours",
                    "best_time": "Afternoon",
                    "crowd_level": "Very High",
                    "admission": "Free",
                    "description": "Popular waterfront area with shops, restaurants, and sea lion viewing.",
                },
            ],
            "Dining": [
                {
                    "name": "Gary Danko",
                    "rating": 4.9,
                    "visit_duration": "2-3 hours",
                    "best_time": "Evening",
                    "crowd_level": "Medium",
                    "price_range": "$$$",
                    "description": "Upscale fine dining restaurant perfect for a special anniversary dinner. Reservations essential.",
                },
                {
                    "name": "Foreign Cinema",
                    "rating": 4.7,
                    "visit_duration": "2 hours",
                    "best_time": "Evening",
                    "crowd_level": "Medium",
                    "price_range": "$$",
                    "description": "Unique restaurant with outdoor courtyard where they project classic films. Romantic atmosphere.",
                },
                {
                    "name": "The Cliff House",
                    "rating": 4.6,
                    "visit_duration": "1-2 hours",
                    "best_time": "Sunset",
                    "crowd_level": "Medium",
                    "price_range": "$$",
                    "description": "Historic restaurant perched on the cliffs overlooking the Pacific Ocean. Spectacular sunset views.",
                },
            ],
            "Special Experiences": [
                {
                    "name": "Hot Air Balloon Over Napa Valley",
                    "rating": 4.9,
                    "visit_duration": "Half day",
                    "best_time": "Morning",
                    "crowd_level": "Low",
                    "admission": "$350 per person",
                    "description": "Romantic sunrise hot air balloon ride over the vineyards, followed by champagne breakfast. Great day trip from San Francisco.",
                },
                {
                    "name": "Wine Tasting Tour in Sonoma",
                    "rating": 4.8,
                    "visit_duration": "Full day",
                    "best_time": "Daytime",
                    "crowd_level": "Medium",
                    "admission": "$150 per person",
                    "description": "Guided tour of premium wineries with tastings and gourmet lunch included.",
                },
                {
                    "name": "Couples' Spa Day at Cavallo Point",
                    "rating": 4.8,
                    "visit_duration": "3-4 hours",
                    "best_time": "Afternoon",
                    "crowd_level": "Low",
                    "admission": "$400 for couple",
                    "description": "Luxury spa experience with couples' massage, soaking tubs, and relaxation lounge overlooking the Golden Gate Bridge.",
                },
            ],
        },
    }

    if location in attractions_data:
        if category and category in attractions_data[location]:
            return {
                "attractions": attractions_data[location][category],
                "location": location,
                "category": category,
            }
        elif not category:
            # Return all categories
            all_attractions = []
            for cat in attractions_data[location]:
                all_attractions.extend(attractions_data[location][cat])
            return {"attractions": all_attractions, "location": location}
        else:
            return {"error": f"Category '{category}' not found for {location}"}
    else:
        return {"error": f"No attractions data available for {location}"}
