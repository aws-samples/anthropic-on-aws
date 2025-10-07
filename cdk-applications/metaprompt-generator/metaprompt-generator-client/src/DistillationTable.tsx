import React, { useCallback, useState } from 'react';
import {
    ExpandableSection,
    StatusIndicator,
    StatusIndicatorProps,
    ButtonDropdown,
} from '@cloudscape-design/components';
import { Task, TaskStatus } from './Definitions';
import { BaseTable, CenteredCell, XMLComponent } from './BaseTable';

interface DistillationTableProps {
    tasks: Task[];
    onDeleteTask: (taskId: string) => void;
    onCopyToTaskForm: (distilledTask: string) => void;
}

export const DistillationTable: React.FC<DistillationTableProps> = ({ tasks, onDeleteTask, onCopyToTaskForm }) => {
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

    const handleCopyToTaskForm = useCallback(
        (content: string) => {
            onCopyToTaskForm(content);
            console.log('Copying to Task Form:', content);
            setNotification({ visible: true, content: 'Copied to Task Form' });
            setTimeout(() => setNotification({ visible: false, content: '' }), 2000);
        },
        [onCopyToTaskForm],
    );

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
                        <div>Not yet distilled</div>
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
            cell: (item: Task) => (
                <CenteredCell>
                    <ButtonDropdown
                        items={[
                            {
                                text: 'Copy Original Prompt',
                                id: 'copy-original',
                            },
                            {
                                text: 'Copy to Task Form',
                                id: 'copy-to-task-form',
                                disabled: !item.distilledTask,
                            },
                        ]}
                        onItemClick={(e) => {
                            if (e.detail.id === 'copy-original') {
                                handleCopy(item.originalPrompt, 'Original Prompt');
                            } else if (e.detail.id === 'copy-to-task-form' && item.distilledTask) {
                                handleCopyToTaskForm(item.distilledTask);
                            }
                        }}
                        mainAction={{
                            text: 'Copy Distilled Task',
                            onClick: () => item.distilledTask && handleCopy(item.distilledTask, 'Distilled Task'),
                            disabled: !item.distilledTask,
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
                items={tasks}
                onDeleteItems={(taskIds) => taskIds.forEach(onDeleteTask)}
                columnDefinitions={columnDefinitions}
                tableHeader="Tasks"
            />
        </>
    );
};
