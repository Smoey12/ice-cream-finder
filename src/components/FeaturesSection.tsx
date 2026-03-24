import { motion } from "framer-motion";
import { MapPin, Bell, Star, TrendingUp, Shield, Clock } from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Live GPS Tracking",
    description: "See ice cream vans moving in real time on an interactive map. Know exactly when they're nearby.",
    color: "text-strawberry",
    bg: "bg-primary/10",
  },
  {
    icon: Bell,
    title: "Get Notified",
    description: "Set alerts for when your favourite van enters your neighbourhood. Never miss a 99 Flake again!",
    color: "text-mint",
    bg: "bg-secondary/10",
  },
  {
    icon: Star,
    title: "Ratings & Reviews",
    description: "Read and leave reviews for ice cream vans. Find the best Mr Whippy in your area.",
    color: "text-vanilla",
    bg: "bg-accent/10",
  },
  {
    icon: TrendingUp,
    title: "Grow Your Business",
    description: "Van operators get analytics, route insights, and direct customer engagement tools.",
    color: "text-sky",
    bg: "bg-sky/10",
  },
  {
    icon: Shield,
    title: "Verified Vendors",
    description: "All van operators are verified for food safety and hygiene standards. Peace of mind guaranteed.",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: Clock,
    title: "Schedule & Routes",
    description: "Van operators can share their daily routes so customers know when and where to find them.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-primary/10 text-primary font-display text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Features
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything You Need
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-body">
            Whether you're chasing the jingle or driving the van, we've got you covered.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-shadow duration-300"
            >
              <div className={`w-12 h-12 rounded-lg ${feature.bg} flex items-center justify-center mb-4`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="font-display text-xl font-semibold text-card-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground font-body">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
