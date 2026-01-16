import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface OrderWithItems {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    ticket_code?: string | null;
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
    } | null;
  }[];
}

export const useUserOrders = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-orders", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          total_amount,
          status,
          created_at,
          order_items (
            id,
            quantity,
            unit_price,
            subtotal,
            ticket_code,
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
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as OrderWithItems[];
    },
    enabled: !!user?.id,
  });
};

export const useUserOrdersWithTicketCodes = () => {
  return useUserOrders();
};

export const useUserProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};
