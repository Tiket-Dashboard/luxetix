import { CreditCard, Wallet, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaymentMethod, BankCode, EwalletType } from "@/hooks/useXenditPayment";
import { BANK_OPTIONS, EWALLET_OPTIONS } from "@/hooks/useXenditPayment";

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onMethodChange: (method: PaymentMethod) => void;
  selectedBank: BankCode;
  onBankChange: (bank: BankCode) => void;
  selectedEwallet: EwalletType;
  onEwalletChange: (ewallet: EwalletType) => void;
}

const PaymentMethodSelector = ({
  selectedMethod,
  onMethodChange,
  selectedBank,
  onBankChange,
  selectedEwallet,
  onEwalletChange,
}: PaymentMethodSelectorProps) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Pilih Metode Pembayaran</h3>

      {/* Payment Method Cards */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => onMethodChange("VA")}
          className={cn(
            "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
            selectedMethod === "VA"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          )}
        >
          <CreditCard className="w-6 h-6" />
          <span className="text-sm font-medium">Virtual Account</span>
        </button>

        <button
          type="button"
          onClick={() => onMethodChange("EWALLET")}
          className={cn(
            "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
            selectedMethod === "EWALLET"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          )}
        >
          <Wallet className="w-6 h-6" />
          <span className="text-sm font-medium">E-Wallet</span>
        </button>

        <button
          type="button"
          onClick={() => onMethodChange("QRIS")}
          className={cn(
            "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
            selectedMethod === "QRIS"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          )}
        >
          <QrCode className="w-6 h-6" />
          <span className="text-sm font-medium">QRIS</span>
        </button>
      </div>

      {/* Bank Selection for VA */}
      {selectedMethod === "VA" && (
        <div className="animate-fade-in space-y-2">
          <p className="text-sm text-muted-foreground">Pilih Bank</p>
          <div className="grid grid-cols-3 gap-2">
            {BANK_OPTIONS.map((bank) => (
              <button
                key={bank.value}
                type="button"
                onClick={() => onBankChange(bank.value)}
                className={cn(
                  "p-3 rounded-lg border transition-all text-sm font-medium",
                  selectedBank === bank.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                {bank.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* E-Wallet Selection */}
      {selectedMethod === "EWALLET" && (
        <div className="animate-fade-in space-y-2">
          <p className="text-sm text-muted-foreground">Pilih E-Wallet</p>
          <div className="grid grid-cols-2 gap-2">
            {EWALLET_OPTIONS.map((ewallet) => (
              <button
                key={ewallet.value}
                type="button"
                onClick={() => onEwalletChange(ewallet.value)}
                className={cn(
                  "p-3 rounded-lg border transition-all flex items-center gap-2",
                  selectedEwallet === ewallet.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <span className="text-xl">{ewallet.icon}</span>
                <span className="font-medium">{ewallet.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* QRIS Info */}
      {selectedMethod === "QRIS" && (
        <div className="animate-fade-in p-4 bg-secondary/50 rounded-xl">
          <p className="text-sm text-muted-foreground">
            Scan QR code dengan aplikasi e-wallet atau mobile banking yang mendukung QRIS
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
