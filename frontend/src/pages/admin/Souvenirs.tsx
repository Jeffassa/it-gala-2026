import { useEffect, useState } from "react";
import { Plus, Trash2, Upload, MoveUp, MoveDown, Camera, ImageIcon } from "@/components/Icon";
import { galaApi, souvenirApi, apiError } from "@/lib/api";
import type { Gala, Souvenir } from "@/lib/types";
import { toast } from "@/store/toast";

export default function AdminSouvenirs() {
  const [galas, setGalas] = useState<Gala[]>([]);
  const [selectedGalaId, setSelectedGalaId] = useState<number | "">("");
  const [souvenirs, setSouvenirs] = useState<Souvenir[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    galaApi.list().then((list) => {
      setGalas(list);
      const active = list.find(g => g.is_active);
      if (active) setSelectedGalaId(active.id);
    });
  }, []);

  useEffect(() => {
    if (selectedGalaId) {
      loadSouvenirs(Number(selectedGalaId));
    } else {
      setSouvenirs([]);
    }
  }, [selectedGalaId]);

  async function loadSouvenirs(galaId: number) {
    setLoading(true);
    try {
      const data = await souvenirApi.list(galaId);
      setSouvenirs(data);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!selectedGalaId || !newTitle.trim()) return;
    try {
      await souvenirApi.create({
        gala_id: Number(selectedGalaId),
        title: newTitle.trim(),
        order: souvenirs.length,
      });
      setNewTitle("");
      loadSouvenirs(Number(selectedGalaId));
      toast.success("Souvenir créé");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer ce souvenir ?")) return;
    try {
      await souvenirApi.remove(id);
      setSouvenirs(prev => prev.filter(s => s.id !== id));
      toast.success("Souvenir supprimé");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function handleFileUpload(id: number, file: File) {
    try {
      await souvenirApi.uploadPhoto(id, file);
      loadSouvenirs(Number(selectedGalaId));
      toast.success("Photo mise à jour");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function move(id: number, direction: 'up' | 'down') {
    const index = souvenirs.findIndex(s => s.id === id);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === souvenirs.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const target = souvenirs[newIndex];
    const current = souvenirs[index];

    try {
      await souvenirApi.update(current.id, { order: newIndex });
      await souvenirApi.update(target.id, { order: index });
      loadSouvenirs(Number(selectedGalaId));
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <div className="space-y-6">
      {/* ... header and create form ... */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Souvenirs</h1>
          <p className="text-ink-muted">Gérez les cadres photos de la page d'accueil.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input py-2"
            value={selectedGalaId}
            onChange={(e) => setSelectedGalaId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Sélectionner une édition</option>
            {galas.map(g => (
              <option key={g.id} value={g.id}>Édition {g.edition_year} — {g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedGalaId && (
        <div className="bg-bg-elev border border-line rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Ajouter un nouveau cadre</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Titre du cadre (ex: Cérémonie d'ouverture)"
              className="input flex-1"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <button className="btn btn-primary" onClick={handleCreate}>
              <Plus size={18} /> Ajouter
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
        </div>
      ) : souvenirs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {souvenirs.map((s, i) => (
            <SouvenirCard
              key={s.id}
              souvenir={s}
              index={i}
              total={souvenirs.length}
              onDelete={handleDelete}
              onUpload={handleFileUpload}
              onMove={move}
            />
          ))}
        </div>
      ) : selectedGalaId ? (
        <div className="text-center py-12 bg-bg-elev/40 border border-dashed border-line rounded-2xl">
          <Camera size={48} className="mx-auto text-ink-faint mb-4" />
          <p className="text-ink-muted">Aucun souvenir pour cette édition.</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-ink-muted text-lg">Sélectionnez une édition pour gérer ses souvenirs.</p>
        </div>
      )}
    </div>
  );
}

function SouvenirCard({ souvenir, index, total, onDelete, onUpload, onMove }: {
  souvenir: Souvenir;
  index: number;
  total: number;
  onDelete: (id: number) => void;
  onUpload: (id: number, file: File) => void;
  onMove: (id: number, dir: 'up' | 'down') => void;
}) {
  const [error, setError] = useState(false);

  return (
    <div className="bg-bg-elev border border-line rounded-2xl overflow-hidden flex flex-col">
      <div className="aspect-video bg-bg-elev2 relative group flex items-center justify-center border-b border-line">
        {souvenir.image_url && !error ? (
          <img
            src={souvenir.image_url}
            alt={souvenir.title}
            className="w-full h-full object-cover"
            onError={() => setError(true)}
          />
        ) : (
          <ImageIcon size={48} className="text-ink-faint" />
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
          <label className="btn btn-sm btn-accent cursor-pointer">
            <Upload size={14} /> {souvenir.image_url ? "Changer" : "Upload"}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && onUpload(souvenir.id, e.target.files[0])}
            />
          </label>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between gap-4">
        <div>
          <h3 className="font-semibold truncate">{souvenir.title}</h3>
          <p className="text-xs text-ink-muted mt-1">Ordre: {souvenir.order}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <button
              className="btn btn-icon btn-ghost btn-sm"
              onClick={() => onMove(souvenir.id, 'up')}
              disabled={index === 0}
            >
              <MoveUp size={16} />
            </button>
            <button
              className="btn btn-icon btn-ghost btn-sm"
              onClick={() => onMove(souvenir.id, 'down')}
              disabled={index === total - 1}
            >
              <MoveDown size={16} />
            </button>
          </div>
          <button
            className="btn btn-icon btn-ghost btn-sm text-red-500 hover:bg-red-500/10"
            onClick={() => onDelete(souvenir.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
