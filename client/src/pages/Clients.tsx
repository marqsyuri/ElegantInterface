import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Search, MoreHorizontal, Edit, ChevronDown, ChevronUp, Calendar, Eye, FileText, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import TopHeader from "@/components/TopHeader";
import PageLayout from "@/components/PageLayout";
import { insertClientSchema, type Client, type Appointment } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ImageUpload";
import { z } from "zod";
import { format } from "date-fns";

const clientFormSchema = insertClientSchema.extend({
  birthDate: z.string().optional(),
  profileImage: z.string().optional(),
}).omit({ userId: true });

type ClientFormData = z.infer<typeof clientFormSchema>;

interface ClientWithHistory extends Client {
  appointments?: Appointment[];
}

export default function Clients() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingClient, setEditingClient] = useState<ClientWithHistory | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [expandedClient, setExpandedClient] = useState<number | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<{ before: string[]; after: string[] }>({ before: [], after: [] });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      isActive: true,
      loyaltyPoints: 0,
      notifySms: false,
      notifyWhatsapp: false,
      notifyPhone: false,
    },
  });

  // Reset form when editingClient changes
  const resetForm = (client?: ClientWithHistory) => {
    if (client) {
      form.reset({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        cpf: client.cpf || "",
        birthDate: client.birthDate || "",
        healthHistory: client.healthHistory || "",
        isActive: client.isActive ?? true,
        loyaltyPoints: client.loyaltyPoints || 0,
        notifySms: client.notifySms ?? false,
        notifyWhatsapp: client.notifyWhatsapp ?? false,
        notifyPhone: client.notifyPhone ?? false,
      });
      setProfileImage(client.profileImage || null);
    } else {
      form.reset({
        isActive: true,
        loyaltyPoints: 0,
        notifySms: false,
        notifyWhatsapp: false,
        notifyPhone: false,
      });
      setProfileImage(null);
    }
  };

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/clients"],
    retry: false,
  });

  // Fetch client history when expanded
  const { data: clientHistory } = useQuery({
    queryKey: ["/api/clients", expandedClient, "history"],
    queryFn: async () => {
      if (!expandedClient) return null;
      const response = await fetch(`/api/clients/${expandedClient}/appointments`);
      if (!response.ok) throw new Error("Failed to fetch client history");
      return response.json();
    },
    enabled: !!expandedClient,
  });

  // Fetch services and procedures for enriching appointment data
  const { data: services = [] } = useQuery({
    queryKey: ["/api/services"],
    enabled: !!expandedClient,
  });

  const { data: procedures = [] } = useQuery({
    queryKey: ["/api/procedures"],
    enabled: !!expandedClient,
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: ClientFormData & { profileImage?: string }) => {
      await apiRequest('POST', '/api/clients', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Client added successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create client: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ClientFormData & { profileImage?: string } }) => {
      await apiRequest('PUT', `/api/clients/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setEditingClient(null);
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Client updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update client: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClientFormData) => {
    const submitData = { ...data, profileImage };
    
    if (editingClient) {
      updateClientMutation.mutate({ id: editingClient.id, data: submitData });
    } else {
      createClientMutation.mutate(submitData);
    }
  };

  const handleEditClient = (client: ClientWithHistory) => {
    setEditingClient(client);
    resetForm(client);
    setIsDialogOpen(true);
  };

  const handleAddClient = () => {
    setEditingClient(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const toggleClientHistory = (clientId: number) => {
    setExpandedClient(expandedClient === clientId ? null : clientId);
  };

  const viewImages = (beforeImages: string[], afterImages: string[]) => {
    setSelectedImages({ before: beforeImages, after: afterImages });
    setImageDialogOpen(true);
  };

  const filteredClients = clients?.filter((client: Client) =>
    client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.includes(searchQuery)
  ) || [];

  const formatDate = (date: string | Date) => {
    try {
      return format(new Date(date), "dd/MM/yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const formatDateTime = (date: string | Date) => {
    try {
      return format(new Date(date), "dd/MM/yyyy 'at' h:mm a");
    } catch {
      return "Invalid date";
    }
  };

  const getServiceName = (appointment: any) => {
    if (appointment.serviceType === 'procedure') {
      const procedure = procedures.find((p: any) => p.id === appointment.serviceId);
      return procedure?.name || "Unknown Procedure";
    } else {
      const service = services.find((s: any) => s.id === appointment.serviceId);
      return service?.name || "Unknown Service";
    }
  };

  return (
    <PageLayout>
      <TopHeader title="Client Management" subtitle="Manage your client database and appointments" />
      
      <div className="p-6 space-y-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="loyalty">Loyalty Programs</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            <Button onClick={handleAddClient} className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Add Client
            </Button>
          </div>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Client Database</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        placeholder="Search clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {clientsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center p-4 border border-slate-200 rounded-lg">
                        <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                        <div className="ml-4 flex-1">
                          <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                          <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredClients.length > 0 ? (
                  <div className="space-y-4">
                    {filteredClients.map((client: Client) => (
                      <Collapsible key={client.id} open={expandedClient === client.id}>
                        <div className="border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center space-x-4 flex-1">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={client.profileImage || ""} />
                                <AvatarFallback>{client.name?.charAt(0) || "?"}</AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <h3 className="font-medium text-slate-900">{client.name}</h3>
                                  <Badge variant={client.isActive ? "default" : "secondary"}>
                                    {client.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                  {client.loyaltyPoints > 0 && (
                                    <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                                      {client.loyaltyPoints} pts
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="text-sm text-slate-600 mt-1">
                                  <div className="flex items-center space-x-4">
                                    {client.email && <span>📧 {client.email}</span>}
                                    {client.phone && <span>📞 {client.phone}</span>}
                                    {client.birthDate && <span>🎂 {formatDate(client.birthDate)}</span>}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditClient(client)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleClientHistory(client.id)}
                                >
                                  {expandedClient === client.id ? (
                                    <>
                                      <ChevronUp className="w-4 h-4 mr-1" />
                                      Hide History
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-4 h-4 mr-1" />
                                      View History
                                    </>
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                            </div>
                          </div>

                          <CollapsibleContent>
                            <div className="border-t border-slate-200 p-4 bg-slate-50">
                              <h4 className="font-medium text-slate-900 mb-4 flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                Treatment History
                              </h4>
                              
                              {clientHistory && clientHistory.length > 0 ? (
                                <div className="space-y-3">
                                  {clientHistory.map((appointment: any) => (
                                    <div key={appointment.id} className="bg-white rounded-lg p-4 border border-slate-200">
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-3 mb-2">
                                            <h5 className="font-medium text-slate-900">
                                              {getServiceName(appointment)}
                                            </h5>
                                            <Badge 
                                              variant={
                                                appointment.status === 'completed' ? 'default' :
                                                appointment.status === 'confirmed' ? 'secondary' : 'outline'
                                              }
                                            >
                                              {appointment.status}
                                            </Badge>
                                          </div>
                                          
                                          <div className="text-sm text-slate-600 space-y-1">
                                            <p>📅 {formatDateTime(appointment.appointmentDate)}</p>
                                            {appointment.notes && (
                                              <p className="flex items-start">
                                                <FileText className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                                                {appointment.notes}
                                              </p>
                                            )}
                                            {appointment.totalAmount && (
                                              <p>💰 NZ${parseFloat(appointment.totalAmount).toFixed(2)}</p>
                                            )}
                                          </div>
                                        </div>

                                        {/* Before/After Images */}
                                        {((appointment.beforeImages && appointment.beforeImages.length > 0) || 
                                          (appointment.afterImages && appointment.afterImages.length > 0)) && (
                                          <div className="ml-4">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => viewImages(
                                                appointment.beforeImages || [],
                                                appointment.afterImages || []
                                              )}
                                              className="flex items-center gap-2"
                                            >
                                              <ImageIcon className="w-4 h-4" />
                                              <Eye className="w-4 h-4" />
                                              View Photos
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-6 text-slate-500">
                                  <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                  <p>No treatment history available</p>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-4">
                      {searchQuery ? "No clients found matching your search" : "No clients registered yet"}
                    </p>
                    {!searchQuery && (
                      <Button variant="outline" onClick={handleAddClient}>
                        Add your first client
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loyalty">
            <Card>
              <CardHeader>
                <CardTitle>Loyalty Programs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-slate-500">Loyalty program management coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Client Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-slate-500">Client analytics coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Client Form Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? "Edit Client" : "Add New Client"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <ImageUpload
                      value={profileImage}
                      onChange={setProfileImage}
                      placeholder="Upload profile photo"
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter client's full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="client@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="021 123 4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IRD Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="123-456-789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birth Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="healthHistory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Health History & Allergies</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any allergies, medical conditions, or relevant health information..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="font-medium text-slate-900">Notification Preferences</h3>
                    <p className="text-sm text-slate-500 mb-3">Select how you'd like to notify this client</p>
                    
                    <FormField
                      control={form.control}
                      name="notifySms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value ?? false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-normal">
                              SMS Notifications
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notifyWhatsapp"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value ?? false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-normal">
                              WhatsApp Notifications
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notifyPhone"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value ?? false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-normal">
                              Phone Call Reminders
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createClientMutation.isPending || updateClientMutation.isPending}
                  >
                    {createClientMutation.isPending || updateClientMutation.isPending 
                      ? (editingClient ? "Updating..." : "Adding...") 
                      : (editingClient ? "Update Client" : "Add Client")
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Before/After Images Dialog */}
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Treatment Photos - Before & After</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
              {/* Before Images */}
              <div>
                <h3 className="font-medium text-slate-900 mb-3 flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Before Treatment ({selectedImages.before.length})
                </h3>
                {selectedImages.before.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {selectedImages.before.map((image, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={image}
                          alt={`Before treatment ${index + 1}`}
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 border border-dashed border-slate-300 rounded-lg">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>No before photos available</p>
                  </div>
                )}
              </div>

              {/* After Images */}
              <div>
                <h3 className="font-medium text-slate-900 mb-3 flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  After Treatment ({selectedImages.after.length})
                </h3>
                {selectedImages.after.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {selectedImages.after.map((image, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={image}
                          alt={`After treatment ${index + 1}`}
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 border border-dashed border-slate-300 rounded-lg">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>No after photos available</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setImageDialogOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}