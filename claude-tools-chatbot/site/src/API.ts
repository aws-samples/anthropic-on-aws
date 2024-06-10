/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type MessageInput = {
  content: Array<MessageContentInput>;
  role: string;
};

export type MessageContentInput = {
  text?: string | null;
  imageBytes?: ImageBytesInput | null;
  toolResult?: ToolResultInput | null;
  toolUse?: ToolUseInput | null;
};

export type ImageBytesInput = {
  bytes: string;
};

export type ToolResultInput = {
  textContent?: Array<TextBlockInput> | null;
  imageContent?: Array<ImageBytesInput> | null;
  jsonContent?: Array<JSONBlockInput> | null;
  toolUseId: string;
  status?: string | null;
};

export type TextBlockInput = {
  text: string;
};

export type JSONBlockInput = {
  json: string;
};

export type ToolUseInput = {
  input: string;
  name: string;
  toolUseId: string;
};

export type Conversation = {
  __typename: 'Conversation';
  conversationId: string;
  messages: Array<Message>;
  timestamp: number;
  ownerId: string;
};

export type Message = {
  __typename: 'Message';
  content: Array<MessageContent>;
  role: string;
};

export type MessageContent = {
  __typename: 'MessageContent';
  text?: string | null;
  imageBytes?: ImageBytes | null;
  toolResult?: ToolResult | null;
  toolUse?: ToolUse | null;
};

export type ImageBytes = {
  __typename: 'ImageBytes';
  bytes: string;
};

export type ToolResult = {
  __typename: 'ToolResult';
  content: Array<ToolResultContent>;
  toolUseId: string;
  status?: string | null;
};

export type ToolResultContent = {
  __typename: 'ToolResultContent';
  text?: string | null;
  imageBytes?: ImageBytes | null;
  json?: string | null;
};

export type TextBlock = {
  __typename: 'TextBlock';
  text: string;
};

export type JSONBlock = {
  __typename: 'JSONBlock';
  json: string;
};

export type ToolUse = {
  __typename: 'ToolUse';
  input: string;
  name: string;
  toolUseId: string;
};

export type ProcessMessageMutationVariables = {
  conversationId: string;
  message: MessageInput;
  ownerId: string;
};

export type ProcessMessageMutation = {
  processMessage?: {
    __typename: 'Conversation';
    conversationId: string;
    messages: Array<{
      __typename: 'Message';
      role: string;
      content: MessageContent;
    }>;
    timestamp: number;
    ownerId: string;
  } | null;
};

export type UpdateConversationMutationVariables = {
  conversationId: string;
  ownerId: string;
  message: MessageInput;
  timestamp?: number | null;
};

export type UpdateConversationMutation = {
  updateConversation?: {
    __typename: 'Conversation';
    conversationId: string;
    messages: Array<{
      __typename: 'Message';
      role: string;
    }>;
    timestamp: number;
    ownerId: string;
  } | null;
};

export type GetConversationQueryVariables = {
  conversationId: string;
};

export type GetConversationQuery = {
  getConversation?: {
    __typename: 'Conversation';
    conversationId: string;
    messages: Array<{
      __typename: 'Message';
      role: string;
    }>;
    timestamp: number;
    ownerId: string;
  } | null;
};

export type ConversationUpdatedSubscriptionVariables = {
  conversationId: string;
  ownerId: string;
};

export type ConversationUpdatedSubscription = {
  conversationUpdated?: {
    __typename: 'Conversation';
    conversationId: string;
    messages: Array<{
      __typename: 'Message';
      role: string;
      content: Array<MessageContent>;
    }>;
    timestamp: number;
    ownerId: string;
  } | null;
};
