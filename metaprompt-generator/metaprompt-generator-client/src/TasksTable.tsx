import React, { useState, useCallback } from 'react';
import {
    Table,
    SpaceBetween,
    ButtonDropdown,
    Header,
    ExpandableSection,
    StatusIndicator,
    StatusIndicatorProps,
    Box,
} from '@cloudscape-design/components';
import { Task, TaskStatus } from './Definitions';

interface TasksTableProps {
    tasks: Task[];
    onDeleteTask: (taskId: string) => void;
    onCopyToTaskForm: (distilledTask: string) => void;
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

export const TasksTable: React.FC<TasksTableProps> = ({ tasks, onDeleteTask, onCopyToTaskForm }) => {
    const [selectedItems, setSelectedItems] = useState<Task[]>([]);
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
            onDeleteTask(item.id);
        });
        setSelectedItems([]);
    }, [selectedItems, onDeleteTask]);

    const columnDefinitions = [
        {
            id: 'originalPrompt',
            header: 'Original Prompt',
            cell: (item: Task) => (
                <CenteredCell>
                    <ExpandableSection headerText="Original Prompt">
                        <XMLComponent content={item.originalPrompt} />
                    </ExpandableSection>
                </CenteredCell>
            ),
        },
        {
            id: 'distilledTask',
            header: 'Distilled Task',
            cell: (item: Task) => (
                <CenteredCell>
                    {item.distilledTask ? (
                        <ExpandableSection headerText="Distilled Task">
                            <XMLComponent content={item.distilledTask} />
                        </ExpandableSection>
                    ) : (
                        <Box>Not yet distilled</Box>
                    )}
                </CenteredCell>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            width: 150,
            minWidth: 150,
            cell: (item: Task) => {
                const statusMap: { [key in TaskStatus]: StatusIndicatorProps.Type } = {
                    [TaskStatus.PENDING]: 'pending',
                    [TaskStatus.PROCESSING]: 'in-progress',
                    [TaskStatus.COMPLETED]: 'success',
                    [TaskStatus.ERROR]: 'error',
                };

                return (
                    <CenteredCell>
                        <StatusIndicator type={statusMap[item.status]}>{TaskStatus[item.status]}</StatusIndicator>
                    </CenteredCell>
                );
            },
        },
        {
            id: 'actions',
            header: 'Actions',
            width: 250,
            minWidth: 250,
            cell: (item: Task) => (
                <div
                    style={{
                        position: 'relative',
                        height: '100%',
                        minHeight: '60px', // Adjust this value as needed
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            right: '5px',
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
                        <ButtonDropdown
                            items={[
                                {
                                    text: 'Copy to Task Form',
                                    id: 'copy-to-task-form',
                                },
                            ]}
                            onItemClick={(e) => {
                                if (e.detail.id === 'copy-to-task-form') {
                                    onCopyToTaskForm(item.distilledTask!);
                                }
                            }}
                            mainAction={{
                                text: 'Copy',
                                onClick: () => handleCopy(item.distilledTask!, item.id),
                            }}
                            expandToViewport
                        />
                    </div>
                </div>
            ),
        },
    ];

    return (
        <Table
            columnDefinitions={columnDefinitions}
            items={tasks}
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
            loadingText="Loading tasks..."
            empty={<Box textAlign="center">No tasks found.</Box>}
            header={
                <Header
                    counter={selectedItems.length ? `(${selectedItems.length}/${tasks.length})` : ''}
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
                    Tasks
                </Header>
            }
        />
    );
};
