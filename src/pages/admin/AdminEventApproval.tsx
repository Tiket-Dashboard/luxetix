import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Eye,
  Calendar,
  MapPin,
  User,
  Clock,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface AgentEvent {
  id: string;
  title: string;
  artist: string;
  venue: string;
  city: string;
  date: string;
  time: string;
  description: string | null;
  image_url: string | null;
  event_status: string;
  rejection_reason: string | null;
  created_at: string;
  agent_id: string;
  agent?: {
    business_name: string;
    user_id: string;
    profiles?: {
      full_name: string | null;
    };
  };
}

const AdminEventApproval = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<AgentEvent | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending_approval");

  // Fetch pending events from agents
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["admin", "agent-events", statusFilter],
    queryFn: async (): Promise<AgentEvent[]> => {
      let query = supabase
        .from("concerts")
        .select(`
          *,
          agents!inner(
            business_name,
            user_id
          )
        `)
        .not("agent_id", "is", null)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("event_status", statusFilter as "approved" | "cancelled" | "draft" | "pending_approval" | "rejected");
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch profiles separately
      if (data && data.length > 0) {
        const userIds = data.map((e) => e.agents?.user_id).filter(Boolean) as string[];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        return data.map((event) => ({
          ...event,
          agent: event.agents ? {
            ...event.agents,
            profiles: profiles?.find((p) => p.user_id === event.agents?.user_id)
          } : undefined
        })) as AgentEvent[];
      }

      return (data || []) as AgentEvent[];
    },
  });

  // Approve event mutation
  const approveMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("concerts")
        .update({ 
          event_status: "approved",
          is_active: true,
          rejection_reason: null
        })
        .eq("id", eventId);

      if (error) throw error;

      // Increment agent's successful_events_count and check auto-approve
      const event = events.find(e => e.id === eventId);
      if (event?.agent_id) {
        const { data: agent } = await supabase
          .from("agents")
          .select("successful_events_count")
          .eq("id", event.agent_id)
          .single();

        if (agent) {
          const newCount = (agent.successful_events_count || 0) + 1;
          
          // Check if should enable auto-approve
          const { data: settings } = await supabase
            .from("agent_settings")
            .select("max_events_before_auto_approve")
            .single();

          const shouldAutoApprove = settings && newCount >= settings.max_events_before_auto_approve;

          await supabase
            .from("agents")
            .update({ 
              successful_events_count: newCount,
              is_auto_approve: shouldAutoApprove || undefined
            })
            .eq("id", event.agent_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "agent-events"] });
      toast.success("Event berhasil disetujui!");
      setViewDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error("Gagal menyetujui event", { description: error.message });
    },
  });

  // Reject event mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ eventId, reason }: { eventId: string; reason: string }) => {
      const { error } = await supabase
        .from("concerts")
        .update({ 
          event_status: "rejected",
          is_active: false,
          rejection_reason: reason
        })
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "agent-events"] });
      toast.success("Event ditolak!");
      setRejectDialogOpen(false);
      setViewDialogOpen(false);
      setRejectionReason("");
    },
    onError: (error: Error) => {
      toast.error("Gagal menolak event", { description: error.message });
    },
  });

  const filteredEvents = events.filter((event) => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.agent?.business_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_approval":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">Menunggu</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">Disetujui</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">Ditolak</Badge>;
      case "draft":
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/30">Draft</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/30">Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const pendingCount = events.filter(e => e.event_status === "pending_approval").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Menunggu Review</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Disetujui</p>
                  <p className="text-2xl font-bold">
                    {events.filter(e => e.event_status === "approved").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ditolak</p>
                  <p className="text-2xl font-bold">
                    {events.filter(e => e.event_status === "rejected").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Event Agent</p>
                  <p className="text-2xl font-bold">{events.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Event Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari event atau agent..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {["all", "pending_approval", "approved", "rejected"].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className="capitalize"
                  >
                    {status === "all" ? "Semua" : 
                     status === "pending_approval" ? "Menunggu" :
                     status === "approved" ? "Disetujui" : "Ditolak"}
                  </Button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada event yang ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {event.image_url && (
                              <img 
                                src={event.image_url} 
                                alt={event.title}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium">{event.title}</p>
                              <p className="text-sm text-muted-foreground">{event.artist}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{event.agent?.business_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {event.agent?.profiles?.full_name || "-"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(event.date), "dd MMM yyyy", { locale: localeId })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            {event.city}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(event.event_status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedEvent(event);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {event.event_status === "pending_approval" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-500 hover:text-green-600"
                                  onClick={() => approveMutation.mutate(event.id)}
                                  disabled={approveMutation.isPending}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-600"
                                  onClick={() => {
                                    setSelectedEvent(event);
                                    setRejectDialogOpen(true);
                                  }}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Event Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detail Event</DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4">
                {selectedEvent.image_url && (
                  <img 
                    src={selectedEvent.image_url} 
                    alt={selectedEvent.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Judul Event</p>
                    <p className="font-medium">{selectedEvent.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Artis</p>
                    <p className="font-medium">{selectedEvent.artist}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal</p>
                    <p className="font-medium">
                      {format(new Date(selectedEvent.date), "dd MMMM yyyy", { locale: localeId })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Waktu</p>
                    <p className="font-medium">{selectedEvent.time}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Venue</p>
                    <p className="font-medium">{selectedEvent.venue}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kota</p>
                    <p className="font-medium">{selectedEvent.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Agent</p>
                    <p className="font-medium">{selectedEvent.agent?.business_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(selectedEvent.event_status)}
                  </div>
                </div>
                {selectedEvent.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Deskripsi</p>
                    <p className="text-sm">{selectedEvent.description}</p>
                  </div>
                )}
                {selectedEvent.rejection_reason && (
                  <div className="p-3 bg-red-500/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Alasan Penolakan</p>
                    <p className="text-sm text-red-500">{selectedEvent.rejection_reason}</p>
                  </div>
                )}
                
                {selectedEvent.event_status === "pending_approval" && (
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRejectDialogOpen(true);
                      }}
                    >
                      Tolak
                    </Button>
                    <Button
                      variant="gold"
                      onClick={() => approveMutation.mutate(selectedEvent.id)}
                      disabled={approveMutation.isPending}
                    >
                      Setujui Event
                    </Button>
                  </DialogFooter>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tolak Event</DialogTitle>
              <DialogDescription>
                Berikan alasan penolakan untuk event ini
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Masukkan alasan penolakan..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedEvent && rejectionReason.trim()) {
                    rejectMutation.mutate({ 
                      eventId: selectedEvent.id, 
                      reason: rejectionReason 
                    });
                  }
                }}
                disabled={!rejectionReason.trim() || rejectMutation.isPending}
              >
                Tolak Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminEventApproval;
