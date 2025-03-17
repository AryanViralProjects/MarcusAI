import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { openai } from "@/lib/openai";

// POST /api/files/vector-stores - Create a new vector store
export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Create vector store in OpenAI
    const vectorStore = await openai.vectorStores.create({
      name: name,
    });

    // Save vector store to database
    const dbVectorStore = await db.vectorStore.create({
      data: {
        name,
        openaiVectorStoreId: vectorStore.id,
        userId: session.user.id,
      },
    });

    return NextResponse.json(dbVectorStore);
  } catch (error: any) {
    console.error("Error creating vector store:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/files/vector-stores - Get all vector stores for the current user
export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get vector stores from database
    const vectorStores = await db.vectorStore.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        files: {
          include: {
            file: true,
          },
        },
      },
    });

    return NextResponse.json(vectorStores);
  } catch (error: any) {
    console.error("Error getting vector stores:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 