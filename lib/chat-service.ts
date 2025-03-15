import type { Message, Conversation, Attachment } from "@/types/chat";
import type { UserPreferences } from "@/lib/personalization";
import { ModelType, ToolType, Message as OpenAiMessage, getChatCompletion } from "@/lib/openai";

// Function to send a message to the OpenAI API and get a response
export async function sendMessage(messages: Message[], userPreferences: UserPreferences, model: ModelType = ModelType.GPT_4_5_PREVIEW, tools: ToolType[] = []) {
  try {
    console.log("sendMessage called with model:", model);
    console.log("sendMessage called with tools:", tools);
    
    // Get completion from OpenAI
    const assistantMessage = await getChatCompletion(messages, model, tools);
    
    return assistantMessage;
  } catch (error) {
    console.error("Error in sendMessage:", error);
    
    // Return error message
    return {
      id: Date.now().toString(),
      role: "assistant",
      content: "Sorry, I encountered an error. Please try again later.",
      timestamp: new Date().toISOString(),
    };
  }
};

// Function to save conversations to local storage
export const saveConversations = (conversations: Conversation[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("conversations", JSON.stringify(conversations));
  }
};

// Function to load conversations from local storage
export const loadConversations = (): Conversation[] => {
  if (typeof window !== "undefined") {
    const savedConversations = localStorage.getItem("conversations");
    if (savedConversations) {
      try {
        return JSON.parse(savedConversations);
      } catch (error) {
        console.error("Error parsing saved conversations:", error);
      }
    }
  }
  return [];
};
