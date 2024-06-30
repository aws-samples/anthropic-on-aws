import React, { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { Prompt, PromptStatus } from './Definitions';
import * as subscriptions from './graphql/subscriptions';
import * as queries from './graphql/queries';

const client = generateClient({ authMode: 'userPool' });

interface GraphQLProps {
    onNewPrompt: (newPrompt: Prompt) => void;
    onPromptsUpdated: (prompts: Prompt[]) => void;
    onPromptDeleted: (promptId: string) => void;
    onPromptUpdated: (updatedPrompt: Prompt) => void;
}

export const GraphQL: React.FC<GraphQLProps> = ({
    onNewPrompt,
    onPromptsUpdated,
    onPromptUpdated,
    onPromptDeleted,
}) => {
    const [owner, setOwner] = useState<string | undefined>(undefined);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userAttributes = await fetchUserAttributes();
                const ownerValue = userAttributes.sub;
                setOwner(ownerValue);
            } catch (error) {
                console.error('Error fetching user attributes:', error);
            }
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        if (!owner) return;

        const fetchPrompts = async () => {
            try {
                const result = await client.graphql({
                    query: queries.getAllPrompts,
                    variables: { owner },
                });

                const prompts = result.data.getAllPrompts.map((prompt: any) => ({
                    ...prompt,
                    status: PromptStatus[prompt.status as keyof typeof PromptStatus],
                }));

                onPromptsUpdated(prompts);
            } catch (error) {
                console.error('Error fetching prompts:', error);
            }
        };

        fetchPrompts();

        const createSub = client
            .graphql({
                query: subscriptions.promptGenerated,
                variables: { owner },
            })
            .subscribe({
                next: ({ data }) => {
                    console.log(data);
                    const newPrompt = data.promptGenerated;
                    if (newPrompt) {
                        console.log('New prompt generated:', newPrompt);
                        onNewPrompt({
                            ...newPrompt,
                            status: PromptStatus[newPrompt.status as keyof typeof PromptStatus],
                        });
                    }
                },
                error: (error) => console.warn(error),
            });

        const updateSub = client
            .graphql({
                query: subscriptions.promptUpdated,
                variables: { owner },
            })
            .subscribe({
                next: ({ data }) => {
                    console.log(data);
                    const updatedPrompt = data.promptUpdated;
                    if (updatedPrompt) {
                        console.log('Prompt updated:', updatedPrompt);
                        onPromptUpdated({
                            ...updatedPrompt,
                            status: PromptStatus[updatedPrompt.status as keyof typeof PromptStatus],
                        });
                    }
                },
                error: (error) => console.warn(error),
            });

        const deleteSub = client
            .graphql({
                query: subscriptions.promptDeleted,
                variables: { owner },
            })
            .subscribe({
                next: ({ data }) => {
                    console.log(data);
                    const deletedPrompt = data.promptDeleted;
                    if (deletedPrompt) {
                        console.log('Prompt deleted:', deletedPrompt);
                        onPromptDeleted(deletedPrompt.id);
                        fetchPrompts();
                    }
                },
                error: (error) => console.warn(error),
            });

        return () => {
            createSub.unsubscribe();
            updateSub.unsubscribe();
            deleteSub.unsubscribe();
        };
    }, [owner]);

    return null;
};
