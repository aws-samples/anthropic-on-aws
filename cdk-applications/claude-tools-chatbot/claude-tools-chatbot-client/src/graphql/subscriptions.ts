/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from '../API';

type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const conversationUpdated =
  /* GraphQL */ `subscription ConversationUpdated($conversationId: String!, $ownerId: String!) {
  conversationUpdated(conversationId: $conversationId, ownerId: $ownerId) {
    conversationId
    messages {
      role
      content {
        text
        imageBytes {
          bytes
        }
        toolResult {
          content {
            text
            imageBytes {
              bytes
            }
            json
          }
          toolUseId
          status
        }
        toolUse {
          input
          name
          toolUseId
        }
      }
      __typename
    }
    timestamp
    ownerId
    __typename
  }
}
` as GeneratedSubscription<
    APITypes.ConversationUpdatedSubscriptionVariables,
    APITypes.ConversationUpdatedSubscription
  >;
