import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
 
const f = createUploadthing();

// Get the current user from the session
const auth = async () => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    throw new Error("Unauthorized");
  }
  return { userId: session.user.id };
};
 
// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique route key
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    // Set permissions and file types for this FileRoute
    .middleware(async () => {
      const { userId } = await auth();
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Save file to database
      await db.file.create({
        data: {
          name: file.name,
          url: file.url,
          type: file.type,
          size: file.size,
          userId: metadata.userId,
        },
      });
      
      return { uploadedBy: metadata.userId };
    }),
  
  // Document uploader for PDFs and other documents
  documentUploader: f({ 
    pdf: { maxFileSize: "16MB" },
    text: { maxFileSize: "2MB" },
    image: { maxFileSize: "8MB" },
  })
    .middleware(async () => {
      const { userId } = await auth();
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Save file to database
      await db.file.create({
        data: {
          name: file.name,
          url: file.url,
          type: file.type,
          size: file.size,
          userId: metadata.userId,
        },
      });
      
      return { uploadedBy: metadata.userId };
    }),
    
  // File search document uploader - specifically for documents to be used with file search
  fileSearchUploader: f({ 
    pdf: { maxFileSize: "16MB" },
    text: { maxFileSize: "2MB" },
    image: { maxFileSize: "8MB" },
  })
    .middleware(async () => {
      const { userId } = await auth();
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Save file to database
      const newFile = await db.file.create({
        data: {
          name: file.name,
          url: file.url,
          type: file.type,
          size: file.size,
          userId: metadata.userId,
        },
      });
      
      return { 
        uploadedBy: metadata.userId,
        fileId: newFile.id,
        fileName: file.name,
        fileUrl: file.url,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
