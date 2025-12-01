import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, User, Phone, Mail, FileText, Camera, CheckCircle, XCircle, AlertTriangle, DollarSign, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { useLocale } from "@/contexts/LocaleContext";
import { getDateLocale } from "@/lib/dateLocale";

interface AppointmentDetailsProps {
  appointment: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function AppointmentDetailsDialog({ appointment, isOpen, onClose }: AppointmentDetailsProps) {
  const [status, setStatus] = useState(appointment?.status || 'pending');
  const [notes, setNotes] = useState(appointment?.notes || '');
  const [paidAmount, setPaidAmount] = useState('');
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

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: { amount: number; fullPayment: boolean }) => {
      await apiRequest('POST', `/api/appointments/${appointment.id}/payment`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Payment recorded successfully!",
      });
      setPaidAmount('');
      // Close the dialog after successful payment
      setTimeout(() => {
        onClose();
      }, 1000); // Wait 1 second to show the success message
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to record payment";
      let description = errorMessage;
      
      // Handle specific error cases
      if (errorMessage.includes("already fully paid")) {
        description = "This appointment is already fully paid.";
      } else if (errorMessage.includes("exceeds outstanding balance")) {
        description = "Payment amount exceeds the outstanding balance.";
      } else if (errorMessage.includes("must be greater than zero")) {
        description = "Payment amount must be greater than zero.";
      }
      
      toast({
        title: "Payment Error",
        description,
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

  const handleFullPayment = () => {
    const totalAmount = parseFloat(appointment.totalAmount || '0');
    const currentPaid = parseFloat(appointment.paidAmount || '0');
    const outstandingBalance = totalAmount - currentPaid;
    
    if (outstandingBalance <= 0) {
      toast({
        title: "Payment Already Complete",
        description: "This appointment is already fully paid.",
        variant: "destructive",
      });
      return;
    }
    
    recordPaymentMutation.mutate({ amount: outstandingBalance, fullPayment: true });
  };

  const handlePartialPayment = () => {
    const amount = parseFloat(paidAmount);
    const totalAmount = parseFloat(appointment.totalAmount || '0');
    const currentPaid = parseFloat(appointment.paidAmount || '0');
    const outstandingBalance = totalAmount - currentPaid;
    
    if (outstandingBalance <= 0) {
      toast({
        title: "Payment Already Complete",
        description: "This appointment is already fully paid.",
        variant: "destructive",
      });
      return;
    }
    
    if (amount > outstandingBalance) {
      toast({
        title: "Amount Too High",
        description: `Payment amount cannot exceed outstanding balance of NZ$${outstandingBalance.toFixed(2)}.`,
        variant: "destructive",
      });
      return;
    }
    
    if (amount > 0) {
      recordPaymentMutation.mutate({ amount, fullPayment: false });
    }
  };

  const getPaymentStatus = () => {
    const total = parseFloat(appointment.totalAmount || '0');
    const paid = parseFloat(appointment.paidAmount || '0');
    const remaining = total - paid;
    
    if (paid === 0) return 'unpaid';
    if (remaining <= 0) return 'paid';
    return 'partial';
  };

  const getPaymentBadge = () => {
    const status = getPaymentStatus();
    const config = {
      unpaid: { variant: "destructive" as const, label: "Unpaid" },
      partial: { variant: "secondary" as const, label: "Partially Paid" },
      paid: { variant: "default" as const, label: "Paid in Full" },
    };
    const { variant, label } = config[status];
    return <Badge variant={variant}>{label}</Badge>;
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
      return format(date, "EEEE, d MMMM yyyy 'at' h:mm a", { locale: dateLocale });
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
                  <div className="flex flex-col">
                    {appointment.allProcedures && appointment.allProcedures.length > 0 ? (
                      <div>
                        <span className="font-medium">Procedures:</span>
                        <div className="mt-1 space-y-1">
                          {appointment.allProcedures.map((proc: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span>{proc.name}</span>
                              <span className="text-green-600">${proc.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="font-medium">{appointment.service?.name || 'Service not found'}</span>
                    )}
                  </div>
                </div>
                {appointment.service?.price && !appointment.allProcedures && (
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

          {/* Payment Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Payment Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-600">Total Amount</label>
                    <div className="text-lg font-semibold">
                      NZ${parseFloat(appointment.totalAmount || '0').toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Amount Paid</label>
                    <div className="text-lg font-semibold text-green-600">
                      NZ${parseFloat(appointment.paidAmount || '0').toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm text-slate-600">Outstanding Balance</label>
                    <div className="text-lg font-semibold text-red-600">
                      NZ${Math.max(0, parseFloat(appointment.totalAmount || '0') - parseFloat(appointment.paidAmount || '0')).toFixed(2)}
                    </div>
                  </div>
                  {getPaymentBadge()}
                </div>

                {getPaymentStatus() !== 'paid' && Math.max(0, parseFloat(appointment.totalAmount || '0') - parseFloat(appointment.paidAmount || '0')) > 0 && (
                  <div className="space-y-3 border-t pt-4">
                    <h4 className="font-medium">Record Payment</h4>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={handleFullPayment}
                        disabled={recordPaymentMutation.isPending}
                        className="flex items-center gap-2 bg-pink-500 text-white hover:bg-pink-600"
                      >
                        <CreditCard className="w-4 h-4" />
                        Full Payment
                      </Button>
                    </div>
                    
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="text-sm font-medium mb-1 block">Custom Amount</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={parseFloat(appointment.totalAmount || '0')}
                          placeholder="0.00"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handlePartialPayment}
                        disabled={!paidAmount || recordPaymentMutation.isPending}
                        variant="outline"
                      >
                        Record Payment
                      </Button>
                    </div>
                    
                    <p className="text-xs text-slate-500">
                      This will be automatically recorded in your financial records.
                    </p>
                  </div>
                )}
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