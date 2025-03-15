"use client"

import * as React from "react"
import { Search, FileSearch, Laptop } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ToolType } from "@/lib/openai"

interface ToolOption {
  id: ToolType;
  name: string;
  icon: React.ReactNode;
  description: string;
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
    name: "File Search",
    icon: <FileSearch className="h-4 w-4" />,
    description: "Search through your files"
  },
  {
    id: ToolType.COMPUTER_USE,
    name: "Computer Use",
    icon: <Laptop className="h-4 w-4" />,
    description: "Execute commands on your computer"
  }
];

interface ToolSelectorProps {
  value: ToolType[];
  onChange: (value: ToolType[]) => void;
}

export function ToolSelector({ value = [], onChange }: ToolSelectorProps) {
  const toggleTool = (toolId: ToolType) => {
    if (value.includes(toolId)) {
      onChange(value.filter(id => id !== toolId));
    } else {
      onChange([...value, toolId]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {TOOLS.map((tool) => (
        <Button
          key={tool.id}
          variant={value.includes(tool.id) ? "secondary" : "outline"}
          size="sm"
          onClick={() => toggleTool(tool.id)}
          title={tool.description}
          className="flex items-center gap-1"
        >
          {tool.icon}
          <span>{tool.name}</span>
        </Button>
      ))}
    </div>
  );
}
