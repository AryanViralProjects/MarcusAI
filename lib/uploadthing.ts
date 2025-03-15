import { generateReactHelpers } from "@uploadthing/react";
 
import type { OurFileRouter } from "@/app/api/uploadthing/core";
 
export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();

// Re-export the components from the package
export { UploadButton, UploadDropzone, Uploader } from "@uploadthing/react";
