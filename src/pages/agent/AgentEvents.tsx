import { Navigate, Link } from "react-router-dom";
import { Loader2, Plus, Calendar, Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AgentLayout from "@/components/agent/AgentLayout";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useState } from "react";

const AgentEvents = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: agent, isLoading: agentLoading } = useQuery({
    queryKey: ["agent-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("user_id", user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: concerts = [], isLoading: concertsLoading } = useQuery({
    queryKey: ["agent-concerts", agent?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("concerts")
        .select("*, ticket_types(*)")
        .eq("agent_id", agent?.id)
        .order("date", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!agent?.id,
  });

  if (authLoading || agentLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!agent || agent.registration_status !== "active") {
    return <Navigate to="/agent/register" replace />;
  }

  const filteredConcerts = concerts.filter((concert) => {
    const query = searchQuery.toLowerCase();
    return (
      concert.title.toLowerCase().includes(query) ||
      concert.artist.toLowerCase().includes(query)
    );
  });

  const canCreateEvent = concerts.length < agent.max_events;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: "Draft", className: "bg-gray-500/20 text-gray-500" },
      pending_approval: { label: "Menunggu Approval", className: "bg-yellow-500/20 text-yellow-500" },
      approved: { label: "Aktif", className: "bg-green-500/20 text-green-500" },
      rejected: { label: "Ditolak", className: "bg-red-500/20 text-red-500" },
      cancelled: { label: "Dibatalkan", className: "bg-gray-500/20 text-gray-500" },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <AgentLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Event Saya</h1>
            <p className="text-muted-foreground">
              Kelola semua event yang Anda buat
            </p>
          </div>
          {canCreateEvent ? (
            <Link to="/agent/events/new">
              <Button variant="gold" className="gap-2">
                <Plus className="w-4 h-4" />
                Buat Event Baru
              </Button>
            </Link>
          ) : (
            <Button variant="outline" disabled className="gap-2">
              <AlertCircle className="w-4 h-4" />
              Limit {agent.max_events} Event
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Events */}
        {concertsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredConcerts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">
                {searchQuery ? "Event Tidak Ditemukan" : "Belum Ada Event"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? "Coba kata kunci lain" 
                  : "Mulai buat event pertama Anda"}
              </p>
              {!searchQuery && (
                <Link to="/agent/events/new">
                  <Button variant="gold">Buat Event</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredConcerts.map((concert) => (
              <Card key={concert.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-48 h-32 md:h-auto">
                    <img
                      src={concert.image_url || "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400"}
                      alt={concert.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="flex-1 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                      <div>
                        <Link 
                          to={`/agent/events/${concert.id}`}
                          className="font-semibold hover:text-primary transition-colors"
                        >
                          {concert.title}
                        </Link>
                        <p className="text-sm text-primary">{concert.artist}</p>
                      </div>
                      {getStatusBadge(concert.event_status)}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                      <span>{format(new Date(concert.date), "d MMMM yyyy", { locale: localeId })}</span>
                      <span>{concert.venue}, {concert.city}</span>
                      <span>{concert.ticket_types?.length || 0} tipe tiket</span>
                    </div>
                    {concert.rejection_reason && (
                      <div className="p-2 rounded bg-red-500/10 text-red-500 text-sm mb-3">
                        <strong>Alasan ditolak:</strong> {concert.rejection_reason}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Link to={`/agent/events/${concert.id}`}>
                        <Button variant="outline" size="sm">Detail</Button>
                      </Link>
                      {(concert.event_status === "draft" || concert.event_status === "rejected") && (
                        <Link to={`/agent/events/${concert.id}/edit`}>
                          <Button variant="outline" size="sm">Edit</Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AgentLayout>
  );
};

export default AgentEvents;
