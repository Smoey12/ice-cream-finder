import { Link, useLocation } from "react-router-dom";

const links = [
  { to: "/", label: "Home" },
  { to: "/auth/customer", label: "Customer Auth" },
  { to: "/auth/vendor", label: "Vendor Auth" },
  { to: "/map", label: "Live Map" },
  { to: "/dashboard", label: "Vendor Dashboard" },
];

const DevNav = () => {
  const { pathname } = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-foreground/90 backdrop-blur text-background px-4 py-2 flex items-center gap-4 text-xs font-mono overflow-x-auto">
      <span className="font-bold text-primary shrink-0">DEV NAV:</span>
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          className={`shrink-0 hover:text-primary transition-colors ${pathname === l.to ? "text-primary font-bold underline" : ""}`}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
};

export default DevNav;
