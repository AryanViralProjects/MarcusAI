// User preferences for personalization
export interface UserPreferences {
  // Communication style preferences
  communicationStyle?: 'concise' | 'detailed' | 'casual' | 'formal';
  
  // Subject matter expertise
  expertise?: string[];
  
  // Preferred response format
  responseFormat?: 'markdown' | 'plain' | 'code-focused';
  
  // Personalization level
  personalizationLevel?: 'minimal' | 'moderate' | 'high';
  
  // Preferred examples type
  examplesType?: 'technical' | 'business' | 'creative';
  
  // User's background/context
  background?: string;
  
  // User's goals
  goals?: string[];
}

// Default user preferences
export const defaultPreferences: UserPreferences = {
  communicationStyle: 'concise',
  expertise: [],
  responseFormat: 'markdown',
  personalizationLevel: 'moderate',
  examplesType: 'technical',
  background: '',
  goals: [],
};

// Generate a personalized system message based on user preferences
export function generatePersonalizedSystemMessage(preferences: UserPreferences): string {
  const { communicationStyle, expertise, responseFormat, personalizationLevel } = preferences;
  
  let systemMessage = 'You are Marcus, a helpful AI assistant. ';
  
  // Add communication style instructions
  if (communicationStyle === 'concise') {
    systemMessage += 'Provide brief, to-the-point responses. ';
  } else if (communicationStyle === 'detailed') {
    systemMessage += 'Provide comprehensive, detailed responses. ';
  } else if (communicationStyle === 'casual') {
    systemMessage += 'Use a friendly, conversational tone. ';
  } else if (communicationStyle === 'formal') {
    systemMessage += 'Use a professional, formal tone. ';
  }
  
  // Add expertise context if available
  if (expertise && expertise.length > 0) {
    systemMessage += `Focus on these areas of expertise: ${expertise.join(', ')}. `;
  }
  
  // Add formatting instructions
  if (responseFormat === 'markdown') {
    systemMessage += 'Format responses using Markdown for readability. ';
  } else if (responseFormat === 'code-focused') {
    systemMessage += 'Prioritize code examples and technical details in responses. ';
  }
  
  return systemMessage;
}
