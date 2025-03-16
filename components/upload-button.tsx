"use client";

import { useState } from "react";
import { UploadButton as UTUploadButton } from "@uploadthing/react";
import { Image, Paperclip, X } from "lucide-react";
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
        className="rounded-full border-muted-foreground/20 hover:bg-muted hover:text-primary"
        onClick={() => setIsImageUploadOpen(!isImageUploadOpen)}
        type="button"
      >
        <Image className="h-4 w-4" />
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
            className="ut-button:bg-primary ut-button:text-primary-foreground ut-button:hover:bg-primary/90 ut-button:rounded-md ut-button:transition-colors"
          />
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
            className="ut-button:bg-primary ut-button:text-primary-foreground ut-button:hover:bg-primary/90 ut-button:rounded-md ut-button:transition-colors"
          />
        </div>
      )}
    </>
  );
}
