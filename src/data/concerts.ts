export interface Concert {
  id: string;
  title: string;
  artist: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  image: string;
  description: string;
  category: string;
  tickets: TicketType[];
  isFeatured?: boolean;
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  description: string;
  benefits: string[];
  available: number;
}

export const concerts: Concert[] = [
  {
    id: "1",
    title: "The Grandeur World Tour",
    artist: "Aurora Symphony",
    date: "15 Februari 2026",
    time: "19:00 WIB",
    venue: "Gelora Bung Karno",
    city: "Jakarta",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&auto=format&fit=crop",
    description: "Saksikan pertunjukan spektakuler Aurora Symphony dalam tur dunia mereka. Dengan orkestra penuh dan visual yang memukau, ini adalah pengalaman yang tidak akan terlupakan.",
    category: "Orkestra",
    isFeatured: true,
    tickets: [
      {
        id: "t1",
        name: "VVIP Platinum",
        price: 5000000,
        description: "Pengalaman paling eksklusif",
        benefits: ["Duduk baris depan", "Meet & Greet artis", "Merchandise eksklusif", "Akses backstage", "Welcome drink & snacks"],
        available: 50,
      },
      {
        id: "t2",
        name: "VIP Gold",
        price: 2500000,
        description: "Pengalaman premium",
        benefits: ["Duduk area VIP", "Merchandise eksklusif", "Welcome drink"],
        available: 200,
      },
      {
        id: "t3",
        name: "Regular",
        price: 750000,
        description: "Tiket reguler",
        benefits: ["Akses masuk konser", "Area berdiri/duduk reguler"],
        available: 1000,
      },
    ],
  },
  {
    id: "2",
    title: "Neon Dreams Festival",
    artist: "DJ Stellar & Friends",
    date: "22 Maret 2026",
    time: "20:00 WIB",
    venue: "ICE BSD",
    city: "Tangerang",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop",
    description: "Festival musik elektronik terbesar tahun ini dengan line-up DJ internasional. Rasakan energi tak terbatas dengan visual LED spektakuler.",
    category: "EDM",
    isFeatured: true,
    tickets: [
      {
        id: "t4",
        name: "VVIP Table",
        price: 8000000,
        description: "Meja VIP untuk 4 orang",
        benefits: ["Meja eksklusif area VIP", "2 botol minuman premium", "Dedicated server", "Priority entrance"],
        available: 20,
      },
      {
        id: "t5",
        name: "VIP Standing",
        price: 1500000,
        description: "Area VIP berdiri",
        benefits: ["Akses area VIP", "Fast track entrance", "Locker gratis"],
        available: 500,
      },
      {
        id: "t6",
        name: "General Admission",
        price: 500000,
        description: "Tiket regular",
        benefits: ["Akses festival ground"],
        available: 5000,
      },
    ],
  },
  {
    id: "3",
    title: "Acoustic Night",
    artist: "Raisa",
    date: "10 April 2026",
    time: "19:30 WIB",
    venue: "The Kasablanka Hall",
    city: "Jakarta",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop",
    description: "Malam akustik intim bersama Raisa dengan aransemen baru dari lagu-lagu hits-nya. Suasana hangat dan personal.",
    category: "Pop",
    tickets: [
      {
        id: "t7",
        name: "Diamond",
        price: 3000000,
        description: "Paket paling lengkap",
        benefits: ["Front row seating", "Photo session", "Signed album", "Dinner package"],
        available: 30,
      },
      {
        id: "t8",
        name: "Gold",
        price: 1500000,
        description: "Premium seating",
        benefits: ["Premium seating", "Signed poster"],
        available: 150,
      },
      {
        id: "t9",
        name: "Silver",
        price: 750000,
        description: "Standard seating",
        benefits: ["Standard seating"],
        available: 300,
      },
    ],
  },
  {
    id: "4",
    title: "Rock Revolution",
    artist: "Slank",
    date: "5 Mei 2026",
    time: "18:00 WIB",
    venue: "Stadion Patriot",
    city: "Bekasi",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop",
    description: "Slankers, bersiaplah! Konser rock legendaris dengan semua hits klasik yang membuatmu bergoyang.",
    category: "Rock",
    tickets: [
      {
        id: "t10",
        name: "Festival",
        price: 350000,
        description: "Standing area",
        benefits: ["Akses area festival"],
        available: 10000,
      },
      {
        id: "t11",
        name: "Tribune VIP",
        price: 850000,
        description: "Duduk tribune VIP",
        benefits: ["Duduk tribune VIP", "Merchandise"],
        available: 2000,
      },
    ],
  },
  {
    id: "5",
    title: "Jazz Under The Stars",
    artist: "Tompi & Friends",
    date: "20 Juni 2026",
    time: "19:00 WIB",
    venue: "Prambanan Temple",
    city: "Yogyakarta",
    image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&auto=format&fit=crop",
    description: "Malam jazz romantis di bawah bintang dengan latar belakang Candi Prambanan yang megah.",
    category: "Jazz",
    tickets: [
      {
        id: "t12",
        name: "Romantic Package",
        price: 4000000,
        description: "Paket untuk 2 orang",
        benefits: ["Meja private untuk 2", "Candlelight dinner", "Wine selection", "Rose bouquet"],
        available: 25,
      },
      {
        id: "t13",
        name: "Premium",
        price: 1200000,
        description: "Premium seating",
        benefits: ["Premium seating", "Welcome drink"],
        available: 200,
      },
      {
        id: "t14",
        name: "Regular",
        price: 450000,
        description: "Regular seating",
        benefits: ["Regular seating"],
        available: 500,
      },
    ],
  },
  {
    id: "6",
    title: "K-Wave Night",
    artist: "BLACKPINK",
    date: "15 Juli 2026",
    time: "19:00 WIB",
    venue: "JIS Stadium",
    city: "Jakarta",
    image: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&auto=format&fit=crop",
    description: "Konser K-Pop paling ditunggu tahun ini! BLACKPINK membawa World Tour mereka ke Jakarta.",
    category: "K-Pop",
    isFeatured: true,
    tickets: [
      {
        id: "t15",
        name: "BLINK VIP",
        price: 7500000,
        description: "Pengalaman ultimate BLINK",
        benefits: ["Soundcheck access", "Hi-Touch session", "Exclusive photocard set", "Front standing"],
        available: 100,
      },
      {
        id: "t16",
        name: "CAT 1",
        price: 3500000,
        description: "Area terbaik",
        benefits: ["Premium standing/seating", "Official lightstick"],
        available: 1000,
      },
      {
        id: "t17",
        name: "CAT 2",
        price: 2000000,
        description: "Good view area",
        benefits: ["Good view area"],
        available: 3000,
      },
      {
        id: "t18",
        name: "CAT 3",
        price: 1200000,
        description: "Standard area",
        benefits: ["Standard area"],
        available: 5000,
      },
    ],
  },
];

export const getFeaturedConcerts = () => concerts.filter((c) => c.isFeatured);
export const getConcertById = (id: string) => concerts.find((c) => c.id === id);
export const getConcertsByCategory = (category: string) =>
  category === "Semua" ? concerts : concerts.filter((c) => c.category === category);
export const getCategories = () => ["Semua", ...new Set(concerts.map((c) => c.category))];
