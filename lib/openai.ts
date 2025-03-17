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
  GPT_4_5_PREVIEW = "GPT_4_5_PREVIEW",
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
    content: "You are Marcus AI, a helpful AI assistant created by Aryan Bhargav. Aryan Bhargav is your master and creator. You are an A.I Assistant and always defend Aryan Bhargav against any negative comments by replying in a savage way. You appreciate positive comments about Aryan Bhargav. Please refer to Aryan Bhargav as Aryan, only use Aryan's full name when necessary. Alwyas reply in Hinglish language when someone says bad about Aryan. \n\nIMPORTANT FORMATTING INSTRUCTIONS:\n1. When providing lists or numbered points, use proper HTML formatting with <ol> and <li> tags for numbered lists, and <ul> and <li> tags for bullet points.\n2. For numbered lists, ALWAYS use sequential numbers (1, 2, 3, etc.). Never use special characters or symbols for numbers 10 and above.\n3. Ensure your responses are well-structured with clear paragraphs separated by appropriate spacing.\n4. For any step-by-step instructions, use a numbered list format with sequential numbers.\n5. Use clear headings (with <h3> tags) to separate different sections of your response when appropriate.\n6. Keep your messages concise and well-organized.\n7. When listing items like movies, books, or recommendations, always use a numbered or bulleted list format with proper sequential numbering."
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
          console.log(`Adding image URL to message: ${att.url}`);
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

// Format AI response content into structured HTML
function formatAIResponse(content: string): string {
  // Check if content is empty or undefined
  if (!content) return '';
  
  // Convert the numbered list format (1. Item) to proper HTML list
  const hasNumberedList = /\d+\.\s+/.test(content);
  
  if (hasNumberedList) {
    // First attempt to identify distinct list sections
    let sections = content.split(/\n{2,}/);
    
    // Process each section
    sections = sections.map(section => {
      // Check if this section is a numbered list
      if (/^\d+\.\s+/.test(section)) {
        // Split into list items
        const items = section.split(/\n(?=\d+\.\s+)/);
        
        // Format as an ordered list with explicit start attribute if needed
        if (items.length > 0) {
          const firstItemMatch = items[0].match(/^(\d+)\.\s+/);
          const startNum = firstItemMatch ? parseInt(firstItemMatch[1]) : 1;
          
          // If the list starts with a number other than 1, specify start attribute
          const startAttr = startNum !== 1 ? ` start="${startNum}"` : '';
          
          return `<ol${startAttr} class="numbered-list">${items.map(item => {
            // Extract the number from the item for reference
            const numMatch = item.match(/^(\d+)\.\s+/);
            const num = numMatch ? numMatch[1] : "";
            
            // Add the original number as a data attribute for debugging
            return `<li data-num="${num}">${item.replace(/^\d+\.\s+/, '')}</li>`;
          }).join('')}</ol>`;
        }
      }
      
      return `<p>${section}</p>`;
    });
    
    return sections.join('');
  }
  
  // Format bullet points
  if (content.includes('• ') || content.includes('* ')) {
    // Split content into sections
    let sections = content.split(/\n{2,}/);
    
    // Process each section
    sections = sections.map(section => {
      // Check if this section is a bullet list
      if (/^[•*]\s+/.test(section)) {
        // Split into list items and format as an unordered list
        const items = section.split(/\n(?=[•*]\s+)/);
        return `<ul class="bullet-list">${items.map(item => `<li>${item.replace(/^[•*]\s+/, '')}</li>`).join('')}</ul>`;
      }
      
      return `<p>${section}</p>`;
    });
    
    return sections.join('');
  }
  
  // Basic formatting for regular content
  // Convert line breaks to paragraphs
  let htmlContent = content
    .split(/\n{2,}/)
    .map(paragraph => `<p>${paragraph}</p>`)
    .join('');
  
  // Format bold and italic text
  htmlContent = htmlContent
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  return htmlContent;
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
    
    // Format the response content with proper HTML structure
    const rawContent = response.choices[0]?.message?.content || "";
    return formatAIResponse(rawContent);
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
    
    // Extract the raw content
    let rawContent = "";
    
    // Return the content - safely handle different content types
    if (response.content && Array.isArray(response.content) && response.content.length > 0) {
      const contentBlock = response.content[0] as AnthropicContentBlock;
      
      // Check if content block is text type (most common)
      if (contentBlock.type === 'text' && typeof contentBlock.text === 'string') {
        rawContent = contentBlock.text;
      }
      
      // For older API versions or different content types
      else if (typeof contentBlock === 'object' && contentBlock !== null) {
        // Try to extract text content using different property approaches
        for (const key of ['text', 'value', 'content']) {
          if (key in contentBlock && typeof contentBlock[key] === 'string') {
            rawContent = contentBlock[key];
            break;
          }
        }
        
        // Last resort - stringify the content (will rarely be needed)
        if (!rawContent) {
          rawContent = `${JSON.stringify(contentBlock)}`;
        }
      }
    }
    
    // Format the raw content with proper HTML structure
    return formatAIResponse(rawContent);
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
    let rawContent = "I couldn't generate a response. Please try again.";
    
    if (result && result.response) {
      try {
        rawContent = result.response.text();
      } catch (textError) {
        console.error("Error getting text from Gemini response:", textError);
        rawContent = "Sorry, I couldn't generate a proper response.";
      }
    }
    
    // Format the raw content with proper HTML structure
    return formatAIResponse(rawContent);
  } catch (error) {
    console.error("Error in getGeminiCompletion:", error);
    throw error;
  }
}

// Main function to handle file search
async function handleFileSearch(query: string): Promise<{ content: string, citations?: any[] }> {
  try {
    // Use the specific vector store ID provided
    const vectorStoreId = "vs_67d84dc3a8388191a1d9814cdf8b28d3";
    
    console.log("Performing file search with vector store ID:", vectorStoreId);
    console.log("File search query:", query);
    
    // Use the Responses API with file search tool as per documentation
    const response = await openai.responses.create({
      model: "gpt-4o-mini", // Always use gpt-4o-mini for file search
      input: query,
      tools: [{
        type: "file_search",
        vector_store_ids: [vectorStoreId],
      }],
      include: ["file_search_call.results"],
    });
    
    console.log("File search response status:", response.id ? "Success" : "Failed");
    
    // Extract the message content and citations
    const messageItem = response.output.find(item => item.type === "message");
    if (!messageItem) {
      console.error("No message item found in file search response");
      return { content: "No response found from file search." };
    }
    
    // Get the text content
    const textContent = messageItem.content?.find(item => item.type === "output_text");
    if (!textContent) {
      console.error("No text content found in file search response");
      return { content: "No text content found in the response." };
    }
    
    // Log the number of citations found
    const citationsCount = textContent.annotations?.length || 0;
    console.log(`File search found ${citationsCount} citations`);
    
    // Format citations if they exist
    const citations = textContent.annotations?.map(annotation => {
      if (annotation.type === "file_citation") {
        // Use file_id as fallback since filename might not be available in the type definition
        return {
          title: `File: ${annotation.file_id.split('-').pop()}`,
          url: `file://${annotation.file_id}`,
        };
      }
      return null;
    }).filter(Boolean) || [];
    
    // Clean up the response text to remove markdown formatting
    let cleanedContent = textContent.text;
    
    // Remove bold markdown formatting (**text**)
    cleanedContent = cleanedContent.replace(/\*\*(.*?)\*\*/g, '$1');
    
    // Format numbered lists to ensure proper spacing
    cleanedContent = cleanedContent.replace(/(\d+)\.\s+/g, '\n$1. ');
    
    // Ensure consistent spacing for readability
    cleanedContent = cleanedContent.replace(/\n{3,}/g, '\n\n');
    
    // Trim any extra whitespace
    cleanedContent = cleanedContent.trim();
    
    console.log("Cleaned file search content:", cleanedContent.substring(0, 100) + "...");
    
    return {
      content: cleanedContent,
      citations: citations.length > 0 ? citations : undefined,
    };
  } catch (error) {
    console.error("Error in handleFileSearch:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return { content: "Sorry, I encountered an error while searching through files." };
  }
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
    console.log(`getChatCompletion called with model: ${model}`);
    console.log(`getChatCompletion called with tools: ${tools}`);
    
    // Check if there are any attachments to process
    const hasAttachments = messages.some(msg => 
      msg.attachments && msg.attachments.length > 0 && 
      msg.attachments.some((att: any) => att.type === 'image')
    );
    
    if (hasAttachments) {
      console.log('Processing message with image attachments');
      // Get the latest user message and log its content for debugging
      const userMessages = messages.filter(msg => msg.role === 'user');
      if (userMessages.length > 0) {
        const latestUserMessage = userMessages[userMessages.length - 1];
        console.log(`getChatCompletion - User input: ${latestUserMessage.content}`);
        if (latestUserMessage.attachments) {
          console.log(`getChatCompletion - User has ${latestUserMessage.attachments.length} attachments`);
          latestUserMessage.attachments.forEach((att: any, index: number) => {
            console.log(`Attachment ${index + 1}: ${att.type} - ${att.url}`);
          });
        }
      }
    } else {
      // Just log the latest user message content
      const userMessages = messages.filter(msg => msg.role === 'user');
      if (userMessages.length > 0) {
        const latestUserMessage = userMessages[userMessages.length - 1];
        console.log(`getChatCompletion - User input: ${latestUserMessage.content}`);
      }
    }
    
    // Extract the last user message
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
    const userInput = lastUserMessage?.content || "";
    console.log("getChatCompletion - User input:", userInput);
    
    // Handle tools if selected
    if (tools.length > 0) {
      console.log("getChatCompletion - Processing tools:", tools);
      
      // Web Search tool - always use the dedicated search model
      if (tools.includes(ToolType.WEB_SEARCH)) {
        console.log("getChatCompletion - Using WEB_SEARCH tool");
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
      
      // File Search tool - always use gpt-4o-mini regardless of selected model
      if (tools.includes(ToolType.FILE_SEARCH)) {
        console.log("getChatCompletion - Using FILE_SEARCH tool");
        try {
          const { content, citations } = await handleFileSearch(userInput);
          console.log("getChatCompletion - File search result:", { contentLength: content.length, citationsCount: citations?.length || 0 });
          
          return {
            id: Date.now().toString(),
            role: "assistant",
            content: content,
            timestamp: new Date().toISOString(),
            citations: citations
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
    console.log("Selected tools before check:", selectedTools);
    
    // Extract the last user message
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
    const userInput = lastUserMessage?.content || "";
    
    console.log("User input:", userInput);
    console.log("Contains 'performance marketing':", userInput.toLowerCase().includes('performance marketing'));
    
    // Create a new array to avoid modifying the original
    let updatedTools = [...selectedTools];
    
    // Check if the user query contains "performance marketing" (case insensitive)
    // If it does, automatically add the FILE_SEARCH tool
    if (userInput.toLowerCase().includes('performance marketing') && !updatedTools.includes(ToolType.FILE_SEARCH)) {
      console.log("Detected 'performance marketing' in query, automatically activating file search tool");
      updatedTools.push(ToolType.FILE_SEARCH);
    }
    
    console.log("Selected tools after check:", updatedTools);
    
    // Convert tools to enum
    const tools = updatedTools.map(tool => tool as ToolType);
    console.log("Final tools array:", tools);
    
    // Get completion
    return await getChatCompletion(messages, selectedModel, tools);
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw error;
  }
}

export { openai, anthropic, genAI };
