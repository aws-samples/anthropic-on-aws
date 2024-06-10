tool_config = {
    "toolChoice": {"auto": {}},
    "tools": [
        {
            "toolSpec": {
                "name": "get_user",
                "description": "Looks up a user by email, phone, or username.",
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "key": {
                                "type": "string",
                                "enum": ["email", "phone", "username"],
                                "description": "The attribute to search for a user by (email, phone, or username).",
                            },
                            "value": {
                                "type": "string",
                                "description": "The value to match for the specified attribute.",
                            },
                        },
                        "required": ["key", "value"],
                    },
                },
            },
        },
        {
            "toolSpec": {
                "name": "get_order_by_id",
                "description": "Retrieves the details of a specific order based on the order ID. Returns the order ID, product name, quantity, price, and order status.",
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "order_id": {
                                "type": "string",
                                "description": "The unique identifier for the order.",
                            }
                        },
                        "required": ["order_id"],
                    },
                },
            },
        },
        {
            "toolSpec": {
                "name": "get_customer_orders",
                "description": "Retrieves the list of orders belonging to a user based on a user's customer id.",
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "customer_id": {
                                "type": "string",
                                "description": "The customer_id belonging to the user",
                            }
                        },
                        "required": ["customer_id"],
                    },
                },
            },
        },
        {
            "toolSpec": {
                "name": "cancel_order",
                "description": "Cancels an order based on a provided order_id.  Only orders that are 'processing' can be cancelled",
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "order_id": {
                                "type": "string",
                                "description": "The order_id pertaining to a particular order",
                            }
                        },
                        "required": ["order_id"],
                    },
                },
            },
        },
    ],
}
