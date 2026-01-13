import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Check, Loader2, User, Mail, Phone, Ticket, Calendar, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConcertById } from "@/hooks/useConcerts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { z } from "zod";

const checkoutSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
  email: z.string().trim().email("Email tidak valid").max(255, "Email maksimal 255 karakter"),
  phone: z.string().trim().min(10, "Nomor telepon minimal 10 digit").max(15, "Nomor telepon maksimal 15 digit"),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

const Checkout = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const ticketId = searchParams.get("ticket");
  const qty = parseInt(searchParams.get("qty") || "1", 10);

  const { data: concert, isLoading } = useConcertById(id || "");

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CheckoutForm>({
    name: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill form with user data
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setForm((prev) => ({ ...prev, email: user.email || "" }));
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (profile) {
          setForm((prev) => ({
            ...prev,
            name: profile.full_name || "",
            phone: profile.phone || "",
          }));
        }
      }
    };
    fetchProfile();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!concert || !ticketId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold mb-4">Data tidak valid</h1>
          <Link to="/concerts">
            <Button variant="gold">Kembali ke Daftar Konser</Button>
          </Link>
        </div>
      </div>
    );
  }

  const ticket = concert.ticket_types.find((t) => t.id === ticketId);
  
  if (!ticket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold mb-4">Tiket tidak ditemukan</h1>
          <Link to={`/concert/${id}`}>
            <Button variant="gold">Kembali ke Detail Konser</Button>
          </Link>
        </div>
      </div>
    );
  }

  const quantity = Math.min(qty, ticket.available_quantity);
  const totalPrice = ticket.price * quantity;

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

  const validateForm = () => {
    try {
      checkoutSchema.parse(form);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof CheckoutForm, string>> = {};
        err.errors.forEach((e) => {
          const field = e.path[0] as keyof CheckoutForm;
          newErrors[field] = e.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateForm()) {
        setStep(2);
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Generate a temporary order number (will be replaced by trigger)
      const tempOrderNumber = `TMP-${Date.now()}`;
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: tempOrderNumber,
          user_id: user?.id || null,
          total_amount: totalPrice,
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order item
      const { error: itemError } = await supabase
        .from("order_items")
        .insert({
          order_id: order.id,
          ticket_type_id: ticket.id,
          concert_id: concert.id,
          quantity: quantity,
          unit_price: ticket.price,
          subtotal: totalPrice,
        });

      if (itemError) throw itemError;

      // Navigate to success page
      navigate(`/order-success/${order.id}`);
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error("Gagal membuat pesanan", {
        description: error.message || "Silakan coba lagi",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Link */}
          <Link
            to={`/concert/${id}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Detail Konser
          </Link>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-10">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    step >= s
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                <span className={step >= s ? "text-foreground" : "text-muted-foreground"}>
                  {s === 1 ? "Data Pembeli" : "Konfirmasi"}
                </span>
                {s < 2 && (
                  <div
                    className={`w-16 h-0.5 ${
                      step > s ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {step === 1 ? (
                <div className="glass-card rounded-2xl p-6 animate-fade-in">
                  <h2 className="font-display text-2xl font-bold mb-6">
                    Data Pembeli
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4" />
                        Nama Lengkap
                      </Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Masukkan nama lengkap"
                        className={errors.name ? "border-red-500" : ""}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="contoh@email.com"
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4" />
                        Nomor Telepon
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="08xxxxxxxxxx"
                        className={errors.phone ? "border-red-500" : ""}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="premium"
                    size="xl"
                    className="w-full mt-8"
                    onClick={handleNext}
                  >
                    Lanjutkan
                  </Button>
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-6 animate-fade-in">
                  <h2 className="font-display text-2xl font-bold mb-6">
                    Konfirmasi Pesanan
                  </h2>

                  {/* Buyer Info */}
                  <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold mb-3">Data Pembeli</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nama</span>
                        <span>{form.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email</span>
                        <span>{form.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Telepon</span>
                        <span>{form.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold mb-3">Detail Pesanan</h3>
                    <div className="flex gap-4">
                      <img
                        src={concert.image_url || "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=200&auto=format&fit=crop"}
                        alt={concert.title}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold">{concert.title}</h4>
                        <p className="text-primary text-sm">{concert.artist}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(concert.date)} - {formatTime(concert.time)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {concert.venue}, {concert.city}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Info */}
                  <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold mb-3">Tiket</h3>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{ticket.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {quantity} tiket × {formatCurrency(ticket.price)}
                        </p>
                      </div>
                      <span className="font-bold text-primary">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      size="xl"
                      className="flex-1"
                      onClick={() => setStep(1)}
                    >
                      Kembali
                    </Button>
                    <Button
                      variant="premium"
                      size="xl"
                      className="flex-1"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Memproses...
                        </>
                      ) : (
                        "Konfirmasi Pesanan"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="glass-card rounded-2xl p-6 sticky top-28">
                <h3 className="font-display text-lg font-bold mb-4">
                  Ringkasan Pesanan
                </h3>

                <div className="flex gap-3 mb-4">
                  <img
                    src={concert.image_url || "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=100&auto=format&fit=crop"}
                    alt={concert.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-semibold text-sm line-clamp-1">{concert.title}</p>
                    <p className="text-xs text-primary">{concert.artist}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(concert.date)}</p>
                  </div>
                </div>

                <div className="border-t border-border py-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{ticket.name}</span>
                    <span>{formatCurrency(ticket.price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Jumlah</span>
                    <span>{quantity}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold text-gradient-gold">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
