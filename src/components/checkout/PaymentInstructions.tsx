import { Copy, Check, QrCode } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import type { PaymentMethod } from "@/hooks/useXenditPayment";

interface PaymentInstructionsProps {
  paymentMethod: PaymentMethod;
  paymentData: any;
  orderId: string;
}

const PaymentInstructions = ({ paymentMethod, paymentData, orderId }: PaymentInstructionsProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Disalin ke clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (paymentMethod === "VA") {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <QrCode className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display text-xl font-bold">Transfer Virtual Account</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Transfer sesuai nominal ke nomor VA berikut
          </p>
        </div>

        <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Bank</span>
            <span className="font-semibold">{paymentData.bank_code}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Nomor VA</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold">{paymentData.account_number}</span>
              <button
                onClick={() => copyToClipboard(paymentData.account_number)}
                className="p-1 hover:bg-background rounded"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Jumlah Transfer</span>
            <span className="font-bold text-primary">{formatCurrency(paymentData.expected_amount)}</span>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            ⚠️ Transfer harus sesuai dengan jumlah di atas. Pembayaran akan diverifikasi otomatis dalam 1-5 menit.
          </p>
        </div>
      </div>
    );
  }

  if (paymentMethod === "EWALLET") {
    const deeplink = paymentData.actions?.mobile_deeplink_checkout_url;
    const webUrl = paymentData.actions?.desktop_web_checkout_url || paymentData.actions?.mobile_web_checkout_url;

    return (
      <div className="space-y-4 animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-3xl">💳</span>
          </div>
          <h3 className="font-display text-xl font-bold">Pembayaran E-Wallet</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Selesaikan pembayaran di aplikasi e-wallet Anda
          </p>
        </div>

        <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">E-Wallet</span>
            <span className="font-semibold">{paymentData.channel_code?.replace("ID_", "")}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Jumlah</span>
            <span className="font-bold text-primary">{formatCurrency(paymentData.charge_amount || paymentData.amount)}</span>
          </div>
        </div>

        {(deeplink || webUrl) && (
          <Button
            variant="premium"
            size="xl"
            className="w-full"
            onClick={() => window.open(deeplink || webUrl, "_blank")}
          >
            Buka Aplikasi E-Wallet
          </Button>
        )}
      </div>
    );
  }

  if (paymentMethod === "QRIS") {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="text-center">
          <h3 className="font-display text-xl font-bold">Scan QRIS</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Scan dengan aplikasi e-wallet atau mobile banking
          </p>
        </div>

        <div className="flex justify-center p-4 bg-white rounded-xl">
          <QRCodeSVG
            value={paymentData.qr_string}
            size={200}
            level="H"
            includeMargin
          />
        </div>

        <div className="bg-secondary/50 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Jumlah</span>
            <span className="font-bold text-primary">{formatCurrency(paymentData.amount)}</span>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            ℹ️ QR Code berlaku selama 24 jam. Pembayaran akan diverifikasi otomatis.
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentInstructions;
