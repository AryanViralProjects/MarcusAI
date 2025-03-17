"use client";

import { useState } from "react";
import { Image, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadButton as UTUploadButton, UploadDropzone } from "@/lib/uploadthing";

interface CustomUploadButtonProps {
  onUploadComplete: (url: string, type: "image" | "document") => void;
}

export function CustomUploadButton({ onUploadComplete }: CustomUploadButtonProps) {
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);
  const [isDocumentUploadOpen, setIsDocumentUploadOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <>
      {/* Image upload button */}
      <Button
        variant="outline"
        size="icon"
        className="rounded-full border-muted-foreground/20 hover:bg-muted hover:text-primary"
        onClick={() => setIsImageUploadOpen(!isImageUploadOpen)}
        type="button"
      >
        <Image className="h-4 w-4" aria-label="Upload image" />
      </Button>
      
      {/* Document upload button */}
      <Button
        variant="outline"
        size="icon"
        className="rounded-full border-muted-foreground/20 hover:bg-muted hover:text-primary"
        onClick={() => setIsDocumentUploadOpen(!isDocumentUploadOpen)}
        type="button"
      >
        <Paperclip className="h-4 w-4" />
      </Button>

      {/* Image upload component */}
      {isImageUploadOpen && (
        <div className="absolute bottom-20 right-20 z-10 bg-background border border-border rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">Upload an image</div>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsImageUploadOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md">
            <UTUploadButton
              endpoint="imageUploader"
              onBeforeUploadBegin={(files) => {
                console.log("Before upload begin:", files);
                return files;
              }}
              onClientUploadComplete={(res) => {
                console.log("Upload completed:", res);
                if (res && res[0]?.url) {
                  onUploadComplete(res[0].url, "image");
                  setIsImageUploadOpen(false);
                  setErrorMessage(null);
                }
              }}
              onUploadError={(error: Error) => {
                console.error("Image upload error:", error);
                setErrorMessage(`Failed to upload image: ${error.message}`);
              }}
              appearance={{
                button: {
                  width: "100%"
                }
              }}
            />
            {errorMessage && (
              <p className="text-red-500 text-xs mt-2">{errorMessage}</p>
            )}
          </div>
        </div>
      )}

      {/* Document upload component */}
      {isDocumentUploadOpen && (
        <div className="absolute bottom-20 right-20 z-10 bg-background border border-border rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">Upload a document</div>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsDocumentUploadOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md">
            <UTUploadButton
              endpoint="documentUploader"
              onBeforeUploadBegin={(files) => {
                console.log("Before document upload begin:", files);
                return files;
              }}
              onClientUploadComplete={(res) => {
                console.log("Document upload completed:", res);
                if (res && res[0]?.url) {
                  onUploadComplete(res[0].url, "document");
                  setIsDocumentUploadOpen(false);
                  setErrorMessage(null);
                }
              }}
              onUploadError={(error: Error) => {
                console.error("Document upload error:", error);
                setErrorMessage(`Failed to upload document: ${error.message}`);
              }}
              appearance={{
                button: {
                  width: "100%"
                }
              }}
            />
            {errorMessage && (
              <p className="text-red-500 text-xs mt-2">{errorMessage}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
