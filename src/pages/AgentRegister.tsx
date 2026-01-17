import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { 
  Loader2, 
  Building2, 
  CreditCard, 
  CheckCircle, 
  Clock,
  ArrowRight,
  Wallet,
  QrCode as QrCodeIcon
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";

interface AgentSettings {
  registration_fee: number;
  platform_commission_percent: number;
  default_max_events: number;
}

interface RegistrationStatus {
  registration: {
    id: string;
    status: string;
    payment_data: any;
    expires_at: string;
  } | null;
  agent: {
    id: string;
    registration_status: string;
  } | null;
}

const AgentRegister = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("qris");
  const [paymentData, setPaymentData] = useState<any>(null);

  // Get agent settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["agent-settings-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_settings")
        .select("registration_fee, platform_commission_percent, default_max_events")
        .limit(1)
        .single();
      
      if (error) throw error;
      return data as AgentSettings;
    },
  });

  // Check existing registration status
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ["agent-registration-status"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("agent-registration", {
        body: { action: "check_status" },
      });
      
      if (error) throw error;
      return data as RegistrationStatus;
    },
    enabled: !!user,
    refetchInterval: 5000, // Poll every 5 seconds to check payment status
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("agent-registration", {
        body: {
          action: "register",
          business_name: businessName,
          business_description: businessDescription,
          bank_name: bankName,
          bank_account_name: bankAccountName,
          bank_account_number: bankAccountNumber,
          payment_method: paymentMethod,
        },
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      setPaymentData(data.payment_data);
      setStep(3);
      toast({ title: "Registrasi berhasil dibuat", description: "Silakan lakukan pembayaran" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal mendaftar", description: error.message, variant: "destructive" });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Redirect if already an active agent
  useEffect(() => {
    if (status?.agent?.registration_status === "active") {
      navigate("/agent");
    }
  }, [status, navigate]);

  // Show payment instructions if there's a pending registration
  useEffect(() => {
    if (status?.registration?.status === "pending" && status?.registration?.payment_data) {
      setPaymentData(status.registration.payment_data);
      setStep(3);
    }
  }, [status]);

  if (authLoading || settingsLoading || statusLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If registration is paid but agent not yet created (processing)
  if (status?.registration?.status === "paid" && !status?.agent) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-28 pb-20">
          <div className="container mx-auto px-4 max-w-lg">
            <Card className="text-center">
              <CardContent className="pt-8 pb-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="font-display text-2xl font-bold mb-2">Pembayaran Diterima!</h2>
                <p className="text-muted-foreground mb-4">
                  Pendaftaran Anda sedang diproses. Anda akan segera mendapat akses ke dashboard agent.
                </p>
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // If already an agent
  if (status?.agent) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-28 pb-20">
          <div className="container mx-auto px-4 max-w-lg">
            <Card className="text-center">
              <CardContent className="pt-8 pb-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="font-display text-2xl font-bold mb-2">Anda Sudah Terdaftar!</h2>
                <p className="text-muted-foreground mb-6">
                  Anda sudah terdaftar sebagai agent. Silakan akses dashboard agent Anda.
                </p>
                <Button variant="gold" onClick={() => navigate("/agent")}>
                  Ke Dashboard Agent
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmitRegistration = () => {
    if (!businessName.trim()) {
      toast({ title: "Nama bisnis wajib diisi", variant: "destructive" });
      return;
    }
    registerMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">Daftar Sebagai Agent</h1>
            <p className="text-muted-foreground">
              Buat dan jual tiket event Anda sendiri di platform LUXETIX
            </p>
          </div>

          {/* Steps Indicator */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`w-12 h-1 mx-2 ${step > s ? "bg-primary" : "bg-secondary"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Info */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Keuntungan Menjadi Agent</CardTitle>
                <CardDescription>
                  Bergabung sebagai agent dan mulai menjual tiket event Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Buat Event Sendiri</h4>
                      <p className="text-sm text-muted-foreground">
                        Buat dan kelola event konser Anda sendiri dengan mudah
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Sistem Pembayaran Terintegrasi</h4>
                      <p className="text-sm text-muted-foreground">
                        Terima pembayaran otomatis melalui berbagai metode
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">E-Ticket & QR Code</h4>
                      <p className="text-sm text-muted-foreground">
                        Sistem e-ticket dengan validasi QR Code otomatis
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">Biaya Pendaftaran</span>
                    <span className="text-2xl font-bold text-gradient-gold">
                      {formatCurrency(settings?.registration_fee || 500000)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Komisi Platform</span>
                    <span>{settings?.platform_commission_percent || 10}% per transaksi</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Maksimal Event</span>
                    <span>{settings?.default_max_events || 5} event</span>
                  </div>
                </div>

                <Button variant="gold" className="w-full" onClick={() => setStep(2)}>
                  Lanjutkan Pendaftaran
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Form */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Informasi Bisnis</CardTitle>
                <CardDescription>
                  Lengkapi data bisnis Anda untuk mendaftar sebagai agent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Nama Bisnis / Event Organizer *</Label>
                    <Input
                      id="businessName"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Nama bisnis atau brand Anda"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessDescription">Deskripsi Bisnis</Label>
                    <Textarea
                      id="businessDescription"
                      value={businessDescription}
                      onChange={(e) => setBusinessDescription(e.target.value)}
                      placeholder="Ceritakan tentang bisnis atau event Anda..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-4">Informasi Rekening Bank (untuk pencairan)</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Nama Bank</Label>
                      <Input
                        id="bankName"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="BCA, Mandiri, BNI, dll"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankAccountName">Nama Pemilik Rekening</Label>
                        <Input
                          id="bankAccountName"
                          value={bankAccountName}
                          onChange={(e) => setBankAccountName(e.target.value)}
                          placeholder="Nama sesuai rekening"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankAccountNumber">Nomor Rekening</Label>
                        <Input
                          id="bankAccountNumber"
                          value={bankAccountNumber}
                          onChange={(e) => setBankAccountNumber(e.target.value)}
                          placeholder="Nomor rekening"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-4">Metode Pembayaran</h4>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`relative flex items-center p-4 rounded-lg border cursor-pointer ${
                        paymentMethod === "qris" ? "border-primary bg-primary/5" : "border-border"
                      }`}>
                        <RadioGroupItem value="qris" id="qris" className="mr-3" />
                        <Label htmlFor="qris" className="cursor-pointer flex items-center gap-2">
                          <QrCodeIcon className="w-5 h-5" />
                          QRIS
                        </Label>
                      </div>
                      <div className={`relative flex items-center p-4 rounded-lg border cursor-pointer ${
                        paymentMethod === "va_bca" ? "border-primary bg-primary/5" : "border-border"
                      }`}>
                        <RadioGroupItem value="va_bca" id="va_bca" className="mr-3" />
                        <Label htmlFor="va_bca" className="cursor-pointer flex items-center gap-2">
                          <Wallet className="w-5 h-5" />
                          VA BCA
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                    Kembali
                  </Button>
                  <Button 
                    variant="gold" 
                    className="flex-1"
                    onClick={handleSubmitRegistration}
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Bayar {formatCurrency(settings?.registration_fee || 500000)}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Payment */}
          {step === 3 && paymentData && (
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Lakukan Pembayaran</CardTitle>
                <CardDescription>
                  Selesaikan pembayaran untuk mengaktifkan akun agent Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Total Pembayaran</p>
                  <p className="text-3xl font-bold text-gradient-gold">
                    {formatCurrency(settings?.registration_fee || 500000)}
                  </p>
                </div>

                {paymentData.qr_string ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-white p-4 rounded-lg">
                      <QRCodeSVG value={paymentData.qr_string} size={200} />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      Scan QR Code di atas menggunakan aplikasi e-wallet atau mobile banking Anda
                    </p>
                  </div>
                ) : paymentData.account_number ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-secondary/50 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Nomor Virtual Account</p>
                      <p className="text-2xl font-mono font-bold">{paymentData.account_number}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Bank: {paymentData.bank_code}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      Transfer ke nomor VA di atas melalui ATM, mobile banking, atau internet banking
                    </p>
                  </div>
                ) : null}

                <div className="flex items-center justify-center gap-2 text-yellow-500">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm">Menunggu pembayaran...</span>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Halaman ini akan otomatis terupdate setelah pembayaran berhasil
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AgentRegister;
