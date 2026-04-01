import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { User, CreditCard, MapPin, LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const UserDropdown = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const displayName =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Customer";

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
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link to="/my-card" className="flex items-center gap-2 cursor-pointer">
            <CreditCard className="w-4 h-4" />
            My Card
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/map" className="flex items-center gap-2 cursor-pointer">
            <MapPin className="w-4 h-4" />
            Find Vans
          </Link>
        </DropdownMenuItem>
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
