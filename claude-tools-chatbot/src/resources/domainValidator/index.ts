import { PreSignUpTriggerHandler } from 'aws-lambda';

const allowedDomain = process.env.ALLOWED_DOMAIN || '';

export const handler: PreSignUpTriggerHandler = async (event, _context) => {
  try {
    const userEmailDomain = event.request.userAttributes.email.split('@')[1];

    if (
      userEmailDomain === allowedDomain ||
      !allowedDomain ||
      allowedDomain.length === 0
    ) {
      return event;
    } else {
      throw new Error(
        'Cannot authenticate users from domains different from ' +
          allowedDomain,
      );
    }
  } catch (error) {
    throw error;
  }
};
