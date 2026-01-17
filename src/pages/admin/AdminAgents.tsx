import { useState } from "react";
import { Loader2, Search, Settings, Users, CheckCircle, XCircle, Clock, Building2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Agent {
  id: string;
  user_id: string;
  business_name: string;
  business_description: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
  max_events: number;
  successful_events_count: number;
  is_auto_approve: boolean;
  registration_status: string;
  total_earnings: number;
  total_commission_paid: number;
  created_at: string;
  profiles?: {
    full_name: string | null;
    phone: string | null;
    user_id: string;
  };
}

interface AgentSettings {
  id: string;
  registration_fee: number;
  platform_commission_percent: number;
  max_events_before_auto_approve: number;
  default_max_events: number;
}

const AdminAgents = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [editAgentDialogOpen, setEditAgentDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [editMaxEvents, setEditMaxEvents] = useState(5);

  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: ["admin-agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Agent[];
    },
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["agent-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      return data as AgentSettings;
    },
  });

  const [editSettings, setEditSettings] = useState<AgentSettings | null>(null);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<AgentSettings>) => {
      const { error } = await supabase
        .from("agent_settings")
        .update(newSettings)
        .eq("id", settings?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Pengaturan berhasil disimpan" });
      queryClient.invalidateQueries({ queryKey: ["agent-settings"] });
      setSettingsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Gagal menyimpan pengaturan", description: error.message, variant: "destructive" });
    },
  });

  const updateAgentMutation = useMutation({
    mutationFn: async ({ agentId, maxEvents }: { agentId: string; maxEvents: number }) => {
      const { error } = await supabase
        .from("agents")
        .update({ max_events: maxEvents })
        .eq("id", agentId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Agent berhasil diperbarui" });
      queryClient.invalidateQueries({ queryKey: ["admin-agents"] });
      setEditAgentDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Gagal memperbarui agent", description: error.message, variant: "destructive" });
    },
  });

  const filteredAgents = agents.filter((agent) => {
    const query = searchQuery.toLowerCase();
    return (
      agent.business_name?.toLowerCase().includes(query) ||
      agent.profiles?.full_name?.toLowerCase().includes(query)
    );
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
      active: { label: "Aktif", className: "bg-green-500/20 text-green-500", icon: CheckCircle },
      pending: { label: "Menunggu", className: "bg-yellow-500/20 text-yellow-500", icon: Clock },
      rejected: { label: "Ditolak", className: "bg-red-500/20 text-red-500", icon: XCircle },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const openEditAgentDialog = (agent: Agent) => {
    setSelectedAgent(agent);
    setEditMaxEvents(agent.max_events);
    setEditAgentDialogOpen(true);
  };

  const handleSaveAgent = () => {
    if (!selectedAgent) return;
    updateAgentMutation.mutate({ agentId: selectedAgent.id, maxEvents: editMaxEvents });
  };

  const openSettingsDialog = () => {
    if (settings) {
      setEditSettings({ ...settings });
    }
    setSettingsDialogOpen(true);
  };

  const handleSaveSettings = () => {
    if (!editSettings) return;
    updateSettingsMutation.mutate({
      registration_fee: editSettings.registration_fee,
      platform_commission_percent: editSettings.platform_commission_percent,
      max_events_before_auto_approve: editSettings.max_events_before_auto_approve,
      default_max_events: editSettings.default_max_events,
    });
  };

  const activeAgents = agents.filter((a) => a.registration_status === "active").length;
  const totalEarnings = agents.reduce((sum, a) => sum + a.total_earnings, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">Kelola Agent</h2>
            <p className="text-muted-foreground">
              Kelola agent dan pengaturan komisi
            </p>
          </div>
          <Button onClick={openSettingsDialog} className="gap-2">
            <Settings className="w-4 h-4" />
            Pengaturan Agent
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Agent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{agents.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Agent Aktif
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold">{activeAgents}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pendapatan Agent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-gradient-gold">
                {formatCurrency(totalEarnings)}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Current Settings */}
        {settings && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Pengaturan Saat Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Biaya Pendaftaran</p>
                  <p className="font-semibold">{formatCurrency(settings.registration_fee)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Komisi Platform</p>
                  <p className="font-semibold">{settings.platform_commission_percent}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Auto-approve setelah</p>
                  <p className="font-semibold">{settings.max_events_before_auto_approve} event sukses</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Default Max Event</p>
                  <p className="font-semibold">{settings.default_max_events} event</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama bisnis atau agent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Agents Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          {agentsLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada agent terdaftar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Agent
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Event
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Pendapatan
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Bergabung
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAgents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-secondary/30">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{agent.business_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {agent.profiles?.full_name || "-"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {getStatusBadge(agent.registration_status)}
                          {agent.is_auto_approve && (
                            <Badge variant="outline" className="text-xs">Auto-approve</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p>{agent.successful_events_count} sukses</p>
                          <p className="text-muted-foreground">Max: {agent.max_events}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{formatCurrency(agent.total_earnings)}</p>
                        <p className="text-xs text-muted-foreground">
                          Komisi: {formatCurrency(agent.total_commission_paid)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {format(new Date(agent.created_at), "dd MMM yyyy")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditAgentDialog(agent)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Settings Dialog */}
        <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pengaturan Agent</DialogTitle>
              <DialogDescription>
                Atur biaya pendaftaran dan komisi platform
              </DialogDescription>
            </DialogHeader>
            {editSettings && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Biaya Pendaftaran Agent (Rp)</Label>
                  <Input
                    type="number"
                    value={editSettings.registration_fee}
                    onChange={(e) => setEditSettings({ ...editSettings, registration_fee: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Komisi Platform (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editSettings.platform_commission_percent}
                    onChange={(e) => setEditSettings({ ...editSettings, platform_commission_percent: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Auto-approve setelah X event sukses</Label>
                  <Input
                    type="number"
                    value={editSettings.max_events_before_auto_approve}
                    onChange={(e) => setEditSettings({ ...editSettings, max_events_before_auto_approve: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Max Event untuk Agent Baru</Label>
                  <Input
                    type="number"
                    value={editSettings.default_max_events}
                    onChange={(e) => setEditSettings({ ...editSettings, default_max_events: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
                Batal
              </Button>
              <Button 
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Agent Dialog */}
        <Dialog open={editAgentDialogOpen} onOpenChange={setEditAgentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Agent</DialogTitle>
              <DialogDescription>
                {selectedAgent?.business_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Maksimal Event yang Bisa Dibuat</Label>
                <Input
                  type="number"
                  value={editMaxEvents}
                  onChange={(e) => setEditMaxEvents(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditAgentDialogOpen(false)}>
                Batal
              </Button>
              <Button 
                onClick={handleSaveAgent}
                disabled={updateAgentMutation.isPending}
              >
                {updateAgentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminAgents;
