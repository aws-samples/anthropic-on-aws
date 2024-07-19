import React, { useState, useCallback } from 'react';
import {
    Table,
    SpaceBetween,
    ButtonDropdown,
    Button,
    Header,
    ExpandableSection,
    StatusIndicator,
    StatusIndicatorProps,
    Box,
} from '@cloudscape-design/components';
import { Prompt, PromptStatus } from './Definitions';

interface PromptsTableProps {
    prompts: Prompt[];
    onDeletePrompt: (promptId: string) => void;
}

const XMLComponent: React.FC<{ content: string }> = ({ content }) => {
    const formattedContent = content.replace(
        /(<\/?(?:Instructions|scratchpad|recommendation|reasoning)(?:\s+[^>]*)?>)/g,
        '$1',
    );

    return <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{formattedContent}</pre>;
};

const CenteredCell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            minHeight: '60px', // Adjust this value as needed
        }}
    >
        {children}
    </div>
);

export const PromptsTable: React.FC<PromptsTableProps> = ({ prompts, onDeletePrompt }) => {
    const [selectedItems, setSelectedItems] = useState<Prompt[]>([]);
    const [copyFeedback, setCopyFeedback] = useState<{ itemId: string | null; visible: boolean }>({
        itemId: null,
        visible: false,
    });

    const handleCopy = useCallback((content: string, itemId: string) => {
        console.log('Copying to clipboard:', content);
        navigator.clipboard.writeText(content);
        setCopyFeedback({ itemId, visible: true });
        setTimeout(() => setCopyFeedback({ itemId: null, visible: false }), 2000);
    }, []);

    const handleDelete = useCallback(() => {
        selectedItems.forEach((item) => {
            onDeletePrompt(item.id);
        });
        setSelectedItems([]);
    }, [selectedItems, onDeletePrompt]);

    const columnDefinitions = [
        {
            id: 'task',
            header: 'Task',
            width: 200,
            minWidth: 150,
            cell: (item: Prompt) => <CenteredCell>{item.task}</CenteredCell>,
        },
        {
            id: 'variables',
            header: 'Variables',
            width: 200,
            minWidth: 150,
            cell: (item: Prompt) => <CenteredCell>{item.variables?.join(', ') || '-'}</CenteredCell>,
        },

        {
            id: 'prompt',
            header: 'Prompt',
            cell: (item: Prompt) => (
                <div
                    style={{
                        position: 'relative',
                        height: '100%',
                        minHeight: '60px', // Adjust this value as needed
                    }}
                >
                    <CenteredCell>
                        {item.prompt ? (
                            <ExpandableSection headerText="Generated Prompt">
                                <XMLComponent content={item.prompt} />
                            </ExpandableSection>
                        ) : (
                            <div>No prompt generated yet.</div>
                        )}
                    </CenteredCell>
                </div>
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
            width: 150,
            cell: (item: Prompt) => (
                <CenteredCell>
                    {item.prompt && (
                        <div
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            {copyFeedback.itemId === item.id && copyFeedback.visible && (
                                <StatusIndicator type="success">Copied</StatusIndicator>
                            )}
                            <div style={{ width: '10px' }} /> {/* Spacer */}
                            <Button onClick={() => handleCopy(item.prompt!, item.id)}>Copy</Button>
                        </div>
                    )}
                </CenteredCell>
            ),
        },
    ];

    return (
        <Table
            columnDefinitions={columnDefinitions}
            items={prompts}
            stickyHeader
            resizableColumns
            stripedRows
            wrapLines
            selectedItems={selectedItems}
            selectionType="multi"
            onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
            variant="container"
            sortingDisabled={true}
            contentDensity="comfortable"
            loadingText="Loading prompts..."
            empty={<Box textAlign="center">No prompts found.</Box>}
            header={
                <Header
                    counter={selectedItems.length ? `(${selectedItems.length}/${prompts.length})` : ''}
                    actions={
                        <SpaceBetween direction="horizontal" size="xs">
                            <ButtonDropdown
                                items={[
                                    {
                                        text: 'Delete',
                                        id: 'delete',
                                        disabled: selectedItems.length === 0,
                                    },
                                ]}
                                onItemClick={(e) => {
                                    if (e.detail.id === 'delete') {
                                        handleDelete();
                                    }
                                }}
                            >
                                Actions
                            </ButtonDropdown>
                        </SpaceBetween>
                    }
                >
                    Prompts
                </Header>
            }
        />
    );
};
