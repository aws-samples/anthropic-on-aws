import {
  updateTicketAssignment,
  getIntercomTeams,
  getSelectedAdmin,
} from './intercomClient';
import { classifyTicket } from './ticketClassifier';
import { TicketAttributes, IntercomTeam } from './types';
import { logInfo, logError } from './utils';

const categoryTeamMap: { [key: string]: string } = {
  'Billing Inquiries': 'Billing',
  'Policy Administration': 'Policy',
  'Claims Assistance': 'Claims',
  'Coverage Explanations': 'Support',
  'Quotes and Proposals': 'Sales',
  'Account Management': 'Account',
  'Billing Disputes': 'Billing',
  'Claims Disputes': 'Claims',
  'Policy Comparisons': 'Sales',
  'General Inquiries': 'Support',
};

async function determineTeam(
  attributes: TicketAttributes,
): Promise<IntercomTeam | undefined> {
  const ticketContent = `${attributes._default_title_}\n${attributes._default_description_}`;
  logInfo(`Classifying ticket: ${ticketContent}`);
  const category = await classifyTicket(ticketContent);
  logInfo(`Ticket classified as: ${category}`);

  const teamName = categoryTeamMap[category] || 'SupportTeam';
  logInfo(`Mapped category to team: ${teamName}`);
  const matchingTeam = getIntercomTeams().find((t) => t.name === teamName);

  if (matchingTeam) {
    logInfo(`Found matching team: ${matchingTeam.name} (${matchingTeam.id})`);
  } else {
    logError(
      `No matching team found for: ${teamName}`,
      new Error('Team not found'),
    );
  }

  return matchingTeam;
}

export async function handleTicketCreated(item: any) {
  logInfo('New ticket created:', item);
  try {
    const team = await determineTeam(item.ticket_attributes);
    const selectedAdmin = getSelectedAdmin();

    if (!selectedAdmin) {
      throw new Error('No admin available for assignment');
    }

    if (team) {
      logInfo(
        `Assigning ticket ${item.id} to team ${team.name} (${team.id}) with admin ${selectedAdmin.name} (${selectedAdmin.id})`,
      );
      await updateTicketAssignment(item.id, team.id);
    } else {
      logError(
        `No suitable team found for ticket ${item.id}`,
        new Error('No suitable team'),
      );
    }
  } catch (error) {
    logError(`Error handling ticket ${item.id}:`, error);
    throw error;
  }
}
