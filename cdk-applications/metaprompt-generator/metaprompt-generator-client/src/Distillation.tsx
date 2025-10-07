import React from 'react';
import { SpaceBetween } from '@cloudscape-design/components';
import { DistillationForm } from './DistillationForm';
import { DistillationTable } from './DistillationTable';
import { Task } from './Definitions';

interface DistillationProps {
    tasks: Task[];
    onDeleteTask: (taskId: string) => void;
    onCopyToTaskForm: (distilledTask: string) => void;
}

export const Distillation: React.FC<DistillationProps> = ({ tasks, onDeleteTask, onCopyToTaskForm }) => {
    return (
        <SpaceBetween size="l">
            <DistillationForm />
            <DistillationTable tasks={tasks} onDeleteTask={onDeleteTask} onCopyToTaskForm={onCopyToTaskForm} />
        </SpaceBetween>
    );
};
