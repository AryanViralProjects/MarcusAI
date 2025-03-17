import { NextResponse } from "next/server";

// This endpoint is no longer used as file management is handled by the Marcus AI team
export async function POST() {
  return NextResponse.json({ 
    success: false, 
    error: "File uploads are handled by the Marcus AI team" 
  }, { status: 403 });
} 