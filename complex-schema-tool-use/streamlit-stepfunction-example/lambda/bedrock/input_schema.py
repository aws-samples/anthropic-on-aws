tools = {
    "tools": [
        {
            "toolSpec": {
                "name": "create_pizza_order",
                "description": "Use this tool to create a pizza orders. When creating the order determine the crust, size, toppings, extras and delivery details ",
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "crust": {
                                "type": "string",
                                "description": "The type of crust for the pizza",
                                "enum": [
                                    "thin",
                                    "regular",
                                    "deep dish",
                                    "stuffed",
                                    "gluten-free"
                                ]
                            },
                            "size": {
                                "type": "string",
                                "description": "The size of the pizza",
                                "enum": [
                                    "small",
                                    "medium",
                                    "large",
                                    "extra-large"
                                ]
                            },
                            "toppings": {
                                "type": "array",
                                "description": "A list of toppings for the pizza",
                                "items": {
                                    "type": "string",
                                    "enum": [
                                        "pepperoni",
                                        "sausage",
                                        "mushrooms",
                                        "onions",
                                        "peppers",
                                        "olives",
                                        "extra cheese",
                                        "ham",
                                        "pineapple",
                                        "bacon",
                                        "anchovies",
                                        "chicken",
                                        "tomatoes",
                                        "garlic",
                                        "spinach"
                                    ]
                                }
                            },
                            "extras": {
                                "type": "array",
                                "description": "A list of extra items to include with the pizza",
                                "items": {
                                    "type": "string",
                                    "enum": [
                                        "garlic bread",
                                        "cheese bread",
                                        "salad",
                                        "wings",
                                        "soda"
                                    ]
                                }
                            },
                            "delivery_instructions": {
                                "type": "string",
                                "description": "Any special delivery instructions for the order"
                            },
                            "customer_details": {
                                "type": "object",
                                "description": "Details about the customer placing the order",
                                "properties": {
                                    "name": {
                                        "type": "string",
                                        "description": "The name of the customer"
                                    },
                                    "phone": {
                                        "type": "string",
                                        "description": "The phone number of the customer"
                                    },
                                    "address": {
                                        "type": "string",
                                        "description": "The delivery address for the order"
                                    }
                                },
                                "required": [
                                    "name",
                                    "phone",
                                    "address"
                                ]
                            }
                        },
                        "required": [
                            "crust",
                            "size",
                            "toppings",
                            "customer_details"
                        ]
                    }
                }
            }
        }
 
        ,{
            "toolSpec": {
                "name": "order_status",
                "description": "Use this tool to get the status of the order ",
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "order_id": {
                                "type": "string",
                                "description": "ID of the order",
                            }
                        },
                        "required": [
                            "order_id"
                        ]
                    }
                }
            }
        }
 
    ]
}
