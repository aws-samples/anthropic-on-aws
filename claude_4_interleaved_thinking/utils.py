# Tool implementation functions that return dummy data

import json

# Function to handle tool calls
def execute_tool(tool_name, tool_params):
    """Execute the appropriate tool based on the name and parameters"""
    if tool_name == "search_flights":
        return search_flights(
            tool_params.get("origin"), 
            tool_params.get("destination"), 
            tool_params.get("date")
        )
    elif tool_name == "search_accommodations":
        return search_accommodations(
            tool_params.get("location"), 
            tool_params.get("check_in"), 
            tool_params.get("check_out")
        )
    elif tool_name == "get_weather_forecast":
        return get_weather_forecast(
            tool_params.get("location"), 
            tool_params.get("date")
        )
    elif tool_name == "search_attractions":
        return search_attractions(
            tool_params.get("location"), 
            tool_params.get("category")
        )
    elif tool_name == "create_itinerary":
        return create_itinerary(tool_params.get("days", []))
    elif tool_name == "calculator":
        return execute_calculator(tool_params)
    elif tool_name == "database_query":
        return execute_database_query(tool_params)
    else:
        return {"error": f"Unknown tool: {tool_name}"}



def search_flights(origin, destination, date):
    """Return dummy flight search results"""
    flight_options = [
        {
            "flight_id": "JL001",
            "airline": "Japan Airlines",
            "origin": origin,
            "destination": destination,
            "departure": f"{date} 10:30",
            "arrival": f"{date} 14:45",
            "duration": "13h 15m",
            "stops": 1,
            "price": 1250.00,
            "available_seats": 4,
            "layover_airport": "SFO",
            "layover_duration": "2h 30m"
        },
        {
            "flight_id": "NH203",
            "airline": "ANA",
            "origin": origin,
            "destination": destination,
            "departure": f"{date} 00:30",
            "arrival": f"{date} 05:15",
            "duration": "13h 45m",
            "stops": 0,
            "price": 1450.00,
            "available_seats": 2,
            "layover_airport": None,
            "layover_duration": None
        },
        {
            "flight_id": "DL167",
            "airline": "Delta",
            "origin": origin,
            "destination": destination,
            "departure": f"{date} 13:15",
            "arrival": f"{date} 17:30",
            "duration": "14h 15m",
            "stops": 1,
            "price": 1150.00,
            "available_seats": 6,
            "layover_airport": "ICN",
            "layover_duration": "1h 45m"
        }
    ]
    return {"flights": flight_options}

def search_accommodations(location, check_in, check_out):
    """Return dummy accommodation search results"""
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
                "cancellation_policy": "Free cancellation until 3 days before check-in"
            },
            {
                "name": "Residential Airbnb",
                "type": "Apartment",
                "location": "Shibuya, Tokyo",
                "price_per_night": 210.00,
                "rating": 4.6,
                "amenities": ["Kitchen", "Free WiFi", "Washing Machine", "Family-friendly"],
                "distance_to_center": "0.8 km",
                "available_rooms": 1,
                "room_type": "2-Bedroom Apartment",
                "cancellation_policy": "Free cancellation until 1 week before check-in"
            },
            {
                "name": "Asakusa Traditional Inn",
                "type": "Ryokan",
                "location": "Asakusa, Tokyo",
                "price_per_night": 280.00,
                "rating": 4.7,
                "amenities": ["Traditional Breakfast", "Public Bath", "Free WiFi", "Cultural Experience"],
                "distance_to_center": "3.2 km",
                "available_rooms": 1,
                "room_type": "Family Room with Tatami",
                "cancellation_policy": "Non-refundable"
            }
        ],
        "Kyoto": [
            {
                "name": "Traditional Kyoto Machiya",
                "type": "Traditional House",
                "location": "Gion District, Kyoto",
                "price_per_night": 320.00,
                "rating": 4.9,
                "amenities": ["Traditional Architecture", "Garden", "Free WiFi", "Cultural Experience"],
                "distance_to_center": "1.2 km",
                "available_rooms": 1,
                "room_type": "Entire House",
                "cancellation_policy": "Free cancellation until 1 week before check-in"
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
                "cancellation_policy": "Free cancellation until 2 days before check-in"
            }
        ],
        "Osaka": [
            {
                "name": "Osaka Family Hotel",
                "type": "Hotel",
                "location": "Namba, Osaka",
                "price_per_night": 220.00,
                "rating": 4.4,
                "amenities": ["Free WiFi", "Restaurant", "Family Rooms", "Convenience Store"],
                "distance_to_center": "1.0 km",
                "available_rooms": 3,
                "room_type": "Quadruple Room",
                "cancellation_policy": "Free cancellation until 3 days before check-in"
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
                "cancellation_policy": "Free cancellation until 1 week before check-in"
            }
        ],
        "San Francisco": [
            {
                "name": "The Fairmont San Francisco",
                "type": "Luxury Hotel",
                "location": "Nob Hill, San Francisco",
                "price_per_night": 399.00,
                "rating": 4.8,
                "amenities": ["Spa", "Fine Dining", "Free WiFi", "Concierge", "Room Service"],
                "distance_to_center": "0.8 km",
                "available_rooms": 1,
                "room_type": "King Suite with City View",
                "cancellation_policy": "Free cancellation until 3 days before check-in",
                "description": "Historic luxury hotel with stunning views of the city and bay. Perfect for anniversary celebrations."
            },
            {
                "name": "Hotel Zetta",
                "type": "Boutique Hotel",
                "location": "SoMa, San Francisco",
                "price_per_night": 299.00,
                "rating": 4.7,
                "amenities": ["Trendy Bar", "Game Room", "Free WiFi", "Restaurant", "Artsy Atmosphere"],
                "distance_to_center": "0.4 km",
                "available_rooms": 2,
                "room_type": "King Deluxe Room",
                "cancellation_policy": "Free cancellation until 48 hours before check-in",
                "description": "Modern boutique hotel with a playful vibe and central location, perfect for couples who enjoy contemporary design."
            },
            {
                "name": "The Huntington Hotel",
                "type": "Historic Hotel",
                "location": "Nob Hill, San Francisco",
                "price_per_night": 325.00,
                "rating": 4.6,
                "amenities": ["Spa", "Indoor Pool", "Free WiFi", "Fine Dining", "Historic Charm"],
                "distance_to_center": "1.2 km",
                "available_rooms": 1,
                "room_type": "Deluxe King Room",
                "cancellation_policy": "Free cancellation until 7 days before check-in",
                "description": "Elegant historic hotel with sophisticated atmosphere and renowned spa."
            }
        ]
    }
    
    if location in accommodations:
        return {"accommodations": accommodations[location]}
    else:
        return {"accommodations": []}


def get_weather_forecast(location, date):
    """Return dummy weather forecast data"""
    weather_data = {
        "Tokyo": {
            "2025-06-15": {"condition": "Partly Cloudy", "high_temp": 28, "low_temp": 20, "precipitation": 30, "humidity": 65},
            "2025-06-16": {"condition": "Rainy", "high_temp": 25, "low_temp": 19, "precipitation": 80, "humidity": 85},
            "2025-06-17": {"condition": "Rainy", "high_temp": 26, "low_temp": 20, "precipitation": 60, "humidity": 80},
            "2025-06-18": {"condition": "Partly Cloudy", "high_temp": 29, "low_temp": 21, "precipitation": 20, "humidity": 60},
            "2025-06-19": {"condition": "Sunny", "high_temp": 31, "low_temp": 22, "precipitation": 10, "humidity": 55},
        },
        "Kyoto": {
            "2025-06-15": {"condition": "Sunny", "high_temp": 30, "low_temp": 20, "precipitation": 10, "humidity": 55},
            "2025-06-16": {"condition": "Partly Cloudy", "high_temp": 31, "low_temp": 21, "precipitation": 20, "humidity": 60},
            "2025-06-17": {"condition": "Partly Cloudy", "high_temp": 30, "low_temp": 22, "precipitation": 30, "humidity": 65},
            "2025-06-18": {"condition": "Rainy", "high_temp": 28, "low_temp": 21, "precipitation": 70, "humidity": 80},
            "2025-06-19": {"condition": "Rainy", "high_temp": 27, "low_temp": 20, "precipitation": 60, "humidity": 75},
        },
        "Osaka": {
            "2025-06-15": {"condition": "Sunny", "high_temp": 29, "low_temp": 21, "precipitation": 5, "humidity": 50},
            "2025-06-16": {"condition": "Sunny", "high_temp": 30, "low_temp": 22, "precipitation": 10, "humidity": 55},
            "2025-06-17": {"condition": "Partly Cloudy", "high_temp": 31, "low_temp": 23, "precipitation": 20, "humidity": 60},
            "2025-06-18": {"condition": "Partly Cloudy", "high_temp": 30, "low_temp": 22, "precipitation": 30, "humidity": 65},
            "2025-06-19": {"condition": "Rainy", "high_temp": 27, "low_temp": 20, "precipitation": 70, "humidity": 80},
        },
        "San Francisco": {
            "2025-08-12": {"condition": "Partly Cloudy", "high_temp": 21, "low_temp": 14, "precipitation": 10, "humidity": 75},
            "2025-08-13": {"condition": "Foggy Morning, Sunny Afternoon", "high_temp": 22, "low_temp": 15, "precipitation": 5, "humidity": 80},
            "2025-08-14": {"condition": "Sunny", "high_temp": 23, "low_temp": 14, "precipitation": 0, "humidity": 70}
        }

    }
    
    if location in weather_data and date in weather_data[location]:
        return {"forecast": weather_data[location][date], "location": location, "date": date}
    else:
        return {"error": "Forecast not available for the specified location and date"}

def search_attractions(location, category=None):
    """Searches for tourist attractions in the specified location and category.

    Returns dummy attraction data based on the provided location, optionally filtered 
    by category. Currently supports locations: Tokyo, Kyoto, Osaka, and San Francisco,
    with various categories for each location (e.g., Cultural, Family, Shopping, etc.).

    Args:
        location (str): The city to search for attractions (e.g., "Tokyo", "Kyoto").
        category (str, optional): The type of attractions to filter by
            (e.g., "Cultural", "Family", "Shopping"). If None, returns all attractions
            for the specified location. Defaults to None.

    Returns:
        dict: If successful with a category specified, returns a dictionary with:
            - attractions (list): List of attraction dictionaries containing details such as
              name, rating, visit_duration, best_time, crowd_level, admission, and description
            - location (str): The requested location
            - category (str): The requested category

            If successful without a category specified, returns a dictionary with:
            - attractions (list): List of all attractions across all categories
            - location (str): The requested location

            If unsuccessful, returns a dictionary with:
            - error (str): Error message describing why the search failed

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
                {"name": "Senso-ji Temple", "rating": 4.7, "visit_duration": "1-2 hours", "best_time": "Morning", "crowd_level": "High", "admission": "Free", "description": "Tokyo's oldest temple with the famous Thunder Gate and shopping street."},
                {"name": "Meiji Shrine", "rating": 4.6, "visit_duration": "1-2 hours", "best_time": "Morning", "crowd_level": "Medium", "admission": "Free", "description": "Peaceful shrine set in a forest within Tokyo."},
                {"name": "Edo-Tokyo Museum", "rating": 4.5, "visit_duration": "2-3 hours", "best_time": "Afternoon", "crowd_level": "Medium", "admission": "¥600", "description": "Museum showcasing Tokyo's history from the Edo period."}
            ],
            "Family": [
                {"name": "Tokyo Disneyland", "rating": 4.8, "visit_duration": "Full day", "best_time": "Weekday", "crowd_level": "High", "admission": "¥8,200", "description": "World-famous theme park with attractions for all ages."},
                {"name": "Ueno Zoo", "rating": 4.4, "visit_duration": "3-4 hours", "best_time": "Morning", "crowd_level": "Medium", "admission": "¥600", "description": "Japan's oldest zoo featuring pandas and many other animals."},
                {"name": "TeamLab Borderless", "rating": 4.7, "visit_duration": "2-3 hours", "best_time": "Morning", "crowd_level": "High", "admission": "¥3,200", "description": "Interactive digital art museum popular with children and adults."}
            ],
            "Shopping": [
                {"name": "Shibuya Crossing & Center", "rating": 4.5, "visit_duration": "2-3 hours", "best_time": "Evening", "crowd_level": "Very High", "admission": "Free", "description": "Famous crossing and shopping district with fashion boutiques."},
                {"name": "Akihabara Electric Town", "rating": 4.6, "visit_duration": "2-4 hours", "best_time": "Afternoon", "crowd_level": "High", "admission": "Free", "description": "Electronics and anime shopping district."},
                {"name": "Toyosu Fish Market", "rating": 4.3, "visit_duration": "2 hours", "best_time": "Early Morning", "crowd_level": "Medium", "admission": "Free", "description": "The new fish market that replaced Tsukiji, with viewing platforms for the tuna auction."}
            ]
        },
        "Kyoto": {
            "Cultural": [
                {"name": "Fushimi Inari Shrine", "rating": 4.8, "visit_duration": "2-3 hours", "best_time": "Early Morning", "crowd_level": "High", "admission": "Free", "description": "Famous shrine with thousands of vermilion torii gates."},
                {"name": "Kinkaku-ji (Golden Pavilion)", "rating": 4.7, "visit_duration": "1 hour", "best_time": "Morning", "crowd_level": "Very High", "admission": "¥400", "description": "Zen temple covered in gold leaf with beautiful garden."},
                {"name": "Arashiyama Bamboo Grove", "rating": 4.6, "visit_duration": "1 hour", "best_time": "Early Morning", "crowd_level": "High", "admission": "Free", "description": "Picturesque bamboo forest path in western Kyoto."}
            ],
            "Family": [
                {"name": "Kyoto Railway Museum", "rating": 4.5, "visit_duration": "2-3 hours", "best_time": "Afternoon", "crowd_level": "Medium", "admission": "¥1,200", "description": "Interactive railway museum with historical trains."},
                {"name": "Kyoto Aquarium", "rating": 4.3, "visit_duration": "2 hours", "best_time": "Afternoon", "crowd_level": "Medium", "admission": "¥2,050", "description": "Modern aquarium featuring river and sea creatures."},
                {"name": "Toei Kyoto Studio Park", "rating": 4.2, "visit_duration": "3-4 hours", "best_time": "Morning", "crowd_level": "Medium", "admission": "¥2,400", "description": "Theme park with sets from samurai TV dramas and shows."}
            ],
            "Nature": [
                {"name": "Philosopher's Path", "rating": 4.5, "visit_duration": "1-2 hours", "best_time": "Morning", "crowd_level": "Medium", "admission": "Free", "description": "Cherry-tree lined canal path passing several temples."},
                {"name": "Arashiyama Monkey Park", "rating": 4.4, "visit_duration": "1-2 hours", "best_time": "Morning", "crowd_level": "Medium", "admission": "¥550", "description": "Park with panoramic views and Japanese macaques."},
                {"name": "Kyoto Botanical Garden", "rating": 4.3, "visit_duration": "2 hours", "best_time": "Afternoon", "crowd_level": "Low", "admission": "¥200", "description": "Large garden with various plant collections and a conservatory."}
            ]
        },
        "Osaka": {
            "Family": [
                {"name": "Universal Studios Japan", "rating": 4.7, "visit_duration": "Full day", "best_time": "Weekday", "crowd_level": "Very High", "admission": "¥7,900", "description": "Major theme park with Harry Potter, Nintendo World and other attractions."},
                {"name": "Osaka Aquarium Kaiyukan", "rating": 4.6, "visit_duration": "2-3 hours", "best_time": "Morning", "crowd_level": "High", "admission": "¥2,300", "description": "One of the world's largest aquariums featuring whale sharks."},
                {"name": "Kids Plaza Osaka", "rating": 4.4, "visit_duration": "2-3 hours", "best_time": "Afternoon", "crowd_level": "Medium", "admission": "¥1,400", "description": "Interactive children's museum with hands-on exhibits."}
            ],
            "Cultural": [
                {"name": "Osaka Castle", "rating": 4.5, "visit_duration": "2 hours", "best_time": "Morning", "crowd_level": "High", "admission": "¥600", "description": "Historic castle with museum inside and surrounding park."},
                {"name": "Shitennoji Temple", "rating": 4.3, "visit_duration": "1-2 hours", "best_time": "Morning", "crowd_level": "Medium", "admission": "¥300", "description": "Japan's oldest officially administered temple."},
                {"name": "National Museum of Ethnology", "rating": 4.4, "visit_duration": "2-3 hours", "best_time": "Afternoon", "crowd_level": "Low", "admission": "¥580", "description": "Museum showcasing cultures from around the world."}
            ],
            "Food": [
                {"name": "Dotonbori", "rating": 4.7, "visit_duration": "2-3 hours", "best_time": "Evening", "crowd_level": "Very High", "admission": "Free", "description": "Famous food district with iconic Glico Man sign and street food."},
                {"name": "Kuromon Ichiba Market", "rating": 4.5, "visit_duration": "1-2 hours", "best_time": "Morning", "crowd_level": "High", "admission": "Free", "description": "Food market known as 'Osaka's Kitchen' with fresh seafood and snacks."},
                {"name": "Shinsekai", "rating": 4.4, "visit_duration": "2 hours", "best_time": "Evening", "crowd_level": "Medium", "admission": "Free", "description": "Retro district famous for kushikatsu (deep-fried skewers) and nostalgic atmosphere."}
            ]
        },
        "San Francisco": {
            "Romantic": [
                {"name": "Golden Gate Bridge at Sunset", "rating": 4.9, "visit_duration": "1-2 hours", "best_time": "Evening", "crowd_level": "Medium", "admission": "Free", "description": "Take a romantic walk across the iconic bridge at sunset for breathtaking views of the bay."},
                {"name": "Dinner Cruise in the Bay", "rating": 4.7, "visit_duration": "3 hours", "best_time": "Evening", "crowd_level": "Low", "admission": "$125 per person", "description": "Enjoy a gourmet dinner with champagne while cruising past the city lights and under the Golden Gate Bridge."},
                {"name": "Twin Peaks View", "rating": 4.8, "visit_duration": "1 hour", "best_time": "Evening", "crowd_level": "Medium", "admission": "Free", "description": "Drive up for a panoramic vista of the entire city - especially beautiful at dusk."}
            ],
            "Sightseeing": [
                {"name": "Alcatraz Island", "rating": 4.8, "visit_duration": "3-4 hours", "best_time": "Morning", "crowd_level": "High", "admission": "$45", "description": "Historic former federal prison with fascinating audio tour and stunning bay views."},
                {"name": "Cable Car Ride", "rating": 4.6, "visit_duration": "1 hour", "best_time": "Midday", "crowd_level": "High", "admission": "$8 per ride", "description": "Iconic San Francisco experience, riding the historic cable cars up and down the city's hills."},
                {"name": "Fisherman's Wharf", "rating": 4.5, "visit_duration": "2-3 hours", "best_time": "Afternoon", "crowd_level": "Very High", "admission": "Free", "description": "Popular waterfront area with shops, restaurants, and sea lion viewing."}
            ],
            "Dining": [
                {"name": "Gary Danko", "rating": 4.9, "visit_duration": "2-3 hours", "best_time": "Evening", "crowd_level": "Medium", "price_range": "$$$", "description": "Upscale fine dining restaurant perfect for a special anniversary dinner. Reservations essential."},
                {"name": "Foreign Cinema", "rating": 4.7, "visit_duration": "2 hours", "best_time": "Evening", "crowd_level": "Medium", "price_range": "$$", "description": "Unique restaurant with outdoor courtyard where they project classic films. Romantic atmosphere."},
                {"name": "The Cliff House", "rating": 4.6, "visit_duration": "1-2 hours", "best_time": "Sunset", "crowd_level": "Medium", "price_range": "$$", "description": "Historic restaurant perched on the cliffs overlooking the Pacific Ocean. Spectacular sunset views."}
            ],
            "Special Experiences": [
                {"name": "Hot Air Balloon Over Napa Valley", "rating": 4.9, "visit_duration": "Half day", "best_time": "Morning", "crowd_level": "Low", "admission": "$350 per person", "description": "Romantic sunrise hot air balloon ride over the vineyards, followed by champagne breakfast. Great day trip from San Francisco."},
                {"name": "Wine Tasting Tour in Sonoma", "rating": 4.8, "visit_duration": "Full day", "best_time": "Daytime", "crowd_level": "Medium", "admission": "$150 per person", "description": "Guided tour of premium wineries with tastings and gourmet lunch included."},
                {"name": "Couples' Spa Day at Cavallo Point", "rating": 4.8, "visit_duration": "3-4 hours", "best_time": "Afternoon", "crowd_level": "Low", "admission": "$400 for couple", "description": "Luxury spa experience with couples' massage, soaking tubs, and relaxation lounge overlooking the Golden Gate Bridge."}
            ]
        }
    }
    
    if location in attractions_data:
        if category and category in attractions_data[location]:
            return {"attractions": attractions_data[location][category], "location": location, "category": category}
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

def create_itinerary(days):
    """Create a travel itinerary document (dummy function)"""
    # This would normally format the itinerary data into a document
    # For this example, we'll just return confirmation
    return {"status": "success", "message": "Itinerary created successfully", "days": len(days)}


def execute_database_query(input_data):
    """Database query function that returns mock data"""
    query_type = input_data.get("query_type", "")
    print(f"Querying database: {query_type}")
    
    # Return more comprehensive mock data
    if "product" in query_type.lower():
        return json.dumps({
            "results": [
                {"product_id": 1, "name": "Premium Widget", "price": 50.00, "cost": 22.50, "stock": 250, "category": "Hardware"},
                {"product_id": 2, "name": "Deluxe Gadget", "price": 75.00, "cost": 31.25, "stock": 175, "category": "Electronics"}
            ]
        }, indent=2)
    elif "revenue" in query_type.lower() or "sale" in query_type.lower():
        return json.dumps({
            "results": [
                {"product_id": 1, "name": "Premium Widget", "monthly_sales": 120, "monthly_revenue": 6000},
                {"product_id": 2, "name": "Deluxe Gadget", "monthly_sales": 85, "monthly_revenue": 6375}
            ]
        }, indent=2)
    elif "cost" in query_type.lower() or "margin" in query_type.lower():
        return json.dumps({
            "results": [
                {"product_id": 1, "name": "Premium Widget", "cost": 22.50, "price": 50.00, "margin_percent": 55},
                {"product_id": 2, "name": "Deluxe Gadget", "cost": 31.25, "price": 75.00, "margin_percent": 58.3}
            ]
        }, indent=2)
    else:
        return json.dumps({"results": []}, indent=2)


def execute_calculator(input_data):
    """Enhanced calculator function that handles basic arithmetic operations"""
    expression = input_data.get("expression", "")
    print(f"Calculating: {expression}")
    
    # Replace common math terminology with proper Python operators
    expression = expression.replace("×", "*").replace("÷", "/").replace("^", "**")
    
    try:
        # WARNING: eval is used for demo purposes only
        # In a production environment, use a safer evaluation method
        result = eval(expression)
        
        # Format result based on type
        if isinstance(result, float):
            # Round to 2 decimal places for currency calculations
            formatted_result = f"{result:.2f}"
        else:
            formatted_result = str(result)
            
        return formatted_result
    except Exception as e:
        return f"Error calculating expression: {str(e)}"


