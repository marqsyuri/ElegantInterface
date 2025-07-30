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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const publicUrl = user.publicLink ? 
    `https://${window.location.host}/client/${user.publicLink}` : null;

  const generateLinkMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/user/generate-public-link');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Public Link Generated",
        description: "Your new client access link has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate public link. Please try again.",
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
          Share this link with your clients so they can book appointments and contact you directly.
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
                Preview Page
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
                onClick={() => generateLinkMutation.mutate()}
                variant="outline"
                size="sm"
                className="flex items-center"
                disabled={generateLinkMutation.isPending}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${generateLinkMutation.isPending ? 'animate-spin' : ''}`} />
                Regenerate Link
              </Button>
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <Badge className="bg-green-100 text-green-800 mr-3 mt-0.5">
                  Features
                </Badge>
                <div className="text-sm text-green-700">
                  <div className="font-medium mb-1">Your clients can:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-green-600">
                    <li>View your clinic information and opening hours</li>
                    <li>See your services and pricing</li>
                    <li>Contact you directly via WhatsApp</li>
                    <li>Book appointments online with automatic form submission</li>
                    <li>Register as new clients or return as existing clients</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-slate-500 mb-4">
              You don't have a public link yet. Generate one to allow clients to book appointments online.
            </div>
            <Button
              onClick={() => generateLinkMutation.mutate()}
              className="bg-green-600 hover:bg-green-700"
              disabled={generateLinkMutation.isPending}
            >
              {generateLinkMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Generate Client Access Link
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}