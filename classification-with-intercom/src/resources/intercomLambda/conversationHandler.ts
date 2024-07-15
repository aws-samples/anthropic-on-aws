import { getIntercomAdmins } from './intercomClient';

function findClaudeAdmin() {
  return getIntercomAdmins().find((admin) =>
    admin.name.toLowerCase().includes('claude'),
  );
}

async function routeConversation(conversationId: string, adminId: string) {
  // Implement conversation routing logic here
  console.log(`Routing conversation ${conversationId} to admin ${adminId}`);
}

export async function handleConversationCreated(item: any) {
  console.log('New conversation created:', item);
  const claudeAdmin = findClaudeAdmin();
  if (claudeAdmin) {
    await routeConversation(item.id, claudeAdmin.id);
  }
}

export async function handleConversationReplied(item: any) {
  console.log('User replied to conversation:', item);
  // Implement your logic here
}
