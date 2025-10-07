export function logInfo(message: string, ...args: any[]) {
  console.log(`[INFO] ${message}`, ...args);
}

export function logWarning(message: string, ...args: any[]) {
  console.warn(`[WARNING] ${message}`, ...args);
}

export function logError(message: string, error?: any) {
  console.error(`[ERROR] ${message}`);
  if (error) {
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
      console.error(`Stack trace: ${error.stack}`);
    } else {
      console.error('Additional error details:', error);
    }
  }
}

export function logDebug(message: string, ...args: any[]) {
  if (process.env.DEBUG === 'true') {
    console.debug(`[DEBUG] ${message}`, ...args);
  }
}
