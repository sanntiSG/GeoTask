import { useState, useEffect } from 'react';
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
  const { notificationPermission, requestAndSubscribe, checkNotificationPermission, ensureSubscribed } = useNotifications();
  const { setPermissions } = useAppStore();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [, setSettings] = useState<Partial<UserSettings>>({});
  // Tracks WHY the notification permission failed after user pressed "Permitir":
  // 'denied'  → permanently blocked, must go to chrome://settings
  // 'default' → Chrome suppressed the dialog (quiet-messaging)
  const [notifBlockReason, setNotifBlockReason] = useState<'denied' | 'default' | null>(null);
  // Feedback message shown after pressing "Probar"
  const [testFeedback, setTestFeedback] = useState<string | null>(null);
  // Service Worker status for the live diagnostics row
  const [swStatus, setSwStatus] = useState<string>('verificando…');

  useEffect(() => {
    // Reconcile the persisted store permission with the real browser value on every mount
    checkNotificationPermission();
  }, [checkNotificationPermission]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setSwStatus('no soportado');
      return;
    }
    navigator.serviceWorker
      .getRegistration('/')
      .then((reg) => {
        if (!reg) setSwStatus('ninguno registrado');
        else if (reg.active) setSwStatus('activo ✓');
        else if (reg.installing) setSwStatus('instalando…');
        else if (reg.waiting) setSwStatus('en espera');
        else setSwStatus('registrado (inactivo)');
      })
      .catch(() => setSwStatus('error al verificar'));
  }, []);

  const updateSettingsMutation = useMutation({
    mutationFn: (patch: Partial<UserSettings>) => api.patch('/settings', patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => api.delete('/settings/account'),
    onSuccess: () => window.location.href = '/login',
  });

  const testNotifMutation = useMutation({
    mutationFn: async () => {
      setTestFeedback(null);
      // Always refresh the subscription before testing — ensures we are registered against
      // the currently-active SW (which may have changed due to HMR or browser rotation),
      // so we never hit a stale endpoint and have to manually toggle the permission.
      await ensureSubscribed();
      const { data } = await api.post<{ ok: boolean; reason?: string; sent?: number; total?: number; errors?: unknown[] }>('/notifications/test');
      return data;
    },
    onSuccess: async (data) => {
      if (data.ok) {
        setTestFeedback('✅ Notificación enviada. Debería aparecer en instantes.');
      } else if (data.reason === 'no-subscriptions') {
        // ensureSubscribed() ran but the subscription still isn't in the DB — SW issue
        setTestFeedback('❌ No se pudo crear la suscripción. Abrí DevTools → Application → Service Workers, desregistrá el SW, recargá y volvé a probar.');
      } else if (data.reason === 'send-failed') {
        setTestFeedback('❌ El envío falló (revisar VAPID keys en el backend). Ver consola del servidor.');
      } else {
        setTestFeedback(`❌ Error: ${data.reason ?? 'desconocido'}`);
      }
    },
    onError: () => {
      setTestFeedback('❌ No se pudo conectar con el servidor.');
    },
  });

  const handleRequestNotifications = async () => {
    await requestAndSubscribe();
    // Read the actual browser permission AFTER the request to show the right guidance.
    const perm = Notification.permission as 'granted' | 'denied' | 'default';
    if (perm === 'granted') {
      setNotifBlockReason(null);
    } else {
      // 'denied'  → permanently blocked; no dialog was shown at all.
      // 'default' → Chrome's quiet-messaging suppressed the dialog.
      setNotifBlockReason(perm);
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
            <SettingRow label="Re-notificación por defecto" hint="Se aplica al crear tareas nuevas">
              <input
                type="checkbox"
                defaultChecked={currentSettings?.renotifyEnabled ?? true}
                className={styles.checkbox}
                onChange={(e) => updateSettingsMutation.mutate({ renotifyEnabled: e.target.checked })}
              />
            </SettingRow>
            <SettingRow label="Minutos por defecto" hint="Intervalo de re-notificación para tareas nuevas">
              <input
                type="number"
                min={1}
                max={1440}
                defaultValue={currentSettings?.renotifyAfter ?? 30}
                className={styles.numInput}
                onBlur={(e) => updateSettingsMutation.mutate({ renotifyAfter: Number(e.target.value) })}
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
            {testFeedback && (
              <p className={styles.testFeedback}>{testFeedback}</p>
            )}
            </SettingRow>

            {/* Guidance shown only after a failed permission request */}
            {notifBlockReason === 'denied' && (
              <div className={styles.permissionGuide}>
                <p className={styles.permissionGuideTitle}>🚫 Notificaciones bloqueadas</p>
                <p className={styles.permissionGuideText}>
                  Chrome bloqueó este sitio y no volverá a preguntar desde la página.
                  Para activarlas:
                </p>
                <ol className={styles.permissionGuideSteps}>
                  <li>Abrí <code>chrome://settings/content/notifications</code> en una nueva pestaña.</li>
                  <li>En <em>"No pueden enviar notificaciones"</em>, quitá <code>{window.location.origin}</code>.</li>
                  <li>Recargá esta página y presioná "Permitir" de nuevo.</li>
                </ol>
                <p className={styles.permissionGuideAlt}>
                  Alternativa rápida: clic en el candado a la izquierda de la URL → Configuración del sitio → Notificaciones → Permitir.
                </p>
              </div>
            )}
            {notifBlockReason === 'default' && (
              <div className={styles.permissionGuide}>
                <p className={styles.permissionGuideTitle}>🔔 Diálogo oculto</p>
                <p className={styles.permissionGuideText}>
                  Chrome ocultó el pedido. Hacé clic en el ícono de <strong>campana o candado</strong> en la barra de direcciones y elegí <strong>Permitir</strong>, luego volvé a intentarlo.
                </p>
              </div>
            )}

            <SettingRow label="Ubicación" hint="Para detección de proximidad">
              <Button variant="secondary" size="sm" onClick={handleRequestGeo}>
                Actualizar
              </Button>
            </SettingRow>
          </div>
        </section>

        {/* Diagnostics — helps identify why notifications aren't working */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Diagnóstico</h2>
          <div className={styles.card}>
            <div className={styles.diagBox}>
              <DiagRow label="Notification.permission" value={
                'Notification' in window ? Notification.permission : 'no soportado'
              } />
              <DiagRow label="Contexto seguro (HTTPS/localhost)" value={
                window.isSecureContext ? 'sí ✓' : 'NO ✗ — las notificaciones requieren HTTPS'
              } highlight={!window.isSecureContext} />
              <DiagRow label="Origen" value={window.location.origin} />
              <DiagRow label="Service Worker" value={swStatus} />
            </div>
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

function DiagRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={styles.diagRow}>
      <span className={styles.diagLabel}>{label}</span>
      <code className={[styles.diagValue, highlight ? styles.diagValueWarn : ''].join(' ')}>
        {value}
      </code>
    </div>
  );
}
