import { gql } from '@apollo/client';

export const typeDefs = gql`
  type Prompt {
    id: ID!
    content: String!
    prompt: String!
    task: String!
    variables: [String!]
  }

  type Query {
    getPrompt(id: ID!): Prompt
  }

  type Subscription {
    promptGenerated: Prompt @aws_subscribe(mutations: ["putPrompt"])
  }

  type Mutation {
    putPrompt(content: String!): Prompt
  }
`;
