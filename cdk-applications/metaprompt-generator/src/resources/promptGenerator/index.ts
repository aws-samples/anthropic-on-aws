import Anthropic from '@anthropic-ai/sdk';
import {
  ApolloClient,
  InMemoryCache,
  gql,
  createHttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { promptTemplate } from './prompt';
import { typeDefs } from './typeDefs';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const APPSYNC_ENDPOINT = process.env.APPSYNC_ENDPOINT;
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL;

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

const httpLink = createHttpLink({
  uri: APPSYNC_ENDPOINT,
});

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      'x-api-key': APPSYNC_API_KEY,
    },
  };
});

const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  typeDefs: typeDefs,
});

const UPDATE_PROMPT_MUTATION_WITH_PROMPT = gql`
  mutation UpdatePrompt($id: ID!, $status: PromptStatus!, $prompt: String) {
    updatePrompt(id: $id, status: $status, prompt: $prompt) {
      id
      owner
      prompt
      status
      task
      variables
    }
  }
`;

const UPDATE_PROMPT_MUTATION = gql`
  mutation UpdatePrompt($id: ID!, $status: PromptStatus!) {
    updatePrompt(id: $id, status: $status) {
      id
      owner
      prompt
      status
      task
      variables
    }
  }
`;

export const lambdaHandler = async (event: any): Promise<void> => {
  console.log(event);
  const { promptId, task, variables = [] } = event;

  try {
    console.log(
      `Updating AppSync with promptID: ${promptId} and status: GENERATING`,
    );
    const generatingResponse = await apolloClient.mutate({
      mutation: UPDATE_PROMPT_MUTATION,
      variables: {
        id: promptId,
        status: 'GENERATING',
      },
    });
    console.log(
      `Generating Response: ${JSON.stringify(generatingResponse, null, 2)}`,
    );

    const updatedPrompt = promptTemplate.replace('{{TASK}}', task);
    console.log(`Updated Prompt: ${updatedPrompt}`);

    let variableString = '';
    variableString = variables
      .map((variable: string) => `{${variable.toUpperCase()}}`)
      .join('\n');

    let assistantPartial = '';
    if (variableString) {
      assistantPartial += '<Inputs>';
      assistantPartial += variableString + '\n</Inputs>\n';
    }
    assistantPartial += '<Instructions Structure>';
    console.log(`AssistantPartial: \n${assistantPartial}`);

    const response = await anthropic.messages.create({
      max_tokens: 4096,
      temperature: 0,
      messages: [
        { role: 'user', content: updatedPrompt },
        { role: 'assistant', content: assistantPartial },
      ],
      model: ANTHROPIC_MODEL!,
    });

    const generatedPrompt = extractPrompt(response.content);
    console.log(`Response: \n${JSON.stringify(generatedPrompt, null, 2)}`);

    console.log(
      `Updating AppSync with promptID: ${promptId} and status: GENERATED`,
    );
    const generatedResponse = await apolloClient.mutate({
      mutation: UPDATE_PROMPT_MUTATION_WITH_PROMPT,
      variables: {
        id: promptId,
        status: 'GENERATED',
        prompt: generatedPrompt,
      },
    });
    console.log(
      `Generated Response: ${JSON.stringify(generatedResponse, null, 2)}`,
    );
  } catch (error) {
    console.error('Error generating prompt:', error);

    // Update the status to "ERROR" if an error occurs during prompt generation
    await apolloClient.mutate({
      mutation: UPDATE_PROMPT_MUTATION,
      variables: {
        id: promptId,
        status: 'ERROR',
      },
    });
  }
};

function extractBetweenTags(
  tag: string,
  text: string,
  strip: boolean = false,
): string[] {
  const regex = new RegExp(`<${tag}>(.+?)</${tag}>`, 'gs');
  const matches = text.match(regex);
  if (matches) {
    return strip
      ? matches.map((match) => match.replace(regex, '$1').trim())
      : matches.map((match) => match.replace(regex, '$1'));
  }
  return [];
}

function removeEmptyTags(text: string): string {
  return text.replace(/<(\w+)><\/\1>$/g, '');
}

function extractPrompt(content: Anthropic.ContentBlock[]): string {
  const textBlock = content.find((block) => block.type === 'text');
  if (textBlock && 'text' in textBlock) {
    const metapromptResponse = textBlock.text;
    const betweenTags = extractBetweenTags(
      'Instructions',
      metapromptResponse,
    )[0];
    if (betweenTags) {
      return removeEmptyTags(removeEmptyTags(betweenTags).trim()).trim();
    }
    throw new Error('No Instructions tags found in the response');
  }
  throw new Error('No text content found in the response');
}
