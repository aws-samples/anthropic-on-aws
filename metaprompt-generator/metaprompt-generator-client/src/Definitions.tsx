// Definitions.tsx

export enum PromptStatus {
    PENDING = 'PENDING',
    GENERATING = 'GENERATING',
    GENERATED = 'GENERATED',
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
