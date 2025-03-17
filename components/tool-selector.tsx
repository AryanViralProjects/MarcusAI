"use client"

import * as React from "react"
import { Search, FileSearch, Laptop } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ToolType } from "@/lib/openai"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ToolOption {
  id: ToolType;
  name: string;
  icon: React.ReactNode;
  description: string;
  comingSoon?: boolean;
}

const TOOLS: ToolOption[] = [
  {
    id: ToolType.WEB_SEARCH,
    name: "Web Search",
    icon: <Search className="h-4 w-4" />,
    description: "Search the web for information"
  },
  {
    id: ToolType.FILE_SEARCH,
    name: "Performance Marketing",
    icon: <FileSearch className="h-4 w-4" />,
    description: "Search through performance marketing documents"
  },
  {
    id: ToolType.COMPUTER_USE,
    name: "Computer Use",
    icon: <Laptop className="h-4 w-4" />,
    description: "Execute commands on your computer",
    comingSoon: true
  }
];

interface ToolSelectorProps {
  value: ToolType[];
  onChange: (value: ToolType[]) => void;
}

export function ToolSelector({ value = [], onChange }: ToolSelectorProps) {
  const toggleTool = (toolId: ToolType, comingSoon?: boolean) => {
    if (comingSoon) return; // Don't toggle if it's a coming soon feature
    
    if (value.includes(toolId)) {
      onChange(value.filter(id => id !== toolId));
    } else {
      onChange([...value, toolId]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <TooltipProvider>
        {TOOLS.map((tool) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <div className="relative">
                <Button
                  variant={value.includes(tool.id) && !tool.comingSoon ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => toggleTool(tool.id, tool.comingSoon)}
                  className={`flex items-center gap-1 ${tool.comingSoon ? 'opacity-70 cursor-not-allowed' : ''}`}
                  disabled={tool.comingSoon}
                >
                  {tool.icon}
                  <span>{tool.name}</span>
                  {tool.comingSoon && (
                    <Badge variant="outline" className="ml-1 text-xs py-0 h-4">
                      Soon
                    </Badge>
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {tool.comingSoon 
                ? `${tool.description} (Coming soon)`
                : tool.description}
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
