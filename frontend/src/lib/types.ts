export type Role = "super_admin" | "cashier" | "controller" | "participant";

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  school_promotion: string | null;
  is_active: boolean;
}

export interface UserWithSpend extends User {
  total_spent: number;
  tickets_count: number;
  created_at: string;
}

export interface Gala {
  id: number;
  name: string;
  edition_year: number;
  theme: string;
  event_date: string;
  location: string;
  dress_code: string | null;
  program: string | null;
  poster_url: string | null;
  video_url: string | null;
  tiktok_url: string | null;
  telegram_url: string | null;
  is_active: boolean;
  voting_open: boolean;
  live_results_visible: boolean;
  created_at: string;
}

export type TicketType = "solo" | "duo" | "gbonhi";
export type AttendeeStatus = "esoteric" | "regular";
export type TicketStatus = "sold" | "scanned" | "cancelled";

export interface Ticket {
  id: number;
  code: string;
  gala_id: number;
  type: TicketType;
  attendee_status: AttendeeStatus;
  status: TicketStatus;
  price: number;
  buyer_full_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  partner_full_name: string | null;
  group_size: number | null;
  sold_by_id: number | null;
  sold_at: string;
  scanned_at: string | null;
}

export interface ScanResult {
  ok: boolean;
  message: string;
  ticket: Ticket | null;
  already_scanned: boolean;
}

export interface Category {
  id: number;
  gala_id: number;
  name: string;
  description: string | null;
  icon: string | null;
  order_index: number;
  total_votes: number;
  nominees_count: number;
}

export interface Nominee {
  id: number;
  category_id: number;
  name: string;
  school_promotion: string | null;
  photo_url: string | null;
  description: string | null;
  biography: string | null;
  achievements: string | null;
  contact_email: string | null;
  votes_count: number;
}

export interface LiveNominee {
  id: number;
  name: string;
  school_promotion: string | null;
  photo_url: string | null;
  votes: number;
  share: number;
}

export interface LiveCategory {
  category_id: number;
  category_name: string;
  category_icon: string | null;
  total_votes: number;
  nominees: LiveNominee[];
}

export interface LiveResults {
  gala: {
    id: number;
    name: string;
    edition_year: number;
    theme: string;
    event_date: string;
    location: string;
    voting_open: boolean;
  } | null;
  categories: LiveCategory[];
  visible: boolean;
}

export interface NotificationItem {
  id: number;
  channel: "email" | "sms";
  status: "queued" | "sent" | "failed";
  recipient: string;
  subject: string | null;
  body: string;
  error: string | null;
  user_id: number | null;
  created_at: string;
  sent_at: string | null;
}

export interface ScanLogEntry {
  id: number;
  scanned_at: string;
  ticket_code: string;
  ticket_buyer: string;
  ticket_type: string;
  controller_name: string;
  controller_email: string;
}

export interface Student {
  id: number;
  matricule: string;
  full_name: string;
  email: string | null;
  promotion: string;
  phone: string | null;
  created_at: string;
}

export interface StudentImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  total_rows: number;
}

export interface MyVote {
  category_id: number;
  nominee_id: number;
}

export interface DashboardStats {
  total_galas: number;
  active_gala_id: number | null;
  total_users: number;
  total_participants: number;
  total_tickets_sold: number;
  total_tickets_scanned: number;
  total_revenue: number;
  total_votes: number;
  total_categories: number;
  total_nominees: number;
}

export interface CategoryResult {
  category_id: number;
  category_name: string;
  leader_nominee_id: number | null;
  leader_nominee_name: string | null;
  leader_votes: number;
  total_votes: number;
}

export interface FullReport {
  stats: DashboardStats;
  tickets_by_type: { type: string; count: number; revenue: number }[];
  category_results: CategoryResult[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
