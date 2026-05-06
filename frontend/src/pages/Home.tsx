import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Countdown } from "@/components/Countdown";
import { FadeIn } from "@/components/FadeIn";
import {
  ArrowRight, ArrowUpRight, Award, Calendar, Camera, Check, ChevronRight,
  Crown, Drama, Gem, GraduationCap, Heart, MapPin, Menu, MonitorPlay,
  Music2, Plus, Quote, Rocket, Shirt, Smartphone, Smile, Sparkles, Star, Ticket,
  Trophy, Users, Video, Vote, Wallet, X,
} from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { assetUrl, categoryApi, galaApi, souvenirApi } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Category, Gala, Souvenir } from "@/lib/types";

const CATEGORY_FALLBACK = [
  { name: "Top 3 par filière", description: "Les 3 premiers de chaque filière, par promotion.", icon: "trophy" },
  { name: "Majors avec mention", description: "Les majors de chaque filière ayant obtenu une moyenne ≥ 14, par promotion.", icon: "award" },
  { name: "Meilleur club", description: "Le club étudiant qui s'est le plus distingué cette année.", icon: "users" },
  { name: "Meilleur projet étudiant", description: "Le projet le plus innovant et impactant de l'année.", icon: "rocket" },
  { name: "Meilleur professeur", description: "Le professeur le plus apprécié, par promotion.", icon: "graduation-cap" },
  { name: "Meilleur basketteur", description: "Le talent du parquet, toutes promotions confondues.", icon: "star" },
  { name: "Meilleur footballeur", description: "La star du terrain, toutes promotions confondues.", icon: "star" },
  { name: "Meilleur badeur", description: "Celui ou celle qui anime toutes les soirées, par promotion.", icon: "sparkles" },
  { name: "Meilleur délégué de classe", description: "Le ou la représentant·e qui a le plus servi sa classe, par promotion.", icon: "vote" },
  { name: "Meilleur président de promotion", description: "La voix qui rassemble et qui inspire.", icon: "crown" },
  { name: "Meilleur duo (couple)", description: "Le couple le plus apprécié de l'école.", icon: "heart" },
  { name: "Le/La plus faneur(se)", description: "La star du charme, par promotion.", icon: "smile" },
  { name: "Le/La plus sociable", description: "Connaît tout le monde, par promotion.", icon: "users" },
];

const CATEGORY_ICON_MAP: Record<string, any> = {
  "graduation-cap": GraduationCap,
  "heart": Heart,
  "smile": Smile,
  "rocket": Rocket,
  "smartphone": Smartphone,
  "gem": Gem,
  "trophy": Trophy,
  "award": Award,
  "users": Users,
  "star": Star,
  "sparkles": Sparkles,
  "crown": Crown,
  "vote": Vote,
};

// Matin — IT Connect
const PROGRAM_MORNING = [
  { time: "08h00 – 08h30", title: "Accueil des participants", desc: "Installation et émargement.", icon: Users },
  { time: "08h30 – 08h45", title: "Mot d'ouverture", desc: "Présentation de l'activité.", icon: Drama },
  { time: "08h45 – 09h30", title: "Panel de professionnels", desc: "Échanges avec des experts du secteur tech.", icon: Sparkles },
  { time: "09h30 – 10h00", title: "Partage d'expérience d'alumni", desc: "Témoignages d'anciens étudiants.", icon: GraduationCap },
  { time: "10h00 – 10h20", title: "Présentation IT-Foundation", desc: "Mission, vision et engagements.", icon: Rocket },
  { time: "10h20 – 10h40", title: "IT Awards — Volet 1", desc: "Distinctions académiques.", icon: Award },
  { time: "10h40 – 11h00", title: "Attribution de parrains", desc: "Programme de mentorat.", icon: Heart },
  { time: "11h00 – 11h30", title: "Tombola & animation", desc: "Animation interactive.", icon: Gem },
  { time: "11h30 – 12h00", title: "Cocktail & Networking", desc: "Échanges informels.", icon: Smile },
];

// Soir — IT Gala
const PROGRAM_EVENING = [
  { time: "20h00 – 20h30", title: "Cocktail & installation", desc: "Accueil des invités, photos officielles.", icon: Smile },
  { time: "20h30 – 20h45", title: "Allocutions", desc: "Mots de bienvenue.", icon: Drama },
  { time: "20h45 – 21h00", title: "Grand bilan de l'année", desc: "Rétrospective de l'année écoulée.", icon: Sparkles },
  { time: "21h00 – 21h20", title: "Récompenses Hackathon & IT Awards", desc: "Remise des trophées.", icon: Trophy },
  { time: "21h20 – 22h00", title: "Défilé", desc: "Présentation des invités sur le tapis rouge.", icon: Star },
  { time: "22h00 – 23h00", title: "Restauration", desc: "Dîner de gala.", icon: Crown },
  { time: "23h00 – 23h40", title: "IT Queen & King", desc: "Élection des figures de la soirée.", icon: Crown },
  { time: "23h40 – 00h00", title: "Nuit des talents", desc: "Showcase de talents étudiants.", icon: Video },
  { time: "00h00 – 00h20", title: "Quiz & mini-jeux", desc: "Animations interactives.", icon: Gem },
  { time: "00h20 – 00h40", title: "Cérémonie des roses", desc: "Moment d'hommage.", icon: Heart },
  { time: "00h40 – 01h20", title: "Prestation d'artiste", desc: "Performance live.", icon: Music2 },
  { time: "01h20 – 02h00", title: "Bal poussière", desc: "Soirée dansante.", icon: Music2 },
];

const STATS = [
  { value: "+200", label: "Invités attendus" },
  { value: "13", label: "Catégories à départager" },
  { value: "+20", label: "Nominés en lice" },
  { value: "1", label: "Soirée mémorable" },
];

const VALUES = [
  { icon: Award, title: "Excellence", desc: "Reconnaître les talents qui font avancer l'écosystème tech ivoirien." },
  { icon: Sparkles, title: "Créativité", desc: "Célébrer celles et ceux qui osent, innovent et inspirent les générations futures." },
  { icon: Users, title: "Communauté", desc: "Réunir étudiants, alumni, mentors et partenaires autour d'une cause commune." },
];

const FAQ = [
  { q: "Comment voter pour mes nominés favoris ?", a: "Créez votre compte voteur via « Mon espace de vote », puis rendez-vous dans la salle de vote pour découvrir les nominés et faire votre choix dans chaque catégorie. Un seul vote par catégorie est autorisé, mais vous pouvez le modifier jusqu'à la clôture." },
  { q: "Où acheter mes tickets ?", a: "Les tickets s'achètent directement à la caisse officielle de l'événement. Trois formules sont proposées : Solo (15 000 FCFA), Duo (25 000 FCFA) et Gbonhi pour un groupe d'amis (65 000 FCFA)." },
  { q: "Le code vestimentaire est-il strict ?", a: "Oui, l'événement applique un dress code Black Tie. Costumes sombres et tenues de soirée sont attendus pour respecter l'esprit du gala." },
  { q: "Puis-je récupérer mon ticket plus tard ?", a: "Votre ticket est associé à votre email et à un QR code unique. Vous le présentez à l'entrée pour validation par les contrôleurs équipés de scanners." },
  { q: "Y aura-t-il une retransmission ?", a: "Oui. Les résultats des votes seront diffusés en direct sur la page « Grand écran » durant la cérémonie, et un récapitulatif sera publié sur nos canaux officiels." },
];

export default function HomePage() {
  const [gala, setGala] = useState<Gala | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [souvenirs, setSouvenirs] = useState<Souvenir[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => { galaApi.active().then(setGala).catch(() => null); }, []);
  useEffect(() => {
    if (!gala) return;
    categoryApi.list(gala.id).then(setCategories).catch(() => setCategories([]));
    souvenirApi.list(gala.id).then(setSouvenirs).catch(() => setSouvenirs([]));
  }, [gala]);

  const headerLinks = [
    { href: "#about", label: "À propos" },
    { href: "#programme", label: "Programme" },
    { href: "#categories", label: "Catégories" },
    { href: "#archive", label: "Édition précédente" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-bg/75 border-b border-line">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 py-4">
          <Logo />
          <nav className="hidden lg:flex items-center gap-8 text-sm text-ink-muted">
            {headerLinks.map((l) => (
              <a key={l.href} href={l.href} className="relative hover:text-accent transition group">
                {l.label}
                <span className="absolute -bottom-1.5 inset-x-0 h-px bg-accent scale-x-0 group-hover:scale-x-100 transition origin-left" />
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/live" className="hidden md:inline-flex btn btn-ghost btn-sm">
              <MonitorPlay size={16} /> Grand écran
            </Link>
            <Link to="/login" className="btn btn-primary btn-sm sm:btn">
              <span className="hidden sm:inline">Mon espace</span>
              <span className="sm:hidden">Voter</span>
              <ArrowRight size={16} />
            </Link>
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Menu"
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-line-strong text-ink hover:border-accent hover:text-accent transition"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-bg/95 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-line">
            <Logo />
            <button onClick={() => setMenuOpen(false)} className="btn btn-ghost btn-icon" aria-label="Fermer">
              <X size={18} />
            </button>
          </div>
          <nav className="flex flex-col p-6 gap-2">
            {headerLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="px-4 py-3 rounded-lg hover:bg-bg-elev2 text-base font-medium">
                {l.label}
              </a>
            ))}
            <Link to="/live" onClick={() => setMenuOpen(false)} className="px-4 py-3 rounded-lg hover:bg-bg-elev2 text-base font-medium flex items-center gap-2">
              <MonitorPlay size={18} /> Grand écran
            </Link>
            <Link to="/login" onClick={() => setMenuOpen(false)} className="btn btn-primary btn-lg mt-4">
              Mon espace de vote <ArrowRight size={18} />
            </Link>
          </nav>
        </div>
      )}

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-28 pb-20 overflow-hidden">
        <div
          className="absolute inset-0 -z-20"
          style={{ background: "radial-gradient(ellipse at top right, rgba(123, 2, 2, 0.45), transparent 60%), radial-gradient(ellipse at bottom left, rgba(245, 157, 152, 0.18), transparent 55%), linear-gradient(180deg, #0E0808 0%, #1A1010 100%)" }}
        />
        <div className="absolute inset-0 -z-10 glow-grid" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(640px,90vw)] h-[min(640px,90vw)] -z-10 animate-shimmer"
          style={{ background: "radial-gradient(circle, rgba(245, 157, 152, 0.12), transparent 70%)", filter: "blur(60px)" }}
        />

        <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <h1 className="font-serif font-bold leading-[0.95] mb-5 text-balance mx-auto" style={{ fontSize: "clamp(2.6rem, 7vw, 5.6rem)" }}>
              <span className="block">A Night </span>
              <span className="block primary-text">To Shine</span>
              <span className="block">Behind The Mask.</span>
            </h1>
            <p className="font-serif italic text-accent text-xl mb-4">« Cette nuit, c'est ton moment de briller »</p>
            {/* <p className="text-ink-muted text-lg max-w-2xl mx-auto mb-9">
              Le <strong className="text-ink">IT Gala</strong> célèbre les talents qui façonnent le numérique de demain.
              Étudiants, alumni, créateurs et innovateurs : une soirée pour reconnaître les meilleurs et inspirer la suite;
              UNE SOIRÉE D’EXCELLENCE, DE NETWORKING ET DE CÉLÉBRATION

            </p> */}

            <div className="flex gap-3 flex-wrap justify-center mb-12">
              <Link to="/login" className="btn btn-primary btn-lg">
                Mon espace <ArrowRight size={18} />
              </Link>
              <a href="#programme" className="btn btn-ghost btn-lg">
                Découvrir le programme
              </a>
            </div>
          </FadeIn>

        </div>

      </section>

      {/* Stats */}
      {/* <section className="py-20 border-y border-line bg-bg-elev/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <FadeIn key={s.label} delay={i * 80} className="text-center">
              <p className="font-serif text-5xl md:text-6xl font-black accent-text leading-none mb-2">{s.value}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">{s.label}</p>
            </FadeIn>
          ))}
        </div>
      </section> */}

      {/* Countdown */}
      <section id="countdown" className="py-24 bg-bg-elev/40 border-y border-line">
        <div className="max-w-3xl mx-auto px-6">
          <FadeIn className="text-center mb-10">
            <span className="section-eyebrow">Plus que quelques jours</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-3 text-balance">
              Le grand soir <span className="primary-text">approche</span>.
            </h2>
            <p className="text-ink-muted">Préparez-vous, le rideau est sur le point de se lever.</p>
          </FadeIn>

          <FadeIn delay={150}>
            <div className="relative max-w-2xl mx-auto">
              <div className="bg-bg-elev/80 backdrop-blur-xl border border-line rounded-3xl p-6 sm:p-8 shadow-elev">
                <p className="text-xs uppercase tracking-[0.3em] text-accent mb-5 flex items-center gap-2 justify-center">
                  <Calendar size={14} /> Compte à rebours
                </p>
                {gala ? <Countdown target={gala.event_date} /> : <Countdown target="2026-06-06T19:00:00" />}
                <div className="mt-7 pt-6 border-t border-line grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-ink-muted mb-1">Date</p>
                    <p className="font-semibold text-sm">{gala ? formatDate(gala.event_date) : "06 juin 2026"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-ink-muted mb-1">Lieu</p>
                    <p className="font-semibold text-sm">{gala?.location.split(",")[0] ?? "Palais de la Culture"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-ink-muted mb-1">Tenue</p>
                    <p className="font-semibold text-sm">Rouge bordeaux, or rosé et noir</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-accent/20 blur-3xl rounded-full -z-10" />
              <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-primary/30 blur-3xl rounded-full -z-10" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1fr_1.1fr] gap-14 items-center">
          <FadeIn>
            <span className="section-eyebrow">À propos</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-5 text-balance">
              L'IT GALA  <span className="primary-text">DE L'ESATIC</span>.
            </h2>
            <p className="text-ink-muted text-lg leading-relaxed mb-5">
              Baptisé IT-Gala, le dîner gala des étudiants de l’ESATIC est le plus grand évènement festif et professionnel organisé par le Conseil Estudiantin de l’ESATIC (C2E) qui a pour but de créer un cadre associatif et d’échanges.
            </p>
            <p className="text-ink-muted leading-relaxed mb-7">
              Au-delà de son aspect purement festif, il réunit les grands acteurs de l’industrie des Technologies de l’Information et de la Communication (TIC). Il favorise également les retrouvailles entre toutes les promotions de l’ESATIC, et fait le bilan de toutes les activités effectuées au cours de l’année. La 7ème Edition du gala de fin d’année se déroulera en deux phases dont la première, l'it connect débutera à 08h00 et la seconde, l'it gala se déroulera à 20h00 le 06 juin 2026.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/login" className="btn btn-accent">
                <Vote /> Voter maintenant
              </Link>
              <a href="#programme" className="btn btn-ghost">
                Voir le programme <ChevronRight size={16} />
              </a>
            </div>
          </FadeIn>
          <FadeIn delay={150} className="grid sm:grid-cols-2 gap-4">
            {/* {VALUES.map((v) => (
              <div key={v.title} className="card hover:border-accent transition group">
                <span className="icon-tile icon-tile-primary w-12 h-12 mb-4">
                  <v.icon size={22} />
                </span>
                <h3 className="font-serif text-xl font-bold mb-2 group-hover:text-accent transition">{v.title}</h3>
                <p className="text-ink-muted text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))} */}
            <div className="sm:col-span-2 relative overflow-hidden rounded-2xl border border-primary-soft/40 bg-gradient-to-br from-primary/30 via-primary-deep/40 to-bg-elev p-7">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-accent/20 blur-3xl rounded-full" />
              <div className="relative flex items-center gap-4">
                <span className="icon-tile icon-tile-accent w-14 h-14">
                  <Star size={26} />
                </span>
                <div>
                  <p className="font-serif text-2xl font-bold mb-1">Une nuit. Des trophées. Mille souvenirs.</p>
                  <p className="text-ink-muted text-sm">Réservez votre place et faites partie de l'histoire.</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Programme */}
      <section id="programme" className="py-24 bg-bg-elev/40 border-y border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center max-w-2xl mx-auto mb-12">
            <span className="section-eyebrow">Programme de la journée</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-balance">
              Du matin au <span className="accent-text">bout de la nuit</span>.
            </h2>
            <p className="text-ink-muted">
              Deux temps forts : <strong className="text-ink">IT Connect</strong> en matinée, puis le <strong className="text-ink">IT Gala</strong> en soirée.
            </p>
          </FadeIn>

          {/* Deux colonnes side-by-side sur desktop, stacked sur mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FadeIn>
              <ProgramColumn
                eyebrow="Matinée"
                title="IT Connect"
                subtitle="Networking, panels et distinctions académiques."
                steps={PROGRAM_MORNING}
              />
            </FadeIn>
            <FadeIn delay={120}>
              <ProgramColumn
                eyebrow="Soirée"
                title="IT Gala"
                subtitle="La grande célébration, des allocutions au bal poussière."
                steps={PROGRAM_EVENING}
              />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center max-w-2xl mx-auto mb-14">
            <span className="section-eyebrow">Reconnaissance</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-balance">
              13 catégories. <span className="primary-text">Une seule consécration</span>.
            </h2>
            <p className="text-ink-muted text-lg">
              Chaque catégorie célèbre une dimension différente de l'excellence. À vous de désigner vos lauréats.
            </p>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(categories.length > 0 ? categories : CATEGORY_FALLBACK).slice(0, 4).map((c, i) => {
              const IconCmp = CATEGORY_ICON_MAP[(c as any).icon] ?? Trophy;
              return (
                <FadeIn key={c.name} delay={i * 60}>
                  <article className="relative h-full p-7 bg-gradient-to-br from-bg-elev to-bg-elev2 border border-line rounded-2xl transition-all hover:border-accent/60 hover:-translate-y-1 overflow-hidden group">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition" />
                    <div className="flex items-baseline justify-between mb-5">
                      <span className="font-serif text-5xl font-black accent-text leading-none">{String(i + 1).padStart(2, "0")}</span>
                      <span className="icon-tile icon-tile-primary w-11 h-11">
                        <IconCmp size={20} />
                      </span>
                    </div>
                    <h3 className="font-serif text-xl font-bold mb-3">{c.name}</h3>
                    <p className="text-ink-muted text-sm leading-relaxed">{c.description}</p>
                  </article>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tickets */}
      <section className="py-28 bg-bg-elev/40 border-y border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center max-w-2xl mx-auto mb-14">
            <span className="section-eyebrow">Billetterie</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-balance">
              Nos différents types <span className="accent-text">  de tickets </span>.
            </h2>
            <p className="text-ink-muted text-lg">Achat directement à la caisse officielle, places limitées.</p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { type: "Solo", price: "15 000", desc: "Une place individuelle pour vivre la soirée à votre rythme.", icon: Ticket, perks: ["Cocktail et nourriture", "divertissements", "Soirée dansante"] },
              { type: "Duo", price: "25 000", desc: "Deux places côte-à-côte pour partager la magie.", icon: Heart, perks: ["Cocktail et nourriture", "divertissements", "Soirée dansante", "Places voisines garanties"], featured: true },
              { type: "Gbonhi", price: "65 000", desc: "Pack groupe d'amis : la table parfaite pour célébrer.", icon: Users, perks: ["Cocktail et nourriture", "divertissements", "Soirée dansante", "Table réservée de 5 places"] },
            ].map((t, i) => (
              <FadeIn key={t.type} delay={i * 100}>
                <div className={`relative h-full rounded-2xl p-7 border transition hover:-translate-y-1 ${t.featured ? "border-accent bg-gradient-to-br from-accent/10 via-bg-elev to-bg-elev shadow-glow" : "border-line bg-bg-elev hover:border-accent/40"}`}>
                  {/* {t.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-bg text-[10px] font-bold tracking-widest">
                      LE PLUS POPULAIRE
                    </span>
                  )} */}
                  <span className="icon-tile icon-tile-primary w-12 h-12 mb-5">
                    <t.icon size={22} />
                  </span>
                  <p className="text-xs uppercase tracking-[0.2em] text-accent mb-2">Ticket {t.type}</p>
                  <p className="font-serif text-5xl font-black mb-1 accent-text leading-none">{t.price}</p>
                  <p className="text-xs text-ink-muted mb-5">FCFA</p>
                  <p className="text-ink-muted text-sm mb-6">{t.desc}</p>
                  <ul className="space-y-2.5">
                    {t.perks.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-sm">
                        <Check size={16} className="text-accent mt-0.5 shrink-0" />
                        <span className="text-ink-muted">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Archive */}
      <section id="archive" className="py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center max-w-2xl mx-auto mb-14">
            <span className="section-eyebrow">Souvenirs</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-balance">Revivez l'édition <span className="primary-text">précédente</span>.</h2>
            <p className="text-ink-muted text-lg">Une nuit inoubliable, des moments capturés.</p>
          </FadeIn>

          <FadeIn className="grid grid-cols-2 md:grid-cols-12 grid-rows-[160px] md:grid-rows-[200px] auto-rows-[180px] gap-3 mb-12">
            {souvenirs.length > 0 ? (
              souvenirs.slice(0, 5).map((s, i) => {
                const configs = [
                  "col-span-2 row-span-2 md:col-span-6",
                  "col-span-1 md:col-span-3",
                  "col-span-1 md:col-span-3",
                  "col-span-1 md:col-span-3",
                  "col-span-1 md:col-span-3",
                ];
                const gradients = [
                  "from-primary/40 via-primary-deep/30 to-bg-elev",
                  "from-accent/30 to-bg-elev",
                  "from-terracotta/30 to-bg-elev",
                  "from-primary/30 to-bg-elev",
                  "from-accent/30 via-primary/20 to-bg-elev",
                ];
                const icons = [Crown, Trophy, Music2, Camera, Drama];
                return (
                  <ArchiveTile
                    key={s.id}
                    className={configs[i] || "col-span-1 md:col-span-3"}
                    gradient={gradients[i % gradients.length]}
                    Icon={icons[i % icons.length]}
                    title={s.title}
                    image={assetUrl(s.image_url)}
                  />
                );
              })
            ) : (
              <>
                <ArchiveTile className="col-span-2 row-span-2 md:col-span-6" gradient="from-primary/40 via-primary-deep/30 to-bg-elev" Icon={Crown} title="Cérémonie d'ouverture" />
                <ArchiveTile className="col-span-1 md:col-span-3" gradient="from-accent/30 to-bg-elev" Icon={Trophy} title="Remise des trophées" />
                <ArchiveTile className="col-span-1 md:col-span-3" gradient="from-terracotta/30 to-bg-elev" Icon={Music2} title="Performance live" />
                <ArchiveTile className="col-span-1 md:col-span-3" gradient="from-primary/30 to-bg-elev" Icon={Camera} title="Photos officielles" />
                <ArchiveTile className="col-span-1 md:col-span-3" gradient="from-accent/30 via-primary/20 to-bg-elev" Icon={Drama} title="Soirée dansante" />
              </>
            )}
          </FadeIn>

          <FadeIn className="flex gap-3 justify-center flex-wrap">
            <a href={gala?.tiktok_url ?? "https://www.tiktok.com/@esaticstudentpage"} target="_blank" rel="noreferrer" className="btn btn-ghost">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
              TikTok officiel <ArrowUpRight size={14} />
            </a>
            <a href={gala?.telegram_url ?? "https://www.instagram.com/esaticstudents/"} target="_blank" rel="noreferrer" className="btn btn-ghost">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
              Page Instagram <ArrowUpRight size={14} />
            </a>
            {/* <Link to="/live" className="btn btn-accent">
              <MonitorPlay size={16} /> Suivre en direct
            </Link> */}
          </FadeIn>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-24 bg-bg-elev/40 border-y border-line">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <FadeIn>
            <Quote size={48} className="mx-auto text-accent mb-6 opacity-60" />
            <p className="font-serif italic text-2xl md:text-3xl leading-relaxed mb-6 text-balance">
              « Le IT Gala, c'est cette soirée où on se rappelle pourquoi on aime la tech. On y rit, on y rêve, et on y prend rendez-vous avec l'avenir. »
            </p>
            {/* <p className="text-ink-muted text-sm uppercase tracking-[0.2em]">— Un lauréat de l'édition précédente</p> */}
          </FadeIn>
        </div>
      </section>

      {/* Info card grid */}
      <section className="py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center max-w-2xl mx-auto mb-14">
            <span className="section-eyebrow">Édition {gala?.edition_year ?? 2026}</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-balance">L'essentiel à savoir.</h2>
            <p className="text-ink-muted text-lg">Tous les détails pratiques pour vivre la soirée à fond.</p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoCard delay={0} Icon={Calendar} label="Date">
              {gala ? formatDate(gala.event_date) : "06 juin 2026"}
              <span className="block text-ink-muted text-sm mt-1">A partir de 08h00 pour l'it connect</span>
              <span className="block text-ink-muted text-sm mt-1">et 20h00 pour l'it gala</span>
            </InfoCard>
            <InfoCard delay={60} Icon={MapPin} label="Lieu">
              {gala?.location ?? "Palais de la Culture, Abidjan"}
            </InfoCard>
            <InfoCard delay={120} Icon={Ticket} label="Tickets">
              <span className="block text-base">Solo · <span className="text-accent">15 000 FCFA</span></span>
              <span className="block text-base">Duo · <span className="text-accent">25 000 FCFA</span></span>
              <span className="block text-base">Gbonhi · <span className="text-accent">65 000 FCFA</span></span>
            </InfoCard>
            <InfoCard delay={180} Icon={Shirt} label="Code vestimentaire">
              {gala?.dress_code ?? "Tenue de soirée"}
            </InfoCard>
            <InfoCard delay={240} Icon={Drama} label="Programme">
              <span className="block text-base text-ink-muted text-sm whitespace-pre-line">
                {(gala?.program ?? "Cocktail · Cérémonie · Dîner · Soirée dansante").split("\n").slice(0, 4).join("\n")}
              </span>
            </InfoCard>
            <InfoCard delay={300} Icon={Users} label="Public">
              L'ensemble du corps éducatif de l'ESATIC, étudiants, alumni, partenaires et invités.
            </InfoCard>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-28 bg-bg-elev/40 border-y border-line">
        <div className="max-w-3xl mx-auto px-6">
          <FadeIn className="text-center mb-14">
            <span className="section-eyebrow">Questions fréquentes</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-balance">On vous explique <span className="accent-text">tout</span>.</h2>
          </FadeIn>

          <div className="space-y-3">
            {FAQ.map((item, i) => {
              const open = openFaq === i;
              return (
                <FadeIn key={item.q} delay={i * 60}>
                  <div className={`bg-bg-elev border rounded-2xl overflow-hidden transition ${open ? "border-accent/50" : "border-line"}`}>
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-bg-elev2 transition"
                    >
                      <span className="font-semibold">{item.q}</span>
                      <span className={`shrink-0 transition-transform ${open ? "rotate-45 text-accent" : "text-ink-muted"}`}>
                        <Plus size={20} />
                      </span>
                    </button>
                    <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <div className="overflow-hidden">
                        <p className="px-5 pb-5 text-ink-muted leading-relaxed">{item.a}</p>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl border border-primary-soft/40 bg-gradient-to-br from-primary/30 via-primary-deep/40 to-bg-elev p-10 md:p-16 text-center">
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-accent/20 blur-3xl rounded-full" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/40 blur-3xl rounded-full" />
              <div className="relative">
                <span className="section-eyebrow">Plus que quelques jours</span>
                <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-black mb-5 text-balance">
                  Votre voix peut <span className="accent-text">tout changer</span>.
                </h2>
                <p className="text-ink-muted text-lg mb-8 max-w-xl mx-auto">
                  Connectez-vous à votre espace de vote, découvrez les nominés, et désignez celles et ceux qui marqueront cette édition.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Link to="/login" className="btn btn-accent btn-lg">
                    <Vote /> Mon espace de vote
                  </Link>
                  <Link to="/live" className="btn btn-ghost btn-lg">
                    <MonitorPlay size={18} /> Voir le grand écran
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line py-12">
        <div className="max-w-7xl mx-auto px-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Logo />
            <p className="text-sm text-ink-muted mt-4 leading-relaxed">
              La célébration officielle des talents tech ivoiriens.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-3 text-sm tracking-wider uppercase">Navigation</p>
            <ul className="space-y-2 text-sm text-ink-muted">
              {headerLinks.map((l) => (
                <li key={l.href}><a href={l.href} className="hover:text-accent transition">{l.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-3 text-sm tracking-wider uppercase">Espaces</p>
            <ul className="space-y-2 text-sm text-ink-muted">
              <li><Link to="/login" className="hover:text-accent transition">Mon espace de vote</Link></li>
              <li><Link to="/live" className="hover:text-accent transition">Grand écran (live)</Link></li>
              <li><Link to="/login?role=cashier" className="hover:text-accent transition">Caisse</Link></li>
              <li><Link to="/login?role=controller" className="hover:text-accent transition">Contrôle d'accès</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-3 text-sm tracking-wider uppercase">Suivez-nous</p>
            <ul className="space-y-2 text-sm text-ink-muted">
              <li><a href={gala?.tiktok_url ?? "https://www.tiktok.com/@esaticstudentpage"} target="_blank" rel="noreferrer" className="hover:text-accent transition inline-flex items-center gap-1.5">TikTok officiel <ArrowUpRight size={12} /></a></li>
              <li><a href={gala?.telegram_url ?? "https://www.instagram.com/esaticstudents/"} target="_blank" rel="noreferrer" className="hover:text-accent transition inline-flex items-center gap-1.5">Page Instagram <ArrowUpRight size={12} /></a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-10 pt-6 border-t border-line flex flex-wrap items-center justify-between gap-3 text-xs text-ink-faint">
          <p>© {new Date().getFullYear()} IT Gala — Tous droits réservés.</p>
          <p>Une initiative pour célébrer la tech ivoirienne.</p>
        </div>
      </footer>
    </div>
  );
}

type ProgramStep = { time: string; title: string; desc: string; icon: any };

function ProgramColumn({
  eyebrow, title, subtitle, steps,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  steps: ProgramStep[];
}) {
  return (
    <div className="bg-bg-elev/60 border border-line rounded-3xl p-6 sm:p-8 h-full">
      {/* En-tete colonne */}
      <div className="text-center mb-6 pb-6 border-b border-line">
        <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-1.5">{eyebrow}</p>
        <h3 className="font-serif text-2xl font-bold mb-1.5">{title}</h3>
        <p className="text-ink-muted text-xs">{subtitle}</p>
      </div>

      {/* Liste compacte avec ligne verticale */}
      <ol className="relative space-y-3">
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-accent/30 via-accent/20 to-transparent" />
        {steps.map((step, i) => (
          <li key={`${step.time}-${i}`} className="relative flex items-start gap-3 group">
            {/* Pastille avec icone */}
            <div className="relative z-10 shrink-0 w-10 h-10 grid place-items-center rounded-full bg-bg-elev border border-accent/40 transition group-hover:border-accent group-hover:shadow-glow">
              <step.icon size={15} className="text-accent-bright" />
            </div>
            {/* Texte */}
            <div className="flex-1 pt-1.5 pb-1">
              <p className="font-mono text-[11px] text-accent tracking-wider mb-0.5">{step.time}</p>
              <h4 className="font-semibold text-sm leading-tight mb-0.5">{step.title}</h4>
              <p className="text-ink-muted text-xs leading-snug">{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ArchiveTile({ className, gradient, Icon, title, image }: { className?: string; gradient: string; Icon: any; title: string; image?: string | null }) {
  const [error, setError] = useState(false);
  return (
    <figure className={`group relative rounded-2xl overflow-hidden border border-line cursor-pointer ${className}`}>
      <div className={`w-full h-full flex items-center justify-center transition group-hover:scale-105 duration-700 ${image && !error ? "" : "bg-gradient-to-br " + gradient}`}>
        {image && !error ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
            onError={() => setError(true)}
          />
        ) : (
          <Icon size={56} className="text-white/30" strokeWidth={1.4} />
        )}
      </div>
      <figcaption className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end p-5 opacity-0 group-hover:opacity-100 transition">
        <span className="font-medium text-white text-sm">{title}</span>
      </figcaption>
    </figure>
  );
}

function InfoCard({ delay, Icon, label, children }: { delay?: number; Icon: any; label: string; children: React.ReactNode }) {
  return (
    <FadeIn delay={delay}>
      <div className="bg-bg-elev border border-line rounded-2xl p-7 transition-all hover:border-accent/60 group h-full">
        <span className="icon-tile icon-tile-accent w-12 h-12 mb-4 group-hover:scale-110 transition">
          <Icon size={22} />
        </span>
        <p className="text-xs uppercase tracking-[0.2em] text-ink-muted mb-2">{label}</p>
        <div className="font-serif text-xl text-ink">{children}</div>
      </div>
    </FadeIn>
  );
}
