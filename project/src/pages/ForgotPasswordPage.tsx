import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Input, Button, Label } from "@/components/ui";
import { requestPasswordReset } from "@/lib/auth";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-accent-green/15 flex items-center justify-center mx-auto">
            <CheckCircle size={22} className="text-accent-green" />
          </div>
          <h2 className="text-xl font-bold text-text-primary">Reset link sent</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            If an account exists for <span className="text-text-primary">{email}</span>,
            you'll receive a password reset link shortly. Check your inbox and spam folder.
          </p>
          <Link to="/login">
            <Button variant="secondary" className="w-full mt-4">
              <ArrowLeft size={15} /> Back to sign in
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors mb-6">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
        <h2 className="text-2xl font-bold text-text-primary">Reset password</h2>
        <p className="text-sm text-text-secondary mt-1.5">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Email address</Label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="pl-9"
              required
              autoFocus
            />
          </div>
        </div>

        {error && (
          <div className="text-xs text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending..." : "Send reset link"}
        </Button>
      </form>
    </AuthLayout>
  );
}
