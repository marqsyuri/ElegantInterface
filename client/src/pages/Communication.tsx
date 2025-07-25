import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Star, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { insertMessageSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/contexts/SidebarContext";
import { z } from "zod";

const messageFormSchema = insertMessageSchema.omit({ userId: true });
type MessageFormData = z.infer<typeof messageFormSchema>;

export default function Communication() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [autoSettings, setAutoSettings] = useState({
    appointmentReminder: true,
    postTreatmentFeedback: true,
    monthlyPromotions: false,
  });
  const { toast } = useToast();
  const { isCollapsed } = useSidebar();
  const queryClient = useQueryClient();

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      type: "manual",
      channel: "whatsapp",
      status: "pending",
    },
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/messages"],
    retry: false,
  });

  const { data: feedback = [], isLoading: feedbackLoading } = useQuery({
    queryKey: ["/api/feedback"],
    retry: false,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const createMessageMutation = useMutation({
    mutationFn: async (data: MessageFormData) => {
      await apiRequest('POST', '/api/messages', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Message sent successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MessageFormData) => {
    createMessageMutation.mutate({
      ...data,
      sentAt: new Date().toISOString(),
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar />
      
      <main className={`transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <TopHeader title="Communication" subtitle="Manage messages, feedback and client interactions" />
        
        <div className="p-6 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-slate-900">Client Communication</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Send className="w-4 h-4 mr-2" />
                    New Message
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Send Manual Message</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recipient</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(value === "all" ? null : parseInt(value))} 
                              value={field.value ? field.value.toString() : "all"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select recipient" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="all">All clients</SelectItem>
                                {clients?.map((client: any) => (
                                  <SelectItem key={client.id} value={client.id.toString()}>
                                    {client.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="channel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Channel</FormLabel>
                            <div className="flex space-x-4">
                              <div className="flex items-center space-x-2">
                                <input 
                                  type="radio" 
                                  id="whatsapp" 
                                  value="whatsapp"
                                  checked={field.value === "whatsapp"}
                                  onChange={field.onChange}
                                  className="text-primary"
                                />
                                <label htmlFor="whatsapp" className="text-sm text-slate-700">WhatsApp</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input 
                                  type="radio" 
                                  id="sms" 
                                  value="sms"
                                  checked={field.value === "sms"}
                                  onChange={field.onChange}
                                  className="text-primary"
                                />
                                <label htmlFor="sms" className="text-sm text-slate-700">SMS</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input 
                                  type="radio" 
                                  id="email" 
                                  value="email"
                                  checked={field.value === "email"}
                                  onChange={field.onChange}
                                  className="text-primary"
                                />
                                <label htmlFor="email" className="text-sm text-slate-700">E-mail</label>
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Type your message..."
                                className="h-24"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex space-x-3">
                        <Button type="submit" disabled={createMessageMutation.isPending}>
                          {createMessageMutation.isPending ? "Sending..." : "Send Message"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium text-slate-900 mb-4">Automatic Messages</h4>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-slate-900">Appointment Reminder</h5>
                        <Switch 
                          checked={autoSettings.appointmentReminder}
                          onCheckedChange={(checked) => 
                            setAutoSettings(prev => ({ ...prev, appointmentReminder: checked }))
                          }
                        />
                      </div>
                      <p className="text-sm text-slate-600 mb-2">Sent 24h before appointment</p>
                      <p className="text-sm text-slate-700 italic">
                        "Hi [name], we'd like to remind you that you have an appointment tomorrow at [time]. See you soon!"
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-slate-900">Post-Treatment Feedback</h5>
                        <Switch 
                          checked={autoSettings.postTreatmentFeedback}
                          onCheckedChange={(checked) => 
                            setAutoSettings(prev => ({ ...prev, postTreatmentFeedback: checked }))
                          }
                        />
                      </div>
                      <p className="text-sm text-slate-600 mb-2">Sent 2h after treatment</p>
                      <p className="text-sm text-slate-700 italic">
                        "How are you feeling after your treatment? Your feedback is very important to us!"
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-slate-900">Monthly Promotions</h5>
                        <Switch 
                          checked={autoSettings.monthlyPromotions}
                          onCheckedChange={(checked) => 
                            setAutoSettings(prev => ({ ...prev, monthlyPromotions: checked }))
                          }
                        />
                      </div>
                      <p className="text-sm text-slate-600 mb-2">Sent at the beginning of each month</p>
                      <p className="text-sm text-slate-700 italic">
                        "Check out our special promotions this month! Take care of your skin with special discounts."
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-slate-900 mb-4">Client Feedback</h4>
                  <div className="space-y-4 mb-6">
                    {feedbackLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse p-4 border border-slate-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                                <div className="ml-2 h-4 bg-slate-200 rounded w-24"></div>
                              </div>
                              <div className="h-4 bg-slate-200 rounded w-16"></div>
                            </div>
                            <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                            <div className="h-3 bg-slate-200 rounded w-20"></div>
                          </div>
                        ))}
                      </div>
                    ) : feedback?.length > 0 ? (
                      feedback.slice(0, 5).map((item: any) => (
                        <div key={item.id} className="p-4 border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src="" alt="Client" />
                                <AvatarFallback className="text-xs">
                                  {getInitials(item.client.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="ml-2 font-medium text-slate-900">{item.client.name}</span>
                            </div>
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-4 h-4 ${
                                    i < item.rating 
                                      ? 'fill-current' 
                                      : 'text-slate-300'
                                  }`} 
                                />
                              ))}
                            </div>
                          </div>
                          {item.comment && (
                            <p className="text-sm text-slate-600">{item.comment}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-2">
                            {new Date(item.createdAt).toLocaleDateString('en-NZ')}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No feedback received</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
