"use client"

import * as React from "react"
import { Sparkles, Bot, Cpu, Zap } from "lucide-react"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useEffect, useState } from "react"

// Define model options as string constants
const MODELS = [
  {
    value: "gpt-4.5-preview-2025-02-27",
    label: "GPT-4.5",
    icon: <Sparkles className="h-4 w-4 text-yellow-500" />,
    description: "Latest model with new prompting API support"
  },
  {
    value: "gpt-4o",
    label: "GPT-4o",
    icon: <Sparkles className="h-4 w-4" />,
    description: "Balanced model for general use"
  },
  {
    value: "claude-3-7-sonnet-20250219",
    label: "Claude 3.7 Sonnet",
    icon: <Bot className="h-4 w-4" />,
    description: "Anthropic's advanced language model"
  },
  {
    value: "gemini-2.0-flash",
    label: "Gemini 2.0",
    icon: <Cpu className="h-4 w-4" />,
    description: "Google's fast AI model"
  },
]

interface ModelSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  
  // Find the currently selected model
  const selectedModel = MODELS.find(model => model.value === value) || MODELS[0]

  // Handle model selection
  const handleSelectModel = (modelValue: string) => {
    console.log(`Model selected: ${modelValue}`);
    onChange(modelValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
          data-testid="model-selector"
        >
          <div className="flex items-center gap-2">
            {selectedModel.icon}
            <span data-component-name="ModelSelector">{selectedModel.label}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search model..." />
          <CommandGroup>
            {MODELS.map((model) => (
              <div 
                key={model.value}
                className="flex flex-col px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                onClick={() => handleSelectModel(model.value)}
                data-testid={`model-option-${model.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === model.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2">
                    {model.icon}
                    <span className="font-medium">{model.label}</span>
                  </div>
                </div>
                {model.description && (
                  <div className="ml-8 text-xs text-muted-foreground mt-1">{model.description}</div>
                )}
              </div>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
