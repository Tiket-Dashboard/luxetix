import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Music2, 
  ShoppingCart, 
  LogOut, 
  Menu,
  ChevronLeft,
  QrCode,
  Users,
  Building2,
  Ticket,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { title: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { title: "Konser", path: "/admin/concerts", icon: Music2 },
    { title: "Pesanan", path: "/admin/orders", icon: ShoppingCart },
    { title: "Validasi Tiket", path: "/admin/validation", icon: QrCode },
    { title: "Pengguna", path: "/admin/users", icon: Users },
    { title: "Agent", path: "/admin/agents", icon: Building2 },
    { title: "Approval Event", path: "/admin/event-approval", icon: Ticket },
    { title: "Penarikan Dana", path: "/admin/withdrawals", icon: Wallet },
  ];

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-card border-r border-border transition-all duration-300 z-50",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-gold rounded-lg flex items-center justify-center">
                <Ticket className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-gradient-gold">
                LUXETIX
              </span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                isActive(item.path)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.title}</span>}
            </Link>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          {!collapsed && (
            <div className="mb-3 px-3">
              <p className="text-xs text-muted-foreground">Logged in as</p>
              <p className="text-sm font-medium truncate">{user?.email}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40 flex items-center px-6">
          <h1 className="font-display text-xl font-bold">
            {menuItems.find((item) => isActive(item.path))?.title || "Admin"}
          </h1>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
