import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Check, Loader2, User, Mail, Phone, Calendar, MapPin } from "lucide-react";
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
import PaymentMethodSelector from "@/components/checkout/PaymentMethodSelector";
import PaymentInstructions from "@/components/checkout/PaymentInstructions";
import { useXenditPayment, PaymentMethod, BankCode, EwalletType } from "@/hooks/useXenditPayment";

const checkoutSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
  email: z.string().trim().email("Email tidak valid").max(255, "Email maksimal 255 karakter"),
  phone: z.string().trim().min(10, "Nomor telepon minimal 10 digit").max(15, "Nomor telepon maksimal 15 digit"),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

interface ContinueOrderData {
  id: string;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_method: string | null;
  payment_data: Record<string, unknown> | null;
  expires_at: string | null;
  order_items: {
    quantity: number;
    unit_price: number;
    ticket_types: {
      name: string;
      concerts: {
        id: string;
        title: string;
        artist: string;
        date: string;
        time: string;
        venue: string;
        city: string;
        image_url: string | null;
      };
    };
  }[];
}

const Checkout = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createPayment, isProcessing } = useXenditPayment();

  const continueOrderId = searchParams.get("continue");
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
  
  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedBank, setSelectedBank] = useState<BankCode>("BCA");
  const [selectedEwallet, setSelectedEwallet] = useState<EwalletType>("OVO");
  const [paymentData, setPaymentData] = useState<Record<string, unknown> | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  
  // Continue payment state
  const [continueOrder, setContinueOrder] = useState<ContinueOrderData | null>(null);
  const [isContinueLoading, setIsContinueLoading] = useState(false);

  // Fetch existing order for continue payment
  useEffect(() => {
    const fetchContinueOrder = async () => {
      if (!continueOrderId) return;
      
      setIsContinueLoading(true);
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(`
            id,
            total_amount,
            customer_name,
            customer_email,
            customer_phone,
            payment_method,
            payment_data,
            expires_at,
            order_items (
              quantity,
              unit_price,
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
          .eq("id", continueOrderId)
          .single();

        if (error) throw error;
        
        if (data) {
          // Check if expired
          if (data.expires_at && new Date(data.expires_at) <= new Date()) {
            toast.error("Pesanan sudah kadaluarsa");
            navigate("/profile");
            return;
          }
          
          setContinueOrder(data as unknown as ContinueOrderData);
          setOrderId(data.id);
          setPaymentData(data.payment_data as Record<string, unknown> | null);
          setPaymentMethod((data.payment_method as PaymentMethod) || null);
          setStep(3); // Go directly to payment instructions
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error("Gagal memuat pesanan");
        navigate("/profile");
      } finally {
        setIsContinueLoading(false);
      }
    };

    fetchContinueOrder();
  }, [continueOrderId, navigate]);

  // Pre-fill form with user data
  useEffect(() => {
    const fetchProfile = async () => {
      if (user && !continueOrderId) {
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
  }, [user, continueOrderId]);

  if (isLoading || isContinueLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // For continue payment flow
  if (continueOrder && paymentData) {
    const orderItem = continueOrder.order_items[0];
    const orderConcert = orderItem?.ticket_types?.concerts;
    
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-28 pb-20">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="glass-card rounded-2xl p-6 animate-fade-in">
              <h2 className="font-display text-2xl font-bold mb-4 text-center">
                Lanjutkan Pembayaran
              </h2>
              
              {orderConcert && (
                <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                  <div className="flex gap-4">
                    <img
                      src={orderConcert.image_url || "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=200&auto=format&fit=crop"}
                      alt={orderConcert.title}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div>
                      <h4 className="font-bold">{orderConcert.title}</h4>
                      <p className="text-primary text-sm">{orderConcert.artist}</p>
                      <p className="text-sm mt-1">{orderItem.quantity}x {orderItem.ticket_types.name}</p>
                      <p className="font-bold text-primary mt-1">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(continueOrder.total_amount)}</p>
                    </div>
                  </div>
                </div>
              )}

              <PaymentInstructions
                paymentMethod={paymentMethod!}
                paymentData={paymentData}
                orderId={continueOrder.id}
              />

              <div className="mt-8 flex flex-col gap-3">
                <Button
                  variant="premium"
                  size="xl"
                  className="w-full"
                  onClick={() => navigate(`/order-success/${continueOrder.id}`)}
                >
                  Cek Status Pembayaran
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate("/profile")}
                >
                  Kembali ke Profil
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
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
    } else if (step === 2) {
      if (!paymentMethod) {
        toast.error("Pilih metode pembayaran");
        return;
      }
      handleCreateOrder();
    }
  };

  const handleCreateOrder = async () => {
    if (!validateForm() || !paymentMethod) return;

    setIsSubmitting(true);

    try {
      // Generate a temporary order number
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

      setOrderId(order.id);

      // Create payment via Xendit
      const paymentResult = await createPayment({
        order_id: order.id,
        amount: totalPrice,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        payment_method: paymentMethod,
        bank_code: paymentMethod === "VA" ? selectedBank : undefined,
        ewallet_type: paymentMethod === "EWALLET" ? selectedEwallet : undefined,
      });

      if (paymentResult) {
        setPaymentData(paymentResult.payment_data);
        setStep(3);
        toast.success("Pesanan berhasil dibuat!");
      } else {
        toast.error("Gagal membuat pembayaran");
      }
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
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 sm:gap-3">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold transition-colors text-sm sm:text-base ${
                    step >= s
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {step > s ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : s}
                </div>
                <span className={`text-xs sm:text-sm ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>
                  {s === 1 ? "Data" : s === 2 ? "Pembayaran" : "Selesai"}
                </span>
                {s < 3 && (
                  <div
                    className={`w-8 sm:w-16 h-0.5 ${
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
              {step === 1 && (
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
              )}

              {step === 2 && (
                <div className="glass-card rounded-2xl p-6 animate-fade-in">
                  <h2 className="font-display text-2xl font-bold mb-6">
                    Metode Pembayaran
                  </h2>

                  {/* Order Summary */}
                  <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                    <div className="flex gap-4">
                      <img
                        src={concert.image_url || "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=200&auto=format&fit=crop"}
                        alt={concert.title}
                        className="w-20 h-20 rounded-lg object-cover"
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
                    <div className="mt-3 pt-3 border-t border-border flex justify-between">
                      <span className="text-sm">{ticket.name} × {quantity}</span>
                      <span className="font-bold text-primary">{formatCurrency(totalPrice)}</span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <PaymentMethodSelector
                    selectedMethod={paymentMethod}
                    onMethodChange={setPaymentMethod}
                    selectedBank={selectedBank}
                    onBankChange={setSelectedBank}
                    selectedEwallet={selectedEwallet}
                    onEwalletChange={setSelectedEwallet}
                  />

                  <div className="flex gap-4 mt-8">
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
                      onClick={handleNext}
                      disabled={isSubmitting || isProcessing || !paymentMethod}
                    >
                      {isSubmitting || isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Memproses...
                        </>
                      ) : (
                        "Bayar Sekarang"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && paymentData && paymentMethod && orderId && (
                <div className="glass-card rounded-2xl p-6 animate-fade-in">
                  <PaymentInstructions
                    paymentMethod={paymentMethod}
                    paymentData={paymentData}
                    orderId={orderId}
                  />

                  <div className="mt-8 flex flex-col gap-3">
                    <Button
                      variant="premium"
                      size="xl"
                      className="w-full"
                      onClick={() => navigate(`/order-success/${orderId}`)}
                    >
                      Cek Status Pembayaran
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={() => navigate("/profile")}
                    >
                      Lihat Pesanan Saya
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

                {step === 2 && paymentMethod && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Metode</span>
                      <span className="font-medium">
                        {paymentMethod === "VA" && `VA ${selectedBank}`}
                        {paymentMethod === "EWALLET" && selectedEwallet}
                        {paymentMethod === "QRIS" && "QRIS"}
                      </span>
                    </div>
                  </div>
                )}
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
