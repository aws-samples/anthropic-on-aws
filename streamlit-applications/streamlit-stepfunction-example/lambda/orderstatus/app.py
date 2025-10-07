import random
def lambda_handler(event, context):

    """Lambda handler - send canned response"""
    order_id = event["order_details"]["order_id"]
    status = ["in_progress","not_found","en_route","delivered"]
    return {
        "order_id": order_id,
        "status": random.choice(status)
    }
