import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api.service.js';
import { Trajectory } from '../types/index.js';
import { formatDistance } from '../utils/haversine.js';
import { Spinner } from '../components/ui/Spinner.js';
import styles from './TrajectoryPage.module.css';

export function TrajectoryPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: list = [], isLoading: listLoading } = useQuery<Trajectory[]>({
    queryKey: ['trajectories'],
    queryFn: async () => {
      const { data } = await api.get<Trajectory[]>('/trajectory');
      return data;
    },
  });

  const { data: trajectory, isLoading } = useQuery<Trajectory>({
    queryKey: ['trajectory', selectedDate],
    queryFn: async () => {
      const { data } = await api.get<Trajectory>(`/trajectory/${selectedDate}`);
      return data;
    },
    retry: false,
  });

  const positions = trajectory?.points.map((p) => [p.lat, p.lng] as [number, number]) ?? [];
  const center: [number, number] = positions.length > 0
    ? positions[Math.floor(positions.length / 2)]
    : [-34.6037, -58.3816];

  const startTime = trajectory?.points[0]?.timestamp
    ? new Date(trajectory.points[0].timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : null;
  const lastPoint = trajectory?.points[trajectory.points.length - 1];
  const endTime = lastPoint?.timestamp
    ? new Date(lastPoint.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Trayectoria</h1>
      </div>

      {/* Date list */}
      <div className={styles.dates}>
        <div className={styles.dateScroll}>
          {listLoading ? (
            <Spinner size="sm" />
          ) : list.length === 0 ? (
            <p className={styles.noData}>Aún no hay registros</p>
          ) : (
            list.map((t) => (
              <button
                key={t.date}
                className={[styles.dateChip, selectedDate === t.date ? styles.dateActive : ''].join(' ')}
                onClick={() => setSelectedDate(t.date)}
              >
                {new Date(t.date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Stats */}
      {trajectory && (
        <div className={styles.stats}>
          <StatCard icon="📏" label="Distancia" value={formatDistance(trajectory.totalDistance)} />
          {startTime && <StatCard icon="🕐" label="Inicio" value={startTime} />}
          {endTime && <StatCard icon="🕐" label="Fin" value={endTime} />}
          <StatCard icon="📍" label="Puntos" value={String(trajectory.points.length)} />
        </div>
      )}

      {/* Map */}
      <div className={styles.mapWrap}>
        {isLoading ? (
          <div className={styles.mapLoading}><Spinner size="lg" /></div>
        ) : !trajectory ? (
          <div className={styles.mapEmpty}>
            <span>📭</span>
            <p>Sin datos para esta fecha</p>
          </div>
        ) : (
          <MapContainer center={center} zoom={14} className={styles.map} zoomControl={false}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap &copy; CARTO'
              maxZoom={19}
            />
            {positions.length > 1 && (
              <Polyline
                positions={positions}
                pathOptions={{ color: '#0a84ff', weight: 4, opacity: 0.9 }}
              />
            )}
            {positions.length > 0 && (
              <>
                <CircleMarker center={positions[0]} radius={8} pathOptions={{ color: '#30d158', fillColor: '#30d158', fillOpacity: 1 }} />
                <CircleMarker center={positions[positions.length - 1]} radius={8} pathOptions={{ color: '#ff453a', fillColor: '#ff453a', fillOpacity: 1 }} />
              </>
            )}
          </MapContainer>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statIcon}>{icon}</span>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statLabel}>{label}</p>
    </div>
  );
}
