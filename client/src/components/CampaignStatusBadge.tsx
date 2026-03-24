import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CampaignStatusBadgeProps {
  status: 'draft' | 'sending' | 'completed' | 'cancelled';
  className?: string;
}

export function CampaignStatusBadge({ status, className }: CampaignStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft':
        return {
          label: 'Rascunho',
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
        };
      case 'sending':
        return {
          label: 'Enviando',
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-200 animate-pulse',
        };
      case 'completed':
        return {
          label: 'Concluída',
          className: 'bg-green-100 text-green-800 hover:bg-green-200',
        };
      case 'cancelled':
        return {
          label: 'Cancelada',
          className: 'bg-red-100 text-red-800 hover:bg-red-200',
        };
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      className={cn(
        "text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}




