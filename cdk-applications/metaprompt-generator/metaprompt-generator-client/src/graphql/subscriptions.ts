/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const promptGenerated = /* GraphQL */ `subscription PromptGenerated($owner: String!) {
  promptGenerated(owner: $owner) {
    id
    prompt
    updatedPrompt
    task
    variables
    owner
    status
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.PromptGeneratedSubscriptionVariables,
  APITypes.PromptGeneratedSubscription
>;
export const promptUpdated = /* GraphQL */ `subscription PromptUpdated($owner: String!) {
  promptUpdated(owner: $owner) {
    id
    prompt
    updatedPrompt
    task
    variables
    owner
    status
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.PromptUpdatedSubscriptionVariables,
  APITypes.PromptUpdatedSubscription
>;
export const promptDeleted = /* GraphQL */ `subscription PromptDeleted($owner: String!) {
  promptDeleted(owner: $owner) {
    id
    prompt
    updatedPrompt
    task
    variables
    owner
    status
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.PromptDeletedSubscriptionVariables,
  APITypes.PromptDeletedSubscription
>;
export const taskGenerated = /* GraphQL */ `subscription TaskGenerated($owner: String!) {
  taskGenerated(owner: $owner) {
    id
    originalPrompt
    distilledTask
    owner
    status
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.TaskGeneratedSubscriptionVariables,
  APITypes.TaskGeneratedSubscription
>;
export const taskUpdated = /* GraphQL */ `subscription TaskUpdated($owner: String!) {
  taskUpdated(owner: $owner) {
    id
    originalPrompt
    distilledTask
    owner
    status
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.TaskUpdatedSubscriptionVariables,
  APITypes.TaskUpdatedSubscription
>;
export const taskDeleted = /* GraphQL */ `subscription TaskDeleted($owner: String!) {
  taskDeleted(owner: $owner) {
    id
    originalPrompt
    distilledTask
    owner
    status
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.TaskDeletedSubscriptionVariables,
  APITypes.TaskDeletedSubscription
>;
