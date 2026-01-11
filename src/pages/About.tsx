import { Ticket, Users, Shield, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const About = () => {
  const stats = [
    { value: "500K+", label: "Tiket Terjual" },
    { value: "100+", label: "Konser Sukses" },
    { value: "50+", label: "Artis Partner" },
    { value: "4.9", label: "Rating Pengguna" },
  ];

  const values = [
    {
      icon: Shield,
      title: "Keamanan Terjamin",
      description:
        "Setiap transaksi dilindungi dengan sistem keamanan tingkat tinggi.",
    },
    {
      icon: Users,
      title: "Komunitas Pecinta Musik",
      description:
        "Bergabung dengan ribuan pecinta musik yang berbagi passion yang sama.",
    },
    {
      icon: Star,
      title: "Pengalaman Premium",
      description:
        "Akses eksklusif ke tiket VIP dan benefit spesial hanya untuk member.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-8 bg-gradient-gold rounded-2xl flex items-center justify-center">
              <Ticket className="w-10 h-10 text-primary-foreground" />
            </div>

            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Tentang <span className="text-gradient-gold">LUXETIX</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed">
              LUXETIX adalah platform tiket konser premium yang menghubungkan
              pecinta musik dengan pengalaman konser yang tak terlupakan. Kami
              berkomitmen untuk memberikan layanan terbaik dengan akses tiket
              eksklusif dan pengalaman VIP.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="font-display text-4xl md:text-5xl font-bold text-gradient-gold mb-2">
                  {stat.value}
                </p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-primary text-sm font-medium tracking-wider uppercase">
                Misi Kami
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold mt-2 mb-6">
                Membawa{" "}
                <span className="text-gradient-gold">Pengalaman Konser</span>{" "}
                Terbaik untuk Anda
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Kami percaya bahwa setiap orang berhak mendapatkan pengalaman
                konser yang luar biasa. Dengan teknologi terdepan dan jaringan
                partner yang luas, kami memastikan Anda mendapatkan tiket dengan
                mudah, aman, dan terpercaya.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Dari konser musik lokal hingga artis internasional, LUXETIX hadir
                sebagai solusi lengkap untuk kebutuhan tiket konser Anda.
              </p>
            </div>

            <div className="relative">
              <div className="glass-card p-8 rounded-3xl">
                <img
                  src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&fit=crop"
                  alt="Concert experience"
                  className="w-full h-80 object-cover rounded-2xl"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-gold rounded-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gradient-dark">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-primary text-sm font-medium tracking-wider uppercase">
              Nilai Kami
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">
              Mengapa Memilih{" "}
              <span className="text-gradient-gold">LUXETIX</span>?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="glass-card p-8 rounded-2xl text-center hover-lift"
              >
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-gold rounded-2xl flex items-center justify-center">
                  <value.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold mb-3">
                  {value.title}
                </h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team/Partners placeholder */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="glass-card rounded-3xl p-10 md:p-16 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Partner <span className="text-gradient-gold">Terpercaya</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Kami bekerja sama dengan promotor dan venue terbaik di Indonesia
              untuk menghadirkan konser-konser berkualitas.
            </p>
            <div className="flex flex-wrap justify-center gap-8 opacity-50">
              {["Live Nation", "Soundrenaline", "Java Jazz", "We The Fest", "Hammersonic"].map(
                (partner) => (
                  <div
                    key={partner}
                    className="px-6 py-3 bg-secondary rounded-lg font-medium"
                  >
                    {partner}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
