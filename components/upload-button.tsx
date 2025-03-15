"use client";

import { useState } from "react";
import { UploadButton as UTUploadButton } from "@uploadthing/react";
import { Image, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadButtonProps {
  onUploadComplete: (url: string, type: "image" | "document") => void;
}

export function UploadButton({ onUploadComplete }: UploadButtonProps) {
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);
  const [isDocumentUploadOpen, setIsDocumentUploadOpen] = useState(false);

  return (
    <>
      {/* Image upload button */}
      <Button
        variant="outline"
        size="icon"
        className="rounded-full"
        onClick={() => setIsImageUploadOpen(!isImageUploadOpen)}
        type="button"
      >
        <Image className="h-4 w-4" />
      </Button>
      
      {/* Document upload button */}
      <Button
        variant="outline"
        size="icon"
        className="rounded-full"
        onClick={() => setIsDocumentUploadOpen(!isDocumentUploadOpen)}
        type="button"
      >
        <Paperclip className="h-4 w-4" />
      </Button>

      {/* Image upload component */}
      {isImageUploadOpen && (
        <div className="absolute bottom-20 right-20 z-10 bg-background border rounded-md p-4 shadow-lg">
          <div className="mb-2 text-sm font-medium">Upload an image</div>
          {/* @ts-ignore - Ignoring type issues with UploadThing for now */}
          <UTUploadButton
            endpoint="imageUploader"
            onClientUploadComplete={(res: any[]) => {
              if (res && res.length > 0 && res[0].url) {
                onUploadComplete(res[0].url, "image");
                setIsImageUploadOpen(false);
              }
            }}
            onUploadError={(error: Error) => {
              console.error("Image upload error:", error);
              alert("Error uploading image");
            }}
          />
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2"
            onClick={() => setIsImageUploadOpen(false)}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Document upload component */}
      {isDocumentUploadOpen && (
        <div className="absolute bottom-20 right-20 z-10 bg-background border rounded-md p-4 shadow-lg">
          <div className="mb-2 text-sm font-medium">Upload a document</div>
          {/* @ts-ignore - Ignoring type issues with UploadThing for now */}
          <UTUploadButton
            endpoint="documentUploader"
            onClientUploadComplete={(res: any[]) => {
              if (res && res.length > 0 && res[0].url) {
                onUploadComplete(res[0].url, "document");
                setIsDocumentUploadOpen(false);
              }
            }}
            onUploadError={(error: Error) => {
              console.error("Document upload error:", error);
              alert("Error uploading document");
            }}
          />
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2"
            onClick={() => setIsDocumentUploadOpen(false)}
          >
            Cancel
          </Button>
        </div>
      )}
    </>
  );
}
