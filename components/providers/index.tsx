"use client"

import { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { UploadThingProviderWrapper } from "@/components/providers/uploadthing-provider"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <UploadThingProviderWrapper>
        {children}
      </UploadThingProviderWrapper>
    </ThemeProvider>
  )
}
