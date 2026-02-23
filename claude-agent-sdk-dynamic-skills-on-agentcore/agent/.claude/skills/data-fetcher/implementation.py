def fetch_data(source, query):
    """Fetch data from specified source"""
    if source == "api":
        return {"data": f"API data for {query}", "status": "success"}
    elif source == "database":
        return {"data": f"DB data for {query}", "status": "success"}
    else:
        return {"data": f"File data for {query}", "status": "success"}

def execute(params):
    """Main execution function called by Claude SDK"""
    return fetch_data(params.get("source", "api"), params.get("query", "default"))
