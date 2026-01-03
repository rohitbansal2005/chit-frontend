import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiClient, ApiError } from "@/lib/apiClient";
import { ArrowLeft, MailCheck, Shield } from "lucide-react";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPassword = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await apiClient.post<{ message: string }>(
        "/auth/forgot-password",
        { email: email.trim() },
        { auth: false }
      );

      setSuccessMessage(response.message || "If an account exists, we'll email a reset link.");
      toast({
        title: "Reset link sent",
        description: "Check your inbox (or spam folder) for further instructions.",
      });
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Unable to send reset link right now.");
      toast({
        title: "Unable to process request",
        description: apiError.message || "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg shadow-xl border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Forgot password?</CardTitle>
          <CardDescription>
            Enter the email linked to your account and we'll send instructions to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email address</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError("");
                }}
                disabled={isSubmitting}
                className={error ? "border-red-500 focus-visible:ring-red-500" : undefined}
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>

            <div className="rounded-lg border border-muted-foreground/10 bg-muted/30 p-3 text-sm flex items-start gap-2">
              <Shield className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <p className="text-muted-foreground">
                For your security, we only email reset links to verified addresses. Reset links expire after 20 minutes.
              </p>
            </div>

            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting ? "Sending link..." : "Send reset link"}
            </Button>

            {successMessage && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-900/10">
                <MailCheck className="h-4 w-4" />
                <AlertDescription className="text-sm">{successMessage}</AlertDescription>
              </Alert>
            )}
          </form>

          <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
            <Link to="/auth" className="inline-flex items-center gap-2 font-medium text-primary hover:underline">
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
