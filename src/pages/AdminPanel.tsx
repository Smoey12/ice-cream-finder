import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import logoIcon from "@/assets/logo-icon.png";
import { LogOut, Users, Store, Settings, Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle, Eye, Ban, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminPanel = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    // Fetch all profiles
    const { data: profiles } = await supabase.from("profiles").select("*");
    if (profiles) {
      setVendors(profiles.filter((p: any) => p.role === "vendor"));
      setCustomers(profiles.filter((p: any) => p.role === "customer"));
    }

    // Fetch wallet
    const { data: w } = await supabase.from("wallet").select("*").limit(1).single();
    if (w) setWallet(w);

    // Fetch transactions
    const { data: txns } = await supabase.from("wallet_transactions").select("*").order("created_at", { ascending: false });
    if (txns) setTransactions(txns);

    // Fetch payments
    const { data: pays } = await supabase.from("vendor_payments").select("*, profiles:vendor_id(business_name)").order("created_at", { ascending: false });
    if (pays) setPayments(pays);

    // Fetch site settings
    const { data: settings } = await supabase.from("site_settings").select("*");
    if (settings) {
      const map: Record<string, string> = {};
      settings.forEach((s: any) => { map[s.key] = s.value; });
      setSiteSettings(map);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggleVendorActive = async (vendorId: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !currentActive, updated_at: new Date().toISOString() })
      .eq("id", vendorId);
    if (error) toast.error(error.message);
    else {
      toast.success(`Vendor ${!currentActive ? "activated" : "deactivated"}`);
      fetchAll();
    }
  };

  const updateSetting = async (key: string, value: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", key);
    if (error) toast.error(error.message);
    else toast.success(`Updated ${key.replace(/_/g, " ")}`);
    setSaving(false);
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    if (!wallet || amount > parseFloat(wallet.balance)) { toast.error("Insufficient balance"); return; }

    const { error: txnError } = await supabase.from("wallet_transactions").insert({
      type: "withdrawal",
      amount,
      description: `Cash out £${amount.toFixed(2)}`,
    });

    if (txnError) { toast.error(txnError.message); return; }

    const { error: walletError } = await supabase.from("wallet").update({
      balance: parseFloat(wallet.balance) - amount,
      total_withdrawn: parseFloat(wallet.total_withdrawn) + amount,
      updated_at: new Date().toISOString(),
    }).eq("id", wallet.id);

    if (walletError) toast.error(walletError.message);
    else {
      toast.success(`£${amount.toFixed(2)} withdrawn successfully!`);
      setWithdrawAmount("");
      fetchAll();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-4xl animate-float">⚙️</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <nav className="bg-card/90 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoIcon} alt="Logo" width={36} height={36} className="w-9 h-9" />
            <span className="font-display text-lg font-semibold text-foreground hidden sm:inline">
              Admin Panel
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}>
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">⚙️ Admin Panel</h1>
          <p className="text-muted-foreground font-body mb-8">Manage your entire site from here.</p>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <Store className="w-5 h-5 text-primary mx-auto mb-1" />
              <div className="font-display text-2xl font-bold text-foreground">{vendors.length}</div>
              <div className="font-body text-xs text-muted-foreground">Vendors</div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <Users className="w-5 h-5 text-secondary mx-auto mb-1" />
              <div className="font-display text-2xl font-bold text-foreground">{customers.length}</div>
              <div className="font-body text-xs text-muted-foreground">Customers</div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <TrendingUp className="w-5 h-5 text-accent mx-auto mb-1" />
              <div className="font-display text-2xl font-bold text-foreground">£{wallet?.total_earned || "0.00"}</div>
              <div className="font-body text-xs text-muted-foreground">Total Earned</div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <Wallet className="w-5 h-5 text-primary mx-auto mb-1" />
              <div className="font-display text-2xl font-bold text-foreground">£{wallet?.balance || "0.00"}</div>
              <div className="font-body text-xs text-muted-foreground">Wallet Balance</div>
            </div>
          </div>

          <Tabs defaultValue="vendors" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="vendors" className="font-display text-xs">Vendors</TabsTrigger>
              <TabsTrigger value="customers" className="font-display text-xs">Customers</TabsTrigger>
              <TabsTrigger value="wallet" className="font-display text-xs">Wallet</TabsTrigger>
              <TabsTrigger value="settings" className="font-display text-xs">Site Settings</TabsTrigger>
            </TabsList>

            {/* VENDORS TAB */}
            <TabsContent value="vendors">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5" /> Vendor Management
                </h2>
                {vendors.length === 0 ? (
                  <p className="text-muted-foreground font-body text-sm text-center py-6">No vendors registered yet.</p>
                ) : (
                  <div className="space-y-3">
                    {vendors.map((v) => (
                      <div key={v.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-4">
                        <div>
                          <div className="font-display font-semibold text-foreground">
                            {v.business_name || "Unnamed Vendor"}
                          </div>
                          <div className="font-body text-xs text-muted-foreground">
                            {v.billing_cycle === "yearly" ? "Annual — £59.99/yr" : "Monthly — £7.99/mo"}
                            {" • "}
                            {v.is_active ? "✅ Active" : "❌ Inactive"}
                          </div>
                          {v.trial_ends_at && (
                            <div className="font-body text-xs text-muted-foreground">
                              Trial ends: {new Date(v.trial_ends_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant={v.is_active ? "destructive" : "mint"}
                            size="sm"
                            onClick={() => toggleVendorActive(v.id, v.is_active)}
                          >
                            {v.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            {v.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* CUSTOMERS TAB */}
            <TabsContent value="customers">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" /> Customer Management
                </h2>
                {customers.length === 0 ? (
                  <p className="text-muted-foreground font-body text-sm text-center py-6">No customers registered yet.</p>
                ) : (
                  <div className="space-y-3">
                    {customers.map((c) => (
                      <div key={c.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-4">
                        <div>
                          <div className="font-display font-semibold text-foreground">
                            {c.full_name || "Anonymous Customer"}
                          </div>
                          <div className="font-body text-xs text-muted-foreground">
                            Joined: {new Date(c.created_at).toLocaleDateString()}
                            {" • "}{c.is_active ? "✅ Active" : "❌ Inactive"}
                          </div>
                        </div>
                        <Button
                          variant={c.is_active ? "destructive" : "mint"}
                          size="sm"
                          onClick={() => toggleVendorActive(c.id, c.is_active)}
                        >
                          {c.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* WALLET TAB */}
            <TabsContent value="wallet">
              <div className="space-y-6">
                {/* Wallet overview */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5" /> Site Wallet
                  </h2>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="font-display text-2xl font-bold text-foreground">£{wallet?.balance || "0.00"}</div>
                      <div className="font-body text-xs text-muted-foreground">Available</div>
                    </div>
                    <div className="text-center">
                      <div className="font-display text-2xl font-bold text-secondary">£{wallet?.total_earned || "0.00"}</div>
                      <div className="font-body text-xs text-muted-foreground">Total Earned</div>
                    </div>
                    <div className="text-center">
                      <div className="font-display text-2xl font-bold text-primary">£{wallet?.total_withdrawn || "0.00"}</div>
                      <div className="font-body text-xs text-muted-foreground">Withdrawn</div>
                    </div>
                  </div>

                  {/* Withdraw */}
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Amount to withdraw (£)"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                    <Button variant="hero" onClick={handleWithdraw}>
                      Cash Out 💰
                    </Button>
                  </div>
                </div>

                {/* Recent transactions */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-display text-lg font-bold text-foreground mb-4">Transaction History</h3>
                  {transactions.length === 0 ? (
                    <p className="text-muted-foreground font-body text-sm text-center py-4">No transactions yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {transactions.map((t) => (
                        <div key={t.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            {t.type === "credit" ? (
                              <ArrowDownCircle className="w-4 h-4 text-secondary" />
                            ) : (
                              <ArrowUpCircle className="w-4 h-4 text-destructive" />
                            )}
                            <div>
                              <div className="font-display text-sm font-semibold text-foreground">
                                {t.description || t.type}
                              </div>
                              <div className="font-body text-xs text-muted-foreground">
                                {new Date(t.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <span className={`font-display font-bold ${t.type === "credit" ? "text-secondary" : "text-destructive"}`}>
                            {t.type === "credit" ? "+" : "-"}£{parseFloat(t.amount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent payments from vendors */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-display text-lg font-bold text-foreground mb-4">Vendor Payments</h3>
                  {payments.length === 0 ? (
                    <p className="text-muted-foreground font-body text-sm text-center py-4">No payments recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {payments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                          <div>
                            <div className="font-display text-sm font-semibold text-foreground">
                              {(p as any).profiles?.business_name || "Vendor"} — {p.payment_type}
                            </div>
                            <div className="font-body text-xs text-muted-foreground">
                              {new Date(p.created_at).toLocaleString()} • {p.status}
                            </div>
                          </div>
                          <span className="font-display font-bold text-secondary">
                            +£{parseFloat(p.amount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* SITE SETTINGS TAB */}
            <TabsContent value="settings">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" /> Site Settings
                </h2>
                <div className="space-y-4">
                  {[
                    { key: "site_name", label: "Site Name" },
                    { key: "hero_title", label: "Hero Title" },
                    { key: "hero_subtitle", label: "Hero Subtitle" },
                    { key: "monthly_price", label: "Monthly Price (£)" },
                    { key: "yearly_price", label: "Yearly Price (£)" },
                    { key: "photo_upload_price", label: "Photo Upload Price (£)" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <Label className="font-body text-sm">{label}</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={siteSettings[key] || ""}
                          onChange={(e) =>
                            setSiteSettings((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={saving}
                          onClick={() => updateSetting(key, siteSettings[key])}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanel;
