import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertTriangle } from 'lucide-react';

interface TimeSlotAlertProps {
  message: string;
  type: 'warning' | 'error' | 'info';
}

export function TimeSlotAlert({ message, type }: TimeSlotAlertProps) {
  const getAlertStyle = () => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'info':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Alert className={getAlertStyle()}>
      <div className="flex items-center gap-2">
        {getIcon()}
        <AlertDescription className="text-sm">
          {message}
        </AlertDescription>
      </div>
    </Alert>
  );
}
