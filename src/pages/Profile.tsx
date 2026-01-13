import { Navigate, Link } from "react-router-dom";
import { User, Mail, Phone, Calendar, MapPin, Ticket, Loader2, LogOut } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useUserOrders, useUserProfile } from "@/hooks/useUserOrders";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const Profile = () => {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: orders = [], isLoading: ordersLoading } = useUserOrders();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "d MMMM yyyy", { locale: localeId });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: "Menunggu Pembayaran", className: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" },
      paid: { label: "Lunas", className: "bg-green-500/20 text-green-500 border-green-500/30" },
      cancelled: { label: "Dibatalkan", className: "bg-red-500/20 text-red-500 border-red-500/30" },
      expired: { label: "Kadaluarsa", className: "bg-muted text-muted-foreground border-muted" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4">
          {/* Profile Header */}
          <div className="glass-card rounded-2xl p-8 mb-8 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gradient-gold rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-display text-2xl md:text-3xl font-bold">
                    {profile?.full_name || "Pengguna"}
                  </h1>
                  <div className="flex flex-col gap-1 mt-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                    {profile?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="goldOutline" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                Keluar
              </Button>
            </div>
          </div>

          {/* Order History */}
          <div className="animate-fade-in">
            <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-3">
              <Ticket className="w-6 h-6 text-primary" />
              Riwayat Pembelian
            </h2>

            {ordersLoading || profileLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <Ticket className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-display text-xl font-bold mb-2">
                  Belum Ada Pembelian
                </h3>
                <p className="text-muted-foreground mb-6">
                  Anda belum pernah membeli tiket. Yuk, jelajahi konser menarik!
                </p>
                <Link to="/concerts">
                  <Button variant="gold">Lihat Konser</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="glass-card rounded-xl overflow-hidden">
                    {/* Order Header */}
                    <div className="p-4 bg-secondary/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-primary text-sm">
                          {order.order_number}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(order.created_at)}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-4 space-y-4">
                      {order.order_items.map((item) => {
                        const concert = item.ticket_types?.concerts;
                        if (!concert) return null;

                        return (
                          <div
                            key={item.id}
                            className="flex gap-4 items-start"
                          >
                            <img
                              src={concert.image_url || "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=200&auto=format&fit=crop"}
                              alt={concert.title}
                              className="w-20 h-20 md:w-24 md:h-24 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <Link
                                to={`/concert/${concert.id}`}
                                className="font-bold hover:text-primary transition-colors"
                              >
                                {concert.title}
                              </Link>
                              <p className="text-sm text-primary">
                                {concert.artist}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(concert.date)}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                {concert.venue}, {concert.city}
                              </div>
                              <div className="mt-2 text-sm">
                                <span className="text-muted-foreground">
                                  {item.quantity}x {item.ticket_types?.name}
                                </span>
                                <span className="ml-2 font-semibold">
                                  {formatCurrency(item.subtotal)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Order Footer */}
                    <div className="p-4 border-t border-border flex justify-between items-center">
                      <span className="text-muted-foreground">Total</span>
                      <span className="text-xl font-bold text-gradient-gold">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
