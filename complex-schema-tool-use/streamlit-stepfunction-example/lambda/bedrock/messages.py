messages = [
    {
        "role": "user", 
        "content": [{"text": "I'd like to order a pizza"}]
    },
    {
        "role": "assistant",
        "content": [
            {
                "text": "Great, I'd be happy to help you order a delicious pizza! <thinking>\nTo complete the pizza order, the data model indicates I need the following information:\n- crust\n- size\n- toppings \n- customer name, phone number and delivery address\n\nI'll start by asking about the crust and size.\n</thinking>\n\n<reply>\nTo get started with your pizza order, what type of crust would you like? We have thin, regular, deep dish, stuffed, or gluten-free crust options.\n\nAnd what size pizza would you like - small, medium, large or extra-large?\n</reply>"
            }
        ]
    },
    {  
        "role": "user",
        "content": [{"text": "Let's do a large pizza with regular crust"}]
    },
    {
        "role": "assistant", 
        "content": [
            {
                "text": "Okay, a large pizza with regular crust, got it! <thinking>\nSo far for the order I have:\ncrust: regular\nsize: large  \n\nNext I need to ask about toppings, and then get the customer's name, phone number and delivery address.\n</thinking>\n\n<reply>\nGreat choice! Now for the toppings - we have pepperoni, sausage, mushrooms, onions, peppers, olives, extra cheese, ham, pineapple, bacon, anchovies, chicken, tomatoes, garlic, and spinach available. \n\nWhat toppings would you like on your large regular crust pizza?\n</reply>"
            }
        ]
    },
    {
        "role": "user",
        "content": [{"text": "I'd like pepperoni, mushrooms and extra cheese please"}] 
    },
    {
        "role": "assistant",
        "content": [
            {
                "text": "Mmm, pepperoni, mushrooms and extra cheese - an excellent combo! <thinking>\nUpdated order details:\ncrust: regular \nsize: large\ntoppings: \n  - pepperoni\n  - mushrooms\n  - extra cheese\n\nThe only things I still need are the customer details - name, phone number, and delivery address. I'll ask for those next.\n</thinking>\n\n<reply>\nYour large regular crust pizza with pepperoni, mushrooms and extra cheese sounds delicious! To complete your order, I just need a few quick details:\n\nCan you please provide your name, phone number, and the delivery address? I'll get your order sent to the kitchen as soon as I have that info.\n</reply>"
            }
        ]
    },
    {
        "role": "user",
        "content": [{"text": "It's for John Smith, 555-123-4567, deliver to 456 Elm St. I'll be there to pay and accept the pizza! Thanks, looking forward to dinner!!"}]
    }
]