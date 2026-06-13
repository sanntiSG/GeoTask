import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocations } from '../hooks/useLocations.js';
import { useTasks } from '../hooks/useTasks.js';
import { Location, Task } from '../types/index.js';
import { TaskCard } from '../components/tasks/TaskCard.js';
import { useCompleteTask } from '../hooks/useTasks.js';
import styles from './MapPage.module.css';

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function createTaskPinIcon(emoji: string, color: string): L.DivIcon {
  return L.divIcon({
    html: `
      <div style="
        width:48px;height:48px;
        background:var(--surface-2,#2c2c2e);
        border:2.5px solid ${color};
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-size:22px;
        box-shadow:0 0 16px ${color}40, 0 4px 12px rgba(0,0,0,0.5);
        cursor:pointer;
        transition:transform 0.2s;
      ">${emoji}</div>
    `,
    className: '',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -28],
  });
}

export function MapPage() {
  const { data: locations = [] } = useLocations();
  const { data: tasks = [] }     = useTasks({ status: 'pending' });
  const completeTask = useCompleteTask();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [mapCenter] = useState<[number, number]>([-34.6037, -58.3816]);

  const getTasksForLocation = (locationId: string): Task[] =>
    tasks.filter((t) => {
      const lid = typeof t.locationId === 'object' ? t.locationId._id : t.locationId;
      return lid === locationId;
    });

  return (
    <div className={styles.page}>
      <div className={styles.mapWrap}>
        <MapContainer
          center={mapCenter}
          zoom={13}
          className={styles.map}
          zoomControl={false}
          attributionControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com">CARTO</a>'
            maxZoom={19}
          />

          {locations.map((loc) => {
            const locTasks = getTasksForLocation(loc._id);
            if (locTasks.length === 0) return null;
            const topTask = locTasks.sort((a, b) => {
              const order = { urgent: 0, high: 1, medium: 2, low: 3 };
              return order[a.priority] - order[b.priority];
            })[0];

            return (
              <Marker
                key={loc._id}
                position={[loc.coordinates.lat, loc.coordinates.lng]}
                icon={createTaskPinIcon(topTask.emoji, topTask.color)}
                eventHandlers={{ click: () => setSelectedLocation(loc) }}
              />
            );
          })}

          <MapFlyTo location={selectedLocation} />
        </MapContainer>
      </div>

      {/* Side panel */}
      {selectedLocation && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>{selectedLocation.name}</h2>
              <p className={styles.panelSub}>
                {getTasksForLocation(selectedLocation._id).length} tarea(s) pendiente(s)
              </p>
            </div>
            <button className={styles.panelClose} onClick={() => setSelectedLocation(null)}>
              <CloseIcon />
            </button>
          </div>

          <div className={styles.panelList}>
            {getTasksForLocation(selectedLocation._id).map((task, i) => (
              <TaskCard
                key={task._id}
                task={task}
                index={i}
                onComplete={(id) => completeTask.mutate(id)}
              />
            ))}
          </div>
        </div>
      )}

      {!selectedLocation && (
        <div className={styles.hint}>
          <p>{locations.length === 0 ? 'Aún no tenés ubicaciones. Creá una tarea primero.' : `${locations.length} lugar(es) con tareas`}</p>
        </div>
      )}
    </div>
  );
}

function MapFlyTo({ location }: { location: Location | null }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.flyTo([location.coordinates.lat, location.coordinates.lng], 15, { duration: 0.8 });
    }
  }, [location, map]);
  return null;
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
