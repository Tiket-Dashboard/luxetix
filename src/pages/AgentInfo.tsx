import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  CheckCircle, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Shield, 
  Users,
  ArrowRight,
  Star
} from "lucide-react";

const AgentInfo = () => {
  const benefits = [
    {
      icon: Calendar,
      title: "Buat Event Sendiri",
      description: "Kelola dan publikasikan event konser Anda sendiri di platform LUXETIX"
    },
    {
      icon: TrendingUp,
      title: "Sistem Penjualan Terintegrasi",
      description: "Sistem pembayaran otomatis dengan berbagai metode pembayaran"
    },
    {
      icon: DollarSign,
      title: "Pendapatan Transparan",
      description: "Pantau pendapatan dan komisi secara real-time di dashboard"
    },
    {
      icon: Shield,
      title: "Validasi Tiket Aman",
      description: "Sistem QR Code untuk validasi tiket yang aman dan mudah"
    },
    {
      icon: Users,
      title: "Jangkauan Luas",
      description: "Akses ke ribuan pengguna LUXETIX yang mencari event terbaik"
    },
    {
      icon: Star,
      title: "Dukungan Prioritas",
      description: "Tim support yang siap membantu Anda 24/7"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Daftar sebagai Agent",
      description: "Isi formulir pendaftaran dan lengkapi data bisnis Anda"
    },
    {
      number: "02",
      title: "Bayar Biaya Registrasi",
      description: "Lakukan pembayaran biaya pendaftaran untuk aktivasi akun"
    },
    {
      number: "03",
      title: "Mulai Buat Event",
      description: "Akses dashboard agent dan mulai publikasikan event Anda"
    }
  ];

  const faqs = [
    {
      question: "Berapa biaya untuk menjadi agent?",
      answer: "Biaya pendaftaran agent adalah Rp 500.000 (sekali bayar). Biaya ini mencakup akses penuh ke dashboard agent dan semua fitur platform."
    },
    {
      question: "Berapa komisi yang diambil platform?",
      answer: "Platform mengambil komisi sebesar 10% dari setiap penjualan tiket. Sisanya 90% menjadi pendapatan Anda."
    },
    {
      question: "Berapa event yang bisa saya buat?",
      answer: "Setelah mendaftar, Anda akan mendapat kuota awal untuk membuat event. Kuota ini dapat ditingkatkan seiring performa event Anda."
    },
    {
      question: "Apakah event saya perlu disetujui?",
      answer: "Event pertama Anda akan direview oleh tim kami. Setelah beberapa event sukses, Anda akan mendapat status auto-approve."
    },
    {
      question: "Kapan saya menerima pembayaran?",
      answer: "Pembayaran akan diproses setelah event selesai dan dikurangi komisi platform."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow pt-20">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
                Peluang Bisnis
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Jadi <span className="text-gradient-gold">Agent LUXETIX</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Kelola event konser Anda sendiri dan dapatkan keuntungan dari setiap penjualan tiket. 
                Bergabung dengan ratusan agent sukses di platform kami.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/agent/register">
                  <Button variant="gold" size="lg" className="gap-2 text-lg px-8">
                    Daftar Sekarang
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/concerts">
                  <Button variant="outline" size="lg" className="text-lg px-8">
                    Lihat Event
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Keuntungan Menjadi Agent
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Nikmati berbagai keuntungan eksklusif sebagai agent LUXETIX
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="glass-card border-border/50 hover:border-primary/50 transition-all duration-300">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                      <benefit.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Cara Bergabung
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Tiga langkah mudah untuk memulai bisnis event Anda
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {steps.map((step, index) => (
                <div key={index} className="relative text-center">
                  <div className="text-6xl font-display font-bold text-primary/20 mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-xl mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 -right-4 w-8 h-0.5 bg-border" />
                  )}
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link to="/agent/register">
                <Button variant="gold" size="lg" className="gap-2">
                  Mulai Sekarang
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Commission Info */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-primary" />
                      Biaya Pendaftaran
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-gradient-gold mb-2">
                      Rp 500.000
                    </div>
                    <p className="text-muted-foreground mb-4">
                      Pembayaran sekali untuk selamanya
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Akses dashboard agent
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Sistem pembayaran terintegrasi
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Validasi tiket QR Code
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Dukungan prioritas
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Struktur Komisi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-gradient-gold mb-2">
                      90%
                    </div>
                    <p className="text-muted-foreground mb-4">
                      Pendapatan untuk Anda
                    </p>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                        <span className="text-sm">Pendapatan Agent</span>
                        <span className="font-semibold text-green-500">90%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                        <span className="text-sm">Komisi Platform</span>
                        <span className="font-semibold text-muted-foreground">10%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Pertanyaan Umum
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Jawaban untuk pertanyaan yang sering diajukan
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index} className="glass-card">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Siap Memulai?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Bergabunglah dengan ratusan agent sukses yang telah menghasilkan jutaan rupiah dari event mereka
            </p>
            <Link to="/agent/register">
              <Button variant="gold" size="lg" className="gap-2 text-lg px-8">
                Daftar Jadi Agent
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AgentInfo;
