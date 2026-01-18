import { useState } from "react";
import { Loader2, Search, CheckCircle, XCircle, Clock, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";

interface Withdrawal {
  id: string;
  agent_id: string;
  amount: number;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  status: string;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  agent?: {
    business_name: string;
    user_id: string;
  };
}

const AdminWithdrawals = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals")
        .select(`
          *,
          agent:agents(business_name, user_id)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Withdrawal[];
    },
  });

  const processWithdrawalMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("withdrawals")
        .update({
          status,
          admin_notes: adminNotes || null,
          processed_by: user?.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(actionType === "approve" ? "Penarikan berhasil disetujui" : "Penarikan ditolak");
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      setSelectedWithdrawal(null);
      setAdminNotes("");
      setActionType(null);
    },
    onError: (error) => {
      toast.error("Gagal memproses: " + (error as Error).message);
    },
  });

  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchesSearch = 
      w.agent?.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.bank_account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.bank_account_number.includes(searchQuery);
    
    const matchesStatus = statusFilter === "all" || w.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

  const handleAction = (withdrawal: Withdrawal, type: "approve" | "reject") => {
    setSelectedWithdrawal(withdrawal);
    setActionType(type);
    setAdminNotes("");
  };

  const handleSubmit = () => {
    if (!selectedWithdrawal || !actionType) return;
    
    processWithdrawalMutation.mutate({
      id: selectedWithdrawal.id,
      status: actionType === "approve" ? "completed" : "rejected",
      adminNotes,
    });
  };

  // Stats
  const pendingCount = withdrawals.filter(w => w.status === "pending").length;
  const pendingAmount = withdrawals
    .filter(w => w.status === "pending")
    .reduce((sum, w) => sum + w.amount, 0);
  const completedAmount = withdrawals
    .filter(w => w.status === "completed")
    .reduce((sum, w) => sum + w.amount, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Penarikan Dana Agent</h1>
          <p className="text-muted-foreground">
            Kelola permintaan penarikan dana dari agent
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Menunggu</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(pendingAmount)}</p>
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
                  <p className="text-sm text-muted-foreground">Total Dicairkan</p>
                  <p className="text-2xl font-bold">{formatCurrency(completedAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Request</p>
                  <p className="text-2xl font-bold">{withdrawals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari agent atau rekening..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="processing">Diproses</SelectItem>
              <SelectItem value="completed">Selesai</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Permintaan Penarikan</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredWithdrawals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada data penarikan
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead>No. Rekening</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWithdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell className="text-sm">
                          {format(new Date(withdrawal.created_at), "dd MMM yyyy HH:mm", { locale: localeId })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {withdrawal.agent?.business_name || "-"}
                        </TableCell>
                        <TableCell className="font-bold">
                          {formatCurrency(withdrawal.amount)}
                        </TableCell>
                        <TableCell>{withdrawal.bank_name}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {withdrawal.bank_account_number}
                        </TableCell>
                        <TableCell>{withdrawal.bank_account_name}</TableCell>
                        <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                        <TableCell>
                          {withdrawal.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-500 hover:text-green-600"
                                onClick={() => handleAction(withdrawal, "approve")}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-500 hover:text-red-600"
                                onClick={() => handleAction(withdrawal, "reject")}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                          {withdrawal.admin_notes && (
                            <p className="text-xs text-muted-foreground mt-1 max-w-[150px] truncate">
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

        {/* Action Dialog */}
        <Dialog open={!!selectedWithdrawal && !!actionType} onOpenChange={() => {
          setSelectedWithdrawal(null);
          setActionType(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "approve" ? "Setujui Penarikan" : "Tolak Penarikan"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "approve" 
                  ? "Konfirmasi bahwa dana telah ditransfer ke rekening agent."
                  : "Berikan alasan penolakan penarikan dana."}
              </DialogDescription>
            </DialogHeader>
            
            {selectedWithdrawal && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agent</span>
                    <span className="font-medium">{selectedWithdrawal.agent?.business_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jumlah</span>
                    <span className="font-bold text-primary">{formatCurrency(selectedWithdrawal.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank</span>
                    <span>{selectedWithdrawal.bank_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">No. Rekening</span>
                    <span className="font-mono">{selectedWithdrawal.bank_account_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nama</span>
                    <span>{selectedWithdrawal.bank_account_name}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="adminNotes">
                    {actionType === "approve" ? "Catatan (Opsional)" : "Alasan Penolakan"}
                  </Label>
                  <Textarea
                    id="adminNotes"
                    placeholder={actionType === "approve" 
                      ? "Contoh: Transfer berhasil via Internet Banking"
                      : "Contoh: Data rekening tidak valid"}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    required={actionType === "reject"}
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedWithdrawal(null);
                  setActionType(null);
                }}
              >
                Batal
              </Button>
              <Button
                variant={actionType === "approve" ? "gold" : "destructive"}
                onClick={handleSubmit}
                disabled={processWithdrawalMutation.isPending || (actionType === "reject" && !adminNotes)}
              >
                {processWithdrawalMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {actionType === "approve" ? "Setujui" : "Tolak"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminWithdrawals;
