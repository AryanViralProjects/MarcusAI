import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Conversation } from '@/types/chat';
import { ConversationWithMessages } from '@/lib/conversation-service';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ExportConversationProps {
  conversation: Conversation | ConversationWithMessages;
  trigger?: React.ReactNode;
}

export function ExportConversation({ conversation, trigger }: ExportConversationProps) {
  const [exportFormat, setExportFormat] = useState<'json' | 'markdown' | 'text'>('markdown');
  const [isOpen, setIsOpen] = useState(false);

  const exportConversation = () => {
    let content = '';
    let filename = `${conversation.title || 'conversation'}-${new Date().toISOString().split('T')[0]}`;
    let mimeType = '';

    switch (exportFormat) {
      case 'json':
        content = JSON.stringify(conversation, null, 2);
        filename += '.json';
        mimeType = 'application/json';
        break;
      case 'markdown':
        content = conversation.messages.map(message => {
          const role = message.role === 'user' ? 'You' : 'Marcus AI';
          return `## ${role}\n\n${message.content}\n\n`;
        }).join('---\n\n');
        filename += '.md';
        mimeType = 'text/markdown';
        break;
      case 'text':
        content = conversation.messages.map(message => {
          const role = message.role === 'user' ? 'You' : 'Marcus AI';
          return `${role}:\n${message.content}\n\n`;
        }).join('');
        filename += '.txt';
        mimeType = 'text/plain';
        break;
    }

    // Create a blob and download it
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Export">
            <Download className="h-3.5 w-3.5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Conversation</DialogTitle>
          <DialogDescription>
            Choose a format to export your conversation.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup value={exportFormat} onValueChange={(value) => setExportFormat(value as any)}>
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="markdown" id="markdown" />
              <Label htmlFor="markdown">Markdown (.md)</Label>
            </div>
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="json" id="json" />
              <Label htmlFor="json">JSON (.json)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="text" id="text" />
              <Label htmlFor="text">Plain Text (.txt)</Label>
            </div>
          </RadioGroup>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={exportConversation}>
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 