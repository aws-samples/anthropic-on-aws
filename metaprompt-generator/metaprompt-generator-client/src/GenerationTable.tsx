import React, { useCallback, useState } from 'react';
import {
    ExpandableSection,
    StatusIndicator,
    StatusIndicatorProps,
    ButtonDropdown,
} from '@cloudscape-design/components';
import { Prompt, PromptStatus } from './Definitions';
import { BaseTable, CenteredCell, XMLComponent } from './BaseTable';

interface GenerationTableProps {
    prompts: Prompt[];
    onDeletePrompt: (promptId: string) => void;
}

export const GenerationTable: React.FC<GenerationTableProps> = ({ prompts, onDeletePrompt }) => {
    const [notification, setNotification] = useState<{ visible: boolean; content: string }>({
        visible: false,
        content: '',
    });

    const handleCopy = useCallback((content: string, copyType: string) => {
        console.log(`Copying ${copyType} to clipboard:`, content);
        navigator.clipboard.writeText(content);
        setNotification({ visible: true, content: `${copyType} copied to clipboard` });
        setTimeout(() => setNotification({ visible: false, content: '' }), 2000);
    }, []);

    const columnDefinitions = [
        {
            id: 'task',
            header: 'Task',
            width: 200,
            minWidth: 200,
            cell: (item: Prompt) => (
                <CenteredCell>
                    <ExpandableSection headerText="Task">
                        <XMLComponent content={item.task} />
                    </ExpandableSection>
                </CenteredCell>
            ),
        },
        {
            id: 'variables',
            header: 'Variables',
            width: 200,
            minWidth: 200,
            cell: (item: Prompt) => (
                <CenteredCell>
                    <ExpandableSection headerText="Variables">
                        <XMLComponent content={item.variables?.join(', ') || 'No variables'} />
                    </ExpandableSection>
                </CenteredCell>
            ),
        },
        {
            id: 'prompt',
            header: 'Prompt',
            width: 400,
            minWidth: 400,
            cell: (item: Prompt) => (
                <CenteredCell>
                    {item.prompt ? (
                        <ExpandableSection headerText="Generated Prompt">
                            <XMLComponent content={item.prompt} />
                        </ExpandableSection>
                    ) : (
                        <div>No prompt generated yet.</div>
                    )}
                </CenteredCell>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            width: 150,
            minWidth: 150,
            cell: (item: Prompt) => {
                const statusMap: { [key in PromptStatus]: StatusIndicatorProps.Type } = {
                    [PromptStatus.PENDING]: 'pending',
                    [PromptStatus.GENERATING]: 'in-progress',
                    [PromptStatus.GENERATED]: 'success',
                    [PromptStatus.ERROR]: 'error',
                };

                return (
                    <CenteredCell>
                        <StatusIndicator type={statusMap[item.status]}>{PromptStatus[item.status]}</StatusIndicator>
                    </CenteredCell>
                );
            },
        },
        {
            id: 'actions',
            header: 'Actions',
            width: 250,
            cell: (item: Prompt) => (
                <CenteredCell>
                    <ButtonDropdown
                        items={[
                            {
                                text: 'Copy Task',
                                id: 'copy-task',
                            },
                            {
                                text: 'Copy Variables',
                                id: 'copy-variables',
                                disabled: !item.variables || item.variables.length === 0,
                            },
                        ]}
                        onItemClick={(e) => {
                            if (e.detail.id === 'copy-task') {
                                handleCopy(item.task, 'Task');
                            } else if (e.detail.id === 'copy-variables') {
                                handleCopy(item.variables?.join(', ') || '', 'Variables');
                            }
                        }}
                        mainAction={{
                            text: 'Copy Prompt',
                            onClick: () => handleCopy(item.prompt || '', 'Prompt'),
                            disabled: !item.prompt,
                        }}
                        expandToViewport
                    />
                </CenteredCell>
            ),
        },
    ];

    return (
        <>
            {notification.visible && (
                <div
                    style={{
                        position: 'fixed',
                        top: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#188038',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '4px',
                        zIndex: 1000,
                        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
                        transition: 'opacity 0.3s ease-in-out',
                        opacity: notification.visible ? 1 : 0,
                    }}
                >
                    {notification.content}
                </div>
            )}
            <BaseTable
                items={prompts}
                onDeleteItems={(promptIds) => promptIds.forEach(onDeletePrompt)}
                columnDefinitions={columnDefinitions}
                tableHeader="Prompts"
            />
        </>
    );
};
