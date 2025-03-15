"use client";

import { ReactNode } from "react";
import { UploadButton, UploadDropzone, Uploader } from "@uploadthing/react";

interface UploadThingProviderWrapperProps {
  children: ReactNode;
}

export function UploadThingProviderWrapper({ children }: UploadThingProviderWrapperProps) {
  // Simply return children as we don't need a provider
  // The UploadThing components work without a provider wrapper
  return <>{children}</>;
}
