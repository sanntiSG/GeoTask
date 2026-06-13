import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { useNotifications } from '../hooks/useNotifications.js';
import { geolocationService } from '../services/geolocation.service.js';
import { useAppStore } from '../stores/app.store.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import api from '../services/api.service.js';
import { UserSettings } from '../types/index.js';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { notificationPermission, requestAndSubscribe } = useNotifications();
  const { setPermissions } = useAppStore();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [, setSettings] = useState<Partial<UserSettings>>({});

  const updateSettingsMutation = useMutation({
    mutationFn: (patch: Partial<UserSettings>) => api.patch('/settings', patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => api.delete('/settings/account'),
    onSuccess: () => window.location.href = '/login',
  });

  const testNotifMutation = useMutation({
    mutationFn: () => api.post('/notifications/test'),
  });

  const handleRequestNotifications = async () => {
    const granted = await requestAndSubscribe();
    // If Chrome suppressed the dialog, Notification.permission stays 'default'
    if (!granted && Notification.permission !== 'granted') {
      alert('🔒 El navegador ocultó el diálogo.\n\nHacé clic en el ícono de candado o campana en la barra de direcciones y elegí "Permitir". Luego volvé a intentarlo.');
    }
  };

  const handleRequestGeo = async () => {
    const result = await geolocationService.requestPermission();
    setPermissions({ geolocation: result });
  };

  const currentSettings = user?.settings;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Ajustes</h1>
      </div>

      <div className={styles.content}>
        {/* Profile */}
        {user && (
          <section className={styles.section}>
            <div className={styles.profileCard}>
              {user.avatar && <img src={user.avatar} alt={user.name} className={styles.avatar} referrerPolicy="no-referrer" />}
              <div>
                <p className={styles.profileName}>{user.name}</p>
                <p className={styles.profileEmail}>{user.email}</p>
                {user.role === 'admin' && <span className={styles.adminBadge}>Admin</span>}
              </div>
            </div>
          </section>
        )}

        {/* Tracking */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Rastreo</h2>
          <div className={styles.card}>
            <SettingRow label="Hora inicio" hint="Inicio del rastreo diario">
              <input
                type="time"
                defaultValue={currentSettings?.trackingStart ?? '06:00'}
                className={styles.timeInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setSettings((s) => ({ ...s, trackingStart: val }));
                  updateSettingsMutation.mutate({ trackingStart: val });
                }}
              />
            </SettingRow>
            <SettingRow label="Hora fin" hint="Fin del rastreo diario">
              <input
                type="time"
                defaultValue={currentSettings?.trackingEnd ?? '23:00'}
                className={styles.timeInput}
                onChange={(e) => {
                  const val = e.target.value;
                  updateSettingsMutation.mutate({ trackingEnd: val });
                }}
              />
            </SettingRow>
            <SettingRow label="Radio por defecto" hint="Metros">
              <input
                type="number"
                min={50}
                max={5000}
                defaultValue={currentSettings?.defaultRadius ?? 200}
                className={styles.numInput}
                onBlur={(e) => updateSettingsMutation.mutate({ defaultRadius: Number(e.target.value) })}
              />
            </SettingRow>
          </div>
        </section>

        {/* Notifications */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Notificaciones</h2>
          <div className={styles.card}>
            <SettingRow label="Intervalo entre notificaciones" hint="Segundos entre recordatorios en el mismo lugar">
              <input
                type="number"
                min={10}
                max={3600}
                defaultValue={currentSettings?.notificationInterval ?? 60}
                className={styles.numInput}
                onBlur={(e) => updateSettingsMutation.mutate({ notificationInterval: Number(e.target.value) })}
              />
            </SettingRow>
            <SettingRow label="Volver a notificar" hint="Minutos si no se marca como hecha">
              <input
                type="number"
                min={1}
                max={1440}
                defaultValue={currentSettings?.renotifyAfter ?? 30}
                className={styles.numInput}
                onBlur={(e) => updateSettingsMutation.mutate({ renotifyAfter: Number(e.target.value) })}
              />
            </SettingRow>
            <SettingRow label="Activar re-notificación">
              <input
                type="checkbox"
                defaultChecked={currentSettings?.renotifyEnabled ?? true}
                className={styles.checkbox}
                onChange={(e) => updateSettingsMutation.mutate({ renotifyEnabled: e.target.checked })}
              />
            </SettingRow>
          </div>
        </section>

        {/* Permissions */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Permisos</h2>
          <div className={styles.card}>
            <SettingRow label="Notificaciones" hint={notificationPermission === 'granted' ? '✅ Concedido' : '❌ No concedido'}>
              {notificationPermission !== 'granted' && (
                <Button variant="secondary" size="sm" onClick={handleRequestNotifications}>
                  Permitir
                </Button>
              )}
              {notificationPermission === 'granted' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => testNotifMutation.mutate()}
                  loading={testNotifMutation.isPending}
                >
                  Probar
                </Button>
              )}
            </SettingRow>
            <SettingRow label="Ubicación" hint="Para detección de proximidad">
              <Button variant="secondary" size="sm" onClick={handleRequestGeo}>
                Actualizar
              </Button>
            </SettingRow>
          </div>
        </section>

        {/* Account */}
        <section className={styles.section}>
          <div className={styles.card}>
            <button className={styles.dangerRow} onClick={logout}>
              Cerrar sesión
            </button>
            <button className={[styles.dangerRow, styles.deleteRow].join(' ')} onClick={() => setShowDeleteModal(true)}>
              Eliminar cuenta
            </button>
          </div>
        </section>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar cuenta"
        size="sm"
      >
        <div className={styles.deleteModal}>
          <p className={styles.deleteText}>
            Esta acción eliminará permanentemente tu cuenta, todas tus tareas, ubicaciones y trayectorias. No se puede deshacer.
          </p>
          <div className={styles.deleteBtns}>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} fullWidth>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteAccountMutation.mutate()}
              loading={deleteAccountMutation.isPending}
              fullWidth
            >
              Eliminar todo
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SettingRow({ label, hint, children }: { label: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className={styles.row}>
      <div className={styles.rowLabel}>
        <span className={styles.rowTitle}>{label}</span>
        {hint && <span className={styles.rowHint}>{hint}</span>}
      </div>
      {children && <div className={styles.rowControl}>{children}</div>}
    </div>
  );
}
