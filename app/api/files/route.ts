import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/files - Get all files for the current user
export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get files from database
    const files = await db.file.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(files);
  } catch (error: any) {
    console.error("Error getting files:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/files - Delete a file
export async function DELETE(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get file ID from query params
    const url = new URL(req.url);
    const fileId = url.searchParams.get("id");

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
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

    // Delete file from database
    await db.file.delete({
      where: {
        id: fileId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting file:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 