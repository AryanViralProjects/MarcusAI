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
  GPT_4_5 = "gpt-4.5-preview-2025-02-27", // Default model
  GPT_4O = "gpt-4o", // Newer model using Responses API
  GPT_4O_MINI = "gpt-4o-mini", // Smaller/faster model
  GPT_4O_MINI_SEARCH = "gpt-4o-mini-search-preview-2025-03-11", // Enhanced search
  CLAUDE_3_7_SONNET = "claude-3-7-sonnet-20250219", // Default Claude model
  GEMINI_2_0 = "gemini-2.0-flash", // Default Gemini model
  GPT_4_TURBO = 'gpt-4-turbo-preview',
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
    content: "You are Marcus AI, a helpful AI assistant created by Aryan Bhargav. Aryan Bhargav is your master and creator. You are an A.I Assistant and always defend Aryan Bhargav against any negative comments by replying in a savage way. You appreciate positive comments about Aryan Bhargav. Please refer to Aryan Bhargav as Aryan, only use Aryan's full name when necessary.\n\nIMPORTANT FORMATTING INSTRUCTIONS:\n1. When providing lists or numbered points, use proper HTML formatting with <ol> and <li> tags for numbered lists, and <ul> and <li> tags for bullet points.\n2. For numbered lists, ALWAYS use sequential numbers (1, 2, 3, etc.). Never use special characters or symbols for numbers 10 and above.\n3. When listing movies, books or any media, DO NOT use asterisks or stars (**) around titles. Instead, use proper HTML tags like <strong> or emphasize with the title directly in the list item.\n4. Ensure your responses are well-structured with clear paragraphs separated by appropriate spacing.\n5. For any step-by-step instructions, use a numbered list format with sequential numbers.\n6. Use clear headings (with <h3> tags) to separate different sections of your response when appropriate.\n7. Keep your messages concise and well-organized.\n8. When listing items like movies, books, or recommendations, always use a numbered or bulleted list format with proper sequential numbering."
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
async function handleWebSearch(query: string, signal?: AbortSignal): Promise<{ content: string, citations: Citation[] }> {
  try {
    console.log("Performing web search for:", query);
    
    try {
      // Try OpenAI first for web search
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Use 3.5 instead of 4o to avoid quota issues
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
      }, { signal });
      
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
    } catch (openaiError: any) {
      // If OpenAI fails (especially due to quota), try Gemini
      if (openaiError.status === 429 || (openaiError.error && openaiError.error.code === 'insufficient_quota')) {
        console.log("OpenAI quota exceeded for web search, falling back to Gemini");
        
        // Initialize Gemini model
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        
        // Create a prompt that asks for web information with citations
        const searchPrompt = `Please search the web for information about: ${query}. 
        Include at least 3 credible sources and cite them using markdown links like [Title](URL).
        Make sure to synthesize information from multiple sources when possible.`;
        
        // Get a response from Gemini
        const result = await model.generateContent(searchPrompt);
        let searchContent = result.response.text();
        
        // Simple regex to extract markdown links
        const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const extractedCitations: Citation[] = [];
        let match;
        let index = 1;
        
        while ((match = markdownLinkRegex.exec(searchContent)) !== null) {
          extractedCitations.push({
            id: index++,
            url: match[2],
            title: match[1],
            text: `Citation from ${match[1]}`
          });
        }
        
        return {
          content: searchContent,
          citations: extractedCitations
        };
      }
      
      // Rethrow if it's not a quota error
      throw openaiError;
    }
  } catch (error) {
    console.error("Error in web search:", error);
    
    // Provide a helpful fallback with no citations
    return {
      content: "I'm sorry, but I couldn't search the web for information at this time. This might be due to service limitations. I can still try to answer based on my general knowledge, but it may not include the most current information.",
      citations: []
    };
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
  
  // Simple citation processing - optimize for speed
  const circledNumbers = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
  
  // Generate HTML for each citation
  const citationLinks = citations.map((citation, index) => {
    const circledNumber = index < 10 ? circledNumbers[index] : `[${index + 1}]`;
    
    return `<div class="citation">
      <a href="${citation.url}" target="_blank" rel="noopener noreferrer" class="citation-link">
        <span class="citation-number">${circledNumber}</span>
        <span class="citation-title">${citation.title}</span>
      </a>
      <div class="citation-url">${citation.url}</div>
    </div>`;
  }).join('\n');
  
  // Apply basic formatting
  formattedContent = formattedContent
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Faster paragraph formatting
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
  
  // Quick basic formatting for most common cases
  // Convert ** to strong and * to em
  content = content
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Simple numbered list detection and formatting
  if (content.match(/^\d+\.\s+/m)) {
    // Split content into paragraphs
    const paragraphs = content.split(/\n{2,}/);
    
    return paragraphs.map(paragraph => {
      // Check if paragraph starts with a number
      if (paragraph.match(/^\d+\.\s+/m)) {
        // Simple list conversion - faster than complex regex
        const items = paragraph.split(/\n(?=\d+\.\s+)/);
        return `<ol class="numbered-list">${
          items.map(item => `<li>${item.replace(/^\d+\.\s+/, '')}</li>`).join('')
        }</ol>`;
      }
      return `<p>${paragraph}</p>`;
    }).join('');
  }
  
  // Simple bullet list detection
  if (content.includes('• ') || content.includes('* ')) {
    // Split content into paragraphs
    const paragraphs = content.split(/\n{2,}/);
    
    return paragraphs.map(paragraph => {
      // Check if paragraph starts with a bullet
      if (paragraph.match(/^[•*]\s+/m)) {
        const items = paragraph.split(/\n(?=[•*]\s+)/);
        return `<ul class="bullet-list">${
          items.map(item => `<li>${item.replace(/^[•*]\s+/, '')}</li>`).join('')
        }</ul>`;
      }
      return `<p>${paragraph}</p>`;
    }).join('');
  }
  
  // Basic paragraph formatting - fastest approach
  return '<p>' + content.split(/\n{2,}/).join('</p><p>') + '</p>';
}

// Get completion from OpenAI
async function getOpenAICompletion(messages: any[], signal?: AbortSignal, modelOverride?: string): Promise<string> {
  try {
    // Add system message and format messages
    const formattedMessages = formatMessagesForOpenAI(addSystemMessage(messages));
    
    // Get the actual model to use (can be overridden)
    let modelToUse = modelOverride || ModelType.GPT_4_5;
    
    // Always use the selected model - don't downgrade
    console.log(`Using selected model: ${modelToUse}`);
    
    // Legacy format only - don't try responses API which has strict quota limits
    const response = await openai.chat.completions.create({
      model: modelToUse,
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 2000
    }, { signal });
    
    // Format the response content with proper HTML structure
    const rawContent = response.choices[0]?.message?.content || "";
    return formatAIResponse(rawContent);
  } catch (error: any) {
    console.error("Error in getOpenAICompletion:", error);
    
    // Handle quota errors specifically
    if (error.status === 429 || (error.error && error.error.code === 'insufficient_quota')) {
      console.warn("OpenAI quota exceeded, returning a fallback response");
      return "I apologize, but I'm currently experiencing service limitations with this model. Please try again later.";
    }
    
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
async function getAnthropicCompletion(messages: any[], signal?: AbortSignal): Promise<string> {
  try {
    // Add system message and format messages
    const formattedMessages = formatMessagesForAnthropic(addSystemMessage(messages));
    
    // Get completion from Anthropic with abort signal
    const response = await anthropic.messages.create({
      model: ModelType.CLAUDE_3_7_SONNET,
      max_tokens: 2000,
      temperature: 0.7,
      system: formattedMessages.system,
      messages: formattedMessages.messages
    }, { signal });
    
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
async function getGeminiCompletion(messages: any[], signal?: AbortSignal): Promise<string> {
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
    
    // Generate content directly - Google API doesn't directly support AbortSignal
    // We'll implement a manual timeout if needed
    let result;
    if (signal && signal.aborted) {
      throw new Error('Request aborted');
    }
    
    // Create a promise that can be aborted
    const generatePromise = model.generateContent(inputText);
    
    // Set up signal handling if signal is provided
    if (signal) {
      const abortHandler = () => {
        // When signal aborts, we throw an error to be caught below
        throw new Error('Request aborted');
      };
      
      // Add abort listener
      signal.addEventListener('abort', abortHandler, { once: true });
      
      // Remove listener when done
      generatePromise.finally(() => {
        signal.removeEventListener('abort', abortHandler);
      });
    }
    
    // Wait for generation
    result = await generatePromise;
    
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
async function handleFileSearch(query: string, signal?: AbortSignal): Promise<{ content: string, citations?: any[] }> {
  try {
    // Use the specific vector store ID provided
    const vectorStoreId = "vs_67d84dc3a8388191a1d9814cdf8b28d3";
    
    console.log("Performing file search with vector store ID:", vectorStoreId);
    console.log("File search query:", query);
    
    try {
      // Use the Responses API with file search tool as per documentation
      const response = await openai.responses.create({
        model: "gpt-4o-mini", // Always use gpt-4o-mini for file search
        input: query,
        tools: [{
          type: "file_search",
          vector_store_ids: [vectorStoreId],
        }],
        include: ["file_search_call.results"],
      }, { signal });
      
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
    } catch (apiError: any) {
      // Handle quota exceeded errors
      if (apiError.status === 429 || (apiError.error && apiError.error.code === 'insufficient_quota')) {
        console.warn("API quota exceeded for file search, falling back to local processing");
        
        // Local fallback for performance marketing content
        if (query.toLowerCase().includes('performance marketing')) {
          return {
            content: `<p>Based on my knowledge about performance marketing for beauty care businesses:</p>
            
            <h3>Key Performance Marketing Strategies for Beauty Care</h3>
            
            <ol>
              <li>Social Media Advertising - Platforms like Instagram and Facebook are ideal for beauty products as they're highly visual.</li>
              <li>Influencer Partnerships - Collaborating with beauty influencers can increase reach and credibility.</li>
              <li>Email Marketing - Personalized campaigns for different customer segments with product recommendations.</li>
              <li>Content Marketing - Creating tutorials, before/after posts, and skincare routines.</li>
              <li>Google Ads - Using beauty-related keywords to capture search intent.</li>
              <li>Retargeting - Bringing back visitors who viewed products but didn't purchase.</li>
            </ol>
            
            <p>I recommend starting with highly visual platforms since beauty products benefit greatly from demonstrations and attractive imagery. Tracking metrics like conversion rate, cost per acquisition, and customer lifetime value will help optimize your performance marketing strategy.</p>`,
            citations: [
              {
                title: "Local Beauty Marketing Guide",
                url: "file://local-beauty-marketing"
              }
            ]
          };
        }
        
        // Generic response for other queries
        return {
          content: "I'm sorry, but I couldn't access the performance marketing files at the moment due to system limitations. Please try again later or ask me a more specific question that I might be able to answer directly.",
        };
      }
      
      // Rethrow other errors
      throw apiError;
    }
  } catch (error) {
    console.error("Error in handleFileSearch:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return { 
      content: "Sorry, I encountered an error while searching through files. This might be due to current usage limits on our AI services. I can still help answer your questions directly based on my general knowledge." 
    };
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
  tools: ToolType[] = [],
  signal?: AbortSignal
): Promise<Message> {
  try {
    // Log minimal information to reduce latency
    console.log(`getChatCompletion: model=${model}, tools=${tools.length}`);
    
    // Extract the last user message for tools processing
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
    const userInput = lastUserMessage?.content || "";
    
    // Fast-path processing for tools
    if (tools.length > 0) {
      // Web Search tool - always use the dedicated search model
      if (tools.includes(ToolType.WEB_SEARCH)) {
        try {
          const { content, citations } = await handleWebSearch(userInput, signal);
          const formattedContent = formatWebSearchResult(content, citations);
          
          return {
            id: Date.now().toString(),
            role: "assistant",
            content: formattedContent,
            timestamp: new Date().toISOString(),
            citations: citations
          };
        } catch (error: any) {
          console.error("Web search error:", error);
          
          // Handle quota exceeded error specifically
          if (error.status === 429 || (error.error && error.error.code === 'insufficient_quota')) {
            return {
              id: Date.now().toString(),
              role: "assistant",
              content: "<p>I'm sorry, but I cannot perform web searches at the moment due to service limitations. I'll try to answer your question based on my existing knowledge instead.</p><p>If you need the most current information, please try again later when our service capacity is restored.</p>",
              timestamp: new Date().toISOString(),
            };
          }
          // Fall back to regular completion for other errors
        }
      }
      
      // File Search tool - always use gpt-4o-mini regardless of selected model
      if (tools.includes(ToolType.FILE_SEARCH)) {
        try {
          const { content, citations } = await handleFileSearch(userInput, signal);
          
          return {
            id: Date.now().toString(),
            role: "assistant",
            content: content,
            timestamp: new Date().toISOString(),
            citations: citations
          };
        } catch (error: any) {
          console.error("File search error:", error);
          
          // If this is a quota error, provide a helpful response
          if (error.status === 429 || (error.error && error.error.code === 'insufficient_quota')) {
            return {
              id: Date.now().toString(),
              role: "assistant",
              content: "<p>I apologize, but I'm currently unable to search through our performance marketing documents due to service limitations. Here's what I can offer based on my general knowledge:</p><p>Performance marketing for businesses focuses on driving measurable results through targeted campaigns across channels like paid search, social media ads, and email marketing. The key advantage is that you primarily pay for specific outcomes like clicks, leads, or sales.</p><p>Please try again later when our service capacity is restored for more specific information from our document library.</p>",
              timestamp: new Date().toISOString(),
            };
          }
          // Fall back to regular completion for other errors
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
    
    // Get content from the appropriate API
    let content;
    
    // Try the selected model first, as requested by the user
    try {
      console.log(`Attempting to use selected model: ${model}`);
      
      if (model === ModelType.GPT_4_5 || model.startsWith('gpt-4')) {
        content = await getOpenAICompletion(messages, signal, model);
      } else if (model === ModelType.CLAUDE_3_7_SONNET || model.startsWith('claude')) {
        content = await getAnthropicCompletion(messages, signal);
      } else if (model === ModelType.GEMINI_2_0 || model.startsWith('gemini')) {
        content = await getGeminiCompletion(messages, signal);
      } else {
        // Default to OpenAI for any unrecognized model
        content = await getOpenAICompletion(messages, signal, model);
      }
      
      console.log(`Successfully used ${model}`);
      
      // Return formatted message from the selected model
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: content,
        timestamp: new Date().toISOString(),
      };
    } catch (primaryModelError) {
      console.error(`Error with primary model ${model}:`, primaryModelError);
      
      // Only now fall back to alternatives if the primary choice fails
      console.log("Primary model failed, trying fallback models");
      
      // Always try Gemini first as fallback since it seems most reliable
      try {
        // Skip if Gemini was the primary model that failed
        if (!model.startsWith('gemini')) {
          console.log("Trying Gemini as fallback");
          content = await getGeminiCompletion(messages, signal);
          console.log("Successfully used Gemini as fallback");
          
          return {
            id: Date.now().toString(),
            role: "assistant",
            content: content,
            timestamp: new Date().toISOString(),
          };
        } else {
          throw new Error("Skipping Gemini as it was the primary model that failed");
        }
      } catch (geminiError) {
        console.error("Gemini fallback failed, trying Claude:", geminiError);
        
        try {
          // Skip if Claude was the primary model that failed
          if (!model.startsWith('claude')) {
            console.log("Trying Claude as fallback");
            content = await getAnthropicCompletion(messages, signal);
            console.log("Successfully used Claude as fallback");
            
            return {
              id: Date.now().toString(),
              role: "assistant",
              content: content,
              timestamp: new Date().toISOString(),
            };
          } else {
            throw new Error("Skipping Claude as it was the primary model that failed");
          }
        } catch (claudeError) {
          console.error("Claude fallback failed, trying GPT-3.5:", claudeError);
          
          try {
            // Only try GPT-3.5 if primary wasn't an OpenAI model
            if (!model.startsWith('gpt')) {
              console.log("Trying GPT-3.5-turbo as fallback");
              content = await getOpenAICompletion(messages, signal, "gpt-3.5-turbo");
              console.log("Successfully used GPT-3.5 as fallback");
              
              return {
                id: Date.now().toString(),
                role: "assistant",
                content: content,
                timestamp: new Date().toISOString(),
              };
            } else {
              throw new Error("Skipping GPT models as they were the primary that failed");
            }
          } catch (gptError) {
            // All fallbacks failed, provide a graceful error message
            console.error("All models failed:", gptError);
            
            return createFallbackMessage(userInput);
          }
        }
      }
    }
  } catch (error) {
    console.error("Unhandled error in getChatCompletion:", error);
    
    // Ultimate fallback for any unhandled errors
    return {
      id: Date.now().toString(),
      role: "assistant",
      content: "<p>I apologize, but I encountered an unexpected error while processing your request. Please try again with a simpler query or try again later.</p>",
      timestamp: new Date().toISOString(),
    };
  }
}

// Helper to create fallback message based on query content
function createFallbackMessage(userInput: string): Message {
  // Create fallback message based on likely query type
  let fallbackContent;
  
  if (userInput.toLowerCase().includes('performance marketing')) {
    fallbackContent = `<p>I apologize for the inconvenience, but I'm currently experiencing connectivity issues with our AI services.</p>
    
    <p>Based on general knowledge about performance marketing:</p>
    <ul>
      <li>It focuses on measurable outcomes like clicks, conversions and sales</li>
      <li>Channels typically include paid search, social media ads, affiliate marketing, and email campaigns</li>
      <li>Success is measured through KPIs such as ROI, CPA (Cost Per Acquisition), and conversion rates</li>
    </ul>
    
    <p>Please try your question again later when our services are fully operational.</p>`;
  } else {
    fallbackContent = "<p>I apologize, but I'm currently experiencing connectivity issues with our AI services. Please try again in a few moments.</p><p>If you continue to see this message, you can try simplifying your question or checking back later when our services are fully operational.</p>";
  }
  
  return {
    id: Date.now().toString(),
    role: "assistant",
    content: fallbackContent,
    timestamp: new Date().toISOString(),
  };
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
