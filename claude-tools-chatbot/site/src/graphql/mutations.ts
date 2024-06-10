/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const processMessage = /* GraphQL */ `mutation ProcessMessage(
  $conversationId: String!
  $message: MessageInput!
  $ownerId: String!
) {
  processMessage(
    conversationId: $conversationId
    message: $message
    ownerId: $ownerId
  ) {
    conversationId
    messages {
      role
      __typename
    }
    timestamp
    ownerId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.ProcessMessageMutationVariables,
  APITypes.ProcessMessageMutation
>;
export const updateConversation = /* GraphQL */ `mutation UpdateConversation(
  $conversationId: String!
  $ownerId: String!
  $message: MessageInput!
  $timestamp: AWSTimestamp
) {
  updateConversation(
    conversationId: $conversationId
    ownerId: $ownerId
    message: $message
    timestamp: $timestamp
  ) {
    conversationId
    messages {
      role
      __typename
    }
    timestamp
    ownerId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateConversationMutationVariables,
  APITypes.UpdateConversationMutation
>;
