import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Leaf, Recycle, Trash2, Plus, TrendingDown, Award, BarChart3 } from "lucide-react";
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
import TopHeader from "@/components/TopHeader";
import PageLayout from "@/components/PageLayout";
import { insertSustainabilityLogSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const logFormSchema = insertSustainabilityLogSchema.omit({ userId: true });
type LogFormData = z.infer<typeof logFormSchema>;

export default function Sustainability() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LogFormData>({
    resolver: zodResolver(logFormSchema),
    defaultValues: {
      action: "used",
      wastePrevented: "0",
    },
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["/api/sustainability-logs"],
    retry: false,
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["/api/inventory"],
    retry: false,
  });

  const createLogMutation = useMutation({
    mutationFn: async (data: LogFormData) => {
      await apiRequest('POST', '/api/sustainability-logs', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sustainability-logs"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Sustainability log added successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add log entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LogFormData) => {
    createLogMutation.mutate(data);
  };

  const actions = [
    { value: 'used', label: 'Used Product', icon: <Leaf className="w-4 h-4" /> },
    { value: 'disposed', label: 'Disposed Waste', icon: <Trash2 className="w-4 h-4" /> },
    { value: 'recycled', label: 'Recycled Material', icon: <Recycle className="w-4 h-4" /> },
    { value: 'refilled', label: 'Refilled Container', icon: <TrendingDown className="w-4 h-4" /> },
  ];

  // Calculate sustainability metrics
  const totalWastePrevented = (logs as any[]).reduce((sum: number, log: any) => 
    sum + parseFloat(log.wastePrevented || 0), 0
  );

  const recycledItems = (logs as any[]).filter((log: any) => log.action === 'recycled').length;
  const refilledItems = (logs as any[]).filter((log: any) => log.action === 'refilled').length;
  const disposedItems = (logs as any[]).filter((log: any) => log.action === 'disposed').length;

  const getActionColor = (action: string) => {
    switch (action) {
      case 'recycled': return 'bg-green-100 text-green-700';
      case 'refilled': return 'bg-blue-100 text-blue-700';
      case 'used': return 'bg-purple-100 text-purple-700';
      case 'disposed': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <PageLayout>
      <TopHeader title="Sustainability Tracking" subtitle="Monitor and reduce your environmental impact" />
        
        <div className="p-6 space-y-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="logs">Activity Logs</TabsTrigger>
                <TabsTrigger value="goals">Sustainability Goals</TabsTrigger>
              </TabsList>
              <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Log Entry
              </Button>
            </div>

            <TabsContent value="overview">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Leaf className="w-8 h-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-slate-600">Waste Prevented</p>
                        <div className="text-2xl font-bold">{totalWastePrevented.toFixed(1)}g</div>
                        <p className="text-xs text-green-600">This month</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Recycle className="w-8 h-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-slate-600">Items Recycled</p>
                        <div className="text-2xl font-bold">{recycledItems}</div>
                        <p className="text-xs text-blue-600">This month</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <TrendingDown className="w-8 h-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-slate-600">Containers Refilled</p>
                        <div className="text-2xl font-bold">{refilledItems}</div>
                        <p className="text-xs text-purple-600">This month</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Award className="w-8 h-8 text-yellow-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-slate-600">Eco Score</p>
                        <div className="text-2xl font-bold">
                          {Math.min(100, Math.round((recycledItems + refilledItems) * 10)).toFixed(0)}
                        </div>
                        <p className="text-xs text-yellow-600">Out of 100</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sustainability Actions Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Sustainability Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {actions.map((action) => {
                        const count = (logs as any[]).filter((log: any) => log.action === action.value).length;
                        const percentage = (logs as any[]).length > 0 ? (count / (logs as any[]).length) * 100 : 0;
                        
                        return (
                          <div key={action.value}>
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                {action.icon}
                                <span className="ml-2 text-sm text-slate-600">{action.label}</span>
                              </div>
                              <span className="font-medium">{count}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sustainability Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start">
                          <Leaf className="w-5 h-5 text-green-600 mt-0.5" />
                          <div className="ml-3">
                            <h4 className="font-medium text-green-900">Use Refillable Containers</h4>
                            <p className="text-sm text-green-700">Choose products with refillable packaging to reduce waste.</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start">
                          <Recycle className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div className="ml-3">
                            <h4 className="font-medium text-blue-900">Proper Recycling</h4>
                            <p className="text-sm text-blue-700">Separate recyclable materials according to local guidelines.</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-start">
                          <TrendingDown className="w-5 h-5 text-purple-600 mt-0.5" />
                          <div className="ml-3">
                            <h4 className="font-medium text-purple-900">Measure Product Usage</h4>
                            <p className="text-sm text-purple-700">Track usage to optimise inventory and reduce waste.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Sustainability Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(logs as any[]).slice(0, 5).map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                            {actions.find(a => a.value === log.action)?.icon}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-slate-900 capitalize">{log.action}</p>
                            <p className="text-sm text-slate-600">
                              {log.quantity} units • {parseFloat(log.wastePrevented || 0).toFixed(1)}g waste prevented
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getActionColor(log.action)}>
                            {log.action}
                          </Badge>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(log.date).toLocaleDateString('en-NZ')}
                          </p>
                        </div>
                      </div>
                    ))}
                    {(logs as any[]).length === 0 && (
                      <p className="text-slate-500 text-center py-4">No sustainability activities logged yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs">
              <Card>
                <CardHeader>
                  <CardTitle>All Activity Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {logsLoading ? (
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
                    ) : (logs as any[])?.length > 0 ? (
                      (logs as any[]).map((log: any) => (
                        <div key={log.id} className="p-4 border border-slate-200 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full mr-3">
                                {actions.find(a => a.value === log.action)?.icon}
                              </div>
                              <div>
                                <h3 className="font-medium text-slate-900 capitalize">{log.action}</h3>
                                <p className="text-sm text-slate-600">
                                  Quantity: {log.quantity} • Waste prevented: {parseFloat(log.wastePrevented || 0).toFixed(1)}g
                                </p>
                              </div>
                            </div>
                            <Badge className={getActionColor(log.action)}>
                              {log.action}
                            </Badge>
                          </div>
                          {log.notes && (
                            <p className="text-sm text-slate-700 mb-2">{log.notes}</p>
                          )}
                          <p className="text-xs text-slate-500">
                            {new Date(log.date).toLocaleDateString('en-NZ')} at {new Date(log.date).toLocaleTimeString('en-NZ')}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Leaf className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No sustainability logs recorded</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setIsDialogOpen(true)}
                        >
                          Add first log entry
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="goals">
              <Card>
                <CardHeader>
                  <CardTitle>Sustainability Goals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="p-4 border border-slate-200 rounded-lg">
                      <h3 className="font-medium text-slate-900 mb-2">Monthly Recycling Target</h3>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">Progress</span>
                        <span className="font-medium">{recycledItems}/20 items</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (recycledItems / 20) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="p-4 border border-slate-200 rounded-lg">
                      <h3 className="font-medium text-slate-900 mb-2">Waste Reduction Goal</h3>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">Progress</span>
                        <span className="font-medium">{totalWastePrevented.toFixed(1)}/500g prevented</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (totalWastePrevented / 500) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-center py-4">
                      <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">More sustainability goals coming soon...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Add Log Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Sustainability Log</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="itemId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inventory Item (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an item" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(inventory as any[]).map((item: any) => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                                {item.name}
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
                    name="action"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an action" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {actions.map((action) => (
                              <SelectItem key={action.value} value={action.value}>
                                {action.label}
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
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="Enter quantity" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="wastePrevented"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Waste Prevented (grams)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0.0" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional notes about this action..." 
                            className="h-20"
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-3">
                    <Button type="submit" disabled={createLogMutation.isPending}>
                      {createLogMutation.isPending ? "Adding..." : "Add Log Entry"}
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
    </PageLayout>
  );
}