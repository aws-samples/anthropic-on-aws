// PromptsTable.tsx
import React, { useState } from 'react';
import {
    Table,
    SpaceBetween,
    Button,
    ButtonDropdown,
    Header,
    ExpandableSection,
    Popover,
    StatusIndicator,
    StatusIndicatorProps,
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

export const PromptsTable: React.FC<PromptsTableProps> = ({ prompts, onDeletePrompt }) => {
    const [selectedItems, setSelectedItems] = useState<Prompt[]>([]);
    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content);
    };

    const handleDelete = () => {
        selectedItems.forEach((item) => {
            onDeletePrompt(item.id);
        });
        setSelectedItems([]);
    };

    const columnDefinitions = [
        {
            id: 'task',
            header: 'Task',
            width: 200,
            minWidth: 150,
            cell: (item: Prompt) => <div style={{ position: 'sticky', top: 0, left: 0 }}>{item.task}</div>,
        },
        {
            id: 'variables',
            header: 'Variables',
            width: 200,
            minWidth: 150,
            cell: (item: Prompt) => item.variables?.join(', ') || '-',
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

                return <StatusIndicator type={statusMap[item.status]}>{PromptStatus[item.status]}</StatusIndicator>;
            },
        },
        {
            id: 'prompt',
            header: 'Prompt',
            cell: (item: Prompt) => (
                <div style={{ position: 'relative' }}>
                    {item.prompt ? (
                        <>
                            <ExpandableSection headerText="Generated Prompt">
                                <XMLComponent content={item.prompt} />
                            </ExpandableSection>

                            <div style={{ position: 'absolute', top: -5, right: 0 }}>
                                <Popover
                                    dismissButton={false}
                                    position="top"
                                    size="small"
                                    triggerType="custom"
                                    content={<StatusIndicator type="success">Prompt Copied</StatusIndicator>}
                                >
                                    <Button onClick={() => handleCopy(item.prompt || '')}>Copy</Button>
                                </Popover>
                            </div>
                        </>
                    ) : (
                        <div>No prompt generated yet.</div>
                    )}
                </div>
            ),
        },
    ];

    return (
        <SpaceBetween size="xl">
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
                empty={<div>No prompts found.</div>}
                header={
                    <Header
                        counter={selectedItems.length ? '(' + selectedItems.length + '/' + prompts.length + ')' : ''}
                        actions={
                            <SpaceBetween direction="horizontal" size="xs">
                                <ButtonDropdown
                                    onItemClick={() => handleDelete()}
                                    items={[
                                        {
                                            text: 'Delete',
                                            id: 'rn',
                                            disabled: false,
                                        },
                                    ]}
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
        </SpaceBetween>
    );
};
