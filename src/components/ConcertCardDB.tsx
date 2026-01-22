import { Calendar, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Concert } from "@/types/database";
import { useLowestTicketPrice } from "@/hooks/useConcerts";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { getAspectRatioClass } from "@/lib/aspectRatio";
import { cn } from "@/lib/utils";

interface ConcertCardDBProps {
  concert: Concert & { image_aspect_ratio?: string | null };
}

const ConcertCardDB = ({ concert }: ConcertCardDBProps) => {
  const { data: lowestPrice = 0 } = useLowestTicketPrice(concert.id);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "d MMMM yyyy", { locale: localeId });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5) + " WIB";
  };

  return (
    <div
      className={`group glass-card rounded-2xl overflow-hidden hover-lift ${
        concert.is_featured ? "ring-2 ring-primary/50" : ""
      }`}
    >
      {/* Image Container */}
      <div className={cn(
        "relative overflow-hidden",
        getAspectRatioClass(concert.image_aspect_ratio)
      )}>
        <img
          src={concert.image_url || "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&auto=format&fit=crop"}
          alt={concert.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {concert.is_featured && (
            <Badge className="bg-gradient-gold text-primary-foreground border-0">
              Featured
            </Badge>
          )}
          <Badge variant="secondary" className="bg-secondary/80 backdrop-blur">
            {concert.category}
          </Badge>
        </div>

        {/* Price Tag */}
        <div className="absolute bottom-4 right-4">
          <div className="glass-card px-4 py-2 rounded-full">
            <span className="text-sm text-muted-foreground">Mulai dari</span>
            <p className="font-bold text-primary">{formatPrice(lowestPrice)}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display text-xl font-bold text-foreground mb-1 line-clamp-1">
          {concert.title}
        </h3>
        <p className="text-primary font-medium mb-4">{concert.artist}</p>

        {/* Info */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{formatDate(concert.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 text-primary" />
            <span>{formatTime(concert.time)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="line-clamp-1">{concert.venue}, {concert.city}</span>
          </div>
        </div>

        {/* Action */}
        <Link to={`/concert/${concert.id}`}>
          <Button variant="gold" className="w-full">
            Lihat Detail
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ConcertCardDB;
