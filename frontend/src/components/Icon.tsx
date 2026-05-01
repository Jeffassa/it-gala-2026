import {
  Award, ArrowRight, ArrowUpRight, BarChart3, Calendar, Camera, Check,
  ChevronRight, Clock, Crown, Download, Drama, Edit, FileText, Film,
  Gem, GraduationCap, Heart, Image as ImageIcon, LayoutDashboard,
  LogOut, Lock, Mail, MapPin, Menu, MessageSquare, MonitorPlay, Music2,
  Plus, Power, Printer, RefreshCw, Rocket, ScrollText, Search, Send, Shield,
  Shirt, Smartphone, Smile, Sparkles, Star, Ticket, Trash2, TrendingUp,
  Trophy, User, Users, Video, X, Wallet, ListChecks, Eye, Vote,
  Quote, type LucideIcon, type LucideProps,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  "heart": Heart,
  "smile": Smile,
  "rocket": Rocket,
  "smartphone": Smartphone,
  "gem": Gem,
  "trophy": Trophy,
  "calendar": Calendar,
  "map-pin": MapPin,
  "ticket": Ticket,
  "shirt": Shirt,
  "drama": Drama,
  "sparkles": Sparkles,
  "users": Users,
  "user": User,
  "trending-up": TrendingUp,
  "file-text": FileText,
  "mail": Mail,
  "scroll-text": ScrollText,
  "monitor-play": MonitorPlay,
  "camera": Camera,
  "log-out": LogOut,
  "check": Check,
  "x": X,
  "menu": Menu,
  "search": Search,
  "plus": Plus,
  "edit": Edit,
  "trash": Trash2,
  "send": Send,
  "download": Download,
  "printer": Printer,
  "refresh": RefreshCw,
  "power": Power,
  "shield": Shield,
  "lock": Lock,
  "vote": Vote,
  "wallet": Wallet,
  "checks": ListChecks,
  "eye": Eye,
  "video": Video,
  "music": Music2,
  "star": Star,
  "crown": Crown,
  "award": Award,
  "image": ImageIcon,
  "film": Film,
  "clock": Clock,
  "chevron-right": ChevronRight,
  "arrow-right": ArrowRight,
  "arrow-up-right": ArrowUpRight,
  "bar-chart": BarChart3,
  "layout-dashboard": LayoutDashboard,
  "message": MessageSquare,
  "quote": Quote,
};

interface IconProps extends LucideProps {
  name: string;
}

export function Icon({ name, size = 18, strokeWidth = 1.8, ...props }: IconProps) {
  const Cmp = ICON_MAP[name] ?? Sparkles;
  return <Cmp size={size} strokeWidth={strokeWidth} {...props} />;
}

export {
  Award, ArrowRight, ArrowUpRight, BarChart3, Calendar, Camera, Check,
  ChevronRight, Clock, Crown, Download, Drama, Edit, FileText, Film,
  Gem, GraduationCap, Heart, ImageIcon, LayoutDashboard,
  LogOut, Lock, Mail, MapPin, Menu, MessageSquare, MonitorPlay, Music2,
  Plus, Power, Printer, RefreshCw, Rocket, ScrollText, Search, Send, Shield,
  Shirt, Smartphone, Smile, Sparkles, Star, Ticket, Trash2, TrendingUp,
  Trophy, User, Users, Video, X, Wallet, ListChecks, Eye, Vote, Quote,
};
