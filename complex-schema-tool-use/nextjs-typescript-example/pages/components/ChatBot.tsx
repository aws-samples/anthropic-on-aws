import React, { useState, useEffect } from 'react';
import {
  Input,
  Button,
  Container,
  Header,
} from '@cloudscape-design/components';
import styles from '../styles/ChatBot.module.css';
import { Message, ConversationRole } from '@aws-sdk/client-bedrock-runtime';
import ThinkingDots from './ThinkingDots';

const ChatBot: React.FC = () => {
  const [userInput, setUserInput] = useState('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const clearConversation = () => {
      setConversation([]);
      setUserInput('');
      setError('');
      setIsThinking(false);
    };

    clearConversation();
  }, []);

  const handleInputChange = (event: {
    detail: { value: React.SetStateAction<string> };
  }) => {
    setUserInput(event.detail.value);
  };

  const handleKeyDown = (event: CustomEvent<any>) => {
    if (event.detail.key === 'Enter') {
      handleSubmit();
      event.preventDefault();
    }
  };

  const handleClear = () => {
    setConversation([]);
    setUserInput('');
    setError('');
    setIsThinking(false);
  };

  const handleSubmit = async () => {
    setIsThinking(true);
    setError('');

    const userMessage: Message = {
      role: 'user',
      content: [{ text: userInput }],
    };
    setConversation([...conversation, userMessage]);
    setUserInput('');

    try {
      const response = await fetch('/api/pizza-order', {
        method: 'POST',
        body: JSON.stringify({ userInput, conversationHistory: conversation }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      const assistantMessage: Message = data.output.message;
      const stopReason = data.stopReason;

      if (stopReason === 'tool_use') {
        setConversation([
          ...conversation,
          userMessage,
          {
            role: 'assistant' as ConversationRole,
            content: [{ text: 'Pizza ready to be ordered.' }],
          },
        ]);
      } else {
        setConversation([...conversation, userMessage, assistantMessage]);
      }

      setUserInput('');
    } catch (error) {
      console.error('Error processing message:', error);
      setError(
        'An error occurred while processing your message. Please try again.',
      );
    }

    setIsThinking(false);
  };

  const extractReply = (message: Message): string => {
    const text = message.content?.[0]?.text;
    if (!text) {
      return '';
    }
    const replyRegex = /<reply>([\s\S]*?)<\/reply>/;
    const match = text.match(replyRegex);
    return match ? match[1].trim() : text;
  };
  return (
    <Container
      header={
        <Header actions={<Button onClick={handleClear}>Clear</Button>}></Header>
      }
    >
      <div className={styles.chatContainer}>
        <div className={styles.messageList}>
          {isThinking && (
            <div className={`${styles.messageContainer} ${styles.botMessage}`}>
              <div
                className={`${styles.messageBubble} ${styles.thinkingBubble}`}
              >
                <ThinkingDots />
              </div>
            </div>
          )}
          {error && (
            <div className={`${styles.messageContainer} ${styles.botMessage}`}>
              <div className={`${styles.messageBubble} ${styles.errorBubble}`}>
                {error}
              </div>
            </div>
          )}
          {conversation
            .slice()
            .reverse()
            .map((message, index) => (
              <div
                key={index}
                className={`${styles.messageContainer} ${
                  message.role === 'user'
                    ? styles.userMessage
                    : styles.botMessage
                }`}
              >
                <div className={styles.messageBubble}>
                  {message.role === 'user'
                    ? message.content?.[0]?.text
                    : extractReply(message)}
                </div>
              </div>
            ))}
        </div>
      </div>
      <div className={styles.inputContainer}>
        <Input
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder='Enter your message...'
          className={styles.messageInput}
        />
        <Button onClick={handleSubmit}>Send</Button>
      </div>
    </Container>
  );
};

export default ChatBot;
