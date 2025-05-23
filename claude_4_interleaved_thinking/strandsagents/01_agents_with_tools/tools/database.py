#strandsagents/01_agents_with_tools/tools/database.py
# Standard library imports
import json
from typing import Dict, List, Any, Union

# Third-party imports
from strands import tool

# Local application imports
# None required


@tool
def database_query(query_type: str) -> str:
    """Query product database to get product information, inventory, sales, or category data.
    
    Queries a mock product database and returns results based on the specified query type.
    The function returns different product data structures depending on the requested
    information type.
    
    Args:
        query_type: Type of query to execute. Valid options include:
            - 'products': Returns full product details including price, cost, and stock
            - 'inventory': Returns current stock levels for all products
            - 'sales': Returns monthly sales data and revenue by product
            - 'categories': Returns product categorization information
            - 'costs' or 'margin': Returns cost and margin data for all products
            - Simple keywords: Searches for relevant products (e.g., 'widget')
    
    Returns:
        Query results as a JSON-formatted string. Structure varies by query type
        but generally contains a "results" array with product objects.
    
    Examples:
        >>> database_query("products")
        '{"results": [{"product_id": 1, "name": "Premium Widget"...}]}'
        >>> database_query("costs")
        '{"results": [{"product_id": 1, "name": "Premium Widget", "cost": 22.50...}]}'
    """
    print(f"Querying database: {query_type}")

    # Return mock data based on query type
    if "product" in query_type.lower():
        results = {
            "results": [
                {
                    "product_id": 1,
                    "name": "Premium Widget",
                    "price": 50.00,
                    "cost": 22.50,
                    "stock": 250,
                    "category": "Hardware",
                },
                {
                    "product_id": 2,
                    "name": "Deluxe Gadget",
                    "price": 75.00,
                    "cost": 31.25,
                    "stock": 175,
                    "category": "Electronics",
                },
            ]
        }
    elif "revenue" in query_type.lower() or "sale" in query_type.lower():
        results = {
            "results": [
                {
                    "product_id": 1,
                    "name": "Premium Widget",
                    "monthly_sales": 120,
                    "monthly_revenue": 6000,
                },
                {
                    "product_id": 2,
                    "name": "Deluxe Gadget",
                    "monthly_sales": 85,
                    "monthly_revenue": 6375,
                },
            ]
        }
    elif "cost" in query_type.lower() or "margin" in query_type.lower():
        results = {
            "results": [
                {
                    "product_id": 1,
                    "name": "Premium Widget",
                    "cost": 22.50,
                    "price": 50.00,
                    "margin_percent": 55,
                },
                {
                    "product_id": 2,
                    "name": "Deluxe Gadget",
                    "cost": 31.25,
                    "price": 75.00,
                    "margin_percent": 58.3,
                },
            ]
        }
    else:
        results = {"results": []}

    # Return formatted JSON
    return json.dumps(results, indent=2)
