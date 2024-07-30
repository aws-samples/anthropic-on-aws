/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const putPrompt = /* GraphQL */ `mutation PutPrompt(
  $prompt: String
  $task: String!
  $variables: [String!]
  $status: PromptStatus!
) {
  putPrompt(
    prompt: $prompt
    task: $task
    variables: $variables
    status: $status
  ) {
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
` as GeneratedMutation<
  APITypes.PutPromptMutationVariables,
  APITypes.PutPromptMutation
>;
export const updatePrompt = /* GraphQL */ `mutation UpdatePrompt(
  $id: ID!
  $prompt: String
  $updatedPrompt: String
  $task: String
  $variables: [String!]
  $status: PromptStatus
) {
  updatePrompt(
    id: $id
    prompt: $prompt
    updatedPrompt: $updatedPrompt
    task: $task
    variables: $variables
    status: $status
  ) {
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
` as GeneratedMutation<
  APITypes.UpdatePromptMutationVariables,
  APITypes.UpdatePromptMutation
>;
export const deletePrompt = /* GraphQL */ `mutation DeletePrompt($id: ID!) {
  deletePrompt(id: $id) {
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
` as GeneratedMutation<
  APITypes.DeletePromptMutationVariables,
  APITypes.DeletePromptMutation
>;
export const putTask = /* GraphQL */ `mutation PutTask($originalPrompt: String!, $status: TaskStatus!) {
  putTask(originalPrompt: $originalPrompt, status: $status) {
    id
    originalPrompt
    distilledTask
    owner
    status
    __typename
  }
}
` as GeneratedMutation<
  APITypes.PutTaskMutationVariables,
  APITypes.PutTaskMutation
>;
export const updateTask = /* GraphQL */ `mutation UpdateTask($id: ID!, $distilledTask: String, $status: TaskStatus) {
  updateTask(id: $id, distilledTask: $distilledTask, status: $status) {
    id
    originalPrompt
    distilledTask
    owner
    status
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateTaskMutationVariables,
  APITypes.UpdateTaskMutation
>;
export const deleteTask = /* GraphQL */ `mutation DeleteTask($id: ID!) {
  deleteTask(id: $id) {
    id
    originalPrompt
    distilledTask
    owner
    status
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteTaskMutationVariables,
  APITypes.DeleteTaskMutation
>;
