import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, User, Phone, Mail, FileText, Camera, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { enNZ } from "date-fns/locale";

interface AppointmentDetailsProps {
  appointment: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function AppointmentDetailsDialog({ appointment, isOpen, onClose }: AppointmentDetailsProps) {
  const [status, setStatus] = useState(appointment?.status || 'pending');
  const [notes, setNotes] = useState(appointment?.notes || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateAppointmentMutation = useMutation({
    mutationFn: async (data: { status: string; notes: string }) => {
      await apiRequest('PUT', `/api/appointments/${appointment.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Success",
        description: "Appointment updated successfully!",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update appointment",
        variant: "destructive",
      });
    },
  });

  if (!appointment) return null;

  const handleStatusChange = (newStatus: string) => {
    const updatedStatus = newStatus || status;
    setStatus(updatedStatus);
    updateAppointmentMutation.mutate({ status: updatedStatus, notes });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, icon: AlertTriangle, label: "Pending Approval" },
      confirmed: { variant: "default" as const, icon: CheckCircle, label: "Confirmed" },
      scheduled: { variant: "default" as const, icon: Calendar, label: "Scheduled" },
      completed: { variant: "default" as const, icon: CheckCircle, label: "Completed" },
      cancelled: { variant: "destructive" as const, icon: XCircle, label: "Cancelled" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDateTime = (dateTime: string) => {
    try {
      const date = parseISO(dateTime);
      return format(date, "EEEE, d MMMM yyyy 'at' h:mm a", { locale: enNZ });
    } catch {
      return dateTime;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Appointment Details</span>
            {getStatusBadge(appointment.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Client Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-slate-400" />
                  <span className="font-medium">{appointment.client?.name}</span>
                </div>
                {appointment.client?.phone && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-slate-400" />
                    <span>{appointment.client.phone}</span>
                  </div>
                )}
                {appointment.client?.email && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-slate-400" />
                    <span>{appointment.client.email}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Appointment Details */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Appointment Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                  <span>{formatDateTime(appointment.appointmentDate)}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-slate-400" />
                  <span>{appointment.duration} minutes</span>
                </div>
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-slate-400" />
                  <span className="font-medium">{appointment.service?.name || 'Service not found'}</span>
                </div>
                {appointment.service?.price && (
                  <div className="flex items-center">
                    <span className="w-4 h-4 mr-2 text-slate-400">$</span>
                    <span>${appointment.service.price}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Status Management</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Appointment Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending Approval</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Notes</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this appointment..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          {(appointment.beforeImages?.length > 0 || appointment.afterImages?.length > 0) && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center">
                  <Camera className="w-4 h-4 mr-2" />
                  Photos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appointment.beforeImages?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Before</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {appointment.beforeImages.map((image: string, index: number) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Before ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {appointment.afterImages?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">After</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {appointment.afterImages.map((image: string, index: number) => (
                          <img
                            key={index}
                            src={image}
                            alt={`After ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleStatusChange(status)}
              disabled={updateAppointmentMutation.isPending}
            >
              {updateAppointmentMutation.isPending ? "Updating..." : "Update Appointment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}