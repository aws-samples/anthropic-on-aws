"""Utility functions for interacting with AWS Secrets Manager and RDS."""

import os
import json
import datetime
import decimal
import boto3
import psycopg2


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
    if "SecretString" in get_secret_value_response:
        secret = get_secret_value_response["SecretString"]
        return json.loads(secret)
    raise ValueError("Unsupported secret type")


DB_SECRETS = get_secret(os.environ.get("RDS_SECRET_NAME"))


def get_db_connection():
    """
    Establish a connection to the database.

    Returns:
        psycopg2.connection: The database connection object.

    Raises:
        Exception: If an error occurs while connecting to the database.
    """
    try:
        connection = psycopg2.connect(
            database=DB_SECRETS.get("engine"),
            user=DB_SECRETS.get("username"),
            password=DB_SECRETS.get("password"),
            host=DB_SECRETS.get("host"),
            port="5432",
        )
        return connection
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Error connecting to the database: {error}")
        raise error


def convert_to_supported_types(obj):
    """
    Convert decimal.Decimal and datetime.datetime objects to JSON-serializable types.

    Args:
        obj: The object to be converted.

    Returns:
        The converted object.
    """
    if isinstance(obj, decimal.Decimal):
        return float(obj)
    if isinstance(obj, datetime.datetime):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {key: convert_to_supported_types(value) for key, value in obj.items()}
    if isinstance(obj, list):
        return [convert_to_supported_types(item) for item in obj]
    return obj


class CustomJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle decimal.Decimal and datetime.datetime objects."""

    def default(self, obj):
        """
        Override the default method to handle decimal.Decimal and datetime.datetime objects.

        Args:
            obj: The object to be encoded.

        Returns:
            The encoded object.
        """
        if isinstance(obj, decimal.Decimal):
            return float(obj)
        if isinstance(obj, datetime.datetime):
            return obj.isoformat()
        return super().default(obj)
