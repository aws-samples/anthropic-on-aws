---
description: "Report Generator Skill"
tags: ["s3-loaded", "dynamic"]
---

# Report Generator Skill

## Description
Generates reports from processed data.

## Parameters
- `data`: Input data to process
- `format`: Output format (pdf, html, json)
- `template`: Report template to use

## Dependencies
None

## Usage
```python
report = generate_report(data=input_data, format="html", template="standard")
```

## Output
Returns formatted report in specified format.
