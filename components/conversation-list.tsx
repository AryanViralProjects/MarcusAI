import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { PlusIcon, Trash2, Edit, Check, X, Download, FolderIcon, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConversationWithMessages } from '@/lib/conversation-service';
import { useConversations } from '@/hooks/use-conversations';
import { Input } from '@/components/ui/input';
import { ExportConversation } from '@/components/export-conversation';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ConversationListProps {
  className?: string;
  currentConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  isCreatingConversation?: boolean;
}

export function ConversationList({
  className,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  isCreatingConversation = false,
}: ConversationListProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { conversations, deleteConversation, updateConversation } = useConversations();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');

  // Start editing a conversation title
  const handleEdit = (conversation: ConversationWithMessages) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title || 'Untitled conversation');
  };

  // Save the edited title
  const handleSave = async (id: string) => {
    await updateConversation(id, { title: editTitle });
    setEditingId(null);
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingId(null);
  };

  // Delete a conversation
  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this conversation?');
    if (confirmed) {
      await deleteConversation(id);
      if (id === currentConversationId) {
        onNewConversation();
      }
    }
  };

  // Format the date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Sort conversations based on current sort order
  const sortedConversations = [...conversations].sort((a, b) => {
    switch (sortOrder) {
      case 'newest':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'oldest':
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      case 'alphabetical':
        const titleA = a.title || 'Untitled conversation';
        const titleB = b.title || 'Untitled conversation';
        return titleA.localeCompare(titleB);
      default:
        return 0;
    }
  });

  // Toggle sort order
  const toggleSortOrder = () => {
    if (sortOrder === 'newest') setSortOrder('oldest');
    else if (sortOrder === 'oldest') setSortOrder('alphabetical');
    else setSortOrder('newest');
  };

  if (!session?.user) {
    return (
      <div className={cn('flex flex-col gap-2 p-4', className)}>
        <p className="text-sm text-muted-foreground">
          Sign in to view and save your conversations.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Button
        variant="outline"
        className="flex items-center justify-start gap-2 mb-2"
        onClick={onNewConversation}
        disabled={isCreatingConversation}
      >
        {isCreatingConversation ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Creating...
          </div>
        ) : (
          <>
            <PlusIcon className="h-4 w-4" />
            New conversation
          </>
        )}
      </Button>

      {/* Sort options */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Conversations</span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 px-2" 
          onClick={toggleSortOrder}
          title={`Sort by: ${sortOrder}`}
        >
          <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
          <span className="text-xs">{sortOrder.charAt(0).toUpperCase() + sortOrder.slice(1)}</span>
        </Button>
      </div>

      <div className="space-y-1">
        {sortedConversations.length === 0 ? (
          <p className="text-sm text-muted-foreground px-2 py-1">
            No conversations yet
          </p>
        ) : (
          sortedConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                'flex items-center justify-between group rounded-md px-2 py-1 text-sm',
                conversation.id === currentConversationId
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-muted/50'
              )}
            >
              {editingId === conversation.id ? (
                <div className="flex items-center justify-between w-full gap-1">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-7 text-sm"
                    autoFocus
                  />
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleSave(conversation.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleCancel}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    className="flex-1 text-left truncate pr-2"
                    onClick={() => onSelectConversation(conversation.id)}
                  >
                    <span className="truncate">
                      {conversation.title || 'Untitled conversation'}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {formatDate(conversation.updatedAt.toString())}
                    </span>
                  </button>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleEdit(conversation)}
                      title="Rename"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <ExportConversation conversation={conversation} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDelete(conversation.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 