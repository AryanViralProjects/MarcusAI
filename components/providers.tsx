"use client"

import { ThemeProvider } from "next-themes"
import { AuthProvider } from "@/components/auth/auth-provider"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {children}
      </ThemeProvider>
    </AuthProvider>
  )
}
