import { ArrowRight, Sparkles, Shield, Headphones, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CountdownTimer from "@/components/CountdownTimer";
import ConcertCardDB from "@/components/ConcertCardDB";
import { Button } from "@/components/ui/button";
import { useFeaturedConcerts } from "@/hooks/useConcerts";

const Index = () => {
  const { data: featuredConcerts = [], isLoading } = useFeaturedConcerts();
  const mainConcert = featuredConcerts[0];
  
  // Set target date for countdown (main concert or fallback)
  const targetDate = mainConcert 
    ? new Date(`${mainConcert.date}T${mainConcert.time}`)
    : new Date("2026-02-15T19:00:00");

  const features = [
    {
      icon: Sparkles,
      title: "Pengalaman Premium",
      description: "Nikmati tiket eksklusif dengan akses VIP dan benefit spesial.",
    },
    {
      icon: Shield,
      title: "Pembayaran Aman",
      description: "Transaksi aman dengan berbagai metode pembayaran terpercaya.",
    },
    {
      icon: Headphones,
      title: "Support 24/7",
      description: "Tim kami siap membantu Anda kapan saja.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src={mainConcert?.image_url || "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&auto=format&fit=crop"}
            alt="Hero background"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="animate-fade-in-up">
            <span className="inline-block px-4 py-2 mb-6 text-sm font-medium text-primary bg-primary/10 rounded-full border border-primary/20">
              ✨ Platform Tiket Konser Premium
            </span>

            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Rasakan{" "}
              <span className="text-gradient-gold">Pengalaman</span>
              <br />
              Konser Tak Terlupakan
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Dapatkan tiket konser favorit Anda dengan mudah. Akses eksklusif,
              harga terbaik, dan pengalaman premium.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link to="/concerts">
                <Button variant="premium" size="xl" className="gap-2">
                  Jelajahi Konser
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="goldOutline" size="xl">
                  Pelajari Lebih Lanjut
                </Button>
              </Link>
            </div>

            {/* Countdown */}
            {mainConcert && (
              <div className="mb-8">
                <p className="text-muted-foreground mb-4">
                  <span className="text-primary font-semibold">{mainConcert.title}</span> dimulai dalam:
                </p>
                <div className="flex justify-center">
                  <CountdownTimer targetDate={targetDate} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-primary/50 flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Featured Concerts */}
      <section className="py-20 bg-gradient-dark">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in">
            <span className="text-primary text-sm font-medium tracking-wider uppercase">
              Featured Events
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-2 mb-4">
              Konser <span className="text-gradient-gold">Unggulan</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Jangan lewatkan konser-konser spektakuler yang akan segera hadir
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredConcerts.map((concert) => (
                <ConcertCardDB key={concert.id} concert={concert} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/concerts">
              <Button variant="goldOutline" size="lg" className="gap-2">
                Lihat Semua Konser
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-primary text-sm font-medium tracking-wider uppercase">
              Why Choose Us
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-2 mb-4">
              Kenapa <span className="text-gradient-gold">LUXETIX</span>?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-card p-8 rounded-2xl text-center hover-lift group"
              >
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-gold rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="glass-card rounded-3xl p-10 md:p-16 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Siap Untuk Pengalaman <span className="text-gradient-gold">Luar Biasa</span>?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Daftar sekarang dan dapatkan akses ke presale tiket eksklusif serta
              penawaran spesial hanya untuk member.
            </p>
            <Link to="/auth">
              <Button variant="premium" size="xl" className="gap-2">
                Daftar Sekarang
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
