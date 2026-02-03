import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useCancelOrder = () => {
  const [isCancelling, setIsCancelling] = useState(false);

  const cancelOrder = async (orderId: string): Promise<boolean> => {
    setIsCancelling(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Silakan login terlebih dahulu");
        return false;
      }

      const response = await supabase.functions.invoke("cancel-order", {
        body: { order_id: orderId },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to cancel order");
      }

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to cancel order");
      }

      toast.success("Pesanan berhasil dibatalkan");
      return true;
    } catch (error: any) {
      console.error("Cancel order error:", error);
      toast.error("Gagal membatalkan pesanan", {
        description: error.message || "Silakan coba lagi",
      });
      return false;
    } finally {
      setIsCancelling(false);
    }
  };

  return { cancelOrder, isCancelling };
};
