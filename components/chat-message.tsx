import Image from "next/image";
import { cn } from "@/lib/utils";
import { UserIcon, BotIcon } from "lucide-react";

function Avatar({ role, src }: { role: string; src?: string }) {
  const isUser = role === 'user';
  
  // Check if the src is provided and exists
  // If not, use fallback avatar based on role
  const avatarSrc = src || (isUser 
    ? "/user-avatar.png" 
    : "/marcus-avatar.png");
  
  return (
    <div className={cn("flex items-center justify-center h-8 w-8 rounded-md overflow-hidden", 
      isUser ? "bg-primary" : "bg-muted")}>
      {avatarSrc ? (
        <Image
          src={avatarSrc}
          alt={role}
          width={32}
          height={32}
          className={cn(
            "rounded",
            role === 'assistant' && "p-1"
          )}
          priority
          unoptimized
        />
      ) : (
        <div className={cn("h-full w-full flex items-center justify-center",
          isUser ? "bg-primary" : "bg-muted")}>
          {isUser ? (
            <UserIcon className="h-4 w-4 text-primary-foreground" />
          ) : (
            <BotIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      )}
    </div>
  );
}

export default Avatar; 