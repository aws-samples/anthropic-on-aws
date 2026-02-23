def generate_report(data, format="html", template="standard"):
    """Generate report from data"""
    report_content = f"Report using {template} template:\n{data}"
    
    if format == "html":
        return f"<html><body><h1>Report</h1><p>{report_content}</p></body></html>"
    elif format == "pdf":
        return f"PDF: {report_content}"
    else:
        return {"report": report_content, "format": format}

def execute(params):
    """Main execution function called by Claude SDK"""
    return generate_report(
        params.get("data", {}),
        params.get("format", "html"),
        params.get("template", "standard")
    )
