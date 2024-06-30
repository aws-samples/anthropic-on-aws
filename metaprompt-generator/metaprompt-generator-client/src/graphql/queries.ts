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
