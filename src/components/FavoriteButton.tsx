import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";
import { toast } from "sonner";

interface FavoriteButtonProps {
  vendorId: string;
  userId: string | null;
  size?: "sm" | "md";
}

const DEMO_CUSTOMER_ID = "00000000-0000-0000-0000-000000000099";

const FavoriteButton = ({ vendorId, userId, size = "sm" }: FavoriteButtonProps) => {
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(false);
  const activeUserId = userId || DEMO_CUSTOMER_ID;

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase
        .from("customer_favorites")
        .select("id")
        .eq("user_id", activeUserId)
        .eq("vendor_id", vendorId)
        .maybeSingle();
      setIsFav(!!data);
    };
    check();
  }, [vendorId, activeUserId]);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    if (isFav) {
      await supabase.from("customer_favorites").delete().eq("user_id", activeUserId).eq("vendor_id", vendorId);
      setIsFav(false);
      toast("Removed from favorites");
    } else {
      await supabase.from("customer_favorites").insert({ user_id: activeUserId, vendor_id: vendorId });
      setIsFav(true);
      toast("Added to favorites ❤️");
    }
    setLoading(false);
  };

  const s = size === "sm" ? "w-5 h-5" : "w-6 h-6";

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="p-1 rounded-full hover:bg-gray-100 transition-colors"
      title={isFav ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={`${s} transition-all ${isFav ? "fill-red-500 text-red-500 scale-110" : "text-gray-400"}`}
      />
    </button>
  );
};

export default FavoriteButton;
