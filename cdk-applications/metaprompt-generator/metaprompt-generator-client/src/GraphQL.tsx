import React, { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { Prompt, PromptStatus, Task, TaskStatus } from './Definitions';
import * as subscriptions from './graphql/subscriptions';
import * as queries from './graphql/queries';

const client = generateClient({ authMode: 'userPool' });

interface GraphQLProps {
    onNewPrompt: (newPrompt: Prompt) => void;
    onPromptsUpdated: (prompts: Prompt[]) => void;
    onPromptDeleted: (promptId: string) => void;
    onPromptUpdated: (updatedPrompt: Prompt) => void;
    onNewTask: (newTask: Task) => void;
    onTasksUpdated: (tasks: Task[]) => void;
    onTaskDeleted: (taskId: string) => void;
    onTaskUpdated: (updatedTask: Task) => void;
}

export const GraphQL: React.FC<GraphQLProps> = ({
    onNewPrompt,
    onPromptsUpdated,
    onPromptUpdated,
    onPromptDeleted,
    onNewTask,
    onTasksUpdated,
    onTaskUpdated,
    onTaskDeleted,
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

        const fetchTasks = async () => {
            try {
                const result = await client.graphql({
                    query: queries.getAllTasks,
                    variables: { owner },
                });

                const tasks = result.data.getAllTasks.map((task: any) => ({
                    ...task,
                    status: TaskStatus[task.status as keyof typeof TaskStatus],
                }));

                onTasksUpdated(tasks);
            } catch (error) {
                console.error('Error fetching tasks:', error);
            }
        };

        fetchPrompts();
        fetchTasks();

        const createPromptSub = client
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

        const updatePromptSub = client
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

        const deletePromptSub = client
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

        const createTaskSub = client
            .graphql({
                query: subscriptions.taskGenerated,
                variables: { owner },
            })
            .subscribe({
                next: ({ data }) => {
                    console.log(data);
                    const newTask = data.taskGenerated;
                    if (newTask) {
                        console.log('New task generated:', newTask);
                        onNewTask({
                            ...newTask,
                            status: TaskStatus[newTask.status as keyof typeof TaskStatus],
                        });
                    }
                },
                error: (error) => console.warn(error),
            });

        const updateTaskSub = client
            .graphql({
                query: subscriptions.taskUpdated,
                variables: { owner },
            })
            .subscribe({
                next: ({ data }) => {
                    console.log(data);
                    const updatedTask = data.taskUpdated;
                    if (updatedTask) {
                        console.log('Task updated:', updatedTask);
                        onTaskUpdated({
                            ...updatedTask,
                            status: TaskStatus[updatedTask.status as keyof typeof TaskStatus],
                        });
                    }
                },
                error: (error) => console.warn(error),
            });

        const deleteTaskSub = client
            .graphql({
                query: subscriptions.taskDeleted,
                variables: { owner },
            })
            .subscribe({
                next: ({ data }) => {
                    console.log(data);
                    const deletedTask = data.taskDeleted;
                    if (deletedTask) {
                        console.log('Task deleted:', deletedTask);
                        onTaskDeleted(deletedTask.id);
                        fetchTasks();
                    }
                },
                error: (error) => console.warn(error),
            });

        return () => {
            createPromptSub.unsubscribe();
            updatePromptSub.unsubscribe();
            deletePromptSub.unsubscribe();
            createTaskSub.unsubscribe();
            updateTaskSub.unsubscribe();
            deleteTaskSub.unsubscribe();
        };
    }, [owner]);

    return null;
};
