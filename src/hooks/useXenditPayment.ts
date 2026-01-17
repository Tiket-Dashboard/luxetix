import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PaymentMethod = "VA" | "EWALLET" | "QRIS";
export type BankCode = "BCA" | "BNI" | "BRI" | "MANDIRI" | "PERMATA" | "CIMB";
export type EwalletType = "OVO" | "DANA" | "SHOPEEPAY" | "LINKAJA";

interface PaymentRequest {
  order_id: string;
  amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_method: PaymentMethod;
  bank_code?: BankCode;
  ewallet_type?: EwalletType;
}

interface PaymentResponse {
  success: boolean;
  payment_id: string;
  payment_url: string | null;
  payment_method: PaymentMethod;
  payment_data: any;
}

export const useXenditPayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPayment = async (request: PaymentRequest): Promise<PaymentResponse | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("xendit-payment", {
        body: request,
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data as PaymentResponse;
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Gagal memproses pembayaran");
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    createPayment,
    isProcessing,
    error,
  };
};

export const BANK_OPTIONS: { value: BankCode; label: string }[] = [
  { value: "BCA", label: "BCA" },
  { value: "BNI", label: "BNI" },
  { value: "BRI", label: "BRI" },
  { value: "MANDIRI", label: "Mandiri" },
  { value: "PERMATA", label: "Permata" },
  { value: "CIMB", label: "CIMB Niaga" },
];

export const EWALLET_OPTIONS: { value: EwalletType; label: string; icon: string }[] = [
  { value: "OVO", label: "OVO", icon: "💜" },
  { value: "DANA", label: "DANA", icon: "💙" },
  { value: "SHOPEEPAY", label: "ShopeePay", icon: "🧡" },
  { value: "LINKAJA", label: "LinkAja", icon: "❤️" },
];
