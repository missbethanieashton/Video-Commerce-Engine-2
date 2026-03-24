import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import materializedLogo from "@assets/MATERIALIZED_full_logo_1773352270197.png";
import { Eye, EyeOff } from "lucide-react";
import type { CurrentUser } from "@/hooks/useCurrentUser";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().min(1, "Display name is required"),
  role: z.enum(["creator", "brand", "affiliate"]),
  accessCode: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const ROLE_ROUTES: Record<string, string> = {
  creator: "/creator",
  brand: "/brand",
  affiliate: "/affiliate",
};

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", displayName: "", role: "creator", accessCode: "" },
  });

  const registerMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("POST", "/api/auth/register", data),
    onSuccess: async (res: any) => {
      const user: CurrentUser = await res.json();
      queryClient.setQueryData(["/api/auth/me"], user);
      const destination = ROLE_ROUTES[user.role] ?? "/creator";
      navigate(destination);
    },
    onError: async (err: any) => {
      let message = "Registration failed. Please try again.";
      try {
        const body = await err.response?.json();
        if (body?.error) message = body.error;
      } catch {}
      toast({ title: "Registration failed", description: message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#202120] px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <img src={materializedLogo} alt="Materialized" style={{ height: 40, width: "auto" }} />
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <h1 className="text-xl font-semibold text-foreground mb-1">Create your account</h1>
          <p className="text-sm text-muted-foreground mb-6">Join Materialized as a creator, brand, or publisher</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => registerMutation.mutate(d))} className="space-y-4">
              <FormField
                control={form.control}
                name="accessCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Code <span className="text-muted-foreground font-normal text-xs">If you have an access code, enter it here</span></FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Have a code? Enter it for free access"
                        data-testid="input-register-accessCode"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Your name or brand name"
                        data-testid="input-register-displayName"
                      />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        data-testid="input-register-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="At least 6 characters"
                          autoComplete="new-password"
                          data-testid="input-register-password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a…</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-register-role">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="creator">Content Creator</SelectItem>
                        <SelectItem value="brand">Brand</SelectItem>
                        <SelectItem value="affiliate">Publisher / Affiliate</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
                data-testid="button-register-submit"
              >
                {registerMutation.isPending ? "Creating account…" : "Create Account"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
