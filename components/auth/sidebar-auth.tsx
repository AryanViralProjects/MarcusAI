"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { UserAccountNav } from "@/components/auth/user-account-nav"
import { LogIn } from "lucide-react"

export function SidebarAuth() {
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated" && session?.user

  if (isAuthenticated) {
    return <UserAccountNav user={session.user} />
  }

  return (
    <Button variant="ghost" asChild className="w-full justify-start">
      <Link href="/sign-in" className="flex items-center">
        <LogIn className="mr-2 h-4 w-4" />
        <span>Sign in</span>
      </Link>
    </Button>
  )
}
