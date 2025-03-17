# Marcus AI Project Summary

**Date:** March 17, 2025

## Project Overview

Marcus AI is an advanced conversational AI assistant created by Aryan Bhargav. The application leverages multiple AI models (OpenAI, Anthropic, and Google) to provide users with a versatile and powerful chat experience enhanced with specialized tools.

## Core Features

### 1. Multi-Model Support
- **GPT-4.5** (OpenAI)
- **Claude 3.7 Sonnet** (Anthropic)
- **Gemini 2.0** (Google)

### 2. Specialized Tools
- **Web Search:** Retrieves real-time information from the internet with proper citations
- **File Search:** Searches through files in a vector store for relevant information, automatically activated for "performance marketing" queries
- **Computer Use:** Performs actions on the user's computer (coming soon)

### 3. User Authentication (New)
- **Optional Authentication:** Users can access the application without mandatory login
- **Multiple Auth Methods:** Email/password, Google, and GitHub OAuth providers
- **Protected Routes:** Settings and user-specific features require authentication

## Technical Implementation

### Architecture

The project is built using:
- **Next.js** for the frontend and backend framework
- **TypeScript** for type-safe code
- **React** for the UI components
- **NextAuth.js** for authentication
- **Prisma** for database ORM

### API Integrations

#### OpenAI API
- Used for GPT-4.5 model responses
- Implements web search functionality using `gpt-4o-search-preview-2025-03-11`
- Implements file search functionality using `gpt-4o-mini` with vector store ID `vs_67d84dc3a8388191a1d9814cdf8b28d3`
- Implements computer use functionality using `computer-use-preview-2025-03-11` (coming soon)

#### Anthropic API
- Used for Claude 3.7 Sonnet model responses
- Custom message formatting to handle system messages correctly

#### Google Generative AI
- Used for Gemini 2.0 model responses
- Implements proper error handling and type safety

### Key Components

#### Model Selector
- Allows users to switch between different AI models
- Implemented as a dropdown with proper state management

#### Tool Selector
- Enables users to activate specialized tools (Web Search, File Search, Computer Use)
- Tools can be toggled on/off as needed
- File Search tool automatically activates for queries containing "performance marketing"

#### Chat Interface
- Displays conversation history with proper formatting
- Supports markdown rendering
- Handles citations from web search and file search results

#### Authentication Components
- **SidebarAuth:** Displays sign-in option or user account based on auth state
- **Sign-in Form:** Allows login via credentials or OAuth providers
- **Sign-up Form:** Enables new user registration with validation

## Recent Implementations

### 1. File Search Functionality
- Implemented file search using OpenAI's vector store capabilities
- Set up with vector store ID `vs_67d84dc3a8388191a1d9814cdf8b28d3` for retrieving information
- Configured to automatically activate when users mention "performance marketing"
- Uses `gpt-4o-mini` model specifically for file search queries
- Added citation support for file search results

### 2. Authentication System
- Integrated NextAuth.js for user authentication
- Implemented optional authentication flow allowing non-authenticated users to access the main application
- Added multiple authentication providers (Email/Password, Google, GitHub)
- Created user registration with password hashing and validation
- Updated middleware to protect specific routes while keeping the main app accessible
- Added sign-in and sign-up pages with a clean, consistent UI

### 3. UI Improvements
- Switched to dark theme as the default with proper contrast
- Updated button styling to use white primary color in dark mode
- Improved upload button design and modal interface
- Enhanced overall visual consistency across components

### 4. API Security & Model Integration
- Fixed Anthropic Claude API integration to properly handle system messages
- Updated model references to use the latest versions
- Continued using environment variables for API keys security

## Code Structure

### Main Files

- **`/lib/openai.ts`**: Core API integration logic for all models
  - Handles message formatting for different APIs
  - Implements tool functionality (Web Search, File Search, Computer Use)
  - Manages model selection and API requests

- **`/lib/auth.ts`**: Authentication configuration
  - Configures NextAuth with providers and callbacks
  - Manages credential authentication with password hashing

- **`/components/auth/`**: Authentication UI components
  - Sign-in and sign-up forms
  - OAuth provider buttons
  - User account menu

- **`/middleware.ts`**: Route protection and authentication logic
  - Allows non-authenticated access to main application
  - Protects sensitive routes like settings

## Environment Configuration

- **`.env`**: Non-sensitive configuration settings
- **`.env.local`**: Sensitive API keys (not committed to version control)

## Future Development

### Next Phase: Conversation Management

#### 1. Database Schema Completion
- Finalize conversation and message models in Prisma schema
- Create relationships between users and conversations
- Implement metadata for conversations (titles, timestamps)

#### 2. Conversation Persistence
- Save conversations to database for authenticated users
- Associate messages with specific users and conversations
- Implement conversation retrieval and history browsing

#### 3. Conversation UI
- Create conversation list sidebar
- Add ability to name and organize conversations
- Provide options to delete or export conversations

### Technical Debt to Address

- Refactor API integration code for better maintainability
- Improve error handling and user feedback
- Complete any remaining TypeScript type issues

## Security Considerations

- API keys stored in environment variables
- Passwords hashed using bcrypt before storage
- Sensitive information excluded from version control
- Sandboxed environments for executing computer actions

---

*This document serves as a snapshot of the Marcus AI project as of March 17, 2025. It will be updated as the project evolves.*