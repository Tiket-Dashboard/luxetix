import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

interface TicketInfo {
  id: string;
  ticket_code: string;
  quantity: number;
  is_used: boolean;
  used_at: string | null;
  order: {
    id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    status: string;
  };
  ticket_type: {
    name: string;
    concert: {
      id: string;
      title: string;
      artist: string;
      date: string;
      time: string;
      venue: string;
      city: string;
    };
  };
}

export const useValidateTicket = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketCode: string): Promise<TicketInfo> => {
      // First, find the ticket by code
      const { data: orderItem, error: findError } = await supabase
        .from("order_items")
        .select(`
          id,
          ticket_code,
          quantity,
          is_used,
          used_at,
          orders!inner (
            id,
            order_number,
            customer_name,
            customer_email,
            status
          ),
          ticket_types!inner (
            name,
            concerts!inner (
              id,
              title,
              artist,
              date,
              time,
              venue,
              city
            )
          )
        `)
        .eq("ticket_code", ticketCode)
        .maybeSingle();

      if (findError) throw findError;
      if (!orderItem) {
        throw new Error("Tiket tidak ditemukan");
      }

      // Transform the data
      const ticketInfo: TicketInfo = {
        id: orderItem.id,
        ticket_code: orderItem.ticket_code || "",
        quantity: orderItem.quantity,
        is_used: orderItem.is_used || false,
        used_at: orderItem.used_at,
        order: {
          id: (orderItem.orders as any).id,
          order_number: (orderItem.orders as any).order_number,
          customer_name: (orderItem.orders as any).customer_name,
          customer_email: (orderItem.orders as any).customer_email,
          status: (orderItem.orders as any).status,
        },
        ticket_type: {
          name: (orderItem.ticket_types as any).name,
          concert: {
            id: (orderItem.ticket_types as any).concerts.id,
            title: (orderItem.ticket_types as any).concerts.title,
            artist: (orderItem.ticket_types as any).concerts.artist,
            date: (orderItem.ticket_types as any).concerts.date,
            time: (orderItem.ticket_types as any).concerts.time,
            venue: (orderItem.ticket_types as any).concerts.venue,
            city: (orderItem.ticket_types as any).concerts.city,
          },
        },
      };

      return ticketInfo;
    },
  });
};

export const useMarkTicketUsed = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase
        .from("order_items")
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
          validated_by: user?.id,
        })
        .eq("id", ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tiket berhasil divalidasi!");
      queryClient.invalidateQueries({ queryKey: ["validated-tickets"] });
    },
    onError: (error: Error) => {
      toast.error("Gagal memvalidasi tiket", { description: error.message });
    },
  });
};

export const useRecentValidations = () => {
  return useQuery({
    queryKey: ["validated-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          id,
          ticket_code,
          quantity,
          is_used,
          used_at,
          orders!inner (
            order_number,
            customer_name
          ),
          ticket_types!inner (
            name,
            concerts!inner (
              title
            )
          )
        `)
        .eq("is_used", true)
        .order("used_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });
};
