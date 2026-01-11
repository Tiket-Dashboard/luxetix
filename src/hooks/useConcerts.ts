import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Concert, TicketType, ConcertWithTickets } from "@/types/database";

export const useConcerts = () => {
  return useQuery({
    queryKey: ["concerts"],
    queryFn: async (): Promise<Concert[]> => {
      const { data, error } = await supabase
        .from("concerts")
        .select("*")
        .eq("is_active", true)
        .order("date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useFeaturedConcerts = () => {
  return useQuery({
    queryKey: ["concerts", "featured"],
    queryFn: async (): Promise<Concert[]> => {
      const { data, error } = await supabase
        .from("concerts")
        .select("*")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useConcertById = (id: string) => {
  return useQuery({
    queryKey: ["concert", id],
    queryFn: async (): Promise<ConcertWithTickets | null> => {
      const { data: concert, error: concertError } = await supabase
        .from("concerts")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .maybeSingle();

      if (concertError) throw concertError;
      if (!concert) return null;

      const { data: ticketTypes, error: ticketError } = await supabase
        .from("ticket_types")
        .select("*")
        .eq("concert_id", id)
        .order("price", { ascending: false });

      if (ticketError) throw ticketError;

      return {
        ...concert,
        ticket_types: ticketTypes || [],
      };
    },
    enabled: !!id,
  });
};

export const useConcertsByCategory = (category: string) => {
  return useQuery({
    queryKey: ["concerts", "category", category],
    queryFn: async (): Promise<Concert[]> => {
      let query = supabase
        .from("concerts")
        .select("*")
        .eq("is_active", true)
        .order("date", { ascending: true });

      if (category !== "Semua") {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("concerts")
        .select("category")
        .eq("is_active", true);

      if (error) throw error;
      
      const categories = new Set(data?.map((c) => c.category) || []);
      return ["Semua", ...Array.from(categories)];
    },
  });
};

export const useLowestTicketPrice = (concertId: string) => {
  return useQuery({
    queryKey: ["ticket-price", concertId],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from("ticket_types")
        .select("price")
        .eq("concert_id", concertId)
        .order("price", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data?.price || 0;
    },
    enabled: !!concertId,
  });
};
