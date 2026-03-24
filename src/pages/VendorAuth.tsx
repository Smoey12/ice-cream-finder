import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import logoIcon from "@/assets/logo-icon.png";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const VendorAuth = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left - form */}
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

          <div className="bg-primary/10 text-primary font-display text-sm font-semibold px-4 py-2 rounded-full inline-block mb-6">
            🚐 Van Operator Account
          </div>

          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            {isLogin ? "Welcome Back, Operator!" : "List Your Ice Cream Van"}
          </h1>
          <p className="text-muted-foreground font-body mb-6">
            {isLogin
              ? "Sign in to manage your van and routes."
              : "Start your 2-week free trial. No card required to sign up."}
          </p>

          {!isLogin && (
            <div className="mb-6">
              <div className="flex bg-muted rounded-lg p-1 mb-4">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`flex-1 py-2 rounded-md font-display text-sm font-semibold transition-all ${
                    billingCycle === "monthly"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  Monthly — £7.99/mo
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`flex-1 py-2 rounded-md font-display text-sm font-semibold transition-all ${
                    billingCycle === "yearly"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  Yearly — £59.99/yr
                </button>
              </div>
              {billingCycle === "yearly" && (
                <p className="text-secondary font-body text-sm font-semibold text-center">
                  ✨ Save over 37% with annual billing!
                </p>
              )}
            </div>
          )}

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="businessName" className="font-body">Business Name</Label>
                  <Input id="businessName" placeholder="e.g. Tony's Ices" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="name" className="font-body">Your Name</Label>
                  <Input id="name" placeholder="Your full name" className="mt-1.5" />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email" className="font-body">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password" className="font-body">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" className="mt-1.5" />
            </div>
            <Button variant="hero" size="lg" className="w-full mt-2">
              {isLogin ? "Sign In" : "Start 2-Week Free Trial"}
            </Button>
          </form>

          {!isLogin && (
            <p className="text-muted-foreground font-body text-xs text-center mt-3">
              After your free trial, you'll be charged {billingCycle === "monthly" ? "£7.99/month" : "£59.99/year"}.
              Cancel anytime.
            </p>
          )}

          <p className="text-center text-muted-foreground font-body text-sm mt-6">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-semibold hover:underline"
            >
              {isLogin ? "Start free trial" : "Sign in"}
            </button>
          </p>

          <div className="mt-6 text-center">
            <Link to="/auth/customer" className="text-muted-foreground font-body text-sm hover:text-foreground transition-colors">
              Looking to track vans? <span className="text-secondary font-semibold">Track for free →</span>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Right - benefits */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/20 items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-sm"
        >
          <div className="text-7xl mb-6 animate-float">🚐</div>
          <h2 className="font-display text-3xl font-bold text-foreground mb-6">
            Grow Your Ice Cream Business
          </h2>
          <ul className="space-y-4">
            {[
              "Reach thousands of local customers",
              "Share your live location effortlessly",
              "Build a loyal following",
              "Analytics to optimise your routes",
              "2-week free trial, cancel anytime",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 font-body text-foreground">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default VendorAuth;
