import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import logoIcon from "@/assets/logo-icon.png";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const CustomerAuth = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/map");
      } else {
        const { error } = await signUp(email, password, {
          full_name: name,
          role: "customer",
        });
        if (error) throw error;
        toast.success("Account created! Check your email to verify.");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-2 mb-8">
            <img src={logoIcon} alt="Logo" width={40} height={40} className="w-10 h-10" />
            <span className="font-display text-lg font-semibold text-foreground">
              UK Ice Cream Van Tracker
            </span>
          </Link>

          <div className="bg-secondary/10 text-secondary font-display text-sm font-semibold px-4 py-2 rounded-full inline-block mb-6">
            🍦 Free for Ice Cream Lovers
          </div>

          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            {isLogin ? "Welcome Back!" : "Start Tracking Vans"}
          </h1>
          <p className="text-muted-foreground font-body mb-8">
            {isLogin ? "Sign in to find your favourite vans." : "Create a free account to track ice cream vans near you."}
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <Label htmlFor="name" className="font-body">Full Name</Label>
                <Input id="name" placeholder="Your name" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div>
              <Label htmlFor="email" className="font-body">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" className="mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password" className="font-body">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" className="mt-1.5" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button variant="mint" size="lg" className="w-full mt-2" disabled={submitting}>
              {submitting ? "Please wait…" : isLogin ? "Sign In" : "Create Free Account"}
            </Button>
          </form>

          <p className="text-center text-muted-foreground font-body text-sm mt-6">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-secondary font-semibold hover:underline">
              {isLogin ? "Sign up free" : "Sign in"}
            </button>
          </p>

          <div className="mt-6 text-center">
            <Link to="/auth/vendor" className="text-muted-foreground font-body text-sm hover:text-foreground transition-colors">
              Are you a van operator? <span className="text-primary font-semibold">Sign up here →</span>
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-secondary/20 via-secondary/10 to-accent/20 items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <div className="text-8xl mb-6 animate-float">🍦</div>
          <h2 className="font-display text-3xl font-bold text-foreground mb-3">
            Never Miss the Jingle
          </h2>
          <p className="text-muted-foreground font-body text-lg max-w-sm">
            Real-time tracking of ice cream vans in your area. Completely free, forever.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerAuth;
