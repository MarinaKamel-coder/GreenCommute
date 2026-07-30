import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../services/api";
import {
  User as UserIcon,
  Star,
  Car,
  ShieldCheck,
  Calendar,
  ChevronLeft,
  Leaf,
} from "lucide-react";
import type { User as UserType } from "../types/user";
import "../style/profile.css";

// Extension locale du type User pour inclure les stats renvoyées par le backend
interface PublicProfile extends UserType {
  tripsCompleted?: number;
  totalCO2Saved?: number;
}

type PublicProfileResponse = {
  success: boolean;
  data: {
    user: PublicProfile;
  };
};

export function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);

        const response = await apiFetch<PublicProfileResponse>(
          `/api/public/users/${id}`
        );

        setProfile(response.data.user);
      } catch {
        setError("Impossible de charger le profil.");
      } finally {
        setLoading(false);
      }
    };

    fetchPublicData();
  }, [id]);

  if (loading) return <div className="profile-loader-container">Chargement...</div>;
  if (error || !profile) return <div className="profile-error-container">{error}</div>;

  const trips = profile.tripsPosted ?? [];

  return (
    <div className="profile-container">
      {/* Navigation de retour */}
      <button onClick={() => navigate(-1)} className="back-button">
        <ChevronLeft size={20} /> Retour
      </button>

      <div className="profile-card">
        {/* En-tête : Photo et Nom */}
        <header className="profile-header">
          <div className="profile-avatar-wrapper">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.firstName} className="profile-photo" />
            ) : (
              <div className="profile-placeholder">
                <UserIcon size={50} />
              </div>
            )}
            {profile.rating >= 4.5 && (
              <div className="ambassador-badge">
                <ShieldCheck size={14} /> Ambassadeur
              </div>
            )}
          </div>

          <div className="profile-main-info">
            <h1>{profile.firstName} {profile.lastName}</h1>
            <div className="profile-stats-row">
              <div className="stat-pill">
                <Star size={16} fill="#ffb400" stroke="none" />
                <span>{profile.rating.toFixed(1)} / 5</span>
              </div>
              <div className="stat-pill">
                <Calendar size={16} />
                <span>Membre depuis {new Date(profile.createdAt).getFullYear()}</span>
              </div>
            </div>
          </div>
        </header>

        <hr className="profile-divider" />

        {/* Section Statistiques d'impact */}
        <div className="public-stats-grid">
          <div className="stat-card">
            <span className="stat-value">{profile.tripsCompleted || 0}</span>
            <span className="stat-label">Trajets réalisés</span>
          </div>
          <div className="stat-card highlight">
            <span className="stat-value">
               <Leaf size={16} className="leaf-icon" /> {profile.totalCO2Saved?.toFixed(1) || 0} kg
            </span>
            <span className="stat-label">CO2 Économisé</span>
          </div>
        </div>

        {/* Section Biographie */}
        <section className="profile-section">
          <h3>À propos</h3>
          <p className="profile-bio">
            {profile.bio || "Cet utilisateur préfère garder le mystère sur sa biographie !"}
          </p>
        </section>

        {/* Section Véhicule */}
        {profile.vehicles && profile.vehicles.length > 0 && (
          <section className="profile-section">
            <h3>Véhicule vérifié</h3>
            {profile.vehicles.map((v) => (
              <div key={v.id} className="vehicle-info-card">
                <Car size={24} className="icon-car" />
                <div className="vehicle-details">
                  <span className="vehicle-name">{v.brand} {v.model}</span>
                  <span className="vehicle-specs">{v.color} • {v.fuelType}</span>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Section Trajets proposés */}
        {trips.length > 0 && (
          <section className="profile-section">
            <h3>Trajets proposés</h3>
            <div className="space-y-4">
              {trips.map((tripItem) => (
                <div key={tripItem.id} className="trip-card">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-gray-900">
                      <span>{tripItem.departureCity}</span>
                      <span className="text-gray-400">→</span>
                      <span>{tripItem.arrivalCity}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(tripItem.departureTime).toLocaleDateString('fr-CA')}
                    </p>
                  </div>
                  <button className="btn-view-trip" onClick={() => navigate(`/trip/${tripItem.id}`)}>
                    Voir l'offre
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pied de page : Vérifications de confiance */}
        <footer className="profile-trust-footer">
          <div className="trust-item verified">✓ Email vérifié</div>
          <div className="trust-item verified">✓ Identité confirmée</div>
          <div className="trust-item">✓ Profil GreenCommute</div>
        </footer>
      </div>
    </div>
  );
}
