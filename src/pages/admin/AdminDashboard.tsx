import { Music2, ShoppingCart, DollarSign, Ticket, Clock, CheckCircle, XCircle, Package } from "lucide-react";
import { useAdminStats } from "@/hooks/useAdmin";
import AdminLayout from "@/components/admin/AdminLayout";

const AdminDashboard = () => {
  const { data: stats, isLoading } = useAdminStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const statCards = [
    {
      title: "Total Konser",
      value: stats?.totalConcerts || 0,
      icon: Music2,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total Pesanan",
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Total Pendapatan",
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Tiket Terjual",
      value: stats?.ticketsSold || 0,
      icon: Ticket,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  const ticketStatCards = [
    {
      title: "Tiket Terjual (Lunas)",
      value: stats?.ticketsSold || 0,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Tiket Pending",
      value: stats?.ticketsPending || 0,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Tiket Tersedia",
      value: stats?.ticketsAvailable || 0,
      icon: Package,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ];

  const orderStatCards = [
    {
      title: "Pesanan Lunas",
      value: stats?.paidOrders || 0,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Menunggu Pembayaran",
      value: stats?.pendingOrders || 0,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Dibatalkan/Expired",
      value: stats?.expiredOrders || 0,
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold mb-2">
            Selamat Datang, Admin!
          </h2>
          <p className="text-muted-foreground">
            Kelola konser dan tiket dari dashboard ini.
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="glass-card p-6 rounded-xl hover-lift"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">
                    {isLoading ? "..." : stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Ticket Statistics */}
        <div className="glass-card p-6 rounded-xl">
          <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            Statistik Tiket
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ticketStatCards.map((stat, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-border bg-secondary/30"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-xl font-bold">
                      {isLoading ? "..." : stat.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {stats && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Total Kapasitas: <span className="font-semibold text-foreground">{stats.totalTicketCapacity}</span> tiket
              </p>
            </div>
          )}
        </div>

        {/* Order Statistics */}
        <div className="glass-card p-6 rounded-xl">
          <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Statistik Pesanan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {orderStatCards.map((stat, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-border bg-secondary/30"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-xl font-bold">
                      {isLoading ? "..." : stat.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6 rounded-xl">
          <h3 className="font-display text-lg font-bold mb-4">Aksi Cepat</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/concerts"
              className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <Music2 className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold mb-1">Kelola Konser</h4>
              <p className="text-sm text-muted-foreground">
                Tambah, edit, atau hapus konser
              </p>
            </a>
            <a
              href="/admin/orders"
              className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <ShoppingCart className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold mb-1">Lihat Pesanan</h4>
              <p className="text-sm text-muted-foreground">
                Pantau semua transaksi
              </p>
            </a>
            <a
              href="/"
              className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <Ticket className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold mb-1">Lihat Website</h4>
              <p className="text-sm text-muted-foreground">
                Buka halaman publik
              </p>
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
