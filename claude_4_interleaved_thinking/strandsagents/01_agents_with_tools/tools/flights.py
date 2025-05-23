#strandsagents/01_agents_with_tools/tools/flights.py
# Standard library imports
from typing import Dict, List, Optional, Union

# Third-party imports
from strands import tool

# Local application imports
# None required


@tool
def search_flights(origin: str, destination: str, date: str) -> Dict[str, List[Dict[str, Union[str, int, float, None]]]]:
    """Searches for available flights between specified origin and destination.

    Returns dummy flight data for demonstration purposes. The function always returns
    the same three flight options (Japan Airlines, ANA, and Delta) with the provided
    origin, destination, and date parameters incorporated into the results.

    Args:
        origin: The departure airport code (e.g., "NRT", "LAX").
        destination: The arrival airport code (e.g., "JFK", "HND").
        date: The departure date in "YYYY-MM-DD" format, used
            directly in departure and arrival times.

    Returns:
        A dictionary with key "flights" containing a list of 3 flight options.
        Each flight option is a dictionary with the following properties:
            - flight_id (str): The flight identifier
            - airline (str): Name of the airline
            - origin (str): Departure airport (same as input)
            - destination (str): Arrival airport (same as input)
            - departure (str): Departure date and time
            - arrival (str): Arrival date and time
            - duration (str): Flight duration
            - stops (int): Number of stops (0 for direct)
            - price (float): Ticket price in USD
            - available_seats (int): Number of available seats
            - layover_airport (str or None): Airport code for layover
            - layover_duration (str or None): Duration of layover

    Examples:
        >>> search_flights("NRT", "JFK", "2023-05-20")
        {"flights": [{"flight_id": "JL001", "airline": "Japan Airlines", ...}, ...]}
    """
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
            "layover_duration": "2h 30m",
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
            "layover_duration": None,
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
            "layover_duration": "1h 45m",
        },
    ]
    return {"flights": flight_options}
