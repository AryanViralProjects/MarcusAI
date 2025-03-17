import { NextRequest, NextResponse } from 'next/server';
import { getChatCompletion, Message as OpenAiMessage, ModelType, ToolType } from '@/lib/openai';
import { validateEnv } from '@/lib/config';
import { UserPreferences, defaultPreferences } from '@/lib/personalization';
import { Message, Attachment, Citation } from '@/types/chat';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { addMessageToConversation, createConversation } from '@/lib/conversation-service';

export async function POST(req: NextRequest) {
  try {
    // Validate environment variables
    try {
      validateEnv();
    } catch (envError: any) {
      console.error('Environment validation failed:', envError);
      return NextResponse.json(
        { error: 'Server configuration error', details: envError.message },
        { status: 500 }
      );
    }
    
    // Add request timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 90000); // 90 seconds timeout
    
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('Failed to parse request JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { 
      messages, 
      preferences = defaultPreferences, 
      model = ModelType.GPT_4_5, 
      tools = [], 
      conversationId 
    } = requestBody;

    // Log minimal info to reduce overhead
    console.log(`Chat API: ${model}, tools=${tools.length}, msgs=${messages?.length}, convId=${conversationId || 'new'}`);

    if (!messages || !Array.isArray(messages)) {
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: 'Messages are required and must be an array' },
        { status: 400 }
      );
    }

    // Extract the latest user message - fast find for last user message
    const latestUserMessage = [...messages].reverse().find(m => m.role === 'user') as Message | undefined;
    
    if (!latestUserMessage) {
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: 'No user message found' },
        { status: 400 }
      );
    }

    // Check if message is very long and simplify to prevent timeouts
    const userMessageLength = latestUserMessage.content?.length || 0;
    console.log(`Message length: ${userMessageLength} characters`);
    
    // For very long messages, trim history to prevent timeouts
    let processedMessages = messages;
    if (userMessageLength > 5000) {
      console.log("Long message detected, optimizing request");
      // Keep only recent messages to reduce context length
      const systemMessage = messages.find(m => m.role === 'system');
      const lastUserMessages = messages.filter(m => m.role === 'user').slice(-3);
      const lastAssistantMessages = messages.filter(m => m.role === 'assistant').slice(-3);
      
      processedMessages = [
        ...(systemMessage ? [systemMessage] : []),
        ...lastAssistantMessages,
        ...lastUserMessages
      ].sort((a, b) => {
        // Sort messages by timestamp if available
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeA - timeB;
      });
      
      console.log(`Reduced message count from ${messages.length} to ${processedMessages.length}`);
    }

    // Get all messages without system for the API
    const chatHistory = processedMessages
      .filter(m => m.role !== 'system')
      .map(m => {
        // Fast transformation with minimal object creation
        const mappedMessage: any = {
          role: m.role,
          content: m.content
        };

        // Only process attachments if they exist
        if (m.attachments?.length > 0) {
          mappedMessage.attachments = m.attachments;
        }

        return mappedMessage;
      });

    // Check for performance marketing keyword to add FILE_SEARCH tool
    const activeTools = [...tools];
    if (latestUserMessage.content.toLowerCase().includes('performance marketing') && 
        !activeTools.includes(ToolType.FILE_SEARCH)) {
      activeTools.push(ToolType.FILE_SEARCH);
    }

    // Filter out unsupported tools
    const filteredTools = activeTools.filter(tool => tool !== ToolType.COMPUTER_USE);

    // Generate AI response with timeout
    let response;
    try {
      // Pass abort signal to enable timeout
      response = await getChatCompletion(chatHistory, model as ModelType, filteredTools, controller.signal);
    } catch (openaiError: any) {
      clearTimeout(timeoutId);
      console.error('Error from AI API:', openaiError);
      
      if (openaiError.name === 'AbortError' || openaiError.message?.includes('aborted')) {
        return NextResponse.json(
          { error: 'Request timed out. Please try a shorter prompt or try again later.' },
          { status: 504 }
        );
      }
      
      if (openaiError.message?.includes('rate_limit') || openaiError.message?.includes('timeout')) {
        return NextResponse.json(
          { error: 'The AI service is currently busy. Please try again in a moment.' },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to generate AI response', details: openaiError.message },
        { status: 500 }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    // Process conversation - fast path for local conversations
    let activeConversationId = conversationId;
    let shouldSaveMessages = false;
    let session;
    
    // Only get session if needed for conversation saving
    if (!activeConversationId || !activeConversationId.startsWith('local-')) {
      try {
        session = await getServerSession(authOptions);
        shouldSaveMessages = !!session?.user;
      } catch (sessionError) {
        console.error('Error retrieving user session:', sessionError);
        shouldSaveMessages = false;
      }
    }
    
    // Process conversation if needed
    if (shouldSaveMessages) {
      try {
        // Create new conversation if needed
        if (!activeConversationId) {
          const firstUserMessage = messages.find(m => m.role === 'user');
          const title = firstUserMessage ? 
            firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '') : 
            'New conversation';
          
          try {
            const newConversation = await createConversation(title);
            if (newConversation) {
              activeConversationId = newConversation.id;
              (response as any).conversationId = activeConversationId;
            }
          } catch (createError) {
            console.error('Error creating conversation:', createError);
            activeConversationId = `local-${Date.now()}`;
            (response as any).conversationId = activeConversationId;
          }
        }
        
        // Save messages if we have a valid conversation ID
        if (activeConversationId && !activeConversationId.startsWith('local-')) {
          // Extract image URL from attachments
          const imageUrl = latestUserMessage.attachments?.find(att => att.type === 'image')?.url;
          
          // Batch save messages in parallel
          await Promise.all([
            // User message
            addMessageToConversation(activeConversationId, {
              role: latestUserMessage.role,
              content: latestUserMessage.content,
              imageUrl,
              citations: latestUserMessage.citations?.map(citation => ({
                title: citation.title,
                url: citation.url
              }))
            }),
            
            // Assistant message
            addMessageToConversation(activeConversationId, {
              role: response.role,
              content: response.content,
              citations: response.citations?.map((citation: Citation) => ({
                title: citation.title,
                url: citation.url
              }))
            })
          ]);
        }
      } catch (dbError) {
        console.error('Error in conversation management:', dbError);
        // Continue with response even if saving fails
      }
    } else if (!activeConversationId) {
      // Use local conversation ID for unauthenticated users
      activeConversationId = `local-${Date.now()}`;
      (response as any).conversationId = activeConversationId;
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Unhandled error in chat API:', error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred', 
        message: error.message || 'Unknown error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    );
  }
}
