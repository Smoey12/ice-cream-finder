import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { User, CreditCard, MapPin, LogOut, QrCode, Heart, Wallet, LayoutDashboard, Route, UtensilsCrossed, Star, Truck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const UserDropdown = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const role = user.user_metadata?.role || "customer";
  const displayName =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    (role === "vendor" ? "Vendor" : "Customer");

  const isVendor = role === "vendor";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <span className="hidden sm:inline text-sm font-body font-medium text-foreground">
            {displayName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-body">
          {isVendor ? "🚐 Vendor Account" : "🍦 Customer Account"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isVendor ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Dashboard</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                  <LayoutDashboard className="w-4 h-4" /> My Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/map" className="flex items-center gap-2 cursor-pointer">
                  <MapPin className="w-4 h-4" /> Live Map
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Manage</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/dashboard?tab=menu" className="flex items-center gap-2 cursor-pointer">
                  <UtensilsCrossed className="w-4 h-4" /> Menu Items
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard?tab=route" className="flex items-center gap-2 cursor-pointer">
                  <Route className="w-4 h-4" /> Route Editor
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard?tab=scanner" className="flex items-center gap-2 cursor-pointer">
                  <QrCode className="w-4 h-4" /> QR Scanner
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard?tab=reviews" className="flex items-center gap-2 cursor-pointer">
                  <Star className="w-4 h-4" /> Reviews
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        ) : (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Discover</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/map" className="flex items-center gap-2 cursor-pointer">
                  <MapPin className="w-4 h-4" /> Find Vans
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/map?favorites=true" className="flex items-center gap-2 cursor-pointer">
                  <Heart className="w-4 h-4" /> My Favorites
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Rewards</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/my-card" className="flex items-center gap-2 cursor-pointer">
                  <QrCode className="w-4 h-4" /> My QR Code
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/my-card" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="w-4 h-4" /> Yummy Rewards
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/my-card" className="flex items-center gap-2 cursor-pointer">
                  <Wallet className="w-4 h-4" /> Reward Wallet
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-2 cursor-pointer text-destructive"
          onClick={() => {
            signOut();
            navigate("/");
          }}
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
