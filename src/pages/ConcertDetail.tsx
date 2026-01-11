import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, MapPin, Clock, ArrowLeft, Check, Minus, Plus, ShoppingCart } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CountdownTimer from "@/components/CountdownTimer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getConcertById } from "@/data/concerts";
import { toast } from "sonner";

const ConcertDetail = () => {
  const { id } = useParams();
  const concert = getConcertById(id || "");
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  if (!concert) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold mb-4">Konser tidak ditemukan</h1>
          <Link to="/concerts">
            <Button variant="gold">Kembali ke Daftar Konser</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const selectedTicketData = concert.tickets.find((t) => t.id === selectedTicket);
  const totalPrice = selectedTicketData ? selectedTicketData.price * quantity : 0;

  // Parse date for countdown
  const concertDate = new Date("2026-02-15T19:00:00");

  const handleBuyTicket = () => {
    if (!selectedTicket) {
      toast.error("Pilih tiket terlebih dahulu");
      return;
    }
    toast.success("Tiket ditambahkan ke keranjang!", {
      description: `${quantity}x ${selectedTicketData?.name} - ${formatPrice(totalPrice)}`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-20">
        <div className="absolute inset-0 h-[60vh]">
          <img
            src={concert.image}
            alt={concert.title}
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        </div>

        <div className="relative z-10 container mx-auto px-4 pt-12">
          {/* Back Button */}
          <Link
            to="/concerts"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Daftar Konser
          </Link>

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            {/* Left: Concert Info */}
            <div className="animate-fade-in">
              <Badge className="bg-primary/20 text-primary border-primary/30 mb-4">
                {concert.category}
              </Badge>

              <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
                {concert.title}
              </h1>
              <p className="text-2xl text-primary font-semibold mb-6">
                {concert.artist}
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal</p>
                    <p className="text-foreground font-medium">{concert.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Waktu</p>
                    <p className="text-foreground font-medium">{concert.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lokasi</p>
                    <p className="text-foreground font-medium">
                      {concert.venue}, {concert.city}
                    </p>
                  </div>
                </div>
              </div>

              {/* Countdown */}
              <div className="glass-card p-6 rounded-2xl mb-8">
                <p className="text-muted-foreground mb-4 text-center">
                  Konser dimulai dalam:
                </p>
                <div className="flex justify-center">
                  <CountdownTimer targetDate={concertDate} />
                </div>
              </div>

              {/* Description */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="font-display text-xl font-bold mb-3">Tentang Konser</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {concert.description}
                </p>
              </div>
            </div>

            {/* Right: Ticket Selection */}
            <div className="glass-card p-6 rounded-2xl sticky top-24 animate-fade-in">
              <h3 className="font-display text-2xl font-bold mb-6">Pilih Tiket</h3>

              <div className="space-y-4 mb-6">
                {concert.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket.id)}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedTicket === ticket.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-lg">{ticket.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {ticket.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">
                          {formatPrice(ticket.price)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ticket.available} tersedia
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {ticket.benefits.map((benefit, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <Check className="w-4 h-4 text-primary" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quantity */}
              {selectedTicket && (
                <div className="flex items-center justify-between mb-6 p-4 bg-secondary rounded-xl">
                  <span className="font-medium">Jumlah Tiket</span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center hover:border-primary transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-xl font-bold w-8 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(10, quantity + 1))}
                      className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center hover:border-primary transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Total & Buy */}
              <div className="border-t border-border pt-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-2xl font-bold text-gradient-gold">
                    {formatPrice(totalPrice)}
                  </span>
                </div>

                <Button
                  variant="premium"
                  size="xl"
                  className="w-full gap-2"
                  onClick={handleBuyTicket}
                  disabled={!selectedTicket}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Beli Tiket
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Dengan membeli, Anda menyetujui Syarat & Ketentuan kami
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="py-20" />
      <Footer />
    </div>
  );
};

export default ConcertDetail;
