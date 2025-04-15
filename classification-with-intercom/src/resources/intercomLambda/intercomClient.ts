import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import fetch from 'node-fetch';
import { INTERCOM_API_SECRET_NAME, AWS_REGION } from './config';
import { IntercomAdmin, IntercomTeam } from './types';
import { logError, logInfo, logWarning } from './utils';

const secretsManager = new SecretsManagerClient({ region: AWS_REGION });

let intercomToken: string;
let intercomAdmins: IntercomAdmin[] = [];
let intercomTeams: IntercomTeam[] = [];
let selectedAdmin: IntercomAdmin | null = null;

export async function initializeIntercomData() {
  try {
    if (!intercomToken) {
      intercomToken = await getIntercomApiToken();
      logInfo('Intercom API token retrieved');
    }
    if (intercomAdmins.length === 0) {
      intercomAdmins = await fetchIntercomAdmins();
      logInfo(`Fetched ${intercomAdmins.length} Intercom admins`);
      selectedAdmin = findAdminForAssignment();
      if (selectedAdmin) {
        logInfo(
          `Selected admin for assignments: ${selectedAdmin.name} (${selectedAdmin.id})`,
        );
      } else {
        logError(
          'No admin found for assignments',
          new Error('No admin available'),
        );
      }
    }
    if (intercomTeams.length === 0) {
      intercomTeams = await fetchIntercomTeams();
      logInfo(`Fetched ${intercomTeams.length} Intercom teams`);
    }
  } catch (error) {
    logError('Error initializing Intercom data:', error);
    throw error;
  }
}

function findAdminForAssignment(): IntercomAdmin | null {
  const claudeAdmin = intercomAdmins.find((admin) =>
    admin.name.toLowerCase().includes('claude'),
  );
  if (claudeAdmin) {
    return claudeAdmin;
  }

  if (intercomAdmins.length > 0) {
    logWarning(
      "No admin with 'claude' in the name found. Using the first available admin.",
    );
    return intercomAdmins[0];
  }

  return null;
}

async function getIntercomApiToken(): Promise<string> {
  const command = new GetSecretValueCommand({
    SecretId: INTERCOM_API_SECRET_NAME,
  });
  const response = await secretsManager.send(command);
  return response.SecretString || '';
}

async function fetchIntercomAdmins(): Promise<IntercomAdmin[]> {
  const response = await fetch('https://api.intercom.io/admins', {
    method: 'GET',
    headers: {
      'Intercom-Version': '2.11',
      'Authorization': `Bearer ${intercomToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = (await response.json()) as {
    type: string;
    admins: IntercomAdmin[];
  };

  if (data.type !== 'admin.list' || !Array.isArray(data.admins)) {
    throw new Error('Unexpected response format from Intercom API');
  }

  return data.admins;
}

async function fetchIntercomTeams(): Promise<IntercomTeam[]> {
  const response = await fetch('https://api.intercom.io/teams', {
    method: 'GET',
    headers: {
      'Intercom-Version': '2.11',
      'Authorization': `Bearer ${intercomToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = (await response.json()) as {
    type: string;
    teams: IntercomTeam[];
  };

  if (data.type !== 'team.list' || !Array.isArray(data.teams)) {
    throw new Error('Unexpected response format from Intercom API');
  }

  return data.teams;
}

export async function updateTicketAssignment(
  ticketId: string,
  assigneeId: string,
) {
  if (!selectedAdmin) {
    throw new Error('No admin available for assignment');
  }

  logInfo(
    `Attempting to assign ticket ${ticketId} to assignee ${assigneeId} with admin ${selectedAdmin.id}`,
  );
  try {
    const response = await fetch(
      `https://api.intercom.io/tickets/${ticketId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Intercom-Version': '2.11',
          'Authorization': `Bearer ${intercomToken}`,
        },
        body: JSON.stringify({
          assignment: {
            admin_id: selectedAdmin.id,
            assignee_id: assigneeId,
          },
          state: 'in_progress',
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      logError(
        `HTTP error! status: ${response.status}, body: ${errorBody}`,
        new Error(errorBody),
      );
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorBody}`,
      );
    }

    const data = await response.json();
    logInfo(
      `Ticket ${ticketId} successfully assigned to assignee ${assigneeId} with admin ${selectedAdmin.id}`,
    );
    console.log('Ticket assigned: ', ticketId, data);
  } catch (error) {
    logError(`Error assigning ticket ${ticketId}:`, error);
    throw error;
  }
}

export function getIntercomAdmins() {
  return intercomAdmins;
}

export function getIntercomTeams() {
  return intercomTeams;
}

export function getSelectedAdmin() {
  return selectedAdmin;
}
