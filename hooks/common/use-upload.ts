"use client"

import * as React from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api" ||"https://onno-rokom-backend.onrender.com/api"

export function useUpload() {
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const uploadFile = async (file: File): Promise<string | null> => {
    setUploading(true)
    setError(null)

    // Match backend size limitation rule: 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds the maximum limit of 10MB.")
      setUploading(false)
      return null
    }

    // Match backend allowed format restrictions
    const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg", ".docx", ".zip"]
    const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
    if (!allowedExtensions.includes(extension)) {
      setError("Unsupported format. Allowed formats: PDF, PNG, JPG, DOCX, ZIP.")
      setUploading(false)
      return null
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("AUTH_TOKEN") : null
    const formData = new FormData()
    formData.append("file", file)

    try {
      const baseUrl = API_BASE_URL.replace(/\/$/, "")
      const response = await fetch(`${baseUrl}/upload`, {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
        body: formData,
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.message || "Failed to upload file.")
      }

      const data = await response.json()
      return data.url // Returns the public URL of the uploaded asset
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during file upload.")
      return null
    } finally {
      setUploading(false)
    }
  }

  return {
    uploadFile,
    uploading,
    error,
  }
}