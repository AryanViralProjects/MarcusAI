"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { validateName, validateEmail, validatePassword } from "@/lib/auth-validation"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { SocialAuthButtons } from "./social-auth-buttons"
import { signIn } from "next-auth/react"

export function SignUpForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  })

  const [errors, setErrors] = useState<Record<string, string | null>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, acceptTerms: checked }))
    
    // Clear error when user checks the box
    if (errors.acceptTerms) {
      setErrors((prev) => ({ ...prev, acceptTerms: null }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const nameError = validateName(formData.name)
    const emailError = validateEmail(formData.email)
    const passwordError = validatePassword(formData.password)
    
    let confirmPasswordError: string | null = null
    if (formData.password !== formData.confirmPassword) {
      confirmPasswordError = "Passwords do not match"
    }
    
    let acceptTermsError: string | null = null
    if (!formData.acceptTerms) {
      acceptTermsError = "You must accept the terms and conditions"
    }

    setErrors({
      name: nameError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
      acceptTerms: acceptTermsError,
    })

    // If there are errors, don't submit
    if (nameError || emailError || passwordError || confirmPasswordError || acceptTermsError) {
      return
    }

    // Submit form
    setIsSubmitting(true)

    try {
      // Call the registration API
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      // Auto sign-in after successful registration
      await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      })

      // Redirect to home page after successful sign-up
      router.push("/")
      router.refresh()
    } catch (error: any) {
      console.error("Sign up failed:", error)
      setErrors({
        form: error.message || "An error occurred during sign up. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.form && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{errors.form}</div>}

      <SocialAuthButtons isSignUp={true} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? "border-destructive pr-10" : "pr-10"}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </Button>
          </div>
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className={errors.confirmPassword ? "border-destructive" : ""}
          />
          {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="accept-terms" 
            checked={formData.acceptTerms} 
            onCheckedChange={handleCheckboxChange}
            className={errors.acceptTerms ? "border-destructive" : ""}
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="accept-terms" className="text-sm">
              I accept the{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms and Conditions
              </Link>
            </Label>
            {errors.acceptTerms && <p className="text-sm text-destructive">{errors.acceptTerms}</p>}
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </form>
  )
}
