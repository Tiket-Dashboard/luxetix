import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Plus, Trash2 } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AgentLayout from "@/components/agent/AgentLayout";
import ImageUploadWithAspectRatio, { AspectRatioType } from "@/components/admin/ImageUploadWithAspectRatio";

interface TicketType {
  name: string;
  description: string;
  price: number;
  total_quantity: number;
  benefits: string[];
}

const CATEGORIES = ["Pop", "Rock", "Jazz", "EDM", "Hip-Hop", "Classical", "Lainnya"];

const AgentEventCreate = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("Lainnya");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAspectRatio, setImageAspectRatio] = useState<AspectRatioType>("16:9");
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { name: "Regular", description: "", price: 0, total_quantity: 100, benefits: [] }
  ]);

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

  const createEventMutation = useMutation({
    mutationFn: async () => {
      if (!agent) throw new Error("Agent not found");

      // Determine event status
      const eventStatus = agent.is_auto_approve ? "approved" : "pending_approval";

      // Create concert
      const { data: concert, error: concertError } = await supabase
        .from("concerts")
        .insert({
          title,
          artist,
          description,
          date,
          time,
          venue,
          city,
          category,
          image_url: imageUrl,
          image_aspect_ratio: imageAspectRatio,
          agent_id: agent.id,
          event_status: eventStatus,
          is_active: agent.is_auto_approve, // Only active if auto-approved
          platform_commission_percent: settings?.platform_commission_percent || 10,
        })
        .select()
        .single();

      if (concertError) throw concertError;

      // Create ticket types
      const ticketTypesData = ticketTypes.map((tt) => ({
        concert_id: concert.id,
        name: tt.name,
        description: tt.description || null,
        price: tt.price,
        total_quantity: tt.total_quantity,
        available_quantity: tt.total_quantity,
        benefits: tt.benefits.filter(Boolean),
      }));

      const { error: ticketsError } = await supabase
        .from("ticket_types")
        .insert(ticketTypesData);

      if (ticketsError) throw ticketsError;

      return { concert, eventStatus };
    },
    onSuccess: ({ eventStatus }) => {
      const message = eventStatus === "approved" 
        ? "Event berhasil dibuat dan langsung aktif!"
        : "Event berhasil dibuat dan menunggu approval admin.";
      toast({ title: "Berhasil!", description: message });
      navigate("/agent/events");
    },
    onError: (error: Error) => {
      toast({ title: "Gagal membuat event", description: error.message, variant: "destructive" });
    },
  });

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { name: "", description: "", price: 0, total_quantity: 50, benefits: [] }]);
  };

  const removeTicketType = (index: number) => {
    if (ticketTypes.length > 1) {
      setTicketTypes(ticketTypes.filter((_, i) => i !== index));
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

    if (ticketTypes.some(tt => !tt.name || tt.price <= 0 || tt.total_quantity <= 0)) {
      toast({ title: "Lengkapi data tiket dengan benar", variant: "destructive" });
      return;
    }

    createEventMutation.mutate();
  };

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

  return (
    <AgentLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold">Buat Event Baru</h1>
            <p className="text-muted-foreground">
              {agent.is_auto_approve 
                ? "Event akan langsung aktif setelah dibuat"
                : "Event akan di-review oleh admin sebelum ditampilkan"}
            </p>
          </div>
        </div>

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

              <ImageUploadWithAspectRatio
                imageUrl={imageUrl}
                aspectRatio={imageAspectRatio}
                onImageChange={setImageUrl}
                onAspectRatioChange={setImageAspectRatio}
                folder="concerts"
              />
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
              {ticketTypes.map((ticket, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Tiket #{index + 1}</span>
                    {ticketTypes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTicketType(index)}
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
                        onChange={(e) => updateTicketType(index, "name", e.target.value)}
                        placeholder="Regular, VIP, VVIP..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Harga (Rp) *</Label>
                      <Input
                        type="number"
                        value={ticket.price || ""}
                        onChange={(e) => updateTicketType(index, "price", parseInt(e.target.value) || 0)}
                        placeholder="100000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Jumlah Tiket *</Label>
                      <Input
                        type="number"
                        value={ticket.total_quantity || ""}
                        onChange={(e) => updateTicketType(index, "total_quantity", parseInt(e.target.value) || 0)}
                        placeholder="100"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Deskripsi</Label>
                    <Input
                      value={ticket.description}
                      onChange={(e) => updateTicketType(index, "description", e.target.value)}
                      placeholder="Deskripsi tiket..."
                    />
                  </div>
                </div>
              ))}
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
              variant="gold" 
              className="flex-1"
              disabled={createEventMutation.isPending}
            >
              {createEventMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Buat Event
            </Button>
          </div>
        </form>
      </div>
    </AgentLayout>
  );
};

export default AgentEventCreate;
