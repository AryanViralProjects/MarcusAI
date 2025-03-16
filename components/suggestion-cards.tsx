"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"
import Image from "next/image"

interface SuggestionCardsProps {
  onSelectSuggestion: (suggestion: string) => void
}

export function SuggestionCards({ onSelectSuggestion }: SuggestionCardsProps) {
  // Add timestamp to force image reload and prevent caching
  const timestamp = Date.now();
  
  const suggestions = [
    {
      id: 1,
      title: "Improve my email writing",
      image: `/email.png?t=${timestamp}`,
      fallbackImage: `/6tfFlC1N41i (1).png`,
      prompt: "Help me write a professional email to request a meeting with a potential client",
    },
    {
      id: 2,
      title: "Movie recommendations",
      image: `/movie.png?t=${timestamp}`,
      fallbackImage: `/ROqhI2t0K61.png`,
      prompt: "Suggest some movies similar to Inception and Interstellar",
    },
    {
      id: 3,
      title: "Adventure planning",
      image: `/movie.png?t=${timestamp}`,
      fallbackImage: `/ROqhI2t0K61.png`,
      prompt: "Help me plan a weekend surfing trip with my friends",
    },
  ]

  // Track which images have failed to load
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  const handleImageError = (id: number) => {
    console.log(`Image ${id} failed to load`);
    setFailedImages(prev => ({
      ...prev,
      [id]: true
    }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className="bg-card hover:bg-card/80 border rounded-lg p-4 cursor-pointer transition-colors"
          onClick={() => onSelectSuggestion(suggestion.prompt)}
        >
          <div className="aspect-video rounded-md overflow-hidden mb-4 bg-muted relative">
            {failedImages[suggestion.id] ? (
              <img
                src={suggestion.fallbackImage}
                alt={suggestion.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={suggestion.image}
                alt={suggestion.title}
                className="w-full h-full object-cover"
                onError={() => handleImageError(suggestion.id)}
              />
            )}
          </div>
          <h3 className="font-medium text-center">{suggestion.title}</h3>
        </div>
      ))}
    </div>
  )
}
