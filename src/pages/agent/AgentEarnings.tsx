import { Navigate } from "react-router-dom";
import { Loader2, DollarSign, TrendingUp, Clock, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AgentLayout from "@/components/agent/AgentLayout";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const AgentEarnings = () => {
  const { user, isLoading: authLoading } = useAuth();

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

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["agent-payments", agent?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_payments")
        .select("*")
        .eq("agent_id", agent?.id)
        .order("created_at", { ascending: false });
      
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const pendingPayments = payments.filter((p) => p.status === "pending");
  const paidPayments = payments.filter((p) => p.status === "paid");
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.net_amount, 0);
  const paidAmount = paidPayments.reduce((sum, p) => sum + p.net_amount, 0);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: "Menunggu", className: "bg-yellow-500/20 text-yellow-500" },
      paid: { label: "Dibayar", className: "bg-green-500/20 text-green-500" },
      failed: { label: "Gagal", className: "bg-red-500/20 text-red-500" },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <AgentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Pendapatan</h1>
          <p className="text-muted-foreground">
            Lihat dan kelola pendapatan dari penjualan tiket
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <Clock className="w-4 h-4" />
                Menunggu Cair
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-yellow-500">
                {formatCurrency(pendingAmount)}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Sudah Dicairkan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-green-500">
                {formatCurrency(paidAmount)}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Komisi Platform
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">
                {formatCurrency(agent.total_commission_paid)}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Bank Info */}
        <Card>
          <CardHeader>
            <CardTitle>Rekening Pencairan</CardTitle>
          </CardHeader>
          <CardContent>
            {agent.bank_name && agent.bank_account_number ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-medium">{agent.bank_account_name}</p>
                  <p className="text-muted-foreground">
                    {agent.bank_name} - {agent.bank_account_number}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Belum ada rekening terdaftar. Hubungi admin untuk menambahkan rekening.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada transaksi pembayaran.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Tanggal
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Gross
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Komisi
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Bersih
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-secondary/30">
                        <td className="px-4 py-3 text-sm">
                          {format(new Date(payment.created_at), "d MMM yyyy", { locale: localeId })}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {formatCurrency(payment.gross_amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-500">
                          -{formatCurrency(payment.commission_amount)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {formatCurrency(payment.net_amount)}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(payment.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AgentLayout>
  );
};

export default AgentEarnings;
