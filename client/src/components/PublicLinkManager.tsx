import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, RefreshCw, ExternalLink, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface PublicLinkManagerProps {
  user: User;
}

export function PublicLinkManager({ user }: PublicLinkManagerProps) {
  const [copied, setCopied] = useState(false);
  const [customLink, setCustomLink] = useState("");
  const [isCustomizing, setIsCustomizing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const publicUrl = user.publicLink ? 
    `${window.location.protocol}//${window.location.host}/booking/${user.publicLink}` : null;

  const generateLinkMutation = useMutation({
    mutationFn: async (customLinkValue?: string) => {
      return await apiRequest('POST', '/api/user/generate-public-link', {
        customLink: customLinkValue || undefined
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setIsCustomizing(false);
      setCustomLink("");
      toast({
        title: "Public Link Generated",
        description: "Your new client access link has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to generate public link. Please try again.",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async () => {
    if (publicUrl) {
      try {
        await navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        toast({
          title: "Link Copied",
          description: "Your client access link has been copied to clipboard.",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast({
          title: "Copy Failed",
          description: "Could not copy link to clipboard.",
          variant: "destructive",
        });
      }
    }
  };

  const openPreview = () => {
    if (publicUrl) {
      window.open(publicUrl, '_blank');
    }
  };

  const shareWhatsApp = () => {
    if (publicUrl && user.clinicWhatsapp) {
      const message = encodeURIComponent(
        `Hi! You can now book appointments with ${user.clinicName || 'my clinic'} online at: ${publicUrl}`
      );
      const whatsappUrl = `https://wa.me/${user.clinicWhatsapp.replace(/\D/g, '')}?text=${message}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ExternalLink className="w-5 h-5 mr-2 text-green-600" />
          Client Access Link
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-slate-600">
          Your public booking link is automatically generated from your salon name. Share it with clients so they can book appointments online.
        </div>

        {publicUrl ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="public-link">Your Public Link</Label>
              <div className="flex mt-1">
                <Input
                  id="public-link"
                  value={publicUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="icon"
                  className="ml-2 shrink-0"
                  disabled={copied}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={openPreview}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Preview Booking Page
              </Button>

              {user.clinicWhatsapp && (
                <Button
                  onClick={shareWhatsApp}
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
                  Share via WhatsApp
                </Button>
              )}

              <Button
                onClick={() => setIsCustomizing(!isCustomizing)}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {isCustomizing ? "Cancel" : "Customize Link"}
              </Button>
            </div>

            {isCustomizing && (
              <div className="p-4 border rounded-lg bg-slate-50 space-y-3">
                <Label htmlFor="custom-link">Customize Your Link</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="flex items-center border rounded-md bg-white">
                      <span className="px-3 text-sm text-slate-500 border-r bg-slate-100">
                        {window.location.host}/booking/
                      </span>
                      <Input
                        id="custom-link"
                        value={customLink}
                        onChange={(e) => setCustomLink(e.target.value)}
                        placeholder="my-salon"
                        className="border-0 focus-visible:ring-0"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Use lowercase letters, numbers, and hyphens only
                    </p>
                  </div>
                  <Button
                    onClick={() => generateLinkMutation.mutate(customLink)}
                    disabled={generateLinkMutation.isPending || !customLink}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    {generateLinkMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
                <Button
                  onClick={() => generateLinkMutation.mutate()}
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={generateLinkMutation.isPending}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Or Generate Random Link
                </Button>
              </div>
            )}

            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <Badge className="bg-green-100 text-green-800 mr-3 mt-0.5">
                  Features
                </Badge>
                <div className="text-sm text-green-700">
                  <div className="font-medium mb-1">Your clients can:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-green-600">
                    <li>Select multiple services from organized categories</li>
                    <li>View pricing and duration for each service</li>
                    <li>See total price calculation automatically</li>
                    <li>Book appointments with their selected service bundle</li>
                    <li>Experience the new streamlined booking interface</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-4">
            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 mt-0.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Configure your salon name first</h4>
                  <p className="text-sm text-blue-700">
                    {user.clinicName 
                      ? `Your link will be based on "${user.clinicName}". Save your profile changes to generate the link automatically.`
                      : "Please add your Clinic/Salon Name in the Profile tab above, then save. Your public booking link will be generated automatically."}
                  </p>
                </div>
              </div>
            </div>

            {user.clinicName && (
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-3">
                  Or generate a random link if you prefer:
                </p>
                <Button
                  onClick={() => generateLinkMutation.mutate()}
                  variant="outline"
                  disabled={generateLinkMutation.isPending}
                >
                  {generateLinkMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Generate Random Link
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}