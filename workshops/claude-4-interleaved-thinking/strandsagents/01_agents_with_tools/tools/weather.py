#strandsagents/01_agents_with_tools/tools/weather.py
# Standard library imports
from typing import Dict, Union, Any

# Third-party imports
from strands import tool

# Local application imports
# None required


@tool
def get_weather_forecast(location: str, date: str) -> Dict[str, Any]:
    """Retrieves weather forecast data for a specified location and date.

    Returns dummy weather forecast data for demonstration purposes. Currently supports
    Tokyo, Kyoto, and Osaka for dates between 2025-06-15 and 2025-06-19, and San Francisco
    for dates between 2025-08-12 and 2025-08-14.

    Args:
        location (str): The city name to get a weather forecast for (e.g., "Tokyo").
        date (str): The date for the forecast in "YYYY-MM-DD" format.

    Returns:
        dict: If the forecast is available, returns a dictionary with the following keys:
            - forecast (dict): Weather forecast data containing:
                - condition (str): Weather condition description
                - high_temp (int): Maximum temperature in Celsius
                - low_temp (int): Minimum temperature in Celsius
                - precipitation (int): Precipitation probability as percentage
                - humidity (int): Humidity level as percentage
            - location (str): The requested location
            - date (str): The requested date

            If the forecast is not available, returns a dictionary with:
            - error (str): Error message indicating forecast unavailability

    Examples:
        >>> get_weather_forecast("Tokyo", "2025-06-15")
        {"forecast": {"condition": "Partly Cloudy", "high_temp": 28, "low_temp": 20,
         "precipitation": 30, "humidity": 65}, "location": "Tokyo", "date": "2025-06-15"}

        >>> get_weather_forecast("Unknown", "2025-06-15")
        {"error": "Forecast not available for the specified location and date"}
    """
    weather_data = {
        "Tokyo": {
            "2025-06-15": {
                "condition": "Partly Cloudy",
                "high_temp": 28,
                "low_temp": 20,
                "precipitation": 30,
                "humidity": 65,
            },
            "2025-06-16": {
                "condition": "Rainy",
                "high_temp": 25,
                "low_temp": 19,
                "precipitation": 80,
                "humidity": 85,
            },
            "2025-06-17": {
                "condition": "Rainy",
                "high_temp": 26,
                "low_temp": 20,
                "precipitation": 60,
                "humidity": 80,
            },
            "2025-06-18": {
                "condition": "Partly Cloudy",
                "high_temp": 29,
                "low_temp": 21,
                "precipitation": 20,
                "humidity": 60,
            },
            "2025-06-19": {
                "condition": "Sunny",
                "high_temp": 31,
                "low_temp": 22,
                "precipitation": 10,
                "humidity": 55,
            },
        },
        "Kyoto": {
            "2025-06-15": {
                "condition": "Sunny",
                "high_temp": 30,
                "low_temp": 20,
                "precipitation": 10,
                "humidity": 55,
            },
            "2025-06-16": {
                "condition": "Partly Cloudy",
                "high_temp": 31,
                "low_temp": 21,
                "precipitation": 20,
                "humidity": 60,
            },
            "2025-06-17": {
                "condition": "Partly Cloudy",
                "high_temp": 30,
                "low_temp": 22,
                "precipitation": 30,
                "humidity": 65,
            },
            "2025-06-18": {
                "condition": "Rainy",
                "high_temp": 28,
                "low_temp": 21,
                "precipitation": 70,
                "humidity": 80,
            },
            "2025-06-19": {
                "condition": "Rainy",
                "high_temp": 27,
                "low_temp": 20,
                "precipitation": 60,
                "humidity": 75,
            },
        },
        "Osaka": {
            "2025-06-15": {
                "condition": "Sunny",
                "high_temp": 29,
                "low_temp": 21,
                "precipitation": 5,
                "humidity": 50,
            },
            "2025-06-16": {
                "condition": "Sunny",
                "high_temp": 30,
                "low_temp": 22,
                "precipitation": 10,
                "humidity": 55,
            },
            "2025-06-17": {
                "condition": "Partly Cloudy",
                "high_temp": 31,
                "low_temp": 23,
                "precipitation": 20,
                "humidity": 60,
            },
            "2025-06-18": {
                "condition": "Partly Cloudy",
                "high_temp": 30,
                "low_temp": 22,
                "precipitation": 30,
                "humidity": 65,
            },
            "2025-06-19": {
                "condition": "Rainy",
                "high_temp": 27,
                "low_temp": 20,
                "precipitation": 70,
                "humidity": 80,
            },
        },
        "San Francisco": {
            "2025-08-12": {
                "condition": "Partly Cloudy",
                "high_temp": 21,
                "low_temp": 14,
                "precipitation": 10,
                "humidity": 75,
            },
            "2025-08-13": {
                "condition": "Foggy Morning, Sunny Afternoon",
                "high_temp": 22,
                "low_temp": 15,
                "precipitation": 5,
                "humidity": 80,
            },
            "2025-08-14": {
                "condition": "Sunny",
                "high_temp": 23,
                "low_temp": 14,
                "precipitation": 0,
                "humidity": 70,
            },
        },
    }

    if location in weather_data and date in weather_data[location]:
        return {
            "forecast": weather_data[location][date],
            "location": location,
            "date": date,
        }
    else:
        return {"error": "Forecast not available for the specified location and date"}
