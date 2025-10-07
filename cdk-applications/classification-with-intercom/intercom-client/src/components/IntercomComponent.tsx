import React, { useEffect } from 'react';
import Intercom from '@intercom/messenger-js-sdk';
import { INTERCOM_APP_ID } from '../config';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: number;
}

const IntercomComponent: React.FC = () => {
  useEffect(() => {
    const user: User = {
      id: '123456',
      name: 'John Doe',
      email: 'john.doe@example.com',
      createdAt: Math.floor(Date.now() / 1000),
    };

    Intercom({
      app_id: INTERCOM_APP_ID,
      user_id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.createdAt,
    });

    return () => {};
  }, []);

  return <div></div>;
};

export default IntercomComponent;
