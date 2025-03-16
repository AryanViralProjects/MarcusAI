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
      image: `/email-writing.png?t=${timestamp}`,
      fallbackImage: `/email-writing.png`,
      prompt: "Help me write a professional email to request a meeting with a potential client",
    },
    {
      id: 2,
      title: "Movie recommendations",
      image: `/movie-recommendation.png?t=${timestamp}`,
      fallbackImage: `/movie-recommendation.png`,
      prompt: "Suggest some movies similar to Inception and Interstellar",
    },
    {
      id: 3,
      title: "Let's Talk About Space",
      image: `/space-rocket.png?t=${timestamp}`,
      fallbackImage: `/space-rocket.png`,
      prompt: "Tell me about recent developments in space exploration and Mars missions",
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className="bg-card hover:bg-card/80 border rounded-lg p-5 cursor-pointer transition-colors transform hover:scale-105 hover:shadow-lg"
          onClick={() => onSelectSuggestion(suggestion.prompt)}
        >
          <div className="aspect-video rounded-lg overflow-hidden mb-5 bg-muted relative shadow-md">
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
          <h3 className="font-medium text-center text-lg">{suggestion.title}</h3>
        </div>
      ))}
    </div>
  )
}
