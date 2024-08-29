export interface Citation {
  generatedResponsePart?: {
    textResponsePart?: {
      text?: string;
      span?: {
        start: number;
        end: number;
      };
    };
  };
  retrievedReferences: RetrievedReference[];
  metadata: {
    'x-amz-bedrock-kb-source-uri': string;
    [key: string]: string;
  };
  content: string;
}

export interface RetrievedReference {
  content: {
    text: string;
  };
  location?: {
    s3Location?: {
      uri: string;
    };
  };
  metadata: Record<string, string>;
}