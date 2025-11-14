"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, CheckCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"

export default function SignupPage() {
  const [step, setStep] = useState<"info" | "company" | "success">("info")
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    rePassword: "",
    companyName: "",
    companySize: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.email.trim()) newErrors.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format"
    if (!formData.password) newErrors.password = "Password is required"
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters"
    if (!formData.rePassword) newErrors.rePassword = "Please confirm your password"
    else if (formData.password !== formData.rePassword) newErrors.rePassword = "Passwords don't match"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.companyName.trim()) newErrors.companyName = "Company name is required"
    if (!formData.companySize) newErrors.companySize = "Company size is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep("company")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep2()) return

    setIsLoading(true)
    setErrors({})

    try {
      // Generate username from email (before @) and sanitize it
      // Django username validator allows: letters, digits, and @/./+/-/_ characters
      let username = formData.email.split("@")[0]
      // Replace any invalid characters with underscore (keep only alphanumeric and @/./+/-/_)
      username = username.replace(/[^a-zA-Z0-9@.+\-_]/g, "_")
      // Ensure username is not empty and has valid length
      if (!username || username.length === 0) {
        username = `user_${Date.now()}`
      }
      // Truncate to max 150 characters (Django username limit)
      if (username.length > 150) {
        username = username.substring(0, 150)
      }

      // Prepare signup data matching backend serializer
      const signupData = {
        username,
        email: formData.email,
        password: formData.password,
        re_password: formData.rePassword,
        company_name: formData.companyName,
        company_size: formData.companySize,
      }

      console.log("Signup data being sent:", { ...signupData, password: "***", re_password: "***" })

      const response = await apiClient.post("/auth/users/", signupData, {
        requireAuth: false,
      })

      console.log("Signup response:", response)

      if (response.error) {
        // Handle validation errors from backend
        if (typeof response.error === "object" && response.error !== null) {
          const backendErrors: Record<string, string> = {}
          Object.keys(response.error).forEach((key) => {
            const errorValue = (response.error as unknown as Record<string, string[]>)[key]
            if (Array.isArray(errorValue) && errorValue.length > 0) {
              backendErrors[key] = errorValue[0]
            }
          })
          setErrors(backendErrors)
        } else {
          setErrors({ submit: typeof response.error === "string" ? response.error : "An error occurred" })
        }
        setIsLoading(false)
        return
      }

      // Success - move to success step
      setStep("success")
      setIsLoading(false)
    } catch (error) {
      console.error("Signup error:", error)
      setErrors({ submit: "An unexpected error occurred. Please try again." })
      setIsLoading(false)
    }
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Account Created!</h1>
            <p className="text-muted-foreground">
              Your namespace is being provisioned. Check your email for next steps.
            </p>
          </div>

          <div className="bg-muted border border-border rounded-lg p-4 text-left space-y-2">
            <p className="text-sm font-medium text-foreground">Account Details</p>
            <p className="text-sm text-muted-foreground">
              <strong>Admin:</strong> {formData.email}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Company:</strong> {formData.companyName}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Size:</strong> {formData.companySize}
            </p>
          </div>

          <Link href="/login">
            <Button className="w-full bg-primary hover:bg-accent text-primary-foreground">Go to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
              N
            </div>
            <span className="text-xl font-bold text-foreground">NetSentinel</span>
          </div>
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </div>

      {/* Form Container */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12">
        <div className="w-full max-w-md">
          {/* Step Indicator */}
          <div className="mb-8 flex gap-2">
            <div className="flex-1 h-1 rounded-full bg-primary" />
            <div
              className={`flex-1 h-1 rounded-full transition-colors ${
                step !== "info" ? "bg-primary" : "bg-border"
              }`}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === "info" ? (
              <>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground">Create Your Account</h1>
                  <p className="text-muted-foreground">You&apos;ll be the admin for your organization.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className={errors.email ? "border-destructive" : ""}
                      disabled={isLoading}
                    />
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Username</label>
                    <Input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="john_doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                    <Input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={errors.password ? "border-destructive" : ""}
                      disabled={isLoading}
                    />
                    {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
                    <Input
                      type="password"
                      name="rePassword"
                      value={formData.rePassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={errors.rePassword ? "border-destructive" : ""}
                      disabled={isLoading}
                    />
                    {errors.rePassword && <p className="text-sm text-destructive mt-1">{errors.rePassword}</p>}
                  </div>
                </div>

                {errors.submit && (
                  <div className="bg-destructive/10 border border-destructive rounded-md p-3">
                    <p className="text-sm text-destructive">{errors.submit}</p>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full bg-primary hover:bg-accent text-primary-foreground"
                  disabled={isLoading}
                >
                  Continue
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground">Tell us about your organization</h1>
                  <p className="text-muted-foreground">We&apos;ll set up your dedicated namespace.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Company Name</label>
                    <Input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Acme Inc."
                      className={errors.companyName || errors.company_name ? "border-destructive" : ""}
                      disabled={isLoading}
                    />
                    {(errors.companyName || errors.company_name) && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.companyName || errors.company_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Company Size</label>
                    <select
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                        errors.companySize || errors.company_size ? "border-destructive" : ""
                      }`}
                      disabled={isLoading}
                    >
                      <option value="">Select size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="501+">501+ employees</option>
                    </select>
                    {(errors.companySize || errors.company_size) && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.companySize || errors.company_size}
                      </p>
                    )}
                  </div>
                </div>

                {errors.submit && (
                  <div className="bg-destructive/10 border border-destructive rounded-md p-3">
                    <p className="text-sm text-destructive">{errors.submit}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => setStep("info")}
                    variant="outline"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-accent text-primary-foreground"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
