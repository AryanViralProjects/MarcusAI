import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { openai } from "@/lib/openai";

// POST /api/files/vector-stores/[id]/files - Add a file to a vector store
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get vector store ID from params
    const { id } = params;

    // Get request body
    const body = await req.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    // Check if vector store exists and belongs to user
    const vectorStore = await db.vectorStore.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!vectorStore) {
      return NextResponse.json({ error: "Vector store not found" }, { status: 404 });
    }

    // Check if file exists and belongs to user
    const file = await db.file.findFirst({
      where: {
        id: fileId,
        userId: session.user.id,
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // If file doesn't have an OpenAI file ID, create one
    if (!file.openaiFileId) {
      // Download the file from the URL
      const response = await fetch(file.url);
      const buffer = await response.arrayBuffer();
      const fileName = file.name;
      
      // Create a File object
      const fileObject = new File([buffer], fileName);
      
      // Upload to OpenAI
      const openaiFile = await openai.files.create({
        file: fileObject,
        purpose: "assistants",
      });
      
      // Update file in database with OpenAI file ID
      await db.file.update({
        where: {
          id: fileId,
        },
        data: {
          openaiFileId: openaiFile.id,
        },
      });
      
      // Use the new OpenAI file ID
      file.openaiFileId = openaiFile.id;
    }

    // Add file to vector store in OpenAI
    await openai.vectorStores.files.create(
      vectorStore.openaiVectorStoreId,
      {
        file_id: file.openaiFileId,
      }
    );

    // Save relationship to database
    const vectorStoreFile = await db.vectorStoreFile.create({
      data: {
        fileId,
        vectorStoreId: id,
        status: "processing",
      },
    });

    return NextResponse.json(vectorStoreFile);
  } catch (error: any) {
    console.error("Error adding file to vector store:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/files/vector-stores/[id]/files - Get all files in a vector store
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get vector store ID from params
    const { id } = params;

    // Check if vector store exists and belongs to user
    const vectorStore = await db.vectorStore.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!vectorStore) {
      return NextResponse.json({ error: "Vector store not found" }, { status: 404 });
    }

    // Get files from OpenAI to check status
    const openaiFiles = await openai.vectorStores.files.list(
      vectorStore.openaiVectorStoreId
    );

    // Get files from database
    const vectorStoreFiles = await db.vectorStoreFile.findMany({
      where: {
        vectorStoreId: id,
      },
      include: {
        file: true,
      },
    });

    // Update status of files in database based on OpenAI status
    for (const vsFile of vectorStoreFiles) {
      const openaiFile = openaiFiles.data.find(
        (f) => f.file_id === vsFile.file.openaiFileId
      );
      
      if (openaiFile && openaiFile.status !== vsFile.status) {
        await db.vectorStoreFile.update({
          where: {
            id: vsFile.id,
          },
          data: {
            status: openaiFile.status,
          },
        });
        
        // Update status in the response
        vsFile.status = openaiFile.status;
      }
    }

    return NextResponse.json(vectorStoreFiles);
  } catch (error: any) {
    console.error("Error getting files in vector store:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 