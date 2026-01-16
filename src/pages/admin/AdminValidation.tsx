import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Ticket,
  Calendar,
  MapPin,
  User,
  Clock,
  Loader2,
  QrCode,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import QRScanner from "@/components/admin/QRScanner";
import {
  useValidateTicket,
  useMarkTicketUsed,
  useRecentValidations,
} from "@/hooks/useTicketValidation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const AdminValidation = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [validationStatus, setValidationStatus] = useState<
    "idle" | "checking" | "valid" | "invalid" | "used" | "unpaid"
  >("idle");

  const validateTicket = useValidateTicket();
  const markUsed = useMarkTicketUsed();
  const { data: recentValidations = [] } = useRecentValidations();

  const handleScan = async (data: string) => {
    try {
      // Parse QR data
      let ticketCode: string;
      try {
        const parsed = JSON.parse(data);
        ticketCode = parsed.ticketCode;
      } catch {
        ticketCode = data;
      }

      if (!ticketCode) {
        setValidationStatus("invalid");
        setScanResult({ error: "Format QR Code tidak valid" });
        return;
      }

      setValidationStatus("checking");
      setScanResult(null);

      const result = await validateTicket.mutateAsync(ticketCode);
      setScanResult(result);

      if (result.is_used) {
        setValidationStatus("used");
      } else if (result.order.status !== "paid") {
        setValidationStatus("unpaid");
      } else {
        setValidationStatus("valid");
      }
    } catch (error: any) {
      setValidationStatus("invalid");
      setScanResult({ error: error.message });
    }
  };

  const handleManualCheck = () => {
    if (manualCode.trim()) {
      handleScan(manualCode.trim());
    }
  };

  const handleConfirmEntry = async () => {
    if (scanResult?.id) {
      await markUsed.mutateAsync(scanResult.id);
      setValidationStatus("idle");
      setScanResult(null);
    }
  };

  const resetScan = () => {
    setValidationStatus("idle");
    setScanResult(null);
    setManualCode("");
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "d MMMM yyyy", { locale: localeId });
  };

  const formatTime = (timeStr: string) => {
    return timeStr?.slice(0, 5) + " WIB";
  };

  const formatDateTime = (dateStr: string) => {
    return format(new Date(dateStr), "d MMM yyyy, HH:mm", { locale: localeId });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold flex items-center gap-3">
            <QrCode className="w-7 h-7 text-primary" />
            Validasi Tiket
          </h2>
          <p className="text-muted-foreground">
            Scan QR Code tiket untuk validasi masuk venue
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Scanner Section */}
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <h3 className="font-display text-lg font-bold">Scan QR Code</h3>

            <QRScanner
              onScan={handleScan}
              isScanning={isScanning}
              onScanningChange={setIsScanning}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  atau masukkan kode manual
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Masukkan kode tiket..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualCheck()}
              />
              <Button
                onClick={handleManualCheck}
                disabled={!manualCode.trim() || validateTicket.isPending}
              >
                {validateTicket.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Cek"
                )}
              </Button>
            </div>
          </div>

          {/* Result Section */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="font-display text-lg font-bold">Hasil Validasi</h3>

            {validationStatus === "idle" && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Ticket className="w-16 h-16 mb-4" />
                <p>Scan QR Code untuk memvalidasi tiket</p>
              </div>
            )}

            {validationStatus === "checking" && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Memeriksa tiket...</p>
              </div>
            )}

            {validationStatus === "invalid" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center py-8 text-destructive">
                  <XCircle className="w-16 h-16 mb-4" />
                  <h4 className="font-display text-xl font-bold">
                    Tiket Tidak Valid
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {scanResult?.error || "Tiket tidak ditemukan dalam sistem"}
                  </p>
                </div>
                <Button onClick={resetScan} variant="outline" className="w-full">
                  Scan Ulang
                </Button>
              </div>
            )}

            {validationStatus === "used" && scanResult && (
              <div className="space-y-4">
                <div className="flex flex-col items-center py-6 text-yellow-500">
                  <AlertTriangle className="w-16 h-16 mb-4" />
                  <h4 className="font-display text-xl font-bold">
                    Tiket Sudah Digunakan
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Divalidasi pada {formatDateTime(scanResult.used_at)}
                  </p>
                </div>

                <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Konser</span>
                    <span className="font-medium">
                      {scanResult.ticket_type.concert.title}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nama</span>
                    <span>{scanResult.order.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tiket</span>
                    <span>
                      {scanResult.quantity}x {scanResult.ticket_type.name}
                    </span>
                  </div>
                </div>

                <Button onClick={resetScan} variant="outline" className="w-full">
                  Scan Tiket Lain
                </Button>
              </div>
            )}

            {validationStatus === "unpaid" && scanResult && (
              <div className="space-y-4">
                <div className="flex flex-col items-center py-6 text-destructive">
                  <XCircle className="w-16 h-16 mb-4" />
                  <h4 className="font-display text-xl font-bold">
                    Pembayaran Belum Selesai
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Status: {scanResult.order.status}
                  </p>
                </div>

                <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order</span>
                    <span className="font-mono text-sm">
                      {scanResult.order.order_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nama</span>
                    <span>{scanResult.order.customer_name}</span>
                  </div>
                </div>

                <Button onClick={resetScan} variant="outline" className="w-full">
                  Scan Tiket Lain
                </Button>
              </div>
            )}

            {validationStatus === "valid" && scanResult && (
              <div className="space-y-4">
                <div className="flex flex-col items-center py-6 text-green-500">
                  <CheckCircle className="w-16 h-16 mb-4" />
                  <h4 className="font-display text-xl font-bold">Tiket Valid</h4>
                  <Badge className="mt-2 bg-green-500/20 text-green-500 border-green-500/30">
                    Siap untuk masuk
                  </Badge>
                </div>

                <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">
                        {scanResult.order.customer_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {scanResult.order.customer_email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Ticket className="w-4 h-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">
                        {scanResult.ticket_type.concert.title}
                      </p>
                      <p className="text-sm text-primary">
                        {scanResult.ticket_type.concert.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formatDate(scanResult.ticket_type.concert.date)} -{" "}
                      {formatTime(scanResult.ticket_type.concert.time)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {scanResult.ticket_type.concert.venue},{" "}
                      {scanResult.ticket_type.concert.city}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Tipe Tiket</span>
                      <span className="font-semibold">
                        {scanResult.quantity}x {scanResult.ticket_type.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={resetScan}
                    variant="outline"
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleConfirmEntry}
                    variant="gold"
                    className="flex-1 gap-2"
                    disabled={markUsed.isPending}
                  >
                    {markUsed.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Konfirmasi Masuk
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Validations */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Validasi Terakhir
          </h3>

          {recentValidations.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Belum ada tiket yang divalidasi
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                      Waktu
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                      Order
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                      Nama
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                      Konser
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                      Tiket
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentValidations.map((item: any) => (
                    <tr key={item.id} className="hover:bg-secondary/30">
                      <td className="px-4 py-3 text-sm">
                        {item.used_at && formatDateTime(item.used_at)}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {item.orders?.order_number}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {item.orders?.customer_name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {item.ticket_types?.concerts?.title}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {item.quantity}x {item.ticket_types?.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminValidation;
