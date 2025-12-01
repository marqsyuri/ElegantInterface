import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Send, Eye, Trash2, Calendar, Users, MessageSquare, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { CampaignStatusBadge } from "@/components/CampaignStatusBadge";
import { ChannelBadge } from "@/components/ChannelBadge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLocale } from "@/contexts/LocaleContext";

type CampaignFormData = {
  name: string;
  objective: string;
  channel: 'whatsapp' | 'email';
  messageContent: string;
  sendNow: boolean;
  scheduledFor?: string;
};

interface Campaign {
  id: number;
  name: string;
  objective: string;
  channel: 'whatsapp' | 'email';
  messageContent: string;
  status: 'draft' | 'sending' | 'completed' | 'cancelled';
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  scheduledFor?: string;
  completedAt?: string;
  createdAt: string;
}

export default function Campaigns() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const { toast } = useToast();
  const { isExpanded } = useSidebar();
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const campaignFormSchema = z.object({
    name: z.string().min(1, t("name_required")),
    objective: z.string().min(1, t("campaign_objective_required")),
    channel: z.enum(["whatsapp", "email"]),
    messageContent: z.string().min(1, t("message_required")),
    sendNow: z.boolean().default(true),
    scheduledFor: z.string().optional(),
  });

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: "",
      objective: "",
      channel: "whatsapp",
      messageContent: "",
      sendNow: true,
    },
  });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["/api/campaigns"],
    retry: false,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      const payload = {
        name: data.name,
        objective: data.objective,
        channel: data.channel,
        messageContent: data.messageContent,
        scheduledFor: data.sendNow ? null : data.scheduledFor,
      };
      return await apiRequest('POST', '/api/campaigns', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: t("success"),
        description: t("campaign_created_success"),
      });
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: t("campaign_create_failed"),
        variant: "destructive",
      });
    },
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      return await apiRequest('POST', `/api/campaigns/${campaignId}/send`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: t("success"),
        description: t("campaign_sent_success"),
      });
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: t("campaign_send_failed"),
        variant: "destructive",
      });
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      return await apiRequest('DELETE', `/api/campaigns/${campaignId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: t("success"),
        description: t("campaign_deleted_success"),
      });
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: t("campaign_delete_failed"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CampaignFormData) => {
    createCampaignMutation.mutate(data);
  };

  const handleSendCampaign = (campaignId: number) => {
    sendCampaignMutation.mutate(campaignId);
  };

  const handleDeleteCampaign = (campaignId: number) => {
    if (confirm(t("confirm_delete_campaign"))) {
      deleteCampaignMutation.mutate(campaignId);
    }
  };

  const handleViewDetails = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsDetailsDialogOpen(true);
  };

  const getEligibleClientsCount = (channel: 'whatsapp' | 'email') => {
    if (channel === 'whatsapp') {
      return clients.filter((client: any) => client.notifyWhatsapp).length;
    } else {
      return clients.filter((client: any) => client.email).length;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar />
      
      <main className={`${isExpanded ? 'lg:ml-72' : 'lg:ml-16'} pt-16 lg:pt-0 transition-all duration-300`}>
        <TopHeader title={t("campaigns_title")} subtitle={t("campaigns_subtitle")} />
        
        <div className="p-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-slate-900">{t("marketing_campaigns")}</CardTitle>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    {t("new_campaign")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t("create_new_campaign")}</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("campaign_name")}</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Summer Promotion" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="objective"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("campaign_objective")}</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder={t("campaign_objective_placeholder")}
                                className="h-20"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="channel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("communication_channel")}</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="flex space-x-6"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="whatsapp" id="whatsapp" />
                                  <Label htmlFor="whatsapp" className="flex items-center">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    WhatsApp ({getEligibleClientsCount('whatsapp')} {t("all_clients").toLowerCase()})
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="email" id="email" />
                                  <Label htmlFor="email" className="flex items-center">
                                    <Mail className="w-4 h-4 mr-2" />
                                    Email ({getEligibleClientsCount('email')} {t("all_clients").toLowerCase()})
                                  </Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="messageContent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("message")}</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder={t("message_placeholder")}
                                className="h-32"
                                {...field} 
                              />
                            </FormControl>
                            <div className="text-sm text-slate-500">
                              {t("use_name_personalize")}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sendNow"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("when_to_send")}</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={(value) => field.onChange(value === "now")}
                                value={field.value ? "now" : "schedule"}
                                className="flex space-x-6"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="now" id="now" />
                                  <Label htmlFor="now">{t("send_now")}</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="schedule" id="schedule" />
                                  <Label htmlFor="schedule">{t("schedule")}</Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {!form.watch("sendNow") && (
                        <FormField
                          control={form.control}
                          name="scheduledFor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("date_and_time")}</FormLabel>
                              <FormControl>
                                <Input 
                                  type="datetime-local"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <div className="flex space-x-3 pt-4">
                        <Button 
                          type="submit" 
                          disabled={createCampaignMutation.isPending}
                          className="flex-1"
                        >
                          {createCampaignMutation.isPending ? t("creating_campaign") : t("create_campaign")}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          {t("cancel")}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="h-4 bg-slate-200 rounded w-48"></div>
                        <div className="h-6 bg-slate-200 rounded w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : campaigns.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("objective")}</TableHead>
                      <TableHead>{t("channel")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("sent_total")}</TableHead>
                      <TableHead>{t("date")}</TableHead>
                      <TableHead>{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign: Campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{campaign.objective}</TableCell>
                        <TableCell>
                          <ChannelBadge channel={campaign.channel} />
                        </TableCell>
                        <TableCell>
                          <CampaignStatusBadge status={campaign.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Users className="w-4 h-4 mr-1" />
                            {campaign.sentCount}/{campaign.totalRecipients}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(campaign.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(campaign)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {campaign.status === 'draft' && (
                              <Button
                                size="sm"
                                onClick={() => handleSendCampaign(campaign.id)}
                                disabled={sendCampaignMutation.isPending}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteCampaign(campaign.id)}
                              disabled={deleteCampaignMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">{t("no_campaigns_created")}</h3>
                  <p className="text-slate-500 mb-4">{t("start_first_campaign")}</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t("create_first_campaign")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("campaign_details")}</DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700">{t("name")}</Label>
                <p className="text-slate-900">{selectedCampaign.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">{t("objective")}</Label>
                <p className="text-slate-900">{selectedCampaign.objective}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">{t("channel")}</Label>
                <ChannelBadge channel={selectedCampaign.channel} />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">{t("status")}</Label>
                <CampaignStatusBadge status={selectedCampaign.status} />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">{t("message")}</Label>
                <p className="text-slate-900 bg-slate-50 p-3 rounded-md">
                  {selectedCampaign.messageContent}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700">{t("total_recipients")}</Label>
                  <p className="text-slate-900">{selectedCampaign.totalRecipients}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">{t("sent")}</Label>
                  <p className="text-slate-900">{selectedCampaign.sentCount}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">{t("created_on")}</Label>
                <p className="text-slate-900">{formatDate(selectedCampaign.createdAt)}</p>
              </div>
              {selectedCampaign.completedAt && (
                <div>
                  <Label className="text-sm font-medium text-slate-700">{t("completed_on")}</Label>
                  <p className="text-slate-900">{formatDate(selectedCampaign.completedAt)}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
