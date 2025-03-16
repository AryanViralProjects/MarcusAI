# 🧠 Marcus AI - Your Personalized AI Assistant

![Marcus AI](public/marcus-avatar.png)

## ✨ Overview

Marcus AI is a powerful, personalized AI assistant built with Next.js and modern web technologies. It provides a seamless conversational experience with advanced features like multi-model support, file attachments, and personalization options.

## 🚀 Features

- 💬 **Multi-Model Chat Interface**: Supports OpenAI (GPT-4o), Anthropic (Claude), and Google (Gemini) models
- 🔍 **Web Search Integration**: Find information from across the web without leaving the chat
- 📎 **File Attachments**: Upload and share images and documents within conversations
- 👤 **User Personalization**: Customize AI personality and communication style
- 🔐 **Secure Authentication**: Sign in with email/password, Google, or GitHub
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🌙 **Dark Mode Support**: Easy on the eyes with full dark mode compatibility

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with multiple providers
- **Database**: PostgreSQL with Prisma ORM
- **AI Services**: OpenAI, Anthropic, Google Generative AI
- **File Storage**: UploadThing for file uploads and storage
- **Styling**: Tailwind CSS with shadcn/ui components

## 🔧 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- API keys for OpenAI, Anthropic, and Google AI services
- UploadThing account for file storage

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```bash
# AI Service Keys
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key

# UPLOADTHING API
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id
UPLOADTHING_TOKEN=your_uploadthing_token

# Database
DATABASE_URL=your_postgres_connection_string
DIRECT_URL=your_postgres_direct_connection_string

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_ID=your_github_id
GITHUB_SECRET=your_github_secret
```

### Installation

```bash
# Install dependencies
npm install

# Set up the database
npx prisma generate
npx prisma db push

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 📂 Project Structure

- `/app`: Next.js app router pages and API routes
- `/components`: Reusable React components
- `/lib`: Utility functions and service integrations
- `/prisma`: Database schema and client
- `/public`: Static assets
- `/types`: TypeScript type definitions

## 🚢 Deployment

The application can be deployed on Vercel or any other platform that supports Next.js applications:

```bash
# Build for production
npm run build

# Start the production server
npm start
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👏 Acknowledgements

- [Next.js](https://nextjs.org) - The React framework
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com) - UI component system
- [OpenAI](https://openai.com) - AI model provider
- [Anthropic](https://anthropic.com) - Claude AI model provider
- [Google AI](https://ai.google.dev) - Gemini AI model provider
