import { Link } from "react-router-dom";
import { IceCream, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoIcon from "@/assets/logo-icon.png";
import { useState } from "react";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logoIcon} alt="Ice cream logo" width={36} height={36} className="w-9 h-9" />
        </Link>

        {/* Centered company name */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link to="/" className="font-display text-lg font-semibold text-foreground whitespace-nowrap">
            UK Ice Cream Van Tracker
          </Link>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/#features" className="text-muted-foreground hover:text-foreground transition-colors font-body text-sm">
            Features
          </Link>
          <Link to="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors font-body text-sm">
            Pricing
          </Link>
          <Link to="/auth/customer">
            <Button variant="outline" size="sm">Track Vans Free</Button>
          </Link>
          <Link to="/auth/vendor">
            <Button variant="hero" size="sm">Van Operator Login</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-card border-b border-border px-4 pb-4 space-y-3">
          <Link to="/auth/customer" className="block" onClick={() => setMobileOpen(false)}>
            <Button variant="outline" className="w-full">Track Vans Free</Button>
          </Link>
          <Link to="/auth/vendor" className="block" onClick={() => setMobileOpen(false)}>
            <Button variant="hero" className="w-full">Van Operator Login</Button>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
