import { Link } from "react-router-dom";
import logoIcon from "@/assets/logo-icon.png";

const Footer = () => {
  return (
    <footer className="bg-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={logoIcon} alt="Logo" width={32} height={32} className="w-8 h-8" loading="lazy" />
            <span className="font-display text-lg font-semibold text-primary-foreground">
              UK Ice Cream Van Tracker
            </span>
          </div>
          <div className="flex gap-6 text-primary-foreground/60 font-body text-sm">
            <Link to="/" className="hover:text-primary-foreground transition-colors">Home</Link>
            <Link to="/#features" className="hover:text-primary-foreground transition-colors">Features</Link>
            <Link to="/#pricing" className="hover:text-primary-foreground transition-colors">Pricing</Link>
          </div>
          <p className="text-primary-foreground/40 font-body text-sm">
            © {new Date().getFullYear()} UK Ice Cream Van Tracker. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
