import { CheckCircle2, Drama, FileText, Sparkles, Ticket, TrendingUp, Trophy, Users, Vote, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PageLoader } from "@/components/Spinner";
import { reportApi } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { DashboardStats } from "@/lib/types";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    reportApi.dashboard().then(setStats).catch(() => null);
  }, []);

  if (!stats) return <PageLoader />;

  const cards = [
    { label: "Tickets vendus", value: stats.total_tickets_sold, hint: "Tous galas confondus", Icon: Ticket },
    { label: "Tickets scannés", value: stats.total_tickets_scanned, hint: `${stats.total_tickets_sold - stats.total_tickets_scanned} en attente`, Icon: CheckCircle2 },
    { label: "Recettes totales", value: formatMoney(stats.total_revenue), hint: "Encaissements caisse", Icon: Wallet },
    { label: "Votes enregistrés", value: stats.total_votes, hint: `${stats.total_categories} catégories`, Icon: Vote },
    { label: "Participants", value: stats.total_participants, hint: `${stats.total_users} utilisateurs au total`, Icon: Users },
    { label: "Nominés en lice", value: stats.total_nominees, hint: `${stats.total_categories} catégories actives`, Icon: Sparkles },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-4xl font-bold">Vue d'ensemble</h2>
          <p className="text-ink-muted mt-1">Pilotez l'édition en cours d'un coup d'œil.</p>
        </div>
        <Link to="/admin/galas" className="btn btn-secondary">
          Gérer les galas
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="relative bg-bg-elev border border-line rounded-2xl p-6">
            <span className="absolute top-5 right-5 icon-tile icon-tile-accent w-10 h-10">
              <c.Icon size={18} />
            </span>
            <p className="text-xs uppercase tracking-wider text-ink-muted mb-2.5">{c.label}</p>
            <p className="font-serif text-4xl font-bold leading-none">{c.value}</p>
            <p className="text-xs text-ink-muted mt-2">{c.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickLink to="/admin/galas" Icon={Drama} title="Créer un gala" desc="Configurez date, lieu, thème" />
        <QuickLink to="/admin/categories" Icon={Trophy} title="Catégories" desc="Gérez les nominations" />
        <QuickLink to="/admin/users" Icon={Users} title="Utilisateurs" desc="Caissières, contrôleurs, participants" />
        <QuickLink to="/admin/reports" Icon={TrendingUp} title="Rapports détaillés" desc="Stats par type, résultats par catégorie" />
        <QuickLink to="/admin/certificates" Icon={FileText} title="Certificats" desc="Générer les PDFs des lauréats" />
      </div>
    </div>
  );
}

function QuickLink({ to, Icon, title, desc }: { to: string; Icon: any; title: string; desc: string }) {
  return (
    <Link to={to} className="group block bg-bg-elev border border-line rounded-2xl p-5 hover:border-accent transition">
      <span className="icon-tile icon-tile-primary w-12 h-12 mb-3">
        <Icon size={22} />
      </span>
      <p className="font-semibold mb-1 group-hover:text-accent transition">{title}</p>
      <p className="text-xs text-ink-muted">{desc}</p>
    </Link>
  );
}
