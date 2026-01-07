import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Users, Send, Clock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const inviteCreatorSchema = z.object({
  creatorName: z.string().min(1, "Creator name is required"),
  creatorEmail: z.string().email("Valid email is required"),
  contentCategory: z.string().optional(),
  message: z.string().optional(),
});

type InviteCreatorForm = z.infer<typeof inviteCreatorSchema>;

const demoInvitations = [
  { id: "1", name: "Sarah Johnson", email: "sarah@example.com", status: "pending", category: "Fashion", sentAt: "2 hours ago" },
  { id: "2", name: "Mike Chen", email: "mike@example.com", status: "accepted", category: "Tech", sentAt: "1 day ago" },
  { id: "3", name: "Emma Wilson", email: "emma@example.com", status: "declined", category: "Beauty", sentAt: "3 days ago" },
];

export default function BrandCreators() {
  const { toast } = useToast();
  const [invitations, setInvitations] = useState(demoInvitations);

  const form = useForm<InviteCreatorForm>({
    resolver: zodResolver(inviteCreatorSchema),
    defaultValues: {
      creatorName: "",
      creatorEmail: "",
      contentCategory: "",
      message: "",
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: InviteCreatorForm) => {
      return apiRequest("POST", "/api/brands/invite-creator", data);
    },
    onSuccess: (_, variables) => {
      setInvitations(prev => [{
        id: String(Date.now()),
        name: variables.creatorName,
        email: variables.creatorEmail,
        status: "pending",
        category: variables.contentCategory || "General",
        sentAt: "Just now",
      }, ...prev]);
      toast({
        title: "Invitation Sent!",
        description: `An invitation email has been sent to ${variables.creatorEmail}`,
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Failed to Send",
        description: "There was an error sending the invitation.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InviteCreatorForm) => {
    inviteMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "accepted":
        return <Badge className="gap-1 bg-green-500 hover:bg-green-600"><CheckCircle className="h-3 w-3" /> Accepted</Badge>;
      case "declined":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Declined</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Connect Your Creators</h1>
        <p className="text-muted-foreground mt-1">
          Invite content creators to feature your products in their videos
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Invitation
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Reach out to creators who match your brand
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="creatorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Creator Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter creator's name" 
                          {...field}
                          data-testid="input-invite-creator-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="creatorEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Creator Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="creator@example.com" 
                          {...field}
                          data-testid="input-invite-creator-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contentCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Category (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Fashion, Tech, Beauty, Lifestyle" 
                          {...field}
                          data-testid="input-invite-category"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal Message (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Hi! We love your content and think our products would be a great fit for your audience..."
                          className="resize-none min-h-[100px]"
                          {...field}
                          data-testid="input-invite-message"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="rounded-full gap-2 w-full"
                  disabled={inviteMutation.isPending}
                  data-testid="button-send-creator-invite"
                >
                  <Send className="h-4 w-4" />
                  {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Sent Invitations
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {invitations.length} invitations sent
            </p>
          </CardHeader>
          <CardContent>
            {invitations.length > 0 ? (
              <div className="space-y-3">
                {invitations.map((invite) => (
                  <div 
                    key={invite.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                    data-testid={`invitation-item-${invite.id}`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {invite.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{invite.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{invite.email}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{invite.category}</Badge>
                        <span className="text-xs text-muted-foreground">{invite.sentAt}</span>
                      </div>
                    </div>
                    {getStatusBadge(invite.status)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No invitations sent yet</p>
                <p className="text-sm">Start inviting creators to grow your network</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
