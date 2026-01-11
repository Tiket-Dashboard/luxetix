import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConcertCardDB from "@/components/ConcertCardDB";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useConcerts, useCategories } from "@/hooks/useConcerts";

const Concerts = () => {
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: concerts = [], isLoading: concertsLoading } = useConcerts();
  const { data: categories = ["Semua"], isLoading: categoriesLoading } = useCategories();
  
  const filteredConcerts = concerts
    .filter((concert) => 
      selectedCategory === "Semua" || concert.category === selectedCategory
    )
    .filter((concert) =>
      concert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      concert.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      concert.venue.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const isLoading = concertsLoading || categoriesLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Temukan <span className="text-gradient-gold">Konser</span> Impianmu
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Jelajahi berbagai konser dari artis lokal hingga internasional
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari konser, artis, atau venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg bg-card border-border/50 focus:border-primary"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Grid */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "gold" : "secondary"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Results Count */}
          <p className="text-muted-foreground mb-6">
            Menampilkan{" "}
            <span className="text-primary font-medium">
              {filteredConcerts.length}
            </span>{" "}
            konser
          </p>

          {/* Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredConcerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredConcerts.map((concert) => (
                <ConcertCardDB key={concert.id} concert={concert} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                Tidak ada konser yang ditemukan.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Concerts;
