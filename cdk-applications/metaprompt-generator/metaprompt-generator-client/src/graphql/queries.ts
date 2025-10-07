/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getPrompt = /* GraphQL */ `query GetPrompt($id: ID!, $owner: String!) {
  getPrompt(id: $id, owner: $owner) {
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
` as GeneratedQuery<APITypes.GetPromptQueryVariables, APITypes.GetPromptQuery>;
export const listPrompts = /* GraphQL */ `query ListPrompts($owner: String!) {
  listPrompts(owner: $owner) {
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
` as GeneratedQuery<
  APITypes.ListPromptsQueryVariables,
  APITypes.ListPromptsQuery
>;
export const getAllPrompts = /* GraphQL */ `query GetAllPrompts($owner: String!) {
  getAllPrompts(owner: $owner) {
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
` as GeneratedQuery<
  APITypes.GetAllPromptsQueryVariables,
  APITypes.GetAllPromptsQuery
>;
export const getTask = /* GraphQL */ `query GetTask($id: ID!, $owner: String!) {
  getTask(id: $id, owner: $owner) {
    id
    originalPrompt
    distilledTask
    owner
    status
    __typename
  }
}
` as GeneratedQuery<APITypes.GetTaskQueryVariables, APITypes.GetTaskQuery>;
export const listTasks = /* GraphQL */ `query ListTasks($owner: String!) {
  listTasks(owner: $owner) {
    id
    originalPrompt
    distilledTask
    owner
    status
    __typename
  }
}
` as GeneratedQuery<APITypes.ListTasksQueryVariables, APITypes.ListTasksQuery>;
export const getAllTasks = /* GraphQL */ `query GetAllTasks($owner: String!) {
  getAllTasks(owner: $owner) {
    id
    originalPrompt
    distilledTask
    owner
    status
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetAllTasksQueryVariables,
  APITypes.GetAllTasksQuery
>;
