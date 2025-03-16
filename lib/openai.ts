import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize API clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Message interface
export interface Message {
  id: string;
  role: string;
  content: string;
  timestamp: string;
  attachments?: any[];
  citations?: any[];
}

// Define model types
export enum ModelType {
  GPT_4_5 = 'gpt-4.5-preview-2025-02-27',
  GPT_4O_MINI_SEARCH = 'gpt-4o-search-preview-2025-03-11',
  GPT_4_TURBO = 'gpt-4-turbo-preview',
  CLAUDE_3_7_SONNET = 'claude-3-7-sonnet-20250219',
  GEMINI_2_0 = 'gemini-2.0-flash',
}

// Define tool types
export enum ToolType {
  WEB_SEARCH = 'web_search',
  FILE_SEARCH = 'file_search',
  COMPUTER_USE = 'computer_use',
}

// Interfaces for Responses API
interface ResponseAnnotation {
  type: string;
  start_index: number;
  end_index: number;
  url?: string;
  title?: string;
}

interface ResponseContent {
  type: string;
  text: string;
  annotations?: ResponseAnnotation[];
}

interface ResponseItem {
  id: string;
  type: string;
  status: string;
  content?: ResponseContent[];
  role?: string;
}

// OpenAI Responses API types
interface UrlCitationAnnotation {
  type: "url_citation";
  start_index: number;
  end_index: number;
  url: string;
  title?: string;
}

interface OutputTextContent {
  type: "output_text";
  text: string;
  annotations?: UrlCitationAnnotation[];
}

interface MessageItem {
  type: "message";
  id: string;
  role: string;
  content: OutputTextContent[];
  status: string;
}

interface ResponseData {
  id: string;
  created_at: number;
  items: MessageItem[];
}

// Define the Citation interface
export interface Citation {
  id: number;
  url: string;
  title: string;
  text: string;
}

// Helper function to add system message
function addSystemMessage(messages: any[]): any[] {
  const systemMessage = {
    role: "system",
    content: "You are Marcus AI, a helpful AI assistant created by Aryan Bhargav."
  };
  
  const hasSystemMessage = messages.some(msg => msg.role === "system");
  
  if (!hasSystemMessage) {
    return [systemMessage, ...messages];
  }
  
  return messages;
}

// Helper function to format messages for OpenAI API
function formatMessagesForOpenAI(messages: any[]): ChatCompletionMessageParam[] {
  return messages.map(message => {
    // Handle system messages
    if (message.role === 'system') {
      return {
        role: 'system',
        content: message.content
      };
    }
    
    // Handle messages with attachments (images)
    if (message.attachments && message.attachments.length > 0) {
      const imageAttachments = message.attachments.filter((att: any) => 
        att.type === 'image' && att.url
      );
      
      if (imageAttachments.length > 0) {
        // Format as multimodal content
        const content: any[] = [];
        
        // Add text content if present
        if (message.content) {
          content.push({
            type: 'text',
            text: message.content
          });
        }
        
        // Add image URLs
        imageAttachments.forEach((att: any) => {
          content.push({
            type: 'image_url',
            image_url: {
              url: att.url,
              detail: 'high'
            }
          });
        });
        
        return {
          role: message.role,
          content
        };
      }
    }
    
    // Regular text message
    return {
      role: message.role,
      content: message.content
    };
  });
}

// Format messages for Anthropic API
function formatMessagesForAnthropic(messages: any[]): { system?: string; messages: any[] } {
  // Extract system message if present
  const systemMessage = messages.find(msg => msg.role === 'system');
  const userAssistantMessages = messages.filter(msg => msg.role !== 'system');
  
  // Format the user and assistant messages
  const formattedMessages = userAssistantMessages.map(message => {
    return {
      role: message.role === 'user' ? 'user' : 'assistant',
      content: typeof message.content === 'string' ? 
        [{ type: 'text', text: message.content }] : 
        [{ type: 'text', text: JSON.stringify(message.content) }]
    };
  });
  
  // Return formatted structure with system message as a separate parameter
  return {
    system: systemMessage ? systemMessage.content : undefined,
    messages: formattedMessages
  };
}

// Format messages for Google Gemini model with proper type safety
function formatMessagesForGemini(messages: any[]) {
  return messages.map(msg => {
    const getContentText = (content: any): string => {
      if (typeof content === 'string') {
        return content;
      }
      if (content && typeof content === 'object') {
        return JSON.stringify(content);
      }
      return '';
    };

    // Create safe content part
    const createTextPart = (textContent: string) => {
      return { text: textContent };
    };

    // Handle user messages
    if (msg.role === 'user') {
      return {
        role: 'user',
        parts: [createTextPart(getContentText(msg.content))]
      };
    }
    // Handle assistant messages
    else if (msg.role === 'assistant') {
      return {
        role: 'model',
        parts: [createTextPart(getContentText(msg.content))]
      };
    }
    // Handle system messages
    else if (msg.role === 'system') {
      return {
        role: 'user',
        parts: [createTextPart(`System: ${getContentText(msg.content)}`)]
      };
    }
    // Default case - unknown role
    return {
      role: 'user',
      parts: [createTextPart(getContentText(msg.content))]
    };
  });
}

// Web search functionality using OpenAI chat completions API
async function handleWebSearch(query: string): Promise<{ content: string, citations: Citation[] }> {
  try {
    console.log("Performing web search for:", query);
    
    // Use the specified model that supports web search
    const response = await openai.chat.completions.create({
      model: ModelType.GPT_4O_MINI_SEARCH, // Use the model that supports web search
      messages: [
        {
          role: "system",
          content: "You are Marcus AI, a helpful AI assistant created by Aryan Bhargav. When answering questions, search the web for current information and cite your sources with markdown links."
        },
        {
          role: "user",
          content: query
        }
      ]
    });
    
    console.log("Search response:", JSON.stringify(response, null, 2));
    
    // Extract content from the response
    let content = '';
    const citations: Citation[] = [];
    
    if (response.choices && response.choices.length > 0 && response.choices[0].message) {
      const message = response.choices[0].message;
      content = message.content || '';
      
      // Extract URL citations from annotations if present
      if (message.annotations && Array.isArray(message.annotations)) {
        message.annotations.forEach((annotation, index) => {
          if (annotation.type === 'url_citation' && annotation.url_citation) {
            const { url, title, start_index, end_index } = annotation.url_citation;
            
            citations.push({
              id: index + 1,
              url: url,
              title: title || `Source ${index + 1}`,
              text: getTextSnippet(content, start_index, end_index) || "Citation from web search"
            });
          }
        });
      }
    }
    
    return {
      content,
      citations
    };
  } catch (error) {
    console.error("Error in web search:", error);
    throw error;
  }
}

// Helper function to get text snippet from citation
function getTextSnippet(text: string, startIndex: number, endIndex: number): string {
  if (typeof text !== 'string' || typeof startIndex !== 'number' || typeof endIndex !== 'number') {
    return '';
  }
  
  try {
    return text.substring(startIndex, endIndex);
  } catch (e) {
    console.error("Error extracting text snippet:", e);
    return '';
  }
}

// Format web search results with citations for display
function formatWebSearchResult(content: string, citations: Citation[]): string {
  if (citations.length === 0) {
    return content;
  }
  
  let formattedContent = content;
  
  // Replace markdown links with circled numbers
  citations.forEach((citation, index) => {
    const circledNumber = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"][index] || `[${index + 1}]`;
    
    // Create a regex to find markdown links that match this citation's URL
    const linkRegex = new RegExp(`\\[([^\\]]+)\\]\\(${citation.url.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\)`, 'g');
    formattedContent = formattedContent.replace(linkRegex, `$1 ${circledNumber}`);
  });
  
  // Generate HTML for each citation
  const citationLinks = citations.map((citation, index) => {
    const circledNumber = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"][index] || `[${index + 1}]`;
    
    return `<div class="citation">
      <a href="${citation.url}" target="_blank" rel="noopener noreferrer" class="citation-link">
        <span class="citation-number">${circledNumber}</span>
        <span class="citation-title">${citation.title}</span>
      </a>
      <div class="citation-url">${citation.url}</div>
    </div>`;
  }).join('\n');
  
  // Convert content to HTML paragraphs and format markdown
  formattedContent = formattedContent
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
    .replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italic text
  
  formattedContent = '<p>' + formattedContent.replace(/\n\n/g, '</p><p>') + '</p>';
  
  // Add the sources section
  formattedContent += `
<div class="sources-section">
  <div class="sources-header">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="16"></line>
    <line x1="8" y1="12" x2="16" y2="12"></line>
    </svg>
    <span>Sources</span>
  </div>
  <div class="citations-container">
    ${citationLinks}
  </div>
</div>`;
  
  return formattedContent;
}

// Get completion from OpenAI
async function getOpenAICompletion(messages: any[]): Promise<string> {
  try {
    // Add system message and format messages
    const formattedMessages = formatMessagesForOpenAI(addSystemMessage(messages));
    
    // Get completion from OpenAI
    const response = await openai.chat.completions.create({
      model: ModelType.GPT_4_5,
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 2000
    });
    
    // Return the content
    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Error in getOpenAICompletion:", error);
    throw error;
  }
}

// Interface for Anthropic API response
interface AnthropicTextBlock {
  type: 'text';
  text: string;
}

interface AnthropicContentBlock {
  type: string;
  [key: string]: any;
}

// Get completion from Anthropic
async function getAnthropicCompletion(messages: any[]): Promise<string> {
  try {
    // Add system message and format messages
    const formattedMessages = formatMessagesForAnthropic(addSystemMessage(messages));
    
    // Get completion from Anthropic
    const response = await anthropic.messages.create({
      model: ModelType.CLAUDE_3_7_SONNET,
      max_tokens: 2000,
      temperature: 0.7,
      system: formattedMessages.system,
      messages: formattedMessages.messages
    });
    
    // Return the content - safely handle different content types
    if (response.content && Array.isArray(response.content) && response.content.length > 0) {
      const contentBlock = response.content[0] as AnthropicContentBlock;
      
      // Check if content block is text type (most common)
      if (contentBlock.type === 'text' && typeof contentBlock.text === 'string') {
        return contentBlock.text;
      }
      
      // For older API versions or different content types
      if (typeof contentBlock === 'object' && contentBlock !== null) {
        // Try to extract text content using different property approaches
        for (const key of ['text', 'value', 'content']) {
          if (key in contentBlock && typeof contentBlock[key] === 'string') {
            return contentBlock[key];
          }
        }
        
        // Last resort - stringify the content (will rarely be needed)
        return `${JSON.stringify(contentBlock)}`;
      }
    }
    
    return ""; // Fallback if no valid content is found
  } catch (error) {
    console.error("Error in getAnthropicCompletion:", error);
    throw error;
  }
}

// Get completion from Google Gemini with proper type handling
async function getGeminiCompletion(messages: any[]): Promise<string> {
  try {
    // Add system message and format messages
    const formattedMessages = formatMessagesForGemini(addSystemMessage(messages));
    
    // Initialize Gemini model with the correct model name
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Extract the user's message safely
    const lastMessage = formattedMessages[formattedMessages.length - 1];
    let inputText = '';
    
    // Type-safe way to extract text from the message
    if (lastMessage && 
        lastMessage.parts && 
        Array.isArray(lastMessage.parts) && 
        lastMessage.parts.length > 0 && 
        typeof lastMessage.parts[0] === 'object' && 
        lastMessage.parts[0] !== null &&
        'text' in lastMessage.parts[0]) {
      
      inputText = String(lastMessage.parts[0].text || '');
    }
    
    // Generate content directly
    const result = await model.generateContent(inputText);
    
    // Handle the response safely
    if (result && result.response) {
      try {
        return result.response.text();
      } catch (textError) {
        console.error("Error getting text from Gemini response:", textError);
        return "Sorry, I couldn't generate a proper response.";
      }
    }
    
    return "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error in getGeminiCompletion:", error);
    throw error;
  }
}

// Main function to handle file search
async function handleFileSearch(query: string): Promise<string> {
  // This is a placeholder - real implementation would depend on your file search setup
  return `File search results for "${query}" would appear here.`;
}

// Main function to handle computer use
async function handleComputerUse(query: string): Promise<string> {
  // This is a placeholder - real implementation would depend on your computer use setup
  return `Computer use results for "${query}" would appear here.`;
}

// Main function to get chat completion from any model
export async function getChatCompletion(
  messages: any[],
  model: string = ModelType.GPT_4_5,
  tools: ToolType[] = []
): Promise<Message> {
  try {
    console.log("getChatCompletion called with model:", model);
    console.log("getChatCompletion called with tools:", tools);
    
    // Extract the last user message
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
    const userInput = lastUserMessage?.content || "";
    
    // Handle tools if selected
    if (tools.length > 0) {
      // Web Search tool - always use the dedicated search model
      if (tools.includes(ToolType.WEB_SEARCH)) {
        try {
          const { content, citations } = await handleWebSearch(userInput);
          const formattedContent = formatWebSearchResult(content, citations);
          
          return {
            id: Date.now().toString(),
            role: "assistant",
            content: formattedContent,
            timestamp: new Date().toISOString(),
            citations: citations
          };
        } catch (error) {
          console.error("Web search error:", error);
          // Fall back to regular completion with GPT-4.5
        }
      }
      
      // File Search tool
      if (tools.includes(ToolType.FILE_SEARCH)) {
        try {
          const content = await handleFileSearch(userInput);
          
          return {
            id: Date.now().toString(),
            role: "assistant",
            content: content,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          console.error("File search error:", error);
          // Fall back to regular completion
        }
      }
      
      // Computer Use tool
      if (tools.includes(ToolType.COMPUTER_USE)) {
        try {
          const content = await handleComputerUse(userInput);
          
          return {
            id: Date.now().toString(),
            role: "assistant",
            content: content,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          console.error("Computer use error:", error);
          // Fall back to regular completion
        }
      }
    }
    
    // Continue with regular model completion if no tools or if tools had errors
    let content = "";
    
    // Use the selected model (don't override with GPT-4.5 if the user selected a different model)
    // Only override for web search
    if (tools.includes(ToolType.WEB_SEARCH)) {
      model = ModelType.GPT_4O_MINI_SEARCH;
    }
    
    switch (model) {
      case ModelType.GPT_4_5:
        content = await getOpenAICompletion(messages);
        break;
      case ModelType.CLAUDE_3_7_SONNET:
        content = await getAnthropicCompletion(messages);
        break;
      case ModelType.GEMINI_2_0:
        content = await getGeminiCompletion(messages);
        break;
      default:
        // If the model string doesn't match any enum value, try to determine which provider to use
        if (model.startsWith("gpt")) {
          content = await getOpenAICompletion(messages);
        } else if (model.startsWith("claude")) {
          content = await getAnthropicCompletion(messages);
        } else if (model.startsWith("gemini")) {
          content = await getGeminiCompletion(messages);
        } else {
          // Default to OpenAI if we can't determine
          content = await getOpenAICompletion(messages);
        }
    }
    
    // Return formatted message
    return {
      id: Date.now().toString(),
      role: "assistant",
      content: content,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error in getChatCompletion:", error);
    throw error;
  }
}

// Main function to send a message
export async function sendMessage(
  messages: Message[],
  userPreferences: any,
  selectedModel: string,
  selectedTools: string[] = []
): Promise<Message> {
  try {
    console.log("Sending message with model:", selectedModel);
    console.log("Selected tools:", selectedTools);
    
    // Convert tools to enum
    const tools = selectedTools.map(tool => tool as ToolType);
    
    // Get completion
    return await getChatCompletion(messages, selectedModel, tools);
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw error;
  }
}

export { openai, anthropic, genAI };
