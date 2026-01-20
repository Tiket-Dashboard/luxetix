import { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Ticket, 
  Users, 
  Calendar,
  BarChart3,
  PieChart,
  Download,
  FileSpreadsheet,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Tooltip,
} from "recharts";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { id as localeId } from "date-fns/locale";

const AdminAnalytics = () => {
  const [dateRange, setDateRange] = useState("30");
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Get analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["admin-analytics", dateRange],
    queryFn: async () => {
      const days = parseInt(dateRange);
      const startDate = subDays(new Date(), days);
      
      // Get orders with items
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*, order_items(*, ticket_types(*), concerts(*))")
        .gte("created_at", startDate.toISOString());

      if (ordersError) throw ordersError;

      // Get concerts
      const { data: concerts, error: concertsError } = await supabase
        .from("concerts")
        .select("*, ticket_types(*)");

      if (concertsError) throw concertsError;

      // Get agents
      const { data: agents, error: agentsError } = await supabase
        .from("agents")
        .select("*");

      if (agentsError) throw agentsError;

      return { orders: orders || [], concerts: concerts || [], agents: agents || [] };
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate metrics
  const calculateMetrics = () => {
    if (!analyticsData) return null;

    const { orders, concerts, agents } = analyticsData;
    const paidOrders = orders.filter(o => o.status === "paid");
    
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const totalTicketsSold = paidOrders.reduce((sum, o) => 
      sum + o.order_items?.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0), 0
    );
    const totalOrders = paidOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const activeAgents = agents.filter(a => a.registration_status === "active").length;
    const activeConcerts = concerts.filter(c => c.is_active && c.event_status === "approved").length;

    return {
      totalRevenue,
      totalTicketsSold,
      totalOrders,
      avgOrderValue,
      activeAgents,
      activeConcerts,
    };
  };

  // Calculate daily revenue for chart
  const calculateDailyRevenue = () => {
    if (!analyticsData) return [];

    const days = parseInt(dateRange);
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());
    
    const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });
    const paidOrders = analyticsData.orders.filter(o => o.status === "paid");

    return dateInterval.map(date => {
      const dayOrders = paidOrders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= startOfDay(date) && orderDate <= endOfDay(date);
      });

      const revenue = dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const tickets = dayOrders.reduce((sum, o) => 
        sum + o.order_items?.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0), 0
      );

      return {
        date: format(date, "d MMM", { locale: localeId }),
        revenue,
        tickets,
      };
    });
  };

  // Calculate sales by category
  const calculateSalesByCategory = () => {
    if (!analyticsData) return [];

    const paidOrders = analyticsData.orders.filter(o => o.status === "paid");
    const categoryMap: Record<string, number> = {};

    paidOrders.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const category = item.concerts?.category || "Lainnya";
        categoryMap[category] = (categoryMap[category] || 0) + (item.quantity || 0);
      });
    });

    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  };

  // Calculate top concerts
  const calculateTopConcerts = () => {
    if (!analyticsData) return [];

    const paidOrders = analyticsData.orders.filter(o => o.status === "paid");
    const concertMap: Record<string, { title: string; tickets: number; revenue: number }> = {};

    paidOrders.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const concertId = item.concert_id;
        const concertTitle = item.concerts?.title || "Unknown";
        
        if (!concertMap[concertId]) {
          concertMap[concertId] = { title: concertTitle, tickets: 0, revenue: 0 };
        }
        concertMap[concertId].tickets += item.quantity || 0;
        concertMap[concertId].revenue += item.subtotal || 0;
      });
    });

    return Object.values(concertMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  // Calculate payment method distribution
  const calculatePaymentMethods = () => {
    if (!analyticsData) return [];

    const paidOrders = analyticsData.orders.filter(o => o.status === "paid");
    const methodMap: Record<string, number> = {};

    paidOrders.forEach(order => {
      const method = order.payment_method || "Unknown";
      methodMap[method] = (methodMap[method] || 0) + 1;
    });

    return Object.entries(methodMap).map(([name, value]) => ({ name, value }));
  };

  // Export functions
  const generateCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(","),
      ...data.map(row => headers.map(header => {
        const value = row[header.toLowerCase().replace(/ /g, "_")] ?? "";
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value);
        if (stringValue.includes(",") || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportOrdersReport = async () => {
    setIsExporting(true);
    try {
      const days = parseInt(dateRange);
      const startDate = subDays(new Date(), days);

      const { data: orders, error } = await supabase
        .from("orders")
        .select("*, order_items(*, ticket_types(name), concerts(title, artist, city))")
        .gte("created_at", startDate.toISOString())
        .eq("status", "paid")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const exportData = orders?.flatMap(order => 
        order.order_items?.map((item: any) => ({
          order_number: order.order_number,
          tanggal: format(new Date(order.created_at), "dd/MM/yyyy HH:mm"),
          customer: order.customer_name,
          email: order.customer_email,
          event: item.concerts?.title || "-",
          artist: item.concerts?.artist || "-",
          kota: item.concerts?.city || "-",
          tipe_tiket: item.ticket_types?.name || "-",
          jumlah: item.quantity,
          harga_satuan: item.unit_price,
          subtotal: item.subtotal,
          metode_pembayaran: order.payment_method || "-",
        })) || []
      ) || [];

      if (exportData.length === 0) {
        toast({ title: "Tidak ada data untuk diexport", variant: "destructive" });
        return;
      }

      generateCSV(exportData, "laporan_penjualan", [
        "Order_Number", "Tanggal", "Customer", "Email", "Event", "Artist", 
        "Kota", "Tipe_Tiket", "Jumlah", "Harga_Satuan", "Subtotal", "Metode_Pembayaran"
      ]);

      toast({ title: "Export berhasil", description: `${exportData.length} data berhasil diexport` });
    } catch (error: any) {
      toast({ title: "Gagal export", description: error.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const exportSummaryReport = async () => {
    setIsExporting(true);
    try {
      const summaryData = dailyRevenue.map(day => ({
        tanggal: day.date,
        pendapatan: day.revenue,
        tiket_terjual: day.tickets,
      }));

      if (summaryData.length === 0) {
        toast({ title: "Tidak ada data untuk diexport", variant: "destructive" });
        return;
      }

      generateCSV(summaryData, "ringkasan_harian", ["Tanggal", "Pendapatan", "Tiket_Terjual"]);
      toast({ title: "Export berhasil", description: `${summaryData.length} data berhasil diexport` });
    } catch (error: any) {
      toast({ title: "Gagal export", description: error.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const exportEventReport = async () => {
    setIsExporting(true);
    try {
      const days = parseInt(dateRange);
      const startDate = subDays(new Date(), days);

      const { data: orders, error } = await supabase
        .from("orders")
        .select("*, order_items(*, ticket_types(name, price), concerts(id, title, artist, city, category))")
        .gte("created_at", startDate.toISOString())
        .eq("status", "paid");

      if (error) throw error;

      // Aggregate by event
      const eventMap: Record<string, any> = {};

      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const eventId = item.concert_id;
          if (!eventId) return;
          
          if (!eventMap[eventId]) {
            eventMap[eventId] = {
              event: item.concerts?.title || "-",
              artist: item.concerts?.artist || "-",
              kota: item.concerts?.city || "-",
              kategori: item.concerts?.category || "-",
              tiket_terjual: 0,
              pendapatan: 0,
            };
          }
          eventMap[eventId].tiket_terjual += item.quantity || 0;
          eventMap[eventId].pendapatan += item.subtotal || 0;
        });
      });

      const exportData = Object.values(eventMap).sort((a, b) => b.pendapatan - a.pendapatan);

      if (exportData.length === 0) {
        toast({ title: "Tidak ada data untuk diexport", variant: "destructive" });
        return;
      }

      generateCSV(exportData, "laporan_per_event", [
        "Event", "Artist", "Kota", "Kategori", "Tiket_Terjual", "Pendapatan"
      ]);

      toast({ title: "Export berhasil", description: `${exportData.length} event berhasil diexport` });
    } catch (error: any) {
      toast({ title: "Gagal export", description: error.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const metrics = calculateMetrics();
  const dailyRevenue = calculateDailyRevenue();
  const salesByCategory = calculateSalesByCategory();
  const topConcerts = calculateTopConcerts();
  const paymentMethods = calculatePaymentMethods();

  const COLORS = [
    "hsl(45, 93%, 58%)",
    "hsl(200, 80%, 50%)",
    "hsl(150, 60%, 45%)",
    "hsl(280, 70%, 55%)",
    "hsl(0, 70%, 55%)",
    "hsl(30, 80%, 55%)",
  ];

  const revenueChartConfig: ChartConfig = {
    revenue: {
      label: "Pendapatan",
      color: "hsl(45, 93%, 58%)",
    },
    tickets: {
      label: "Tiket Terjual",
      color: "hsl(200, 80%, 50%)",
    },
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">Analytics Dashboard</h2>
            <p className="text-muted-foreground">Statistik penjualan dan performa platform</p>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isExporting}>
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportOrdersReport}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Laporan Penjualan (Detail)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportSummaryReport}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Ringkasan Harian
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportEventReport}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Laporan per Event
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pilih periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Hari Terakhir</SelectItem>
                <SelectItem value="30">30 Hari Terakhir</SelectItem>
                <SelectItem value="90">90 Hari Terakhir</SelectItem>
                <SelectItem value="365">1 Tahun Terakhir</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Pendapatan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gradient-gold">
                {metrics ? formatCurrency(metrics.totalRevenue) : "..."}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                Tiket Terjual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {metrics ? metrics.totalTicketsSold.toLocaleString() : "..."}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Total Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {metrics ? metrics.totalOrders.toLocaleString() : "..."}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Rata-rata Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {metrics ? formatCurrency(metrics.avgOrderValue) : "..."}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Agent Aktif
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{metrics?.activeAgents || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Event Aktif
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{metrics?.activeConcerts || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Tren Pendapatan & Tiket Terjual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => [
                      name === "revenue" ? formatCurrency(value) : value,
                      name === "revenue" ? "Pendapatan" : "Tiket Terjual"
                    ]}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(45, 93%, 58%)" 
                    strokeWidth={2}
                    dot={false}
                    name="Pendapatan"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="tickets" 
                    stroke="hsl(200, 80%, 50%)" 
                    strokeWidth={2}
                    dot={false}
                    name="Tiket Terjual"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                Penjualan per Kategori
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {salesByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={salesByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {salesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Tidak ada data
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Metode Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {paymentMethods.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentMethods} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        width={100}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(45, 93%, 58%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Tidak ada data
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Concerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              Top 5 Event Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topConcerts.length > 0 ? (
              <div className="space-y-4">
                {topConcerts.map((concert, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{concert.title}</p>
                        <p className="text-sm text-muted-foreground">{concert.tickets} tiket terjual</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gradient-gold">{formatCurrency(concert.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                Belum ada data penjualan
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
