export interface IntercomWebhookPayload {
  type: 'notification_event';
  id: string;
  topic: string;
  data: {
    item: {
      type: string;
      id: string;
      [key: string]: any;
    };
  };
}

export interface IntercomAdmin {
  type: 'admin';
  id: string;
  name: string;
  email: string;
}

export interface IntercomTeam {
  type: 'team';
  id: string;
  name: string;
}

export interface TicketAttributes {
  _default_title_: string;
  _default_description_: string;
  [key: string]: any;
}
