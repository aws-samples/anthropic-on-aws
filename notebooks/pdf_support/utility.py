import json, os, time, uuid, boto3
import matplotlib.pyplot as plt
from botocore.exceptions import ClientError
from PIL import Image as PILImage
from pdf2image import convert_from_path
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth

def create_bedrock_kb_execution_role(bucket_name, region):
    """
    Create an IAM role for Bedrock Knowledge Base to access S3 and OpenSearch
    
    Args:
        bucket_name (str): S3 bucket name
        region (str): AWS region
        
    Returns:
        dict: IAM role creation response
    """
    iam = boto3.client('iam')
    role_name = f"BedrockKBRole-{str(uuid.uuid4())[:8]}"
    
    # Create the trust policy for Bedrock
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "bedrock.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }
    
    # Create the role
    role = iam.create_role(
        RoleName=role_name,
        AssumeRolePolicyDocument=json.dumps(trust_policy),
        Description="Role for Amazon Bedrock Knowledge Base"
    )
    
    # Create policy for S3 access
    s3_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:ListBucket"
                ],
                "Resource": [
                    f"arn:aws:s3:::{bucket_name}",
                    f"arn:aws:s3:::{bucket_name}/*"
                ]
            }
        ]
    }
    
    # Create policy for OpenSearch access
    opensearch_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "aoss:APIAccessAll"
                ],
                "Resource": "*"
            }
        ]
    }
    
    # Create policy for Bedrock model access
    bedrock_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "bedrock:InvokeModel"
                ],
                "Resource": f"arn:aws:bedrock:{region}::foundation-model/amazon.titan-embed-text-v1"
            }
        ]
    }
    
    # Attach the policies
    iam.put_role_policy(
        RoleName=role_name,
        PolicyName="S3Access",
        PolicyDocument=json.dumps(s3_policy)
    )
    
    iam.put_role_policy(
        RoleName=role_name,
        PolicyName="OpenSearchAccess",
        PolicyDocument=json.dumps(opensearch_policy)
    )
    
    iam.put_role_policy(
        RoleName=role_name,
        PolicyName="BedrockModelAccess",
        PolicyDocument=json.dumps(bedrock_policy)
    )
    
    # Wait for the role to be available
    print("Waiting for IAM role to be available...")
    time.sleep(10)
    
    return role

def create_opensearch_vector_store(region):
    """
    Create an OpenSearch Serverless vector store for Knowledge Base
    
    Args:
        region (str): AWS region
        
    Returns:
        str: Collection ID
    """
    # Create an OpenSearch Serverless client
    aoss = boto3.client('opensearchserverless', region_name=region)
    account_id = boto3.client('sts').get_caller_identity()["Account"]
    
    # Generate a unique name for the collection
    collection_name = f"kb-vector-store-{str(uuid.uuid4())[:8]}"
    
    # Create encryption policy
    encryption_policy_name = f"{collection_name}-enc"
    encryption_policy = {
        'Rules': [{'Resource': ['collection/' + collection_name], 'ResourceType': 'collection'}],
        'AWSOwnedKey': True
    }
    
    # Create the encryption policy
    aoss.create_security_policy(
        name=encryption_policy_name,
        policy=json.dumps(encryption_policy),
        type="encryption"
    )
    
    # Create network policy
    network_policy_name = f"{collection_name}-network"
    network_policy = [
        {'Rules': [{'Resource': ['collection/' + collection_name], 'ResourceType': 'collection'}], 
         'AllowFromPublic': True}
    ]
    
    aoss.create_security_policy(
        name=network_policy_name,
        policy=json.dumps(network_policy),
        type="network"
    )
    
    # Create data access policy with correct Principal format
    access_policy_name = f"{collection_name}-access"
    access_policy = [
        {
            'Rules': [
                {
                    'Resource': ['collection/' + collection_name],
                    'Permission': [
                        'aoss:CreateCollectionItems',
                        'aoss:DeleteCollectionItems',
                        'aoss:UpdateCollectionItems',
                        'aoss:DescribeCollectionItems'
                    ],
                    'ResourceType': 'collection'
                },
                {
                    'Resource': ['index/' + collection_name + '/*'],
                    'Permission': [
                        'aoss:CreateIndex',
                        'aoss:DeleteIndex',
                        'aoss:UpdateIndex',
                        'aoss:DescribeIndex',
                        'aoss:ReadDocument',
                        'aoss:WriteDocument'
                    ],
                    'ResourceType': 'index'
                }
            ],
            'Principal': [
                f"arn:aws:iam::{account_id}:root"
            ],
            'Description': 'Data access policy for Knowledge Base'
        }
    ]
    
    aoss.create_access_policy(
        name=access_policy_name,
        policy=json.dumps(access_policy),
        type="data"
    )
    
    # Create the collection
    response = aoss.create_collection(
        name=collection_name,
        type="VECTORSEARCH"
    )
    
    collection_id = response['createCollectionDetail']['id']
    
    # Wait for the collection to be active
    print(f"Creating OpenSearch vector store collection {collection_name}...")
    status = "CREATING"
    while status == "CREATING":
        time.sleep(30)
        response = aoss.batch_get_collection(ids=[collection_id])
        status = response['collectionDetails'][0]['status']
        print(f"Collection status: {status}")
    
    if status != "ACTIVE":
        raise Exception(f"Collection creation failed with status: {status}")

    # Give the collection time to settle, or authentication of the Opensearch client might fail
    time.sleep(20)
    
    # Now create the index in the collection
    try:        
        # Get the collection endpoint
        host = f"{collection_id}.{region}.aoss.amazonaws.com"
        
        # Create AWS authentication for the request
        credentials = boto3.Session().get_credentials()
        awsauth = AWSV4SignerAuth(credentials, region, 'aoss')
        
        # Define the index name and mapping
        index_name = 'bedrock-kb-index'
        
        # Define the mapping for the index with the required fields
        body_json = {
            "settings": {
                "index.knn": "true",
                "number_of_shards": 1,
                "knn.algo_param.ef_search": 512,
                "number_of_replicas": 0,
            },
            "mappings": {
                "properties": {
                    "vector_field": {
                        "type": "knn_vector",
                        "dimension": 1536,
                        "method": {
                            "name": "hnsw",
                            "engine": "faiss",
                            "space_type": "l2"
                        },
                    },
                    "text_field": {
                        "type": "text"
                    },
                    "metadata": {
                        "type": "text"
                    }
                }
            }
        }
        
        # Build the OpenSearch client
        oss_client = OpenSearch(
            hosts=[{'host': host, 'port': 443}],
            http_auth=awsauth,
            use_ssl=True,
            verify_certs=True,
            connection_class=RequestsHttpConnection,
            timeout=300
        )
        
        # Create index
        response = oss_client.indices.create(index=index_name, body=json.dumps(body_json))
        print('\nCreating index:')
        print(response)
        
        # Index creation can take up to a minute
        print("Waiting 60 seconds for index creation to complete...")
        time.sleep(60)
        
        print(f"Successfully created index {index_name}")
    except Exception as e:
        print(f'Error while trying to create the index: {str(e)}')
        raise
    
    return collection_id

def wait_for_kb_status(bedrock_kb_client, kb_id, target_status):
    """
    Wait for a Knowledge Base to reach the target status
    
    Args:
        bedrock_kb_client: Bedrock Knowledge Base client
        kb_id (str): Knowledge Base ID
        target_status (str): Target status to wait for
    """
    print(f"Waiting for Knowledge Base to reach {target_status} status...")
    
    while True:
        response = bedrock_kb_client.get_knowledge_base(knowledgeBaseId=kb_id)
        current_status = response['knowledgeBase']['status']
        
        if current_status == target_status:
            print(f"Knowledge Base is now {target_status}")
            break
        elif current_status in ['CREATING', 'UPDATING']:
            print(f"Current status: {current_status}. Waiting...")
            time.sleep(30)
        else:
            print(f"Knowledge Base is in unexpected state: {current_status}")
            break

def textract(file_name, bucket_name, region):
    """
    Extract text from a PDF file using AWS Textract
    
    Args:
        file_name (str): Name of the PDF file
        bucket_name (str): S3 bucket where the file is stored
        region (str): AWS region
        
    Returns:
        str: Extracted text
    """
    textract_client = boto3.client('textract', region_name=region)
    
    # Start document text detection job
    response = textract_client.start_document_text_detection(
        DocumentLocation={
            'S3Object': {
                'Bucket': bucket_name,
                'Name': file_name
            }
        }
    )
    
    job_id = response['JobId']
    
    # Wait for the job to complete
    print(f"Started Textract job {job_id}, waiting for completion...")
    status = 'IN_PROGRESS'
    while status == 'IN_PROGRESS':
        time.sleep(5)
        response = textract_client.get_document_text_detection(JobId=job_id)
        status = response['JobStatus']
    
    if status != 'SUCCEEDED':
        raise Exception(f"Textract job failed with status: {status}")
    
    # Get all pages of results
    pages = []
    next_token = None
    
    while True:
        if next_token:
            response = textract_client.get_document_text_detection(
                JobId=job_id,
                NextToken=next_token
            )
        else:
            response = textract_client.get_document_text_detection(JobId=job_id)
        
        pages.extend(response['Blocks'])
        
        if 'NextToken' in response:
            next_token = response['NextToken']
        else:
            break
    
    # Extract text from blocks
    text_blocks = [block for block in pages if block['BlockType'] == 'LINE']
    extracted_text = '\n'.join([block['Text'] for block in text_blocks])
    
    return extracted_text

def create_bedrock_execution_role(bucket_name, region):
    """
    Create an IAM role for Bedrock to access S3
    
    Args:
        bucket_name (str): S3 bucket name
        region (str): AWS region
        
    Returns:
        dict: IAM role creation response
    """
    iam = boto3.client('iam')
    role_name = f"BedrockExecutionRole-{str(uuid.uuid4())[:8]}"
    
    # Create the trust policy for Bedrock
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "bedrock.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }
    
    # Create the role
    role = iam.create_role(
        RoleName=role_name,
        AssumeRolePolicyDocument=json.dumps(trust_policy),
        Description="Role for Amazon Bedrock"
    )
    
    # Create policy for S3 access
    s3_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:ListBucket"
                ],
                "Resource": [
                    f"arn:aws:s3:::{bucket_name}",
                    f"arn:aws:s3:::{bucket_name}/*"
                ]
            }
        ]
    }
    
    # Attach the policy
    iam.put_role_policy(
        RoleName=role_name,
        PolicyName="S3Access",
        PolicyDocument=json.dumps(s3_policy)
    )
    
    # Wait for the role to be available
    print("Waiting for IAM role to be available...")
    time.sleep(10)
    
    return role

# Send a Converse request to Claude on Bedrock and return the completion

def get_completion(prompt, model_id, bedrock_runtime, system_prompt=None, temperature=0.0, max_tokens=2000):
    """
    Send a text prompt to Claude and get a completion.
    
    Args:
        prompt (str): The user prompt
        system_prompt (str, optional): System prompt to guide Claude
        temperature (float, optional): Controls randomness (0.0 to 1.0)
        max_tokens (int, optional): Maximum tokens in the response
        
    Returns:
        str: Claude's response
    """
    
    inference_config = {
        "temperature": temperature,
        "maxTokens": max_tokens,
        "topP": 0.9
    }
    
    converse_params = {
        "modelId": model_id,
        "messages": [
            {"role": "user", "content": [{"text": prompt}]}
        ],
        "inferenceConfig": inference_config
    }
    
    if system_prompt:
        converse_params["system"] = [{"text": system_prompt}]
    
    try:
        response = bedrock_runtime.converse(**converse_params)
        text_content = response['output']['message']['content'][0]['text']
        return text_content
    except ClientError as err:
        message = err.response['Error']['Message']
        print(f"A client error occurred: {message}")
        return None

# Upload the sample PDF to S3
def upload_to_s3(file_path, bucket, object_name=None):
    """
    Upload a file to an S3 bucket
    
    Args:
        file_path (str): Path to the file to upload
        bucket (str): Bucket name
        object_name (str, optional): S3 object name. If not specified, file_path is used
        
    Returns:
        bool: True if file was uploaded, else False
    """
    
    if object_name is None:
        object_name = os.path.basename(file_path)
        
    s3_client = boto3.client('s3')
    
    try:
        s3_client.upload_file(file_path, bucket, object_name)
        print(f"Successfully uploaded {file_path} to s3://{bucket}/{object_name}")
        return True
    except ClientError as e:
        print(f"Error uploading file to S3: {e}")
        return False

# Display a page of the PDF
def display_pdf_page(pdf_path, page_num=0):
    """
    Display a specific page of a PDF using pdf2image
    
    Args:
        pdf_path (str): Path to the PDF file
        page_num (int): Page number to display (0-indexed)
    """
    
    # Convert PDF to images
    try:
        # Convert only the specific page we want to display
        # first_page = page_num + 1, last_page = page_num + 1 to get just one page
        images = convert_from_path(pdf_path, first_page=page_num+1, last_page=page_num+1)
        
        if images:
            plt.figure(figsize=(10, 14))
            plt.imshow(images[0])  # Display the first (and only) image in the list
            plt.axis('off')
            plt.title(f"Page {page_num+1}")
            plt.show()
        else:
            print(f"Failed to generate image for page {page_num+1}")
    except IndexError:
        print(f"Page {page_num+1} does not exist in the PDF")
    except Exception as e:
        print(f"Error displaying PDF page: {e}")
