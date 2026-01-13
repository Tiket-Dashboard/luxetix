import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Calendar, MapPin, Ticket, Loader2, Copy, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const OrderSuccess = () => {
  const { orderId } = useParams();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order-success", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            ticket_types (
              name,
              concerts (
                id,
                title,
                artist,
                date,
                time,
                venue,
                city,
                image_url
              )
            )
          )
        `)
        .eq("id", orderId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

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

  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5) + " WIB";
  };

  const copyOrderNumber = () => {
    if (order?.order_number) {
      navigator.clipboard.writeText(order.order_number);
      toast.success("Nomor pesanan disalin!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold mb-4">Pesanan tidak ditemukan</h1>
          <Link to="/concerts">
            <Button variant="gold">Lihat Konser</Button>
          </Link>
        </div>
      </div>
    );
  }

  const orderItem = order.order_items[0];
  const concert = orderItem?.ticket_types?.concerts;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Success Icon */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Pesanan Berhasil!
            </h1>
            <p className="text-muted-foreground">
              Terima kasih telah memesan tiket. Simpan nomor pesanan Anda.
            </p>
          </div>

          {/* Order Number */}
          <div className="glass-card rounded-2xl p-6 mb-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nomor Pesanan</p>
                <p className="font-mono text-2xl font-bold text-primary">
                  {order.order_number}
                </p>
              </div>
              <Button variant="outline" size="icon" onClick={copyOrderNumber}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Order Details */}
          {concert && (
            <div className="glass-card rounded-2xl p-6 mb-6 animate-fade-in">
              <h2 className="font-display text-xl font-bold mb-4">Detail Pesanan</h2>

              <div className="flex gap-4 mb-6">
                <img
                  src={concert.image_url || "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=200&auto=format&fit=crop"}
                  alt={concert.title}
                  className="w-28 h-28 rounded-xl object-cover"
                />
                <div>
                  <h3 className="font-bold text-lg">{concert.title}</h3>
                  <p className="text-primary">{concert.artist}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(concert.date)} - {formatTime(concert.time)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {concert.venue}, {concert.city}
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tiket</span>
                  <span>
                    {orderItem.quantity}x {orderItem.ticket_types?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Pembayaran</span>
                  <span className="text-xl font-bold text-gradient-gold">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Buyer Info */}
          <div className="glass-card rounded-2xl p-6 mb-8 animate-fade-in">
            <h2 className="font-display text-xl font-bold mb-4">Informasi Pembeli</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nama</span>
                <span>{order.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{order.customer_email}</span>
              </div>
              {order.customer_phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telepon</span>
                  <span>{order.customer_phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Note */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-8 animate-fade-in">
            <div className="flex items-start gap-3">
              <Ticket className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-500">Menunggu Pembayaran</p>
                <p className="text-sm text-muted-foreground">
                  Silakan selesaikan pembayaran untuk mendapatkan e-ticket Anda.
                  Integrasi pembayaran akan segera tersedia.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
            <Link to="/profile" className="flex-1">
              <Button variant="goldOutline" size="xl" className="w-full gap-2">
                <Ticket className="w-5 h-5" />
                Lihat Pesanan Saya
              </Button>
            </Link>
            <Link to="/concerts" className="flex-1">
              <Button variant="gold" size="xl" className="w-full gap-2">
                Jelajahi Konser Lain
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderSuccess;
