import { Navigate, Link } from "react-router-dom";
import { Loader2, Plus, Wallet, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AgentLayout from "@/components/agent/AgentLayout";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";

const AgentWithdrawals = () => {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

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

  const { data: withdrawals = [], isLoading: withdrawalsLoading } = useQuery({
    queryKey: ["agent-withdrawals", agent?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("agent_id", agent?.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!agent?.id,
  });

  const createWithdrawalMutation = useMutation({
    mutationFn: async (data: { amount: number; notes: string }) => {
      if (!agent) throw new Error("Agent not found");
      
      const { error } = await supabase
        .from("withdrawals")
        .insert({
          agent_id: agent.id,
          amount: data.amount,
          bank_name: agent.bank_name || "",
          bank_account_number: agent.bank_account_number || "",
          bank_account_name: agent.bank_account_name || "",
          notes: data.notes || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Permintaan penarikan berhasil dibuat");
      queryClient.invalidateQueries({ queryKey: ["agent-withdrawals"] });
      setIsDialogOpen(false);
      setAmount("");
      setNotes("");
    },
    onError: (error) => {
      toast.error("Gagal membuat permintaan: " + (error as Error).message);
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

  // Calculate available balance
  const pendingWithdrawals = withdrawals
    .filter(w => w.status === "pending" || w.status === "processing")
    .reduce((sum, w) => sum + w.amount, 0);
  
  const completedWithdrawals = withdrawals
    .filter(w => w.status === "completed")
    .reduce((sum, w) => sum + w.amount, 0);

  const availableBalance = agent.total_earnings - agent.total_commission_paid - pendingWithdrawals - completedWithdrawals;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountValue = parseInt(amount);
    
    if (isNaN(amountValue) || amountValue < 50000) {
      toast.error("Minimal penarikan Rp 50.000");
      return;
    }
    
    if (amountValue > availableBalance) {
      toast.error("Jumlah melebihi saldo tersedia");
      return;
    }

    if (!agent.bank_name || !agent.bank_account_number) {
      toast.error("Lengkapi data rekening bank di profil terlebih dahulu");
      return;
    }
    
    createWithdrawalMutation.mutate({ amount: amountValue, notes });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      pending: { 
        label: "Menunggu", 
        className: "bg-yellow-500/20 text-yellow-500",
        icon: <Clock className="w-3 h-3" />
      },
      processing: { 
        label: "Diproses", 
        className: "bg-blue-500/20 text-blue-500",
        icon: <Loader2 className="w-3 h-3 animate-spin" />
      },
      completed: { 
        label: "Selesai", 
        className: "bg-green-500/20 text-green-500",
        icon: <CheckCircle className="w-3 h-3" />
      },
      rejected: { 
        label: "Ditolak", 
        className: "bg-red-500/20 text-red-500",
        icon: <XCircle className="w-3 h-3" />
      },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const hasBankDetails = agent.bank_name && agent.bank_account_number && agent.bank_account_name;

  return (
    <AgentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Penarikan Dana</h1>
            <p className="text-muted-foreground">
              Kelola penarikan pendapatan Anda
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="gold" 
                className="gap-2"
                disabled={availableBalance < 50000 || !hasBankDetails}
              >
                <Plus className="w-4 h-4" />
                Tarik Dana
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Permintaan Penarikan Dana</DialogTitle>
                <DialogDescription>
                  Dana akan ditransfer ke rekening yang terdaftar dalam 1-3 hari kerja.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Saldo Tersedia</Label>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(availableBalance)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Rekening Tujuan</Label>
                  <div className="p-3 rounded-lg bg-secondary text-sm">
                    <p className="font-medium">{agent.bank_name}</p>
                    <p>{agent.bank_account_number}</p>
                    <p className="text-muted-foreground">{agent.bank_account_name}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Jumlah Penarikan</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Minimal Rp 50.000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={50000}
                    max={availableBalance}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimal penarikan: Rp 50.000
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan (Opsional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Catatan tambahan..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="gold"
                    disabled={createWithdrawalMutation.isPending}
                  >
                    {createWithdrawalMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Ajukan Penarikan
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Tersedia</p>
                  <p className="text-xl font-bold">{formatCurrency(availableBalance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dalam Proses</p>
                  <p className="text-xl font-bold">{formatCurrency(pendingWithdrawals)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Ditarik</p>
                  <p className="text-xl font-bold">{formatCurrency(completedWithdrawals)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Pendapatan</p>
                  <p className="text-xl font-bold">{formatCurrency(agent.total_earnings - agent.total_commission_paid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bank Account Warning */}
        {!hasBankDetails && (
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-500">Data Rekening Belum Lengkap</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Lengkapi data rekening bank Anda terlebih dahulu untuk dapat melakukan penarikan dana.
                </p>
                <Link to="/agent">
                  <Button variant="outline" size="sm" className="mt-2">
                    Ke Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Withdrawal History */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Penarikan</CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawalsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada riwayat penarikan
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead>No. Rekening</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell className="text-sm">
                          {format(new Date(withdrawal.created_at), "dd MMM yyyy HH:mm", { locale: localeId })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(withdrawal.amount)}
                        </TableCell>
                        <TableCell>{withdrawal.bank_name}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {withdrawal.bank_account_number}
                        </TableCell>
                        <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                        <TableCell className="max-w-[200px]">
                          {withdrawal.admin_notes && (
                            <p className="text-sm text-muted-foreground truncate">
                              {withdrawal.admin_notes}
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AgentLayout>
  );
};

export default AgentWithdrawals;
