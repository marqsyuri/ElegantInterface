import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, MessageSquare, TrendingUp, Target, Send, Calendar, Users, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { insertMarketingCampaignSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const campaignFormSchema = insertMarketingCampaignSchema.omit({ userId: true });
type CampaignFormData = z.infer<typeof campaignFormSchema>;

export default function Marketing() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      status: "draft",
      type: "email",
      targetAudience: "all",
    },
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ["/api/marketing-campaigns"],
    retry: false,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      await apiRequest('POST', '/api/marketing-campaigns', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-campaigns"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Marketing campaign created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CampaignFormData) => {
    createCampaignMutation.mutate(data);
  };

  const campaignTypes = [
    { value: 'email', label: 'Email Campaign' },
    { value: 'sms', label: 'SMS Campaign' },
    { value: 'promotion', label: 'Promotion' },
  ];

  const audiences = [
    { value: 'all', label: 'All Clients' },
    { value: 'vip', label: 'VIP Clients' },
    { value: 'inactive', label: 'Inactive Clients' },
    { value: 'birthday', label: 'Birthday This Month' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-700';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'draft': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar />
      
      <main className="ml-16 lg:ml-64 transition-all duration-300">
        <TopHeader title="Marketing Campaigns" subtitle="Create and manage your marketing campaigns" />
        
        <div className="p-6 space-y-8">
          <section className="flex justify-end items-center">
            <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Create Campaign
            </Button>
          </section>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Mail className="w-8 h-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-slate-600">Total Campaigns</p>
                        <div className="text-2xl font-bold">{campaigns.length}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Send className="w-8 h-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-slate-600">Sent</p>
                        <div className="text-2xl font-bold">
                          {campaigns.filter((c: any) => c.status === 'sent').length}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <TrendingUp className="w-8 h-8 text-emerald-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-slate-600">Open Rate</p>
                        <div className="text-2xl font-bold">
                          {campaigns.length > 0 
                            ? `${(campaigns.reduce((acc: number, c: any) => acc + parseFloat(c.openRate || 0), 0) / campaigns.length).toFixed(1)}%`
                            : '0%'
                          }
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Users className="w-8 h-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-slate-600">Total Clients</p>
                        <div className="text-2xl font-bold">{clients.length}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Campaigns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {campaigns.slice(0, 5).map((campaign: any) => (
                        <div key={campaign.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{campaign.name}</p>
                            <p className="text-sm text-slate-600 capitalize">{campaign.type}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              Target: {campaign.targetAudience}
                            </p>
                          </div>
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        </div>
                      ))}
                      {campaigns.length === 0 && (
                        <p className="text-slate-500 text-center py-4">No campaigns yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Campaign Templates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start" onClick={() => setIsDialogOpen(true)}>
                        <Target className="w-4 h-4 mr-2" />
                        Birthday Promotion
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => setIsDialogOpen(true)}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Appointment Reminder
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => setIsDialogOpen(true)}>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        New Service Launch
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => setIsDialogOpen(true)}>
                        <Users className="w-4 h-4 mr-2" />
                        Client Re-engagement
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="campaigns">
              <Card>
                <CardHeader>
                  <CardTitle>All Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {campaignsLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse p-4 border border-slate-200 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                              <div className="h-6 bg-slate-200 rounded w-16"></div>
                            </div>
                            <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                          </div>
                        ))}
                      </div>
                    ) : campaigns?.length > 0 ? (
                      campaigns.map((campaign: any) => (
                        <div key={campaign.id} className="p-4 border border-slate-200 rounded-lg hover:border-primary/30 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-medium text-slate-900">{campaign.name}</h3>
                              <p className="text-sm text-slate-600 capitalize">{campaign.type} • {campaign.targetAudience}</p>
                            </div>
                            <Badge className={getStatusColor(campaign.status)}>
                              {campaign.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-700 mb-3 line-clamp-2">{campaign.content}</p>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>
                              {campaign.createdAt && `Created: ${new Date(campaign.createdAt).toLocaleDateString('en-NZ')}`}
                            </span>
                            {campaign.openRate && (
                              <span>Open Rate: {campaign.openRate}%</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Send className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No campaigns created yet</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setIsDialogOpen(true)}
                        >
                          Create your first campaign
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Detailed analytics coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Create Campaign Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Marketing Campaign</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter campaign name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select campaign type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {campaignTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
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
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Line</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter subject line" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetAudience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Audience</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select target audience" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {audiences.map((audience) => (
                              <SelectItem key={audience.value} value={audience.value}>
                                {audience.label}
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
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter your campaign message..." 
                            className="h-24"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduledFor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule For (Optional)</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-3">
                    <Button type="submit" disabled={createCampaignMutation.isPending}>
                      {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}