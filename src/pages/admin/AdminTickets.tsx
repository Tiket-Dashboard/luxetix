import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, Pencil, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useConcertById } from "@/hooks/useConcerts";
import {
  useAdminTicketTypes,
  useCreateTicketType,
  useUpdateTicketType,
  useDeleteTicketType,
} from "@/hooks/useAdmin";
import { TicketType } from "@/types/database";

const AdminTickets = () => {
  const { concertId } = useParams();
  const { data: concert } = useConcertById(concertId || "");
  const { data: tickets = [], isLoading } = useAdminTicketTypes(concertId || "");
  const createTicket = useCreateTicketType();
  const updateTicket = useUpdateTicketType();
  const deleteTicket = useDeleteTicketType();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    benefits: "",
    total_quantity: "",
    available_quantity: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      benefits: "",
      total_quantity: "",
      available_quantity: "",
    });
    setEditingTicket(null);
  };

  const handleEdit = (ticket: TicketType) => {
    setEditingTicket(ticket);
    setFormData({
      name: ticket.name,
      description: ticket.description || "",
      price: ticket.price.toString(),
      benefits: ticket.benefits.join("\n"),
      total_quantity: ticket.total_quantity.toString(),
      available_quantity: ticket.available_quantity.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const ticketData = {
      concert_id: concertId!,
      name: formData.name,
      description: formData.description,
      price: parseInt(formData.price),
      benefits: formData.benefits.split("\n").filter((b) => b.trim()),
      total_quantity: parseInt(formData.total_quantity),
      available_quantity: parseInt(formData.available_quantity),
    };

    if (editingTicket) {
      await updateTicket.mutateAsync({
        id: editingTicket.id,
        ...ticketData,
      });
    } else {
      await createTicket.mutateAsync(ticketData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteTicket.mutateAsync({ id, concertId: concertId! });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <Link
            to="/admin/concerts"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Daftar Konser
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold">
                Kelola Tiket
              </h2>
              <p className="text-muted-foreground">
                {concert?.title} - {concert?.artist}
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button variant="gold" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Tambah Tiket
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">
                    {editingTicket ? "Edit Tiket" : "Tambah Tiket Baru"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Tiket</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="VIP, Regular, dll"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Deskripsi singkat tiket"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Harga (IDR)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="500000"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="total_quantity">Total Kuantitas</Label>
                      <Input
                        id="total_quantity"
                        type="number"
                        value={formData.total_quantity}
                        onChange={(e) => setFormData({ ...formData, total_quantity: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="available_quantity">Kuantitas Tersedia</Label>
                      <Input
                        id="available_quantity"
                        type="number"
                        value={formData.available_quantity}
                        onChange={(e) => setFormData({ ...formData, available_quantity: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="benefits">Benefit (satu per baris)</Label>
                    <Textarea
                      id="benefits"
                      value={formData.benefits}
                      onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                      placeholder="Akses VIP&#10;Meet & Greet&#10;Merchandise"
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      variant="gold"
                      disabled={createTicket.isPending || updateTicket.isPending}
                    >
                      {createTicket.isPending || updateTicket.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : editingTicket ? (
                        "Simpan Perubahan"
                      ) : (
                        "Tambah Tiket"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tickets Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="glass-card rounded-xl text-center py-20 text-muted-foreground">
            Belum ada tiket untuk konser ini. Tambahkan tiket pertama!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="glass-card p-6 rounded-xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{ticket.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {ticket.description}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(ticket)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Tiket?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(ticket.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <p className="text-2xl font-bold text-primary mb-4">
                  {formatPrice(ticket.price)}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span>{ticket.total_quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tersedia</span>
                    <span className="text-green-500">{ticket.available_quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Terjual</span>
                    <span className="text-primary">
                      {ticket.total_quantity - ticket.available_quantity}
                    </span>
                  </div>
                </div>

                {ticket.benefits.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">Benefits:</p>
                    <ul className="text-sm space-y-1">
                      {ticket.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-primary rounded-full" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTickets;
