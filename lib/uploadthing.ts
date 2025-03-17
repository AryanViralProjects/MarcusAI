import { generateReactHelpers } from "@uploadthing/react";
import { 
  generateUploadButton,
  generateUploadDropzone,
  generateUploader
} from "@uploadthing/react";
 
import type { OurFileRouter } from "@/app/api/uploadthing/core";
 
export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>({
    url: "/api/uploadthing"
  });

// Generate the components with proper typing
export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
export const Uploader = generateUploader<OurFileRouter>();
