// Personalization settings and utilities for Marcus

// User preferences that can be saved and loaded
export interface UserPreferences {
  name?: string;
  interests?: string[];
  communicationStyle?: 'formal' | 'casual' | 'friendly' | 'professional';
  aiPersonality?: 'helpful' | 'creative' | 'analytical' | 'empathetic';
  theme?: 'light' | 'dark' | 'system';
}

// Default preferences if none are set
export const defaultPreferences: UserPreferences = {
  communicationStyle: 'friendly',
  aiPersonality: 'helpful',
  theme: 'system',
};

// Generate a personalized system message based on user preferences
export function generatePersonalizedSystemMessage(preferences: UserPreferences = defaultPreferences): string {
  const { name, interests, communicationStyle, aiPersonality } = preferences;
  
  // Base personality traits
  const personalityTraits = {
    helpful: 'focused on providing useful and practical information',
    creative: 'imaginative and offering unique perspectives',
    analytical: 'logical and detail-oriented in your analysis',
    empathetic: 'understanding and supportive of emotions and personal situations',
  };
  
  // Communication style guidelines
  const communicationStyles = {
    formal: 'Use proper language and maintain a respectful tone.',
    casual: 'Be relaxed and conversational in your responses.',
    friendly: 'Be warm and approachable, using an upbeat tone.',
    professional: 'Be clear, concise, and business-appropriate.',
  };

  // Build the personalized system message
  let systemMessage = `You are Marcus, a personalized AI assistant`;
  
  if (name) {
    systemMessage += ` for ${name}`;
  }
  
  systemMessage += `. You are ${personalityTraits[aiPersonality || 'helpful']}.`;
  systemMessage += ` ${communicationStyles[communicationStyle || 'friendly']}`;
  
  if (interests && interests.length > 0) {
    systemMessage += ` Pay special attention to topics related to: ${interests.join(', ')}.`;
  }
  
  systemMessage += `\n\nAlways be helpful, accurate, and ethical in your responses.`;
  systemMessage += `\nIf you don't know something, be honest about it rather than making up information.`;
  systemMessage += `\nKeep responses concise but informative.`;
  
  return systemMessage;
}

// Save user preferences to local storage
export function saveUserPreferences(preferences: UserPreferences): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('marcus-user-preferences', JSON.stringify(preferences));
  }
}

// Load user preferences from local storage
export function loadUserPreferences(): UserPreferences {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('marcus-user-preferences');
    if (saved) {
      try {
        return { ...defaultPreferences, ...JSON.parse(saved) };
      } catch (error) {
        console.error('Error parsing saved user preferences:', error);
      }
    }
  }
  
  return defaultPreferences;
}
