import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BillingToggleProps {
  userId: string;
  currentCycle: string | null;
  onUpdated: () => void;
}

const BillingToggle = ({ userId, currentCycle, onUpdated }: BillingToggleProps) => {
  const [saving, setSaving] = useState(false);
  const cycle = currentCycle || "monthly";
  const isYearly = cycle === "yearly";

  const toggleBilling = async () => {
    setSaving(true);
    const newCycle = isYearly ? "monthly" : "yearly";
    const { error } = await supabase
      .from("profiles")
      .update({ billing_cycle: newCycle, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) toast.error(error.message);
    else {
      toast.success(`Switched to ${newCycle === "yearly" ? "annual (£59.99/yr)" : "monthly (£7.99/mo)"} billing`);
      onUpdated();
    }
    setSaving(false);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h2 className="font-display text-xl font-bold text-foreground mb-2">
        Billing Plan
      </h2>
      <p className="text-muted-foreground font-body text-sm mb-4">
        You're currently on the{" "}
        <span className="font-semibold text-foreground">
          {isYearly ? "Annual — £59.99/yr" : "Monthly — £7.99/mo"}
        </span>{" "}
        plan.
        {isYearly
          ? " Switch to monthly for more flexibility."
          : " Switch to annual and save £35.89/yr!"}
      </p>

      <div className="flex gap-3">
        <Button
          variant={!isYearly ? "default" : "outline"}
          size="sm"
          disabled={!isYearly || saving}
          onClick={toggleBilling}
          className="flex-1"
        >
          Monthly — £7.99/mo
        </Button>
        <Button
          variant={isYearly ? "default" : "outline"}
          size="sm"
          disabled={isYearly || saving}
          onClick={toggleBilling}
          className="flex-1"
        >
          Annual — £59.99/yr 💰
        </Button>
      </div>
    </div>
  );
};

export default BillingToggle;
