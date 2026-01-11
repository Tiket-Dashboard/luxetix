import { Calendar, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ConcertCardProps {
  id: string;
  title: string;
  artist: string;
  date: string;
  time: string;
  venue: string;
  image: string;
  price: number;
  category?: string;
  isFeatured?: boolean;
}

const ConcertCard = ({
  id,
  title,
  artist,
  date,
  time,
  venue,
  image,
  price,
  category,
  isFeatured = false,
}: ConcertCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div
      className={`group glass-card rounded-2xl overflow-hidden hover-lift ${
        isFeatured ? "ring-2 ring-primary/50" : ""
      }`}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {isFeatured && (
            <Badge className="bg-gradient-gold text-primary-foreground border-0">
              Featured
            </Badge>
          )}
          {category && (
            <Badge variant="secondary" className="bg-secondary/80 backdrop-blur">
              {category}
            </Badge>
          )}
        </div>

        {/* Price Tag */}
        <div className="absolute bottom-4 right-4">
          <div className="glass-card px-4 py-2 rounded-full">
            <span className="text-sm text-muted-foreground">Mulai dari</span>
            <p className="font-bold text-primary">{formatPrice(price)}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display text-xl font-bold text-foreground mb-1 line-clamp-1">
          {title}
        </h3>
        <p className="text-primary font-medium mb-4">{artist}</p>

        {/* Info */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 text-primary" />
            <span>{time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="line-clamp-1">{venue}</span>
          </div>
        </div>

        {/* Action */}
        <Link to={`/concert/${id}`}>
          <Button variant="gold" className="w-full">
            Lihat Detail
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ConcertCard;
