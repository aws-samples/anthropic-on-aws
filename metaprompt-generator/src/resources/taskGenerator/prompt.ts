export const promptTemplate = `Please analyze the following prompt:

<prompt>
{{ORIGINAL_PROMPT}}
</prompt>

First, carefully examine the prompt and try to discern its intended purpose or goal. Consider what task or behavior it seems to be trying to elicit from an AI system.  Take your time and think.  

Write your analysis and the reasoning behind your conclusions in a <reasoning> section.

Next, provide a concise one-sentence summary of what you believe to be the main purpose of the prompt inside <purpose> tags.

Finally, write a sentence that could be used to generate a new prompt in a <new_prompt> section.  The new prompt should be a fresh start using the ideas from the existing prompt but not a line-by-line modification or incremental change to the existing prompt.  `;
