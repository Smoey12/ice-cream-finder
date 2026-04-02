import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logoIcon from "@/assets/logo-icon.png";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const VendorAuth = () => {
  const [searchParams] = useSearchParams();
  const isFleetParam = searchParams.get("type") === "fleet";

  const [isLogin, setIsLogin] = useState(false);
  const [accountType, setAccountType] = useState<"solo" | "fleet">(isFleetParam ? "fleet" : "solo");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [fleetVanCount, setFleetVanCount] = useState(3);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();

  const baseMonthly = 7.99;
  const baseYearly = 59.99;
  const vanCount = accountType === "fleet" ? fleetVanCount : 1;
  const discount = accountType === "fleet" && fleetVanCount >= 3 ? 0.08 : 0;
  const totalMonthly = +(baseMonthly * vanCount * (1 - discount)).toFixed(2);
  const totalYearly = +(baseYearly * vanCount * (1 - discount)).toFixed(2);
  const displayPrice = billingCycle === "monthly" ? `£${totalMonthly}/month` : `£${totalYearly}/year`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        const { error } = await signUp(email, password, {
          full_name: name,
          business_name: businessName,
          billing_cycle: billingCycle,
          role: "vendor",
          account_type: accountType,
          fleet_van_count: String(vanCount),
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

          <div className="bg-primary/10 text-primary font-display text-sm font-semibold px-4 py-2 rounded-full inline-block mb-6">
            🚐 Van Operator Account
          </div>

          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            {isLogin ? "Welcome Back, Operator!" : "List Your Ice Cream Van"}
          </h1>
          <p className="text-muted-foreground font-body mb-6">
            {isLogin ? "Sign in to manage your van and routes." : "Start your 2-week free trial. No card required to sign up."}
          </p>

          {!isLogin && (
            <>
              {/* Account type toggle */}
              <div className="mb-4">
                <label className="font-body text-sm text-muted-foreground block mb-2">Account Type</label>
                <div className="flex bg-muted rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setAccountType("solo")}
                    className={`flex-1 py-2 rounded-md font-display text-sm font-semibold transition-all ${
                      accountType === "solo" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    🚐 Solo Van
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("fleet")}
                    className={`flex-1 py-2 rounded-md font-display text-sm font-semibold transition-all ${
                      accountType === "fleet" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    🏢 Fleet Business
                  </button>
                </div>
              </div>

              {/* Fleet van count */}
              {accountType === "fleet" && (
                <div className="mb-4 bg-accent/10 rounded-xl p-4">
                  <label className="font-body text-sm text-muted-foreground block mb-2">Number of Vans</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFleetVanCount(Math.max(2, fleetVanCount - 1))}
                      className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-foreground"
                    >−</button>
                    <span className="font-display text-2xl font-bold text-foreground w-8 text-center">{fleetVanCount}</span>
                    <button
                      type="button"
                      onClick={() => setFleetVanCount(Math.min(50, fleetVanCount + 1))}
                      className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-foreground"
                    >+</button>
                  </div>
                  {fleetVanCount >= 3 && (
                    <p className="text-secondary font-body text-xs font-semibold mt-2">✨ 8% fleet discount applied!</p>
                  )}
                </div>
              )}

              {/* Billing toggle */}
              <div className="mb-4">
                <div className="flex bg-muted rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setBillingCycle("monthly")}
                    className={`flex-1 py-2 rounded-md font-display text-sm font-semibold transition-all ${
                      billingCycle === "monthly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Monthly — £{totalMonthly.toFixed(2)}/mo
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle("yearly")}
                    className={`flex-1 py-2 rounded-md font-display text-sm font-semibold transition-all ${
                      billingCycle === "yearly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Yearly — £{totalYearly.toFixed(2)}/yr
                  </button>
                </div>
                {billingCycle === "yearly" && (
                  <p className="text-secondary font-body text-sm font-semibold text-center mt-2">
                    ✨ Save over 37% with annual billing!
                  </p>
                )}
              </div>
            </>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="businessName" className="font-body">Business Name</Label>
                  <Input id="businessName" placeholder="e.g. Tony's Ices" className="mt-1.5" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="name" className="font-body">Your Name</Label>
                  <Input id="name" placeholder="Your full name" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email" className="font-body">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" className="mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password" className="font-body">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" className="mt-1.5" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button variant="hero" size="lg" className="w-full mt-2" disabled={submitting}>
              {submitting ? "Please wait…" : isLogin ? "Sign In" : "Start 2-Week Free Trial"}
            </Button>
          </form>

          {!isLogin && (
            <p className="text-muted-foreground font-body text-xs text-center mt-3">
              After your free trial, you'll be charged {displayPrice}. Cancel anytime.
            </p>
          )}

          <p className="text-center text-muted-foreground font-body text-sm mt-6">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-semibold hover:underline">
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
              "Fleet? Track all vans from one dashboard",
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
