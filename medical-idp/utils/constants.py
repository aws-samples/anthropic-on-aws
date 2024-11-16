class ModelIDs:
    anthropic_claude_3_5_sonnet = "arn:aws:bedrock:us-west-2:789068066945:application-inference-profile/wenjf6zdbcql"
    #anthropic_claude_3_5_sonnet = "anthropic.claude-3-5-sonnet-20241022-v2:0"
    # anthropic_claude_3_5_sonnet = "anthropic.claude-3-5-haiku-20241022-v1:0"
    anthropic_claude_3_sonnet = "anthropic.claude-3-sonnet-20240229-v1:0"
    anthropic_claude_3_opus = "anthropic.claude-3-opus-20240229-v1:0"
    anthropic_claude_3_haiku = "anthropic.claude-3-haiku-20240307-v1:0"
    meta_llama_32_model_id = "us.meta.llama3-2-11b-instruct-v1:0"  
    
class Temperature:
    FOCUSED = 0
    BALANCED = 0.3
    CREATIVE = 0.75
    EXPERIMENTAL = 1

class ToolConfig:
    
    SONNET_35 = "SONNET_35"
    META_32 = "META_32"

    SUMMARY_PROMPT = """ 
                Provide a comprehensive summary of all entities extracted and actions performed during the consultation. Do not include any details about any tools used.
                The summary should be formatted in markdown and organized into clear sections. For each section, list the extracted 
                entities and their corresponding values. Highlight all extracted values using backticks (`value`).                
                Add section for visualization summary, where a summary of any diagrams or visualization are captured
                
                Ensure that all extracted information is included and properly formatted. If any required information is missing 
                or could not be extracted, indicate this with `NOT_FOUND`.

                Finally if multiple documents are present, provide a verification action the summarize the available information in a table similar to 
                Determine the information types available from the avilable documents to be comapred
                [If a value is not found, make it NOT_FOUND and do not use it for match comparision]
                [Show the below only when there are multiple types of document present. Do not show if there is only one doc]
                
                ### Verification Actions
                | Information Type | Intake Form | Insurance Form | Doc Notes |  Match Status |
                |------------------|------|-------------------|-----|--------------|
                | `field_name`        | `value` | `value` | `value` | 

                ### Transcription
                [Full transcription of the doctor's notes wihout any XML tags]
                """
    DOCUMENT_PROCESSING_PIPELINE = [
        {
            "toolSpec": {
                "name": "pdf_to_images",
                "description": "Get triggered if the incoming file is a PDF. Converts a PDF file to a series of image files and returns their file paths.",
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "pdf_path": {
                                "type": "string",
                                "description": "Path to the input PDF file."
                            }
                        },
                        "required": ["pdf_path"]
                    }
                }
            }
        },
        {
            "toolSpec": {
                "name": "classify_documents",
                "description": "Classify the 'document types' in the attached document.",
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "document_paths": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "List of paths to the extracted documents.",
                            }
                        },
                        "required": ["document_paths"]
                    }
                }
            }
        },
        {
            "toolSpec": {
                "name": "summarize",
                "description": "Summarize all the actions that were part of this consultation. Provides a summary of each of the entities extracted and saved. If there are other follow-up actions, mention those as well<important>This task is always run as the final tool.</important>",
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "summary": {
                                "type": "string",
                                "description": f"{SUMMARY_PROMPT}"
                            },
                            "enable_guardrail": {
                                "type": "boolean",
                                "description": """This parameter will be 
                                                    `True` if the user asked for the guardrail to be enabled, 
                                                    `False` if they did not ask for it to be enabled."""
                            }
                        }
                    }
                }
            }
        }
    ]

    DOC_NOTES = [
        {
            "toolSpec": {
                "name": "extract_consultation_notes",
                "description": "Extract diagnostics information from a doctor's consultation notes. Along with the extraction include the full transcript in a <transcript> node",
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "document_paths": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Paths to the files that were classified as DOC_NOTES"
                            },
                            "model_to_use": {
                                "type": "string", 
                                "description": f"Model to use for extraction. This is always a hard-code value of {SONNET_35}"
                            }
                        },
                        "required": ["document_paths", "model_to_use"]
                    }
                }
            }
        },
        {
            "toolSpec": {
                "name": "save_consultation_notes",
                "description": "Save diagnostic information from a doctor's consultation notes, including summaries of any visualizations or drawings.",
                "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                    "consultation_notes": {
                        "type": "object",
                        "properties": {
                            "full_transcription": {
                                "type": "string", 
                                "description": f"A full as-is transcription of the doctor's notes. This information is to be included in in transcript section of the summary."
                            },
                        "doctor": {
                            "type": "object",
                                "properties": {
                                "name": {"type": "string"},
                                "credentials": {
                                    "type": "string",
                                    "description": "Medical credentials of the doctor, e.g., MD, DO"
                                },
                                "licenseNumber": {
                                    "type": "string",
                                    "description": "Medical license number of the doctor. This information can be often abbreviated as `Lic. #`"
                                }
                            },
                            "required": ["name", "credentials", "licenseNumber"]
                        },
                        "hospital": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "address": {
                                    "type": "string",
                                    "description": "Full address of the hospital"
                                },
                                "telephone": {"type": "array", "items": {"type": "string"}}
                            },
                            "required": ["name", "address", "telephone"]
                        },
                        "patient": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "age": {"type": "number"},
                                "sex": {"type": "string", "enum": ["M", "F"]}
                            },
                            "required": ["name", "age", "sex"]
                        },
                        "consultation": {
                            "type": "object",
                            "properties": {
                            "date": {"type": "string"},
                            "concern": {
                                "type": "object",
                                "properties": {
                                    "primaryComplaint": {
                                        "type": "string",
                                        "description": "Primary medical complaint of the patient. Only capture the medical condition. no timelines"
                                    },
                                    "duration": {"type": "number"},
                                    "durationUnit": {"type": "string", "enum": ["days", "weeks", "months", "years"]},
                                    "associatedSymptoms": {
                                        "type": "object",
                                        "additionalProperties": {
                                            "type": "boolean"
                                        },
                                        "description": "Key-value pairs of symptoms and their presence (true) or absence (false)"
                                    },
                                    "absentSymptoms": {
                                        "type": "array",
                                        "items": {"type": "string"}
                                    }
                                },
                                "required": ["primaryComplaint", "duration", "durationUnit"]
                            },
                            "physicalExamFindings": {
                                "type": "object",
                                "properties": {
                                "area": {"type": "string"},
                                "observations": {"type": "array", "items": {"type": "string"}}
                                },
                                "required": ["area", "observations"]
                            },
                            "assessment": {"type": "array", "items": {"type": "string"}},
                            "furtherDiagnosticOptions": {
                                "type": "array",
                                "items": {
                                "type": "object",
                                "properties": {
                                    "test": {"type": "string"},
                                    "types": {"type": "array", "items": {"type": "string"}}
                                },
                                "required": ["test"]
                                }
                            },
                            "diagnosticConsiderations": {
                                "type": "object",
                                "properties": {
                                "benefits": {"type": "string"},
                                "risks": {"type": "array", "items": {"type": "string"}},
                                "cost": {"type": "string"},
                                "indications": {"type": "string"}
                                },
                                "required": ["benefits", "risks", "cost", "indications"]
                            },
                            "thyroidDisorderTypes": {"type": "array", "items": {"type": "string"}},
                            "additionalNotes": {"type": "array", "items": {"type": "string"}},
                            "visualizations": {
                                "type": "array",
                                "items": {
                                "type": "object",
                                "properties": {
                                    "type": {"type": "string", "enum": ["drawing", "diagram", "chart", "other"]},
                                    "description": {"type": "string"},
                                    "location": {"type": "string"},
                                    "relevance": {"type": "string"}
                                },
                                "required": ["type", "description"]
                                },
                                "description": "Summaries of any visualizations or drawings in the consultation notes. This could be in the form of a doctor drawing a part of the body and noting issues with it."
                            }
                            },
                            "required": ["date", "concern", "physicalExamFindings", "assessment", "visualizations"]
                        }
                        },
                        "required": ["doctor", "hospital", "patient", "consultation"]
                    }
                    },
                    "required": ["consultation_notes"]
                }
                }
            }
        }
    ]

    NEW_PATIENT_INFO = [
        {
            "toolSpec": {
                "name": "extract_new_patient_info",
                "description": "If there is a new patient intake forme attached, use this to extract new patient information.",
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "document_paths": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Paths to the files that were classified as INTAKE_FORM"
                            },
                            "model_to_use": {
                                "type": "string", 
                                "description": f"Model to use for extraction. This is always a hard-code value of {SONNET_35}"
                            }
                        }
                    }
                }
            }
        },
        {
            "toolSpec": {
                "name": "save_new_patient_info",
                "description": "Save new patient information, including summaries of any visualizations or drawings.",
                "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                    "patient_intake_form": {
                        "type": "object",
                        "properties": {
                        "patient_information": {
                            "type": "object",
                            "properties": {
                            "name": {"type": "string"},
                            "date_of_birth": {"type": "string"},
                            "ssn": {"type": "string"},
                            "sex": {"type": "string", "enum": ["M", "F"]},
                            "language": {"type": "string"},
                            "address": {"type": "string"},
                            "home_phone": {"type": "string"},
                            "day_phone": {"type": "string"},
                            "email": {"type": "string"},
                            "primary_care_provider": {"type": "string"},
                            "city_state_zip": {"type": "string"},
                            "race": {"type": "string"},
                            "marital_status": {"type": "string"}
                            },
                            "required": ["name", "date_of_birth", "ssn", "sex", "address", "home_phone", "primary_care_provider"]
                        },
                        "employment_information": {
                            "type": "object",
                            "properties": {
                            "primary_employer": {"type": "string"},
                            "employer_address": {"type": "string"},
                            "employer_city_state_zip": {"type": "string"},
                            "work_phone": {"type": "string"}
                            },
                            "required": ["primary_employer"]
                        },
                        "primary_insurance": {
                            "type": "object",
                            "properties": {
                            "insurance_company": {"type": "string"},
                            "policy_number": {"type": "string"},
                            "group_number": {"type": "string"},
                            "name_of_insured": {"type": "string"},
                            "insured_address": {"type": "string"},
                            "insured_city_state_zip": {"type": "string"},
                            "insured_phone": {"type": "string"},
                            "relationship_to_patient": {"type": "string"},
                            "copay_amount": {"type": "number"},
                            "deductible": {"type": "number"},
                            "effective_date": {"type": "string"},
                            "expiration_date": {"type": "string"}
                            },
                            "required": ["insurance_company", "policy_number", "name_of_insured", "relationship_to_patient"]
                        },
                        "signature": {
                            "type": "object",
                            "properties": {
                            "signature_present": {"type": "boolean"},
                            "signature_date": {"type": "string"}
                            },
                            "required": ["signature_present", "signature_date"]
                        }
                        },
                        "required": ["patient_information", "employment_information", "primary_insurance", "signature"]
                    }
                    },
                    "required": ["patient_intake_form"]
                }
                }
            }
            }

    ]
    
    INSURANCE_FORM =[
        {
            "toolSpec": {
                "name": "extract_insurance_card",
                "description": "If there is an insureance card attached, use this tool to extract the information",
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "document_paths": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Paths to the files that were classified as INSURANCE_CARD"
                            },
                            "model_to_use": {
                                "type": "string", 
                                "description": f"Model to use for extraction. This is always a hard-code value of {META_32}"
                            }
                        }
                    }
                }
            }
        },
        {
            "toolSpec": {
                "name": "save_insurance_card",
                "description": "If there is an insureance card attached, use this tool to save the information",
                "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                    "insurance_card": {
                        "type": "object",
                        "properties": {
                        "insurance_company": {
                            "type": "string",
                            "description": "Name of the insurance company. This is typically on the top of the card along with a logo."
                        },
                        "member_info": {
                            "type": "object",
                            "properties": {
                            "name": {"type": "string"},
                            "id": {"type": "string"}
                            },
                            "required": ["name", "id"]
                        },
                        "group_no": {"type": "string"},
                        "bin": {"type": "string"},
                        "benefit_plan": {"type": "string"},
                        "effective_date": {"type": "string"},
                        "dependants": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                        "plan_type": {"type": "string", "enum": ["PPO", "HMO", "HMO-POS", "DSNP"], "description": "Type of the insurance plan"},
                        "copays": {
                            "type": "object",
                            "properties": {
                            "office_visit": {"type": "number"},
                            "specialist_visit": {"type": "number"},
                            "emergency": {"type": "number"}
                            },
                            "required": ["office_visit", "specialist_visit", "emergency"]
                        },
                        "deductible": {"type": "number"}
                        },
                        "required": [
                        "insurance_company",
                        "member_info",
                        "group_no",
                        "bin",
                        "benefit_plan",
                        "effective_date",
                        "dependants",
                        "plan_type",
                        "copays",
                        "deductible"
                        ]
                    }
                    },
                    "required": ["insurance_card"]
                }
                }
            }
            }

    ]
   
    @classmethod
    def compose_toolspec(cls, *components):
        composed_toolspec = []
        for component in components:
            component_specs = getattr(cls, component, [])
            if isinstance(component_specs, list):
                for spec in component_specs:
                    composed_toolspec.append(spec)
            else:
                composed_toolspec.append(component_specs)
        return composed_toolspec

# Example usage:

"""
full_toolspec = ToolConfig.compose_toolspec(
    'COT', 
    'URLA_LOAN_INFO_TOOL', 
    'URLA_BORROWER_INFO_TOOL', 
    'DRIVERS_LICENSE_TOOL', 
    'VERIFICATION_TOOL',
    'CURRENT_EMPLOYER_TOOL',
    'ASSETS_TOOL',
    'LIABILITIES_TOOL',
    'DECLARATIONS_TOOL',
    'LOAN_ORIGINATOR_TOOL'
)
"""
