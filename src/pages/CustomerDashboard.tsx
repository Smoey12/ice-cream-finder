import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logoIcon from "@/assets/logo-icon.png";
import { LogOut, MapPin, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import CustomerWallet from "@/components/CustomerWallet";
import YummyRewards from "@/components/YummyRewards";
import AppleWalletCard from "@/components/AppleWalletCard";

const DEMO_CUSTOMER_ID = "00000000-0000-0000-0000-000000000099";

const CustomerDashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const activeUserId = user?.id || DEMO_CUSTOMER_ID;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-4xl animate-float">🍦</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card/90 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoIcon} alt="Logo" width={36} height={36} className="w-9 h-9" />
            <span className="font-display text-lg font-semibold text-foreground hidden sm:inline">
              My Ice Cream Card
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/map">
              <Button variant="outline" size="sm">
                <MapPin className="w-4 h-4 mr-1" /> Map
              </Button>
            </Link>
            {user && (
              <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}>
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-lg">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Digital Card Header */}
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-foreground">🍦 My Digital Card</h1>
            <p className="text-muted-foreground font-body text-sm mt-1">
              Your loyalty card &amp; rewards
            </p>
          </div>

          {/* Apple Wallet Card */}
          <AppleWalletCard userId={activeUserId} />

          {/* Wallet Balance */}
          <CustomerWallet key={`wallet-${refreshKey}`} userId={activeUserId} />

          {/* Yummy Rewards */}
          <YummyRewards key={`loyalty-${refreshKey}`} userId={activeUserId} onRewardClaimed={refresh} />
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
