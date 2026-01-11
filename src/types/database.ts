export interface Concert {
  id: string;
  title: string;
  artist: string;
  description: string | null;
  date: string;
  time: string;
  venue: string;
  city: string;
  image_url: string | null;
  category: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketType {
  id: string;
  concert_id: string;
  name: string;
  description: string | null;
  price: number;
  benefits: string[];
  total_quantity: number;
  available_quantity: number;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  order_number: string;
  total_amount: number;
  status: string;
  payment_method: string | null;
  payment_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  ticket_type_id: string | null;
  concert_id: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface ConcertWithTickets extends Concert {
  ticket_types: TicketType[];
}
