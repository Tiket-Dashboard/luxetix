import { useState } from "react";
import { Plus, Pencil, Trash2, Ticket, Loader2, Eye, EyeOff } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  useAdminConcerts,
  useCreateConcert,
  useUpdateConcert,
  useDeleteConcert,
} from "@/hooks/useAdmin";
import { Concert } from "@/types/database";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import ImageUpload from "@/components/admin/ImageUpload";

const AdminConcerts = () => {
  const { data: concerts = [], isLoading } = useAdminConcerts();
  const createConcert = useCreateConcert();
  const updateConcert = useUpdateConcert();
  const deleteConcert = useDeleteConcert();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConcert, setEditingConcert] = useState<Concert | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    description: "",
    date: "",
    time: "",
    venue: "",
    city: "",
    image_url: "",
    category: "",
    is_featured: false,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      artist: "",
      description: "",
      date: "",
      time: "",
      venue: "",
      city: "",
      image_url: "",
      category: "",
      is_featured: false,
      is_active: true,
    });
    setEditingConcert(null);
  };

  const handleEdit = (concert: Concert) => {
    setEditingConcert(concert);
    setFormData({
      title: concert.title,
      artist: concert.artist,
      description: concert.description || "",
      date: concert.date,
      time: concert.time,
      venue: concert.venue,
      city: concert.city,
      image_url: concert.image_url || "",
      category: concert.category,
      is_featured: concert.is_featured,
      is_active: concert.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingConcert) {
      await updateConcert.mutateAsync({
        id: editingConcert.id,
        ...formData,
      });
    } else {
      await createConcert.mutateAsync(formData as any);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteConcert.mutateAsync(id);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd MMM yyyy");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">Kelola Konser</h2>
            <p className="text-muted-foreground">
              Tambah, edit, atau hapus konser
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button variant="gold" className="gap-2">
                <Plus className="w-4 h-4" />
                Tambah Konser
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  {editingConcert ? "Edit Konser" : "Tambah Konser Baru"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Judul Konser</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="artist">Artis</Label>
                    <Input
                      id="artist"
                      value={formData.artist}
                      onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Tanggal</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Waktu</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="venue">Venue</Label>
                    <Input
                      id="venue"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Kota</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Pop, Rock, Jazz, dll"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Gambar Konser</Label>
                  <ImageUpload
                    value={formData.image_url}
                    onChange={(url) => setFormData({ ...formData, image_url: url })}
                    folder="concerts"
                  />
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    />
                    <Label htmlFor="is_featured">Featured</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Aktif</Label>
                  </div>
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
                    disabled={createConcert.isPending || updateConcert.isPending}
                  >
                    {createConcert.isPending || updateConcert.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingConcert ? (
                      "Simpan Perubahan"
                    ) : (
                      "Tambah Konser"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Concerts Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : concerts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              Belum ada konser. Tambahkan konser pertama Anda!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Konser
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Tanggal
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Lokasi
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {concerts.map((concert) => (
                    <tr key={concert.id} className="hover:bg-secondary/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={concert.image_url || "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=100"}
                            alt={concert.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium">{concert.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {concert.artist}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {formatDate(concert.date)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {concert.venue}, {concert.city}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {concert.is_active ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500">
                              Aktif
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-500">
                              Nonaktif
                            </span>
                          )}
                          {concert.is_featured && (
                            <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">
                              Featured
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/admin/concerts/${concert.id}/tickets`}>
                            <Button variant="ghost" size="sm" className="gap-1">
                              <Ticket className="w-4 h-4" />
                              Tiket
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(concert)}
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
                                <AlertDialogTitle>Hapus Konser?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tindakan ini tidak dapat dibatalkan. Semua tiket yang terkait juga akan dihapus.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(concert.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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

export default AdminConcerts;
