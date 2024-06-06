import { ResourcesConfig } from 'aws-amplify';
export const config = await fetch('./config.json').then((response) => response.json());

export const AmplifyConfig: ResourcesConfig = {
    Auth: {
        Cognito: {
            userPoolId: config.userPoolId,
            userPoolClientId: config.userPoolClientId,
            identityPoolId: config.identityPoolId,
            signUpVerificationMethod: 'code',
        },
    },
    API: {
        REST: {
            request: { endpoint: config.apiUrl },
        },
        GraphQL: {
            endpoint: config.graphQlUrl,
            defaultAuthMode: 'userPool',
            // defaultAuthMode: 'apiKey',
            // apiKey: config.graphQlApiKey,
        },
    },
};
