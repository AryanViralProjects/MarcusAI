// Environment variable configuration with type safety

export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    defaultModel: process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'gpt-4o',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
  app: {
    name: 'Marcus',
    description: 'Your personalized AI assistant',
  },
  uploadthing: {
    secret: process.env.UPLOADTHING_SECRET,
    appId: process.env.UPLOADTHING_APP_ID,
    token: process.env.UPLOADTHING_TOKEN,
  }
};

// Validate required environment variables
export function validateEnv() {
  const requiredEnvVars = [
    { key: 'OPENAI_API_KEY', value: config.openai.apiKey },
    { key: 'UPLOADTHING_SECRET', value: config.uploadthing.secret },
    { key: 'UPLOADTHING_APP_ID', value: config.uploadthing.appId },
    { key: 'UPLOADTHING_TOKEN', value: config.uploadthing.token },
  ];

  const missingEnvVars = requiredEnvVars
    .filter(({ value }) => !value)
    .map(({ key }) => key);

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}`
    );
  }
}
