import { APIGatewayEvent } from 'aws-lambda';
import {
  handleConversationCreated,
  handleConversationReplied,
} from './conversationHandler';
import { initializeIntercomData } from './intercomClient';
import { handleTicketCreated } from './ticketRouter';
import { IntercomWebhookPayload } from './types';

export const lambdaHandler = async (event: APIGatewayEvent) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Method Not Allowed' }),
      };
    }

    const webhookPayload: IntercomWebhookPayload = JSON.parse(
      event.body || '{}',
    );

    if (webhookPayload.type !== 'notification_event') {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid webhook payload type' }),
      };
    }

    console.log(
      'Received webhook payload:',
      JSON.stringify(webhookPayload, null, 2),
    );

    await initializeIntercomData();

    switch (webhookPayload.topic) {
      case 'conversation.user.created':
        await handleConversationCreated(webhookPayload.data.item);
        break;
      case 'conversation.user.replied':
        await handleConversationReplied(webhookPayload.data.item);
        break;
      case 'ticket.created':
        await handleTicketCreated(webhookPayload.data.item);
        break;
      default:
        console.log(`Unhandled topic: ${webhookPayload.topic}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Webhook received and processed successfully',
        id: webhookPayload.id,
        topic: webhookPayload.topic,
      }),
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
