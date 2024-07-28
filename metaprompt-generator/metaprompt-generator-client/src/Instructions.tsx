import React from 'react';
import { Container, Header, Box, SpaceBetween, ColumnLayout, TextContent } from '@cloudscape-design/components';

export const Instructions: React.FC = () => {
    return (
        <Container>
            <SpaceBetween direction="vertical" size="l">
                <TextContent>
                    <h1>Distillation Tab</h1>
                    The Distillation tab can be used to extract the basic task from an existing prompt. Paste in your
                    working prompt and the core task that it performs will be extracted. This task can be used on the
                    Generation tab to create a prompt for Anthropic Claude. You can copy the task to the Generation tab
                    to turn this task in to a prompt.
                </TextContent>
                <TextContent>
                    <h1>Generation Tab</h1>
                    The Generation tab can be used to generate a prompt to be used with Anthropic Claude models. To
                    generate a prompt, enter a one or two sentence description of the task you want the model to
                    accomplish. This should not be an existing prompt. Variables can be added if you have data to pass
                    in to the prompt.
                </TextContent>
            </SpaceBetween>
        </Container>
    );
};
