import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const PricingSection = () => {
  const [fleetVans, setFleetVans] = useState(3);

  const baseMonthly = 7.99;
  const baseYearly = 59.99;
  const discount = fleetVans >= 3 ? 0.08 : 0;
  const fleetMonthlyTotal = +(baseMonthly * fleetVans * (1 - discount)).toFixed(2);
  const fleetYearlyTotal = +(baseYearly * fleetVans * (1 - discount)).toFixed(2);

  return (
    <section id="pricing" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-secondary/10 text-secondary font-display text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Pricing
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Simple, Fair Pricing
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-body">
            Free for ice cream lovers. Affordable for van operators and fleets.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Customer - Free */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl p-8 border border-border shadow-sm"
          >
            <div className="mb-6">
              <span className="text-4xl">🍦</span>
              <h3 className="font-display text-2xl font-bold text-card-foreground mt-3">Ice Cream Lover</h3>
              <p className="text-muted-foreground font-body mt-1">For customers tracking vans</p>
            </div>
            <div className="mb-8">
              <span className="font-display text-5xl font-bold text-secondary">Free</span>
              <span className="text-muted-foreground font-body ml-2">forever</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                "Live van tracking on map",
                "Notifications when vans are near",
                "Rate and review vans",
                "View van menus & prices",
                "Save favourite vans",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-card-foreground font-body">
                  <Check className="w-5 h-5 text-secondary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/auth/customer">
              <Button variant="mint" size="lg" className="w-full">
                Start Tracking — Free
              </Button>
            </Link>
          </motion.div>

          {/* Solo Vendor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-8 border-2 border-primary shadow-lg relative"
          >
            <div className="absolute -top-3 right-6 bg-primary text-primary-foreground font-display text-xs font-semibold px-4 py-1 rounded-full">
              2 Weeks Free Trial
            </div>
            <div className="mb-6">
              <span className="text-4xl">🚐</span>
              <h3 className="font-display text-2xl font-bold text-card-foreground mt-3">Solo Operator</h3>
              <p className="text-muted-foreground font-body mt-1">For single van businesses</p>
            </div>
            <div className="mb-2">
              <span className="font-display text-5xl font-bold text-primary">£7.99</span>
              <span className="text-muted-foreground font-body ml-1">/month</span>
            </div>
            <p className="text-muted-foreground font-body text-sm mb-8">
              or <span className="font-semibold text-foreground">£59.99/year</span> (save over 37%)
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Live GPS broadcast to customers",
                "Business profile & menu editor",
                "Route planning tools",
                "Customer analytics dashboard",
                "Push notifications to followers",
                "Priority listing on the map",
                "Verified badge",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-card-foreground font-body">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/auth/vendor">
              <Button variant="hero" size="lg" className="w-full">
                Start Free Trial
              </Button>
            </Link>
          </motion.div>

          {/* Fleet / Business */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl p-8 border-2 border-accent shadow-lg relative"
          >
            <div className="absolute -top-3 right-6 bg-accent text-accent-foreground font-display text-xs font-semibold px-4 py-1 rounded-full">
              8% Off for 3+ Vans
            </div>
            <div className="mb-6">
              <span className="text-4xl">🏢</span>
              <h3 className="font-display text-2xl font-bold text-card-foreground mt-3">Fleet Business</h3>
              <p className="text-muted-foreground font-body mt-1">Multiple vans, one account</p>
            </div>

            {/* Van count selector */}
            <div className="mb-4">
              <label className="font-body text-sm text-muted-foreground block mb-2">How many vans?</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFleetVans(Math.max(2, fleetVans - 1))}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-foreground hover:bg-muted/80"
                >−</button>
                <span className="font-display text-2xl font-bold text-foreground w-8 text-center">{fleetVans}</span>
                <button
                  onClick={() => setFleetVans(Math.min(50, fleetVans + 1))}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-foreground hover:bg-muted/80"
                >+</button>
              </div>
            </div>

            <div className="mb-2">
              <span className="font-display text-4xl font-bold text-accent">£{fleetMonthlyTotal.toFixed(2)}</span>
              <span className="text-muted-foreground font-body ml-1">/month</span>
            </div>
            <p className="text-muted-foreground font-body text-sm mb-2">
              or <span className="font-semibold text-foreground">£{fleetYearlyTotal.toFixed(2)}/year</span>
            </p>
            {discount > 0 && (
              <p className="text-secondary font-body text-xs font-semibold mb-6">
                ✨ 8% fleet discount applied! (Save £{(baseMonthly * fleetVans * discount).toFixed(2)}/mo)
              </p>
            )}
            {discount === 0 && (
              <p className="text-muted-foreground font-body text-xs mb-6">
                Add 1 more van to unlock 8% discount!
              </p>
            )}

            <ul className="space-y-3 mb-8">
              {[
                "Everything in Solo, per van",
                "Fleet dashboard for owner",
                "Track all van locations at once",
                "Individual driver accounts",
                "Centralised route management",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-card-foreground font-body">
                  <Check className="w-5 h-5 text-accent flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/auth/vendor?type=fleet">
              <Button variant="hero" size="lg" className="w-full">
                Start Fleet Trial
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
