import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Ticket, User, LogOut, LayoutDashboard, Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, signOut, isAdmin, isAgent } = useAuth();

  const navLinks = [
    { name: "Beranda", path: "/" },
    { name: "Konser", path: "/concerts" },
    { name: "Jadi Agent", path: "/agent-info" },
    { name: "Tentang", path: "/about" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-gold rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Ticket className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold text-gradient-gold">
              LUXETIX
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative text-sm font-medium transition-colors duration-300 ${
                  isActive(link.path)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-gold rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {isAdmin && isAgent ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="gold" size="sm" className="gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                          <LayoutDashboard className="w-4 h-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/agent" className="flex items-center gap-2 cursor-pointer">
                          <Calendar className="w-4 h-4" />
                          Agent Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : isAdmin ? (
                  <Link to="/admin">
                    <Button variant="gold" size="sm" className="gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Admin Dashboard
                    </Button>
                  </Link>
                ) : isAgent ? (
                  <Link to="/agent">
                    <Button variant="gold" size="sm" className="gap-2">
                      <Calendar className="w-4 h-4" />
                      Agent Dashboard
                    </Button>
                  </Link>
                ) : null}
                <Link to="/profile">
                  <Button variant="goldOutline" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    Profil
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="goldOutline" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    Masuk
                  </Button>
                </Link>
                <Link to="/concerts">
                  <Button variant="gold" size="sm">
                    Beli Tiket
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/30 animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-lg font-medium transition-colors ${
                    isActive(link.path)
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-col gap-3 pt-4 border-t border-border/30">
                {user ? (
                  <>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setIsOpen(false)}>
                        <Button variant="gold" className="w-full gap-2">
                          <LayoutDashboard className="w-4 h-4" />
                          Admin Dashboard
                        </Button>
                      </Link>
                    )}
                    {isAgent && (
                      <Link to="/agent" onClick={() => setIsOpen(false)}>
                        <Button variant={isAdmin ? "goldOutline" : "gold"} className="w-full gap-2">
                          <Calendar className="w-4 h-4" />
                          Agent Dashboard
                        </Button>
                      </Link>
                    )}
                    <Link to="/profile" onClick={() => setIsOpen(false)}>
                      <Button variant="goldOutline" className="w-full gap-2">
                        <User className="w-4 h-4" />
                        Profil Saya
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full gap-2"
                      onClick={() => {
                        signOut();
                        setIsOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <Button variant="goldOutline" className="w-full">
                        Masuk
                      </Button>
                    </Link>
                    <Link to="/concerts" onClick={() => setIsOpen(false)}>
                      <Button variant="gold" className="w-full">
                        Beli Tiket
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
