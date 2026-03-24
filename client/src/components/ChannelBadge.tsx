import { Badge } from "@/components/ui/badge";
import { MessageSquare, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChannelBadgeProps {
  channel: 'whatsapp' | 'email';
  className?: string;
}

export function ChannelBadge({ channel, className }: ChannelBadgeProps) {
  const getChannelConfig = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return {
          label: 'WhatsApp',
          icon: <MessageSquare className="w-3 h-3 mr-1" />,
          className: 'bg-green-100 text-green-800 hover:bg-green-200',
        };
      case 'email':
        return {
          label: 'Email',
          icon: <Mail className="w-3 h-3 mr-1" />,
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
        };
      default:
        return {
          label: channel,
          icon: null,
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
        };
    }
  };

  const config = getChannelConfig(channel);

  return (
    <Badge 
      className={cn(
        "text-xs font-medium flex items-center",
        config.className,
        className
      )}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}




