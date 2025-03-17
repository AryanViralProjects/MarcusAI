import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UploadThingError } from "uploadthing/server";
 
const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique route key
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    }
  })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // Get session
      try {
        const session = await getServerSession(authOptions);
        
        // Always allow uploads, even for anonymous users
        const userId = session?.user?.id || "anonymous";
        console.log(`User ${userId} is uploading a file`);
        
        // Return the userId
        return { userId };
      } catch (error) {
        console.error("Auth error in UploadThing:", error);
        // Still allow anonymous uploads
        return { userId: "anonymous" };
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("File uploaded:", file.name, "by user:", metadata.userId);
      
      // Return the file URL to the client
      return { url: file.url };
    }),
  
  // Document uploader for PDFs and other documents
  documentUploader: f({ 
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
    text: { maxFileSize: "2MB", maxFileCount: 1 },
    image: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      // Get session
      try {
        const session = await getServerSession(authOptions);
        
        // Always allow uploads, even for anonymous users
        const userId = session?.user?.id || "anonymous";
        console.log(`User ${userId} is uploading a document`);
        
        // Return the userId
        return { userId };
      } catch (error) {
        console.error("Auth error in UploadThing:", error);
        // Still allow anonymous uploads
        return { userId: "anonymous" };
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Document uploaded:", file.name, "by user:", metadata.userId);
      return { url: file.url };
    }),
    
  // File search document uploader - specifically for documents to be used with file search
  fileSearchUploader: f({ 
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
    text: { maxFileSize: "2MB", maxFileCount: 1 },
    image: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      // Get session
      try {
        const session = await getServerSession(authOptions);
        
        // Always allow uploads, even for anonymous users
        const userId = session?.user?.id || "anonymous";
        console.log(`User ${userId} is uploading a document for search`);
        
        // Return the userId
        return { userId };
      } catch (error) {
        console.error("Auth error in UploadThing:", error);
        // Still allow anonymous uploads
        return { userId: "anonymous" };
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("File search document uploaded:", file.name, "by user:", metadata.userId);
      return { 
        fileUrl: file.url,
        fileName: file.name,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
