import { Navigate, Link } from "react-router-dom";
import { 
  Loader2, 
  Calendar, 
  DollarSign, 
  Ticket, 
  Plus,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AgentLayout from "@/components/agent/AgentLayout";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const AgentDashboard = () => {
  const { user, isLoading: authLoading } = useAuth();

  // Get agent data
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

  // Get agent's concerts
  const { data: concerts = [], isLoading: concertsLoading } = useQuery({
    queryKey: ["agent-concerts", agent?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("concerts")
        .select("*, ticket_types(*)")
        .eq("agent_id", agent?.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!agent?.id,
  });

  // Get agent settings
  const { data: settings } = useQuery({
    queryKey: ["agent-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_settings")
        .select("*")
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    },
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getEventStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
      draft: { label: "Draft", className: "bg-gray-500/20 text-gray-500", icon: Clock },
      pending_approval: { label: "Menunggu Approval", className: "bg-yellow-500/20 text-yellow-500", icon: Clock },
      approved: { label: "Aktif", className: "bg-green-500/20 text-green-500", icon: CheckCircle },
      rejected: { label: "Ditolak", className: "bg-red-500/20 text-red-500", icon: AlertCircle },
      cancelled: { label: "Dibatalkan", className: "bg-gray-500/20 text-gray-500", icon: AlertCircle },
    };
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const approvedEvents = concerts.filter((c) => c.event_status === "approved").length;
  const pendingEvents = concerts.filter((c) => c.event_status === "pending_approval").length;
  const canCreateEvent = concerts.length < agent.max_events;

  return (
    <AgentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Dashboard Agent</h1>
            <p className="text-muted-foreground">
              Selamat datang, {agent.business_name}
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
              Limit Event Tercapai ({agent.max_events})
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Total Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{concerts.length}</span>
                <span className="text-sm text-muted-foreground">/ {agent.max_events}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Event Aktif
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-green-500">{approvedEvents}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Pendapatan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-gradient-gold">
                {formatCurrency(agent.total_earnings)}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                Event Sukses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{agent.successful_events_count}</span>
            </CardContent>
          </Card>
        </div>

        {/* Auto-approve info */}
        {!agent.is_auto_approve && settings && (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-500">Event Perlu Approval Admin</p>
                  <p className="text-sm text-muted-foreground">
                    Setelah {settings.max_events_before_auto_approve} event sukses, event Anda akan otomatis di-approve. 
                    Progress: {agent.successful_events_count}/{settings.max_events_before_auto_approve}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Events List */}
        <div>
          <h2 className="font-display text-xl font-bold mb-4">Event Anda</h2>
          
          {concertsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : concerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Belum Ada Event</h3>
                <p className="text-muted-foreground mb-4">
                  Mulai buat event pertama Anda dan jual tiket ke jutaan pengguna
                </p>
                <Link to="/agent/events/new">
                  <Button variant="gold">Buat Event Pertama</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {concerts.map((concert) => (
                <Card key={concert.id} className="overflow-hidden">
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
                          <h3 className="font-semibold">{concert.title}</h3>
                          <p className="text-sm text-primary">{concert.artist}</p>
                        </div>
                        {getEventStatusBadge(concert.event_status)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                        <span>{format(new Date(concert.date), "d MMMM yyyy", { locale: localeId })}</span>
                        <span>{concert.venue}, {concert.city}</span>
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
                        {concert.event_status === "draft" && (
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
      </div>
    </AgentLayout>
  );
};

export default AgentDashboard;
