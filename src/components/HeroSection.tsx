import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logoIcon from "@/assets/logo-icon.png";


const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-16">
      {/* Background with logo */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-secondary">
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <img
            src={logoIcon}
            alt=""
            className="w-[600px] h-[600px] object-contain"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 via-foreground/30 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            
            <span className="inline-block bg-vanilla text-vanilla-foreground font-display text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              🍦 The UK's #1 Ice Cream Van Finder
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
              Find Your Nearest
              <br />
              <span className="text-vanilla">Ice Cream Van</span>
              <br />
              In Real Time
            </h1>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-md font-body">
              Never miss the ice cream van again! Track live locations across the UK, or list your van and reach thousands of hungry customers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth/customer">
                <Button variant="hero" size="lg" className="text-lg px-8 py-6">
                  🗺️ Track Vans — It's Free!
                </Button>
              </Link>
              <Link to="/auth/vendor">
                <Button variant="vanilla" size="lg" className="text-lg px-8 py-6">
                  🚐 List Your Van
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
