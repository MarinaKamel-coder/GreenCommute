// src/pages/MyBookingsPage.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { bookingService } from '../services/booking.service';
import { ApiError } from '../services/api';

interface Booking {
  id: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  trip: {
    id: number;
    departureCity: string;
    arrivalCity: string;
    departureTime: string;
    pricePerSeat: number;
    driver: {
      id: number;
      firstName: string;
      lastName: string;
    };
  };
}

const MyBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
			if (!token) {
				setBookings([]);
				setError('Session invalide: token manquant. Reconnecte-toi.');
				return;
			}
			const data = await bookingService.getMyBookings(token);
			setBookings(Array.isArray(data) ? (data as Booking[]) : []);
    } catch (err: unknown) {
      setError('Erreur lors du chargement des réservations');
      setBookings([]);
      if (err instanceof ApiError && err.status === 401) navigate('/login');
      console.error(err);
    } finally {
      setLoading(false);
    }
	}, [token, navigate]);

  // Charger les réservations
  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  // Annuler une réservation
  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm('Annuler cette réservation ?')) {
      return;
    }

    try {
			if (!token) {
				alert('Session invalide: token manquant. Reconnecte-toi.');
				navigate('/login');
				return;
			}
			await bookingService.cancelBooking(bookingId, token);
      alert('Réservation annulée');
      void loadBookings(); // Rafraîchir
    } catch (err: unknown) {
      const message = (() => {
        if (err instanceof Error) return err.message;
        if (err && typeof err === "object" && "message" in err) {
          const maybeMessage = (err as { message?: unknown }).message;
          if (typeof maybeMessage === "string") return maybeMessage;
        }
        return "Erreur lors de l'annulation";
      })();
      alert(message);
    }
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return '#2e7d32';
      case 'PENDING': return '#ff9800';
      case 'REJECTED': return '#f44336';
      case 'CANCELLED': return '#757575';
      default: return '#666';
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-CA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isPastTrip = (departureTime: string) => {
    const t = new Date(departureTime).getTime();
    return Number.isFinite(t) && t < Date.now();
  };

  // Redirection si l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Veuillez vous connecter pour voir vos réservations</p>
        <button
          onClick={() => navigate('/login')}
          style={{
            marginTop: '10px',
            padding: '10px 20px',
            background: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px' }}>Mes réservations</h1>

      {error && (
        <div style={{
          padding: '15px',
          background: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Chargement...</p>
        </div>
      ) : (!bookings || bookings.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>Vous n'avez pas encore de réservations</p>
          <button
            onClick={() => navigate('/booking')}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Rechercher un trajet
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {bookings.map(booking => (
            <div 
              key={booking.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                background: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 10px 0' }}>
                    {booking.trip.departureCity} → {booking.trip.arrivalCity}
                  </h3>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    🕐 {formatDate(booking.trip.departureTime)}
                  </p>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    👤 Chauffeur: {booking.trip.driver.firstName} {booking.trip.driver.lastName}
                  </p>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    padding: '5px 10px',
                    background: getStatusColor(booking.status),
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {booking.status === 'PENDING' && 'EN ATTENTE'}
                    {booking.status === 'ACCEPTED' && 'ACCEPTÉE'}
                    {booking.status === 'REJECTED' && 'REFUSÉE'}
                    {booking.status === 'CANCELLED' && 'ANNULÉE'}
                  </span>
                  <p style={{ margin: '10px 0 0 0', fontSize: '18px', color: '#1976d2', fontWeight: 'bold' }}>
                    {booking.trip.pricePerSeat.toFixed(2)} $
                  </p>
                </div>
              </div>

              <div style={{ 
                marginTop: '15px', 
                paddingTop: '15px',
                borderTop: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <p style={{ margin: '0', color: '#888', fontSize: '12px' }}>
                  Réservé le {formatDate(booking.createdAt)}
                </p>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => navigate(`/trip/${booking.trip.id}`)}
                    style={{
                      padding: '8px 16px',
                      background: 'white',
                      border: '1px solid #1976d2',
                      color: '#1976d2',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Voir trajet
                  </button>

                  <button
                    onClick={() => navigate(`/messages/${booking.trip.id}`)}
                    style={{
                      padding: '8px 16px',
                      background: '#e8f5e9',
                      border: '1px solid #2e7d32',
                      color: '#2e7d32',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Messages
                  </button>

                  {(() => {
                    const past = isPastTrip(booking.trip.departureTime);
                    const canReview = booking.status === 'ACCEPTED' && past;

                    const label = canReview
                      ? 'Laisser un avis'
                      : booking.status !== 'ACCEPTED'
                        ? 'Laisser un avis (après acceptation)'
                        : 'Laisser un avis (après le trajet)';

                    return (
                      <button
                        type="button"
                        disabled={!canReview}
                        title={
                          canReview
                            ? 'Ouvrir le formulaire d’avis'
                            : booking.status !== 'ACCEPTED'
                              ? 'Disponible une fois la réservation acceptée'
                              : 'Disponible une fois le trajet terminé'
                        }
                        onClick={() => {
                          if (!canReview) return;
                          const params = new URLSearchParams();
                          params.set('tripId', String(booking.trip.id));
                          params.set('revieweeId', String(booking.trip.driver.id));
                          navigate(`/reviews?${params.toString()}`);
                        }}
                        style={{
                          padding: '8px 16px',
                          background: canReview ? '#fff3e0' : '#fafafa',
                          border: '1px solid ' + (canReview ? '#ef6c00' : '#ddd'),
                          color: canReview ? '#ef6c00' : '#999',
                          borderRadius: '4px',
                          cursor: canReview ? 'pointer' : 'not-allowed',
                          opacity: canReview ? 1 : 0.85
                        }}
                      >
                        {label}
                      </button>
                    );
                  })()}

                  {(booking.status === 'PENDING' || booking.status === 'ACCEPTED') && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      style={{
                        padding: '8px 16px',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;