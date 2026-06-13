import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.service.js';
import { AdminStats, AdminUser } from '../types/index.js';
import { Modal } from '../components/ui/Modal.js';
import { Button } from '../components/ui/Button.js';
import { Spinner } from '../components/ui/Spinner.js';
import styles from './AdminPage.module.css';

export function AdminPage() {
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const queryClient = useQueryClient();

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await api.get<AdminStats>('/admin/stats');
      return data;
    },
  });

  const { data: usersData, isLoading } = useQuery<{ users: AdminUser[]; total: number }>({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const { data } = await api.get<{ users: AdminUser[]; total: number }>(`/admin/users${params}`);
      return data;
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setDeleteTarget(null);
    },
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Panel Admin</h1>
          <p className={styles.subtitle}>Solo para administradores</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className={styles.stats}>
          <StatCard label="Usuarios" value={stats.totalUsers} icon="👥" />
          <StatCard label="Tareas" value={stats.totalTasks} icon="✅" />
          <StatCard label="Ubicaciones" value={stats.totalLocations} icon="📍" />
          <StatCard label="Activos 24h" value={stats.active24h} icon="🟢" accent />
        </div>
      )}

      {/* Search */}
      <div className={styles.searchWrap}>
        <input
          type="search"
          placeholder="Buscar usuarios…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />
      </div>

      {/* User list */}
      <div className={styles.list}>
        {isLoading ? (
          <div className={styles.loading}><Spinner /></div>
        ) : (usersData?.users ?? []).map((u) => (
          <div key={u._id} className={styles.userCard}>
            {u.avatar && <img src={u.avatar} alt={u.name} className={styles.userAvatar} referrerPolicy="no-referrer" />}
            <div className={styles.userInfo}>
              <p className={styles.userName}>{u.name}</p>
              <p className={styles.userEmail}>{u.email}</p>
              <div className={styles.userMeta}>
                <span className={styles.metaTag}>{u.taskCount} tareas</span>
                <span className={styles.metaTag}>{u.locationCount} lugares</span>
                {u.role === 'admin' && <span className={[styles.metaTag, styles.adminTag].join(' ')}>Admin</span>}
              </div>
            </div>
            <button
              className={styles.deleteBtn}
              onClick={() => setDeleteTarget(u)}
              aria-label={`Eliminar ${u.name}`}
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar usuario"
        size="sm"
      >
        {deleteTarget && (
          <div className={styles.deleteModal}>
            <p className={styles.deleteText}>
              Vas a eliminar permanentemente a <strong>{deleteTarget.name}</strong> y todos sus datos (tareas, ubicaciones, trayectorias).
            </p>
            <div className={styles.deleteBtns}>
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
              <Button
                variant="danger"
                onClick={() => deleteUserMutation.mutate(deleteTarget._id)}
                loading={deleteUserMutation.isPending}
              >
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function StatCard({ label, value, icon, accent = false }: { label: string; value: number; icon: string; accent?: boolean }) {
  return (
    <div className={[styles.stat, accent ? styles.statAccent : ''].join(' ')}>
      <span className={styles.statIcon}>{icon}</span>
      <p className={styles.statValue}>{value.toLocaleString('es-AR')}</p>
      <p className={styles.statLabel}>{label}</p>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
