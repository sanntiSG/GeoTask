'use client';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Task, Priority } from '@/lib/types';

// Fix default marker icon paths broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makeIcon(priority: Priority) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:24px;height:24px;border-radius:50% 50% 50% 0;
      background:${priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#22c55e'};
      border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);
      transform:rotate(-45deg)">
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -28],
  });
}

interface ClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

function ClickHandler({ onMapClick }: ClickHandlerProps) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface Props {
  tasks: Task[];
  pendingCoords?: { lat: number; lng: number } | null;
  onMapClick: (lat: number, lng: number) => void;
  onTaskClick: (task: Task) => void;
}

export default function MapView({ tasks, pendingCoords, onMapClick, onTaskClick }: Props) {
  return (
    <MapContainer
      center={[-34.603, -58.381]}
      zoom={12}
      className="h-full w-full rounded-xl"
      style={{ minHeight: '400px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />

      {tasks.map((task) => (
        <Marker
          key={task.id}
          position={[task.latitude, task.longitude]}
          icon={makeIcon(task.priority)}
          opacity={task.completed ? 0.5 : 1}
          eventHandlers={{ click: () => onTaskClick(task) }}
        >
          <Popup>
            <strong>{task.title}</strong>
            {task.description && <p className="text-xs mt-1">{task.description}</p>}
            <p className="text-xs text-gray-500 mt-1">{task.category} · {task.priority}</p>
          </Popup>
        </Marker>
      ))}

      {pendingCoords && (
        <Marker
          position={[pendingCoords.lat, pendingCoords.lng]}
          icon={L.divIcon({
            className: '',
            html: '<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          })}
        >
          <Popup>Click &quot;New Task&quot; to place here</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
