import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AmplifyConfig } from './Config';
import {
  Container,
  Input,
  Button,
  Header,
} from '@cloudscape-design/components';
import { fetchUserAttributes } from 'aws-amplify/auth';
import '@cloudscape-design/global-styles/index.css';
import { Amplify } from 'aws-amplify';
import { v4 as uuidv4 } from 'uuid';
import '@aws-amplify/ui-react/styles.css';
import { generateClient } from 'aws-amplify/api';
import * as mutations from './graphql/mutations';
import * as subscriptions from './graphql/subscriptions';
import './styles/ChatBot.css';
import { Conversation, MessageContent } from './API';
import { InputProps } from '@aws-amplify/ui-react';
import ThinkingDots from './ThinkingDots';

const client = generateClient();
Amplify.configure(AmplifyConfig);

const ChatBot: React.FC = () => {
  const [userInput, setUserInput] = useState('');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [ownerId, setOwnerId] = useState<string | undefined>(undefined);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setConversationId(uuidv4());
  }, []);

  useEffect(() => {
    fetchUserData();
  }, []);

  const subscribeToConversationUpdates = useCallback(
    (ownerId: string, conversationId: string) => {
      return client
        .graphql({
          query: subscriptions.conversationUpdated,
          variables: { ownerId, conversationId },
        })
        .subscribe({
          next: ({ data }) => {
            console.log('Received data', data);
            const updatedConversation = data.conversationUpdated;
            if (updatedConversation) {
              setConversation(updatedConversation);
              const lastMessage =
                updatedConversation.messages[
                  updatedConversation.messages.length - 1
                ];
              if (lastMessage.role === 'assistant') {
                const hasToolUse = lastMessage.content.some(
                  (block) => block.toolUse,
                );
                const hasToolResult = lastMessage.content.some(
                  (block) => block.toolResult,
                );
                if (!hasToolUse && !hasToolResult) {
                  setIsThinking(false);
                  if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                  }
                }
              }
            }
          },
          error: (error: Error) => console.warn(error),
        });
    },
    [],
  );

  useEffect(() => {
    if (ownerId && conversationId) {
      const createSub = subscribeToConversationUpdates(ownerId, conversationId);
      return () => {
        createSub.unsubscribe();
      };
    }
  }, [ownerId, conversationId, subscribeToConversationUpdates]);

  const fetchUserData = async () => {
    try {
      const userAttributes = await fetchUserAttributes();
      setOwnerId(userAttributes.sub);
    } catch (error) {
      console.error('Error fetching user attributes:', error);
    }
  };

  const handleInputChange = (event: {
    detail: { value: React.SetStateAction<string> };
  }) => {
    setUserInput(event.detail.value);
  };

  const handleKeyDown = (event: CustomEvent<InputProps>) => {
    if (event.detail.key === 'Enter') {
      handleSubmit();
      event.preventDefault();
    }
  };

  const handleClear = () => {
    setConversation(null);
    setConversationId(uuidv4());
    setUserInput('');
    setError('');
    setIsThinking(false);
  };

  const handleSubmit = async () => {
    setIsThinking(true);
    setUserInput('');
    setError('');

    timeoutRef.current = setTimeout(() => {
      setError(
        'Oops! It seems like the bot is taking longer than expected to respond. Please try again later.',
      );
      setIsThinking(false);
    }, 60000);

    try {
      await client.graphql({
        query: mutations.processMessage,
        variables: {
          ownerId: ownerId!,
          message: {
            content: [{ text: userInput }],
            role: 'user',
          },
          conversationId: conversationId!,
        },
      });
    } catch (error) {
      console.error('Error processing message:', error);
      setIsThinking(false);
      setError(
        'An error occurred while processing your message. Please try again.',
      );
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };

  const renderMessageContent = (content: MessageContent[]) => {
    const hasToolUse = content.some((block) => block.toolUse);
    if (hasToolUse) {
      return null;
    }

    const hasToolResult = content.some((block) => block.toolResult);
    if (hasToolResult) {
      return null;
    }

    return content.map((block, index) => {
      if (block.text) {
        const hasReplyTags = /<reply>(.*?)<\/reply>/s.test(block.text);
        if (hasReplyTags) {
          const extractedText = block.text.match(/<reply>(.*?)<\/reply>/s);
          if (extractedText) {
            return <div key={index}>{extractedText[1]}</div>;
          }
        } else {
          return <div key={index}>{block.text}</div>;
        }
      }
      return null;
    });
  };

  return (
    <Container
      header={
        <Header actions={<Button onClick={handleClear}>Clear</Button>}></Header>
      }
    >
      <div className='chat-container'>
        <div className='message-list'>
          {conversation?.messages.map((message, index) => {
            const messageContent = renderMessageContent(message.content);
            if (messageContent) {
              return (
                <div
                  key={index}
                  className={`message-container ${
                    message.role === 'user' ? 'user-message' : 'bot-message'
                  }`}
                >
                  <div className='message-bubble'>{messageContent}</div>
                </div>
              );
            }
            return null;
          })}
          {isThinking && (
            <div className='message-container bot-message'>
              <div className='message-bubble thinking-bubble'>
                <ThinkingDots />
              </div>
            </div>
          )}
          {error && (
            <div className='message-container bot-message'>
              <div className='message-bubble error-bubble'>{error}</div>
            </div>
          )}
        </div>
      </div>
      <div className='input-container'>
        <div className='input-wrapper'>
          <Input
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder='Enter your message...'
            className='message-input'
          />
        </div>
        <Button onClick={handleSubmit}>Send</Button>
      </div>
    </Container>
  );
};

export default ChatBot;
