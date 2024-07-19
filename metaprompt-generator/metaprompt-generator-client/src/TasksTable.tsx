import React, { useState } from 'react';
import {
    Table,
    Button,
    StatusIndicator,
    Box,
    SpaceBetween,
    ExpandableSection,
    Popover,
    Header,
    ButtonDropdown,
} from '@cloudscape-design/components';
import { Task, TaskStatus } from './Definitions';

interface TasksTableProps {
    tasks: Task[];
    onDeleteTask: (taskId: string) => void;
}

const XMLComponent: React.FC<{ content: string }> = ({ content }) => {
    return <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{content}</pre>;
};

export const TasksTable: React.FC<TasksTableProps> = ({ tasks, onDeleteTask }) => {
    const [selectedItems, setSelectedItems] = useState<Task[]>([]);

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content);
    };

    const handleDelete = () => {
        selectedItems.forEach((item) => {
            onDeleteTask(item.id);
        });
        setSelectedItems([]);
    };

    const columnDefinitions = [
        {
            id: 'originalPrompt',
            header: 'Original Prompt',
            cell: (item: Task) => (
                <ExpandableSection headerText="Original Prompt">
                    <XMLComponent content={item.originalPrompt} />
                </ExpandableSection>
            ),
        },
        {
            id: 'distilledTask',
            header: 'Distilled Task',
            cell: (item: Task) => (
                <div style={{ position: 'relative' }}>
                    {item.distilledTask ? (
                        <>
                            <ExpandableSection headerText="Distilled Task">
                                <XMLComponent content={item.distilledTask} />
                            </ExpandableSection>
                            <div style={{ position: 'absolute', top: -5, right: 0 }}>
                                <SpaceBetween direction="horizontal" size="xs">
                                    <Popover
                                        dismissButton={false}
                                        position="top"
                                        size="small"
                                        triggerType="custom"
                                        content={<StatusIndicator type="success">Task Copied</StatusIndicator>}
                                    >
                                        <Button onClick={() => handleCopy(item.distilledTask!)}>Copy</Button>
                                    </Popover>
                                </SpaceBetween>
                            </div>
                        </>
                    ) : (
                        'Not yet distilled'
                    )}
                </div>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            cell: (item: Task) => <StatusIndicator type={getStatusType(item.status)}>{item.status}</StatusIndicator>,
        },
    ];

    return (
        <SpaceBetween size="xl">
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
                empty={
                    <Box textAlign="center" color="inherit">
                        <b>No tasks</b>
                        <Box padding={{ bottom: 's' }} variant="p" color="inherit">
                            No tasks to display.
                        </Box>
                    </Box>
                }
                header={
                    <Header
                        counter={selectedItems.length ? `(${selectedItems.length}/${tasks.length})` : ''}
                        actions={
                            <SpaceBetween direction="horizontal" size="xs">
                                <ButtonDropdown
                                    onItemClick={() => handleDelete()}
                                    items={[
                                        {
                                            text: 'Delete',
                                            id: 'delete',
                                            disabled: false,
                                        },
                                    ]}
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
        </SpaceBetween>
    );
};

function getStatusType(status: TaskStatus): 'success' | 'error' | 'warning' | 'info' | 'pending' {
    switch (status) {
        case TaskStatus.COMPLETED:
            return 'success';
        case TaskStatus.ERROR:
            return 'error';
        case TaskStatus.PROCESSING:
            return 'info';
        case TaskStatus.PENDING:
        default:
            return 'pending';
    }
}
