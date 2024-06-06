/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export enum PromptStatus {
  PENDING = "PENDING",
  GENERATING = "GENERATING",
  GENERATED = "GENERATED",
  ERROR = "ERROR",
}


export type Prompt = {
  __typename: "Prompt",
  id: string,
  prompt?: string | null,
  updatedPrompt?: string | null,
  task: string,
  variables?: Array< string > | null,
  owner: string,
  status: PromptStatus,
};

export type PutPromptMutationVariables = {
  prompt?: string | null,
  task: string,
  variables?: Array< string > | null,
  status: PromptStatus,
};

export type PutPromptMutation = {
  putPrompt:  {
    __typename: "Prompt",
    id: string,
    prompt?: string | null,
    updatedPrompt?: string | null,
    task: string,
    variables?: Array< string > | null,
    owner: string,
    status: PromptStatus,
  },
};

export type UpdatePromptMutationVariables = {
  id: string,
  prompt?: string | null,
  updatedPrompt?: string | null,
  task?: string | null,
  variables?: Array< string > | null,
  status?: PromptStatus | null,
};

export type UpdatePromptMutation = {
  updatePrompt:  {
    __typename: "Prompt",
    id: string,
    prompt?: string | null,
    updatedPrompt?: string | null,
    task: string,
    variables?: Array< string > | null,
    owner: string,
    status: PromptStatus,
  },
};

export type DeletePromptMutationVariables = {
  id: string,
};

export type DeletePromptMutation = {
  deletePrompt?:  {
    __typename: "Prompt",
    id: string,
    prompt?: string | null,
    updatedPrompt?: string | null,
    task: string,
    variables?: Array< string > | null,
    owner: string,
    status: PromptStatus,
  } | null,
};

export type GetPromptQueryVariables = {
  id: string,
  owner: string,
};

export type GetPromptQuery = {
  getPrompt?:  {
    __typename: "Prompt",
    id: string,
    prompt?: string | null,
    updatedPrompt?: string | null,
    task: string,
    variables?: Array< string > | null,
    owner: string,
    status: PromptStatus,
  } | null,
};

export type ListPromptsQueryVariables = {
  owner: string,
};

export type ListPromptsQuery = {
  listPrompts:  Array< {
    __typename: "Prompt",
    id: string,
    prompt?: string | null,
    updatedPrompt?: string | null,
    task: string,
    variables?: Array< string > | null,
    owner: string,
    status: PromptStatus,
  } >,
};

export type GetAllPromptsQueryVariables = {
  owner: string,
};

export type GetAllPromptsQuery = {
  getAllPrompts:  Array< {
    __typename: "Prompt",
    id: string,
    prompt?: string | null,
    updatedPrompt?: string | null,
    task: string,
    variables?: Array< string > | null,
    owner: string,
    status: PromptStatus,
  } >,
};

export type PromptGeneratedSubscriptionVariables = {
  owner: string,
};

export type PromptGeneratedSubscription = {
  promptGenerated?:  {
    __typename: "Prompt",
    id: string,
    prompt?: string | null,
    updatedPrompt?: string | null,
    task: string,
    variables?: Array< string > | null,
    owner: string,
    status: PromptStatus,
  } | null,
};

export type PromptUpdatedSubscriptionVariables = {
  owner: string,
};

export type PromptUpdatedSubscription = {
  promptUpdated?:  {
    __typename: "Prompt",
    id: string,
    prompt?: string | null,
    updatedPrompt?: string | null,
    task: string,
    variables?: Array< string > | null,
    owner: string,
    status: PromptStatus,
  } | null,
};

export type PromptDeletedSubscriptionVariables = {
  owner: string,
};

export type PromptDeletedSubscription = {
  promptDeleted?:  {
    __typename: "Prompt",
    id: string,
    prompt?: string | null,
    updatedPrompt?: string | null,
    task: string,
    variables?: Array< string > | null,
    owner: string,
    status: PromptStatus,
  } | null,
};
