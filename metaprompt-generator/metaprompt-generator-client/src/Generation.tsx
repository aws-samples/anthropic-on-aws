import React from 'react';
import { SpaceBetween } from '@cloudscape-design/components';
import { GenerationForm } from './GenerationForm';
import { GenerationTable } from './GenerationTable';
import { Prompt } from './Definitions';

interface GenerationProps {
    prompts: Prompt[];
    copiedTask: string | null;
    onDeletePrompt: (promptId: string) => void;
}

export const Generation: React.FC<GenerationProps> = ({ prompts, copiedTask, onDeletePrompt }) => {
    return (
        <SpaceBetween size="l">
            <GenerationForm copiedTask={copiedTask} />
            <GenerationTable prompts={prompts} onDeletePrompt={onDeletePrompt} />
        </SpaceBetween>
    );
};
