import React, { useState } from 'react';
import { AmplifyConfig } from './Config';
import { ContentLayout, Header, SpaceBetween, AppLayout, Button, Container, Tabs } from '@cloudscape-design/components';
import '@cloudscape-design/global-styles/index.css';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { GraphQL } from './GraphQL';
import { Prompt, Task } from './Definitions';
import { Generation } from './Generation';
import { Distillation } from './Distillation';
import { Instructions } from './Instructions';
import { generateClient } from 'aws-amplify/api';
import * as mutations from './graphql/mutations';
import { signOut } from 'aws-amplify/auth';

const client = generateClient();
Amplify.configure(AmplifyConfig);

const App: React.FC = () => {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [activeTabId, setActiveTabId] = useState('instructions');
    const [copiedTask, setCopiedTask] = useState<string | null>(null);

    const handleNewPrompt = (newPrompt: Prompt) => {
        setPrompts((prevPrompts) => [...prevPrompts, newPrompt]);
    };

    const handlePromptsUpdated = (updatedPrompts: Prompt[]) => {
        setPrompts(updatedPrompts);
    };

    const handlePromptUpdated = (updatedPrompt: Prompt) => {
        setPrompts((prevPrompts) =>
            prevPrompts.map((prompt) => (prompt.id === updatedPrompt.id ? updatedPrompt : prompt)),
        );
    };

    const handleDeletePrompt = async (promptId: string) => {
        console.log('Deleting prompt:', promptId);
        try {
            await client.graphql({
                query: mutations.deletePrompt,
                variables: { id: promptId },
            });
        } catch (error) {
            console.error('Error deleting prompt:', error);
        }
    };

    const handleNewTask = (newTask: Task) => {
        setTasks((prevTasks) => [...prevTasks, newTask]);
    };

    const handleTasksUpdated = (updatedTasks: Task[]) => {
        setTasks(updatedTasks);
    };

    const handleTaskUpdated = (updatedTask: Task) => {
        setTasks((prevTasks) => prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
    };

    const handleDeleteTask = async (taskId: string) => {
        console.log('Deleting task:', taskId);
        try {
            await client.graphql({
                query: mutations.deleteTask,
                variables: { id: taskId },
            });
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const handleCopyToTaskForm = (distilledTask: string) => {
        console.log('Copying to task form:', distilledTask);
        setCopiedTask(distilledTask);
        setActiveTabId('generation');
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            // Add any additional logic after successful sign out, if needed
        } catch (error) {
            console.log('Error signing out:', error);
        }
    };

    return (
        <Authenticator>
            <AppLayout
                content={
                    <ContentLayout
                        header={
                            <SpaceBetween size="m">
                                <Header variant="h1" actions={<Button onClick={handleSignOut}>Sign Out</Button>}>
                                    Anthropic Prompt Engineering
                                </Header>
                            </SpaceBetween>
                        }
                    >
                        <Container>
                            <SpaceBetween size="xl">
                                <Tabs
                                    activeTabId={activeTabId}
                                    onChange={({ detail }) => setActiveTabId(detail.activeTabId)}
                                    tabs={[
                                        {
                                            label: 'Instructions',
                                            id: 'instructions',
                                            content: <Instructions />,
                                        },
                                        {
                                            label: 'Distillation',
                                            id: 'distillation',
                                            content: (
                                                <Distillation
                                                    tasks={tasks}
                                                    onDeleteTask={handleDeleteTask}
                                                    onCopyToTaskForm={handleCopyToTaskForm}
                                                />
                                            ),
                                        },
                                        {
                                            label: 'Generation',
                                            id: 'generation',
                                            content: (
                                                <Generation
                                                    prompts={prompts}
                                                    copiedTask={copiedTask}
                                                    onDeletePrompt={handleDeletePrompt}
                                                />
                                            ),
                                        },
                                    ]}
                                />
                                <GraphQL
                                    onNewPrompt={handleNewPrompt}
                                    onPromptsUpdated={handlePromptsUpdated}
                                    onPromptUpdated={handlePromptUpdated}
                                    onPromptDeleted={handleDeletePrompt}
                                    onNewTask={handleNewTask}
                                    onTasksUpdated={handleTasksUpdated}
                                    onTaskUpdated={handleTaskUpdated}
                                    onTaskDeleted={handleDeleteTask}
                                />
                            </SpaceBetween>
                        </Container>
                    </ContentLayout>
                }
                navigationHide={true}
                toolsHide={true}
            />
        </Authenticator>
    );
};

export default App;
