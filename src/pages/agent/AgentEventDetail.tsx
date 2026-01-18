import { Navigate, useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, Ticket, Users, DollarSign, Calendar, MapPin, Clock } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AgentLayout from "@/components/agent/AgentLayout";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface TicketSale {
  id: string;
  order_number: string;
  customer_name: string;
  ticket_type_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  status: string;
  is_used: boolean;
  created_at: string;
}

const AgentEventDetail = () => {
  const { id } = useParams<{ id: string }>();
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

  const { data: concert, isLoading: concertLoading } = useQuery({
    queryKey: ["agent-concert-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("concerts")
        .select("*, ticket_types(*)")
        .eq("id", id)
        .eq("agent_id", agent?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!agent?.id && !!id,
  });

  const { data: ticketSales = [], isLoading: salesLoading } = useQuery({
    queryKey: ["agent-ticket-sales", id],
    queryFn: async () => {
      // Get all order items for this concert's ticket types
      const ticketTypeIds = concert?.ticket_types?.map((tt: { id: string }) => tt.id) || [];
      
      if (ticketTypeIds.length === 0) return [];

      const { data: orderItems, error } = await supabase
        .from("order_items")
        .select(`
          id,
          quantity,
          unit_price,
          subtotal,
          is_used,
          created_at,
          ticket_type_id,
          order_id
        `)
        .in("ticket_type_id", ticketTypeIds);

      if (error) throw error;

      // Get order details for each order item
      const orderIds = [...new Set(orderItems?.map(item => item.order_id) || [])];
      
      if (orderIds.length === 0) return [];

      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, status")
        .in("id", orderIds);

      if (ordersError) throw ordersError;

      // Map order items with order and ticket type details
      const sales: TicketSale[] = (orderItems || []).map(item => {
        const order = orders?.find(o => o.id === item.order_id);
        const ticketType = concert?.ticket_types?.find((tt: { id: string }) => tt.id === item.ticket_type_id);
        
        return {
          id: item.id,
          order_number: order?.order_number || "-",
          customer_name: order?.customer_name || "-",
          ticket_type_name: ticketType?.name || "-",
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          status: order?.status || "pending",
          is_used: item.is_used || false,
          created_at: item.created_at,
        };
      });

      return sales;
    },
    enabled: !!concert?.ticket_types && concert.ticket_types.length > 0,
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

  // Calculate statistics
  const paidSales = ticketSales.filter(s => s.status === "paid");
  const totalTicketsSold = paidSales.reduce((sum, s) => sum + s.quantity, 0);
  const totalRevenue = paidSales.reduce((sum, s) => sum + s.subtotal, 0);
  const ticketsUsed = paidSales.filter(s => s.is_used).reduce((sum, s) => sum + s.quantity, 0);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: "Pending", className: "bg-yellow-500/20 text-yellow-500" },
      paid: { label: "Lunas", className: "bg-green-500/20 text-green-500" },
      expired: { label: "Expired", className: "bg-gray-500/20 text-gray-500" },
      cancelled: { label: "Dibatalkan", className: "bg-red-500/20 text-red-500" },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getEventStatusBadge = (status: string) => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AgentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/agent/events">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold">Detail Penjualan Tiket</h1>
            <p className="text-muted-foreground">
              Lihat statistik dan riwayat penjualan tiket event Anda
            </p>
          </div>
        </div>

        {concertLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : concert ? (
          <>
            {/* Event Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {concert.image_url && (
                    <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={concert.image_url}
                        alt={concert.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold">{concert.title}</h2>
                        <p className="text-muted-foreground">{concert.artist}</p>
                      </div>
                      {getEventStatusBadge(concert.event_status)}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(concert.date), "dd MMMM yyyy", { locale: localeId })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{concert.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{concert.venue}, {concert.city}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Ticket className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tiket Terjual</p>
                      <p className="text-2xl font-bold">{totalTicketsSold}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Pendapatan</p>
                      <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tiket Digunakan</p>
                      <p className="text-2xl font-bold">{ticketsUsed} / {totalTicketsSold}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                      <Ticket className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Jenis Tiket</p>
                      <p className="text-2xl font-bold">{concert.ticket_types?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ticket Types Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Per Jenis Tiket</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jenis Tiket</TableHead>
                        <TableHead className="text-right">Harga</TableHead>
                        <TableHead className="text-right">Terjual</TableHead>
                        <TableHead className="text-right">Tersedia</TableHead>
                        <TableHead className="text-right">Pendapatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {concert.ticket_types?.map((tt: { id: string; name: string; price: number; total_quantity: number; available_quantity: number }) => {
                        const sold = paidSales
                          .filter(s => s.ticket_type_name === tt.name)
                          .reduce((sum, s) => sum + s.quantity, 0);
                        const revenue = paidSales
                          .filter(s => s.ticket_type_name === tt.name)
                          .reduce((sum, s) => sum + s.subtotal, 0);
                        
                        return (
                          <TableRow key={tt.id}>
                            <TableCell className="font-medium">{tt.name}</TableCell>
                            <TableCell className="text-right">{formatCurrency(tt.price)}</TableCell>
                            <TableCell className="text-right">{sold}</TableCell>
                            <TableCell className="text-right">{tt.available_quantity} / {tt.total_quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(revenue)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Sales History */}
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Penjualan</CardTitle>
              </CardHeader>
              <CardContent>
                {salesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : ticketSales.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Belum ada penjualan tiket
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead>Pembeli</TableHead>
                          <TableHead>Tiket</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Digunakan</TableHead>
                          <TableHead>Tanggal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ticketSales.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell className="font-mono text-xs">{sale.order_number}</TableCell>
                            <TableCell>{sale.customer_name}</TableCell>
                            <TableCell>{sale.ticket_type_name}</TableCell>
                            <TableCell className="text-right">{sale.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(sale.subtotal)}</TableCell>
                            <TableCell>{getStatusBadge(sale.status)}</TableCell>
                            <TableCell>
                              {sale.is_used ? (
                                <Badge className="bg-green-500/20 text-green-500">Ya</Badge>
                              ) : (
                                <Badge className="bg-gray-500/20 text-gray-500">Belum</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(sale.created_at), "dd/MM/yyyy HH:mm")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Event tidak ditemukan</p>
              <Link to="/agent/events">
                <Button variant="outline" className="mt-4">
                  Kembali ke Event Saya
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </AgentLayout>
  );
};

export default AgentEventDetail;
