// Definitions.tsx
export enum PromptStatus {
    PENDING = 'PENDING',
    GENERATING = 'GENERATING',
    GENERATED = 'GENERATED',
    ERROR = 'ERROR',
}

export enum TaskStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    ERROR = 'ERROR',
}

export interface Prompt {
    id: string;
    prompt?: string | null | undefined;
    owner: string;
    status: PromptStatus;
    task: string;
    variables?: string[] | null | undefined;
}

export interface Task {
    id: string;
    originalPrompt: string;
    distilledTask?: string | null | undefined;
    owner: string;
    status: TaskStatus;
}
