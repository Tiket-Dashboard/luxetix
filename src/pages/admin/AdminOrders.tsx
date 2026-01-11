import { Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminOrders } from "@/hooks/useAdmin";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const AdminOrders = () => {
  const { data: orders = [], isLoading } = useAdminOrders();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd MMM yyyy, HH:mm");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: "Menunggu", className: "bg-yellow-500/20 text-yellow-500" },
      paid: { label: "Lunas", className: "bg-green-500/20 text-green-500" },
      cancelled: { label: "Dibatalkan", className: "bg-red-500/20 text-red-500" },
      expired: { label: "Kadaluarsa", className: "bg-gray-500/20 text-gray-500" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold">Daftar Pesanan</h2>
          <p className="text-muted-foreground">
            Pantau semua transaksi pembelian tiket
          </p>
        </div>

        {/* Orders Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              Belum ada pesanan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      No. Order
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Pelanggan
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Tanggal
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Total
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-secondary/30">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-primary">
                          {order.order_number}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.customer_email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
