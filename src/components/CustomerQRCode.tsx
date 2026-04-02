import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";

interface CustomerQRCodeProps {
  userId: string;
}

const CustomerQRCode = ({ userId }: CustomerQRCodeProps) => {
  const cardNumber = userId.replace(/-/g, "").slice(0, 16).toUpperCase();
  const formattedCard = cardNumber.match(/.{1,4}/g)?.join(" ") || cardNumber;

  return (
    <motion.div
      initial={{ rotateY: -5, scale: 0.95 }}
      animate={{ rotateY: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="relative overflow-hidden rounded-2xl"
    >
      <div className="bg-gradient-to-br from-primary via-accent to-secondary p-6 text-primary-foreground relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs opacity-70 font-body">LOYALTY CARD</p>
              <p className="font-display text-lg font-bold mt-0.5">🍦 Yummy Rewards</p>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="bg-white rounded-xl p-3">
              <QRCodeSVG
                value={`icecream-stamp:${userId}`}
                size={160}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>

          <div className="text-center">
            <p className="font-mono text-sm tracking-[0.15em] opacity-80">
              {formattedCard}
            </p>
            <p className="text-xs opacity-60 font-body mt-1">
              Show this QR code to the vendor to earn stamps
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CustomerQRCode;
