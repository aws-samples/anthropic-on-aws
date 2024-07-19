// PromptForm.tsx
import React, { useState, useEffect } from 'react';
import {
    FormField,
    Input,
    Button,
    Container,
    Header,
    SpaceBetween,
    Form,
    Flashbar,
    FlashbarProps,
} from '@cloudscape-design/components';
import { PromptStatus } from './Definitions';
import { post, generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import * as mutations from './graphql/mutations';

const client = generateClient();

interface TaskFormProps {
    copiedTask: string | null;
}

export const TaskForm: React.FC<TaskFormProps> = ({ copiedTask }) => {
    const [task, setTask] = useState('');
    const [variables, setVariables] = useState('');
    const [flashbarItems, setFlashbarItems] = useState<FlashbarProps.MessageDefinition[]>([]);

    useEffect(() => {
        if (copiedTask) {
            setTask(copiedTask);
        }
    }, [copiedTask]);

    useEffect(() => {
        if (flashbarItems.length > 0) {
            const timer = setTimeout(() => {
                setFlashbarItems([]);
            }, 5000);

            return () => {
                clearTimeout(timer);
            };
        }
    }, [flashbarItems]);

    const handlePutPrompt = async (task: string, variables: string[]) => {
        console.log('Creating prompt:', task, variables);

        try {
            const newPrompt = client.graphql({
                query: mutations.putPrompt,
                variables: { task: task, variables: variables, status: 'PENDING' as PromptStatus },
            });

            const promptId = (await newPrompt).data.putPrompt.id;
            console.log('Prompt created:', promptId);

            const authToken = (await fetchAuthSession()).tokens?.idToken?.toString();
            const apiGatewayResponse = post({
                apiName: 'request',
                path: 'createPrompt',
                options: {
                    headers: {
                        Authorization: authToken!,
                    },
                    body: {
                        promptId: promptId,
                        task: task,
                        variables: variables,
                    },
                },
            });
            console.log('API Gateway response:', apiGatewayResponse);
            return apiGatewayResponse;
        } catch (error) {
            console.error('Error creating prompt:', error);
            throw error;
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!task.trim()) {
            setFlashbarItems([
                {
                    type: 'error',
                    content: 'Please enter a task.',
                    dismissible: true,
                    dismissLabel: 'Dismiss message',
                    onDismiss: () => setFlashbarItems([]),
                    id: 'validation_error',
                },
            ]);
            return;
        }

        setFlashbarItems([
            {
                type: 'info',
                content: 'Processing...',
                loading: true,
                id: 'processing_message',
            },
        ]);

        try {
            const processedVariables = variables.trim() ? variables.split(/\s+/) : [];

            const putPromptResponse = handlePutPrompt(task, processedVariables);

            const statusCode = (await (await putPromptResponse).response).statusCode;
            console.log(statusCode);
            if (statusCode === 202) {
                setTask('');
                setVariables('');
                setFlashbarItems([
                    {
                        type: 'success',
                        content: 'Form submitted successfully!',
                        dismissible: true,
                        dismissLabel: 'Dismiss message',
                        onDismiss: () => setFlashbarItems([]),
                        id: 'success_message',
                    },
                ]);
            } else {
                throw new Error('API request failed');
            }
        } catch (error) {
            console.error('Error:', error);
            setFlashbarItems([
                {
                    type: 'error',
                    content: 'Failed to submit the form. Please try again.',
                    dismissible: true,
                    dismissLabel: 'Dismiss message',
                    onDismiss: () => setFlashbarItems([]),
                    id: 'error_message',
                },
            ]);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }}>
                    <Flashbar items={flashbarItems} />
                </div>
                <Container header={<Header variant="h2">Task Entry</Header>}>
                    <Form
                        actions={
                            <SpaceBetween direction="horizontal" size="xs">
                                <Button variant="primary">Submit</Button>
                            </SpaceBetween>
                        }
                    >
                        <SpaceBetween direction="vertical" size="m">
                            <FormField label="Task">
                                <Input value={task} onChange={({ detail }) => setTask(detail.value)} />
                            </FormField>
                            <FormField label="Variables (optional)">
                                <Input
                                    value={variables}
                                    onChange={({ detail }) => setVariables(detail.value)}
                                    placeholder="Enter variables separated by spaces"
                                />
                            </FormField>
                        </SpaceBetween>
                    </Form>
                </Container>
            </div>
        </form>
    );
};
