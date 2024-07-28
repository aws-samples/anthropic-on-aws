import React, { useState, useEffect } from 'react';
import {
    FormField,
    Textarea,
    Button,
    Container,
    Header,
    SpaceBetween,
    Form,
    Flashbar,
    FlashbarProps,
} from '@cloudscape-design/components';
import { TaskStatus } from './Definitions';
import { post, generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import * as mutations from './graphql/mutations';

const client = generateClient();

export const DistillationForm: React.FC = () => {
    const [originalPrompt, setOriginalPrompt] = useState('');
    const [flashbarItems, setFlashbarItems] = useState<FlashbarProps.MessageDefinition[]>([]);

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

    const handlePutTask = async (originalPrompt: string) => {
        console.log('Creating distillation task:', originalPrompt);

        try {
            const newTask = client.graphql({
                query: mutations.putTask,
                variables: {
                    originalPrompt: originalPrompt.trim(),
                    status: TaskStatus.PENDING,
                },
            });

            const taskId = (await newTask).data.putTask.id;
            console.log('Distillation task created:', taskId);

            if (!taskId) {
                console.warn('Task created but no ID returned');
                throw new Error('No task ID returned from mutation');
            }

            const authToken = (await fetchAuthSession()).tokens?.idToken?.toString();
            const apiGatewayResponse = await post({
                apiName: 'request',
                path: 'createTask',
                options: {
                    headers: {
                        Authorization: authToken!,
                    },
                    body: {
                        taskId: taskId,
                        originalPrompt: originalPrompt.trim(),
                    },
                },
            });
            console.log('API Gateway response:', apiGatewayResponse);
            return apiGatewayResponse;
        } catch (error) {
            console.error('Error creating distillation task:', error);
            if (error instanceof Error) {
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
            }
            throw error;
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!originalPrompt.trim()) {
            setFlashbarItems([
                {
                    type: 'error',
                    content: 'Please enter a prompt to distill.',
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
            const putTaskResponse = handlePutTask(originalPrompt);

            const statusCode = (await (await putTaskResponse).response).statusCode;
            console.log('API Gateway status code:', statusCode);
            if (statusCode === 202) {
                setOriginalPrompt('');
                setFlashbarItems([
                    {
                        type: 'success',
                        content: 'Distillation task submitted successfully!',
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
                    content: 'Failed to submit the distillation task. Please try again.',
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
                <Container header={<Header variant="h2">Prompt Distillation</Header>}>
                    <Form
                        actions={
                            <SpaceBetween direction="horizontal" size="xs">
                                <Button variant="primary">Submit</Button>
                            </SpaceBetween>
                        }
                    >
                        <SpaceBetween direction="vertical" size="m">
                            <FormField label="Original Prompt">
                                <Textarea
                                    value={originalPrompt}
                                    onChange={({ detail }) => setOriginalPrompt(detail.value)}
                                    placeholder="Enter the large prompt you want to distill into a manageable task"
                                />
                            </FormField>
                        </SpaceBetween>
                    </Form>
                </Container>
            </div>
        </form>
    );
};
