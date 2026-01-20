import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Concert, TicketType } from "@/types/database";
import { toast } from "sonner";

// Extended concert type with agent info
export interface ConcertWithAgent extends Concert {
  agent_name?: string | null;
}

// Admin: Get all concerts (including inactive) with agent info
export const useAdminConcerts = () => {
  return useQuery({
    queryKey: ["admin", "concerts"],
    queryFn: async (): Promise<ConcertWithAgent[]> => {
      // Get all concerts
      const { data: concerts, error } = await supabase
        .from("concerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get agent IDs that have concerts
      const agentIds = [...new Set(concerts?.filter(c => c.agent_id).map(c => c.agent_id) || [])];
      
      // Fetch agent names if there are any
      let agentMap: Record<string, string> = {};
      if (agentIds.length > 0) {
        const { data: agents } = await supabase
          .from("agents")
          .select("id, business_name")
          .in("id", agentIds);
        
        if (agents) {
          agentMap = agents.reduce((acc, agent) => {
            acc[agent.id] = agent.business_name;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Merge agent names with concerts
      return (concerts || []).map(concert => ({
        ...concert,
        agent_name: concert.agent_id ? agentMap[concert.agent_id] || null : null
      }));
    },
  });
};

// Admin: Create concert
export const useCreateConcert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (concert: Partial<Omit<Concert, "id" | "created_at" | "updated_at">>) => {
      const { data, error } = await supabase
        .from("concerts")
        .insert(concert as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "concerts"] });
      queryClient.invalidateQueries({ queryKey: ["concerts"] });
      toast.success("Konser berhasil ditambahkan!");
    },
    onError: (error: Error) => {
      toast.error("Gagal menambahkan konser", { description: error.message });
    },
  });
};

// Admin: Update concert
export const useUpdateConcert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...concert }: Partial<Concert> & { id: string }) => {
      const { data, error } = await supabase
        .from("concerts")
        .update(concert as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "concerts"] });
      queryClient.invalidateQueries({ queryKey: ["concerts"] });
      toast.success("Konser berhasil diperbarui!");
    },
    onError: (error: Error) => {
      toast.error("Gagal memperbarui konser", { description: error.message });
    },
  });
};

// Admin: Delete concert
export const useDeleteConcert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("concerts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "concerts"] });
      queryClient.invalidateQueries({ queryKey: ["concerts"] });
      toast.success("Konser berhasil dihapus!");
    },
    onError: (error: Error) => {
      toast.error("Gagal menghapus konser", { description: error.message });
    },
  });
};

// Admin: Get ticket types for a concert
export const useAdminTicketTypes = (concertId: string) => {
  return useQuery({
    queryKey: ["admin", "ticket-types", concertId],
    queryFn: async (): Promise<TicketType[]> => {
      const { data, error } = await supabase
        .from("ticket_types")
        .select("*")
        .eq("concert_id", concertId)
        .order("price", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!concertId,
  });
};

// Admin: Create ticket type
export const useCreateTicketType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticket: Omit<TicketType, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("ticket_types")
        .insert(ticket)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "ticket-types", variables.concert_id] });
      toast.success("Tiket berhasil ditambahkan!");
    },
    onError: (error: Error) => {
      toast.error("Gagal menambahkan tiket", { description: error.message });
    },
  });
};

// Admin: Update ticket type
export const useUpdateTicketType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...ticket }: Partial<TicketType> & { id: string }) => {
      const { data, error } = await supabase
        .from("ticket_types")
        .update(ticket)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "ticket-types", data.concert_id] });
      toast.success("Tiket berhasil diperbarui!");
    },
    onError: (error: Error) => {
      toast.error("Gagal memperbarui tiket", { description: error.message });
    },
  });
};

// Admin: Delete ticket type
export const useDeleteTicketType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, concertId }: { id: string; concertId: string }) => {
      const { error } = await supabase
        .from("ticket_types")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { concertId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "ticket-types", data.concertId] });
      toast.success("Tiket berhasil dihapus!");
    },
    onError: (error: Error) => {
      toast.error("Gagal menghapus tiket", { description: error.message });
    },
  });
};

// Admin: Get all orders
export const useAdminOrders = () => {
  return useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

// Admin: Get dashboard stats with ticket breakdown
export const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [concertsRes, ordersRes, ticketsRes, orderItemsRes] = await Promise.all([
        supabase.from("concerts").select("id", { count: "exact" }),
        supabase.from("orders").select("id, total_amount, status"),
        supabase.from("ticket_types").select("available_quantity, total_quantity"),
        supabase.from("order_items").select("quantity, ticket_types!inner(id), orders!inner(status)"),
      ]);

      const totalConcerts = concertsRes.count || 0;
      const orders = ordersRes.data || [];
      const tickets = ticketsRes.data || [];
      const orderItems = orderItemsRes.data || [];

      const totalRevenue = orders
        .filter((o) => o.status === "paid")
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      const totalOrders = orders.length;
      
      // Calculate tickets by status
      const ticketsSold = orderItems
        .filter((item: { orders: { status: string } }) => item.orders?.status === "paid")
        .reduce((sum: number, item: { quantity: number }) => sum + (item.quantity || 0), 0);

      const ticketsPending = orderItems
        .filter((item: { orders: { status: string } }) => item.orders?.status === "pending")
        .reduce((sum: number, item: { quantity: number }) => sum + (item.quantity || 0), 0);

      const totalTicketCapacity = tickets.reduce(
        (sum, t) => sum + (t.total_quantity || 0),
        0
      );

      const ticketsAvailable = tickets.reduce(
        (sum, t) => sum + (t.available_quantity || 0),
        0
      );

      // Order counts by status
      const paidOrders = orders.filter((o) => o.status === "paid").length;
      const pendingOrders = orders.filter((o) => o.status === "pending").length;
      const expiredOrders = orders.filter((o) => o.status === "expired" || o.status === "cancelled").length;

      return {
        totalConcerts,
        totalOrders,
        totalRevenue,
        ticketsSold,
        ticketsPending,
        ticketsAvailable,
        totalTicketCapacity,
        paidOrders,
        pendingOrders,
        expiredOrders,
      };
    },
  });
};
