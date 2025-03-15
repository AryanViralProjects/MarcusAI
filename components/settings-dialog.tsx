"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { UserPreferences, defaultPreferences, saveUserPreferences, loadUserPreferences } from "@/lib/personalization"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)

  // Load user preferences when dialog opens
  useEffect(() => {
    if (open) {
      const savedPreferences = loadUserPreferences()
      setPreferences(savedPreferences)
    }
  }, [open])

  // Handle saving preferences
  const handleSave = () => {
    saveUserPreferences(preferences)
    onOpenChange(false)
  }

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setPreferences((prev) => ({ ...prev, [name]: value }))
  }

  // Handle radio button changes
  const handleRadioChange = (name: string, value: string) => {
    setPreferences((prev) => ({ ...prev, [name]: value }))
  }

  // Handle interests changes (comma-separated list)
  const handleInterestsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const interestsText = e.target.value
    const interestsArray = interestsText
      .split(",")
      .map((interest) => interest.trim())
      .filter((interest) => interest.length > 0)

    setPreferences((prev) => ({ ...prev, interests: interestsArray }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Personalize Marcus</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Your Name
            </Label>
            <Input
              id="name"
              name="name"
              value={preferences.name || ""}
              onChange={handleChange}
              placeholder="Optional"
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="interests" className="text-right pt-2">
              Your Interests
            </Label>
            <Textarea
              id="interests"
              value={preferences.interests?.join(", ") || ""}
              onChange={handleInterestsChange}
              placeholder="Technology, Science, Art, etc. (comma-separated)"
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Communication Style</Label>
            <RadioGroup
              value={preferences.communicationStyle}
              onValueChange={(value: 'formal' | 'casual' | 'friendly' | 'professional') => 
                handleRadioChange("communicationStyle", value)
              }
              className="col-span-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="casual" id="casual" />
                <Label htmlFor="casual">Casual</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="friendly" id="friendly" />
                <Label htmlFor="friendly">Friendly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="professional" id="professional" />
                <Label htmlFor="professional">Professional</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="formal" id="formal" />
                <Label htmlFor="formal">Formal</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">AI Personality</Label>
            <RadioGroup
              value={preferences.aiPersonality}
              onValueChange={(value: 'helpful' | 'creative' | 'analytical' | 'empathetic') => 
                handleRadioChange("aiPersonality", value)
              }
              className="col-span-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="helpful" id="helpful" />
                <Label htmlFor="helpful">Helpful</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="creative" id="creative" />
                <Label htmlFor="creative">Creative</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="analytical" id="analytical" />
                <Label htmlFor="analytical">Analytical</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="empathetic" id="empathetic" />
                <Label htmlFor="empathetic">Empathetic</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
