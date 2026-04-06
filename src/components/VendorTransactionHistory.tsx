import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, Calendar, Filter, Receipt } from "lucide-react";

interface VendorTransactionHistoryProps {
  vendorId: string;
}

const VendorTransactionHistory = ({ vendorId }: VendorTransactionHistoryProps) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterType, setFilterType] = useState<"all" | "qr_payment" | "cashout" | "reward">("all");

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("vendor_payments")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (dateFrom) query = query.gte("created_at", new Date(dateFrom).toISOString());
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      query = query.lte("created_at", end.toISOString());
    }
    if (filterType !== "all") query = query.eq("payment_type", filterType);

    const { data } = await query;
    setPayments(data || []);
    setLoading(false);
  }, [vendorId, dateFrom, dateTo, filterType]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const totalIncome = payments
    .filter(p => p.payment_type !== "cashout")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalCashouts = payments
    .filter(p => p.payment_type === "cashout")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="bg-gradient-to-r from-primary to-accent p-5">
        <div className="flex items-center gap-2 text-primary-foreground">
          <Receipt className="w-5 h-5" />
          <h2 className="font-display text-xl font-bold">Transaction History</h2>
        </div>
        <div className="flex gap-4 mt-2">
          <div className="text-primary-foreground/80 text-xs font-body">
            Income: <span className="font-bold text-primary-foreground">£{totalIncome.toFixed(2)}</span>
          </div>
          <div className="text-primary-foreground/80 text-xs font-body">
            Cashouts: <span className="font-bold text-primary-foreground">£{totalCashouts.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[120px]">
            <label className="text-[10px] text-muted-foreground font-body flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3" /> From
            </label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="text-[10px] text-muted-foreground font-body flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3" /> To
            </label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs" />
          </div>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {([["all", "All"], ["qr_payment", "💳 Payments"], ["cashout", "💸 Cashouts"], ["reward", "🎁 Rewards"]] as const).map(([key, label]) => (
            <Button
              key={key}
              variant={filterType === key ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => setFilterType(key as any)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-muted/30 rounded-lg animate-pulse" />)}
          </div>
        ) : payments.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8 font-body">No transactions found</p>
        ) : (
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {payments.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.payment_type === "cashout" ? "bg-primary/20" : "bg-secondary/20"
                  }`}>
                    {tx.payment_type === "cashout" ? (
                      <ArrowUp className="w-4 h-4 text-primary" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-secondary" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{tx.description || tx.payment_type}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString("en-GB", {
                        weekday: "short", day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-display font-bold ${
                  tx.payment_type === "cashout" ? "text-destructive" : "text-secondary"
                }`}>
                  {tx.payment_type === "cashout" ? "-" : "+"}£{Math.abs(tx.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-[10px] text-muted-foreground font-body">
          Showing {payments.length} transaction{payments.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
};

export default VendorTransactionHistory;
