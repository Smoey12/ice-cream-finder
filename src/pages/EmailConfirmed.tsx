import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logoIcon from "@/assets/logo-icon.png";
import { CheckCircle } from "lucide-react";

const EmailConfirmed = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <motion.img
          src={logoIcon}
          alt="Logo"
          className="w-28 h-28 mx-auto mb-6 drop-shadow-lg"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
        />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="flex justify-center mb-4"
        >
          <CheckCircle className="w-16 h-16 text-primary" />
        </motion.div>
        <h1 className="font-display text-3xl font-bold text-foreground mb-3">
          Thank You for Joining!
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          Your email has been verified. You can now log in and start finding ice cream vans near you! 🍦
        </p>
        <Link to="/auth/customer">
          <Button variant="default" size="lg" className="text-lg px-8 py-6">
            Log In Now
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default EmailConfirmed;
