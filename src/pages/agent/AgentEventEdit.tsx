import { useState, useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Loader2, ArrowLeft, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AgentLayout from "@/components/agent/AgentLayout";

interface TicketType {
  id?: string;
  name: string;
  description: string;
  price: number;
  total_quantity: number;
  available_quantity?: number;
  benefits: string[];
  isNew?: boolean;
  toDelete?: boolean;
}

const CATEGORIES = ["Pop", "Rock", "Jazz", "EDM", "Hip-Hop", "Classical", "Lainnya"];

const AgentEventEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form state
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("Lainnya");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);

  // Get agent data
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

  // Get event data
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["agent-event", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("concerts")
        .select("*, ticket_types(*)")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!agent?.id,
  });

  // Get agent settings
  const { data: settings } = useQuery({
    queryKey: ["agent-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_settings")
        .select("*")
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Populate form with existing data
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setArtist(event.artist);
      setDescription(event.description || "");
      setDate(event.date);
      setTime(event.time);
      setVenue(event.venue);
      setCity(event.city);
      setCategory(event.category);
      setImagePreview(event.image_url || "");
      setTicketTypes(
        event.ticket_types?.map((tt: any) => ({
          id: tt.id,
          name: tt.name,
          description: tt.description || "",
          price: tt.price,
          total_quantity: tt.total_quantity,
          available_quantity: tt.available_quantity,
          benefits: tt.benefits || [],
          isNew: false,
          toDelete: false,
        })) || []
      );
    }
  }, [event]);

  const updateEventMutation = useMutation({
    mutationFn: async () => {
      if (!agent || !event) throw new Error("Data tidak ditemukan");

      // Upload new image if exists
      let imageUrl = event.image_url;
      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("concert-images")
          .upload(fileName, imageFile);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from("concert-images")
          .getPublicUrl(fileName);
        
        imageUrl = urlData.publicUrl;
      }

      // Update concert
      const { error: concertError } = await supabase
        .from("concerts")
        .update({
          title,
          artist,
          description,
          date,
          time,
          venue,
          city,
          category,
          image_url: imageUrl,
        })
        .eq("id", event.id);

      if (concertError) throw concertError;

      // Handle ticket types
      for (const ticket of ticketTypes) {
        if (ticket.toDelete && ticket.id) {
          // Delete ticket type
          await supabase.from("ticket_types").delete().eq("id", ticket.id);
        } else if (ticket.isNew) {
          // Create new ticket type
          await supabase.from("ticket_types").insert({
            concert_id: event.id,
            name: ticket.name,
            description: ticket.description || null,
            price: ticket.price,
            total_quantity: ticket.total_quantity,
            available_quantity: ticket.total_quantity,
            benefits: ticket.benefits.filter(Boolean),
          });
        } else if (ticket.id) {
          // Update existing ticket type
          const quantityDiff = ticket.total_quantity - (event.ticket_types?.find((t: any) => t.id === ticket.id)?.total_quantity || 0);
          await supabase.from("ticket_types").update({
            name: ticket.name,
            description: ticket.description || null,
            price: ticket.price,
            total_quantity: ticket.total_quantity,
            available_quantity: (ticket.available_quantity || 0) + quantityDiff,
            benefits: ticket.benefits.filter(Boolean),
          }).eq("id", ticket.id);
        }
      }

      return event;
    },
    onSuccess: () => {
      toast({ title: "Berhasil!", description: "Event berhasil diperbarui" });
      queryClient.invalidateQueries({ queryKey: ["agent-event", id] });
      queryClient.invalidateQueries({ queryKey: ["agent-concerts"] });
      navigate(`/agent/events/${id}`);
    },
    onError: (error: Error) => {
      toast({ title: "Gagal memperbarui event", description: error.message, variant: "destructive" });
    },
  });

  const submitForApprovalMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("concerts")
        .update({ event_status: "pending_approval" })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Berhasil!", description: "Event telah diajukan untuk review admin" });
      queryClient.invalidateQueries({ queryKey: ["agent-event", id] });
      queryClient.invalidateQueries({ queryKey: ["agent-concerts"] });
      navigate("/agent/events");
    },
    onError: (error: Error) => {
      toast({ title: "Gagal mengajukan event", description: error.message, variant: "destructive" });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTicketType = () => {
    setTicketTypes([
      ...ticketTypes,
      { name: "", description: "", price: 0, total_quantity: 50, benefits: [], isNew: true }
    ]);
  };

  const removeTicketType = (index: number) => {
    const ticket = ticketTypes[index];
    if (ticket.isNew) {
      setTicketTypes(ticketTypes.filter((_, i) => i !== index));
    } else {
      const updated = [...ticketTypes];
      updated[index] = { ...updated[index], toDelete: true };
      setTicketTypes(updated);
    }
  };

  const updateTicketType = (index: number, field: keyof TicketType, value: any) => {
    const updated = [...ticketTypes];
    updated[index] = { ...updated[index], [field]: value };
    setTicketTypes(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !artist || !date || !time || !venue || !city) {
      toast({ title: "Lengkapi semua field wajib", variant: "destructive" });
      return;
    }

    const activeTickets = ticketTypes.filter(tt => !tt.toDelete);
    if (activeTickets.some(tt => !tt.name || tt.price <= 0 || tt.total_quantity <= 0)) {
      toast({ title: "Lengkapi data tiket dengan benar", variant: "destructive" });
      return;
    }

    updateEventMutation.mutate();
  };

  if (authLoading || agentLoading || eventLoading) {
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

  if (!event || event.agent_id !== agent.id) {
    return <Navigate to="/agent/events" replace />;
  }

  // Only allow editing draft or rejected events
  const canEdit = event.event_status === "draft" || event.event_status === "rejected";
  if (!canEdit) {
    return <Navigate to={`/agent/events/${id}`} replace />;
  }

  const activeTicketTypes = ticketTypes.filter(tt => !tt.toDelete);

  return (
    <AgentLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold">Edit Event</h1>
            <p className="text-muted-foreground">
              {event.event_status === "rejected" 
                ? "Perbaiki event yang ditolak dan ajukan kembali"
                : "Edit detail event Anda"}
            </p>
          </div>
        </div>

        {event.rejection_reason && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-4">
              <p className="text-sm text-destructive">
                <strong>Alasan Penolakan:</strong> {event.rejection_reason}
              </p>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Event</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul Event *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nama konser atau event"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artist">Artis / Performer *</Label>
                  <Input
                    id="artist"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="Nama artis atau band"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi event..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Waktu *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue *</Label>
                  <Input
                    id="venue"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Nama gedung atau tempat"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Kota *</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Kota lokasi event"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Gambar Event</Label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-32 h-20 bg-secondary rounded-lg flex items-center justify-center">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="max-w-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ticket Types */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tipe Tiket</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addTicketType}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Tiket
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeTicketTypes.map((ticket, index) => {
                const originalIndex = ticketTypes.findIndex(t => t === ticket);
                return (
                  <div key={ticket.id || index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        Tiket #{index + 1}
                        {ticket.isNew && <span className="text-xs text-primary ml-2">(Baru)</span>}
                      </span>
                      {activeTicketTypes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTicketType(originalIndex)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Nama Tiket *</Label>
                        <Input
                          value={ticket.name}
                          onChange={(e) => updateTicketType(originalIndex, "name", e.target.value)}
                          placeholder="Regular, VIP, VVIP..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Harga (Rp) *</Label>
                        <Input
                          type="number"
                          value={ticket.price || ""}
                          onChange={(e) => updateTicketType(originalIndex, "price", parseInt(e.target.value) || 0)}
                          placeholder="100000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Jumlah Tiket *</Label>
                        <Input
                          type="number"
                          value={ticket.total_quantity || ""}
                          onChange={(e) => updateTicketType(originalIndex, "total_quantity", parseInt(e.target.value) || 0)}
                          placeholder="100"
                          min={ticket.isNew ? 1 : (ticket.total_quantity - (ticket.available_quantity || 0))}
                        />
                        {!ticket.isNew && ticket.available_quantity !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            Tersisa: {ticket.available_quantity} tiket
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Deskripsi</Label>
                      <Input
                        value={ticket.description}
                        onChange={(e) => updateTicketType(originalIndex, "description", e.target.value)}
                        placeholder="Deskripsi tiket..."
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Commission Info */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Info Komisi:</strong> Platform akan mengambil {settings?.platform_commission_percent || 10}% 
                dari setiap transaksi penjualan tiket. Sisa {100 - (settings?.platform_commission_percent || 10)}% 
                akan menjadi pendapatan Anda.
              </p>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate(-1)}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              variant="secondary" 
              className="flex-1"
              disabled={updateEventMutation.isPending}
            >
              {updateEventMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan Perubahan
            </Button>
            {(event.event_status === "draft" || event.event_status === "rejected") && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    type="button" 
                    variant="gold" 
                    className="flex-1"
                    disabled={submitForApprovalMutation.isPending}
                  >
                    {submitForApprovalMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Ajukan untuk Review
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ajukan Event untuk Review?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Setelah diajukan, event akan direview oleh admin sebelum ditampilkan ke publik.
                      Pastikan semua data sudah benar.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => submitForApprovalMutation.mutate()}>
                      Ya, Ajukan
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </form>
      </div>
    </AgentLayout>
  );
};

export default AgentEventEdit;
