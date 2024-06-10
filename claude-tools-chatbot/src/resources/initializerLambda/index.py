import os
import json
import boto3
import psycopg2
from data import customers, orders


def get_secret(secret_name):
    """
    Retrieve a secret from AWS Secrets Manager.

    Args:
        secret_name (str): The name of the secret to retrieve.

    Returns:
        dict: The secret value parsed as JSON.

    Raises:
        ValueError: If the secret type is unsupported.
    """
    session = boto3.Session()
    secrets_manager = session.client("secretsmanager")
    try:
        get_secret_value_response = secrets_manager.get_secret_value(
            SecretId=secret_name
        )
    except Exception as e:
        raise e
    else:
        if "SecretString" in get_secret_value_response:
            secret = get_secret_value_response["SecretString"]
            return json.loads(secret)
        else:
            raise ValueError("Unsupported secret type")


DB_SECRETS = get_secret(os.environ.get("RDS_SECRET_NAME"))


def create_tables():
    """Create the necessary database tables."""
    try:
        with psycopg2.connect(
            database=DB_SECRETS.get("engine"),
            user=DB_SECRETS.get("username"),
            password=DB_SECRETS.get("password"),
            host=DB_SECRETS.get("host"),
            port="5432",
        ) as connection:
            with connection.cursor() as cursor:
                create_customers_table = """
                    CREATE TABLE IF NOT EXISTS customers (
                        id VARCHAR(255) PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        email VARCHAR(255) NOT NULL,
                        phone VARCHAR(255) NOT NULL,
                        username VARCHAR(255) NOT NULL
                    )
                """

                create_orders_table = """
                    CREATE TABLE IF NOT EXISTS orders (
                        id VARCHAR(255) PRIMARY KEY,
                        customer_id VARCHAR(255) NOT NULL,
                        product VARCHAR(255) NOT NULL,
                        quantity INTEGER NOT NULL,
                        price DECIMAL(10, 2) NOT NULL,
                        status VARCHAR(255) NOT NULL,
                        FOREIGN KEY (customer_id) REFERENCES customers (id)
                    )
                """

                cursor.execute(create_customers_table)
                cursor.execute(create_orders_table)
                connection.commit()
                print("Tables created successfully")
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Error creating tables: {error}")


def insert_customers_data(customers):
    """Insert customer data into the database."""
    try:
        with psycopg2.connect(
            database=DB_SECRETS.get("engine"),
            user=DB_SECRETS.get("username"),
            password=DB_SECRETS.get("password"),
            host=DB_SECRETS.get("host"),
            port="5432",
        ) as connection:
            with connection.cursor() as cursor:
                insert_customer = """
                    INSERT INTO customers (id, name, email, phone, username)
                    VALUES (%s, %s, %s, %s, %s)
                """
                for customer in customers:
                    cursor.execute(
                        insert_customer,
                        (
                            customer["id"],
                            customer["name"],
                            customer["email"],
                            customer["phone"],
                            customer["username"],
                        ),
                    )
                connection.commit()
                print("Customers data inserted successfully")
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Error inserting customers data: {error}")


def insert_orders_data(orders):
    """Insert order data into the database."""
    try:
        with psycopg2.connect(
            database=DB_SECRETS.get("engine"),
            user=DB_SECRETS.get("username"),
            password=DB_SECRETS.get("password"),
            host=DB_SECRETS.get("host"),
            port="5432",
        ) as connection:
            with connection.cursor() as cursor:
                insert_order = """
                    INSERT INTO orders (id, customer_id, product, quantity, price, status)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """
                for order in orders:
                    cursor.execute(
                        insert_order,
                        (
                            order["id"],
                            order["customer_id"],
                            order["product"],
                            order["quantity"],
                            order["price"],
                            order["status"],
                        ),
                    )
                connection.commit()
                print("Orders data inserted successfully")
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Error inserting orders data: {error}")


def load_data():
    """Load sample data into the database."""
    insert_customers_data(customers)
    insert_orders_data(orders)


def on_create(event):
    """
    Handle the 'Create' event of the Lambda function.

    Args:
        event (dict): The event payload.

    Returns:
        dict: The physical resource ID of the created resource.
    """
    try:
        create_tables()
        load_data()
        physical_id = "CreateTablesAndLoadData"
        return {"PhysicalResourceId": physical_id}
    except Exception as e:
        print(f"Error in on_create: {e}")
        raise e


def on_update(event):
    """
    Handle the 'Update' event of the Lambda function.

    Args:
        event (dict): The event payload.
    """
    try:
        print("NoOp on Update")
    except Exception as e:
        print(f"Error in on_update: {e}")
        raise e


def on_delete(event):
    """
    Handle the 'Delete' event of the Lambda function.

    Args:
        event (dict): The event payload.
    """
    try:
        print("NoOp on Delete")
    except Exception as e:
        print(f"Error in on_delete: {e}")
        raise e


def handler(event, context):
    """
    The main Lambda function handler.

    Args:
        event (dict): The event payload.
        context (LambdaContext): The Lambda context object.

    Returns:
        dict: The response from the corresponding event handler.

    Raises:
        Exception: If an invalid request type is provided.
    """
    print(event)
    request_type = event["RequestType"]
    if request_type == "Create":
        return on_create(event)
    if request_type == "Update":
        return on_update(event)
    if request_type == "Delete":
        return on_delete(event)
    raise Exception(f"Invalid request type: {request_type}")
