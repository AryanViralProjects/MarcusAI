"use client"

import { Card, CardContent } from "@/components/ui/card"

interface SuggestionCardsProps {
  onSelectSuggestion: (suggestion: string) => void
}

export function SuggestionCards({ onSelectSuggestion }: SuggestionCardsProps) {
  const suggestions = [
    {
      id: 1,
      title: "Improve my email writing",
      image: "/images/email-writing.jpg",
      fallbackImage: "https://placehold.co/400x225/e2e8f0/64748b?text=Email+Writing",
      prompt: "Help me write a professional email to request a meeting with a potential client",
    },
    {
      id: 2,
      title: "Movie recommendations",
      image: "/images/movie-recommendations.jpg",
      fallbackImage: "https://placehold.co/400x225/e2e8f0/64748b?text=Movie+Recommendations",
      prompt: "Suggest some movies similar to Inception and Interstellar",
    },
    {
      id: 3,
      title: "Adventure planning",
      image: "/images/adventure-planning.jpg",
      fallbackImage: "https://placehold.co/400x225/e2e8f0/64748b?text=Adventure+Planning",
      prompt: "Help me plan a weekend surfing trip with my friends",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className="bg-card hover:bg-card/80 border rounded-lg p-4 cursor-pointer transition-colors"
          onClick={() => onSelectSuggestion(suggestion.prompt)}
        >
          <div className="aspect-video rounded-md overflow-hidden mb-4 bg-muted">
            <img
              src={suggestion.image}
              alt={suggestion.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = suggestion.fallbackImage;
              }}
            />
          </div>
          <h3 className="font-medium text-center">{suggestion.title}</h3>
        </div>
      ))}
    </div>
  )
}
