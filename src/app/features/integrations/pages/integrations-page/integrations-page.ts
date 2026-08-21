import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import { MetaAdsPreviewComponent } from '../../components/meta-ads-preview/meta-ads-preview';
import { IntegrationsApiService } from '../../data-access/integrations-api.service';
import {
  DropiAuthToken,
  DropiIntegrationStatus,
  DropiSyncSummary,
  HealthCheckItem,
  HealthCheckResponse,
  IntegrationCard,
  IntegrationCheck,
  IntegrationSection,
  IntegrationStatus,
  MetaAdsPreview,
  MetaConnectionCheck,
  MetaIntegrationStatus,
  SyncDropiOrdersRequest,
} from '../../data-access/integrations.models';

const SECTIONS: readonly {
  readonly id: IntegrationSection;
  readonly label: string;
  readonly icon: string;
}[] = [
  { id: 'general', label: 'General', icon: 'grid_view' },
  { id: 'dropi', label: 'Dropi', icon: 'sync_alt' },
  { id: 'firebase', label: 'Firebase', icon: 'database' },
  { id: 'meta', label: 'Meta Ads', icon: 'ads_click' },
];

@Component({
  selector: 'app-integrations-page',
  imports: [MetaAdsPreviewComponent],
  templateUrl: './integrations-page.html',
  styleUrl: './integrations-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntegrationsPageComponent {
  private readonly integrationsApi = inject(IntegrationsApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly sections = SECTIONS;
  readonly activeSection = signal<IntegrationSection>('general');
  readonly loading = signal(false);
  readonly testingDropi = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly health = signal<HealthCheckResponse | null>(null);
  readonly dropiStatus = signal<DropiIntegrationStatus | null>(null);
  readonly dropiAuth = signal<DropiAuthToken | null>(null);
  readonly dropiAuthError = signal<string | null>(null);
  readonly syncingDropi = signal(false);
  readonly dropiSyncSummary = signal<DropiSyncSummary | null>(null);
  readonly dropiSyncError = signal<string | null>(null);
  readonly testingMeta = signal(false);
  readonly loadingMetaPreview = signal(false);
  readonly metaStatus = signal<MetaIntegrationStatus | null>(null);
  readonly metaConnection = signal<MetaConnectionCheck | null>(null);
  readonly metaConnectionError = signal<string | null>(null);
  readonly metaPreview = signal<MetaAdsPreview | null>(null);
  readonly metaPreviewError = signal<string | null>(null);
  readonly lastChecked = signal<Date | null>(null);

  readonly connectionCards = computed<readonly IntegrationCard[]>(() => {
    const health = this.health();
    const dropi = this.dropiStatus();
    const dropiAuth = this.dropiAuth();
    const dropiAuthError = this.dropiAuthError();
    const meta = this.metaStatus();
    const metaConnection = this.metaConnection();
    const metaConnectionError = this.metaConnectionError();

    return [
      {
        id: 'api',
        title: 'Sistema',
        subtitle:
          healthStatusToIntegration(health?.api) === 'connected'
            ? 'Servicio principal activo'
            : 'Requiere revisión',
        status: healthStatusToIntegration(health?.api),
        icon: 'lan',
        detail: 'Panel administrativo',
      },
      {
        id: 'firebase',
        title: 'Base de datos',
        subtitle: buildFirebaseSubtitle(health),
        status: buildFirebaseStatus(health),
        icon: 'database',
        detail: 'Datos y archivos',
      },
      {
        id: 'dropi',
        title: 'Dropi',
        subtitle: buildDropiSubtitle(dropi, dropiAuth, dropiAuthError),
        status: buildDropiStatus(dropi, dropiAuth, dropiAuthError),
        icon: 'sync_alt',
        detail: 'Pedidos y guías',
      },
      {
        id: 'meta',
        title: 'Meta Ads',
        subtitle: buildMetaSubtitle(meta, metaConnection, metaConnectionError),
        status: buildMetaStatus(meta, metaConnection, metaConnectionError),
        icon: 'ads_click',
        detail: 'Publicidad',
      },
    ];
  });

  readonly firebaseChecks = computed<readonly IntegrationCheck[]>(() => {
    const health = this.health();

    return [
      toClientCheck('Sistema', health?.api, 'Operando correctamente'),
      toClientCheck('Configuración', health?.environment, 'Lista para operar'),
      toClientCheck('Base de datos', health?.firestore, 'Disponible'),
      toClientCheck('Archivos', health?.storage, 'Disponible'),
    ];
  });

  readonly dropiChecks = computed<readonly IntegrationCheck[]>(() => {
    const dropi = this.dropiStatus();
    const syncSummary = this.dropiSyncSummary();
    const syncError = this.dropiSyncError();
    const authStatus: IntegrationStatus = this.dropiAuth()
      ? 'connected'
      : this.dropiAuthError()
        ? 'error'
        : 'pending';

    return [
      {
        label: 'Conexión',
        value: dropi?.configured ? 'Lista para sincronizar' : 'Pendiente de configuración',
        status: dropi?.configured ? 'connected' : 'warning',
      },
      {
        label: 'Cuenta Dropi',
        value: dropi?.userIdConfigured ? 'Configurado' : 'Pendiente',
        status: dropi?.userIdConfigured ? 'connected' : 'warning',
      },
      {
        label: 'Prueba de acceso',
        value: this.dropiAuthError()
          ? 'No se pudo conectar'
          : this.dropiAuth()
            ? 'Conexión aprobada'
            : 'Sin probar',
        status: authStatus,
      },
      {
        label: 'Sincronización',
        value: syncError
          ? 'No se pudo sincronizar'
          : syncSummary
            ? formatDropiSyncSummary(syncSummary)
            : 'Sin probar',
        status: syncError ? 'error' : syncSummary ? 'connected' : 'pending',
      },
    ];
  });

  readonly metaChecks = computed<readonly IntegrationCheck[]>(() => {
    const meta = this.metaStatus();
    const connection = this.metaConnection();
    const error = this.metaConnectionError();

    return [
      {
        label: 'Conexión Meta',
        value: meta?.configured ? 'Lista para probar' : 'Pendiente de credenciales',
        status: meta?.configured
          ? 'connected'
          : meta?.configurationStatus === 'partial'
            ? 'warning'
            : 'pending',
      },
      {
        label: 'Cuenta publicitaria',
        value: connection?.accountName ?? (meta?.adAccountConfigured ? 'Configurada' : 'Pendiente'),
        status: connection ? 'connected' : meta?.adAccountConfigured ? 'pending' : 'warning',
      },
      {
        label: 'Lectura de campañas',
        value: this.metaPreview()
          ? `${this.metaPreview()?.summary.campaigns ?? 0} campañas leídas`
          : 'Sin lectura',
        status: this.metaPreview() ? 'connected' : 'pending',
      },
      {
        label: 'Prueba de conexión',
        value: error ? 'No se pudo conectar' : connection ? 'Conexión aprobada' : 'Sin probar',
        status: error ? 'error' : connection ? 'connected' : 'pending',
      },
    ];
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      health: this.integrationsApi.loadHealth(),
      dropi: this.integrationsApi.loadDropiStatus(),
      meta: this.integrationsApi.loadMetaStatus(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ health, dropi, meta }) => {
          this.health.set(health);
          this.dropiStatus.set(dropi);
          this.metaStatus.set(meta);
          this.lastChecked.set(new Date());
          this.loading.set(false);
        },
        error: (error: Error) => {
          this.errorMessage.set(
            toClientFacingError(error.message, 'No fue posible revisar las conexiones.'),
          );
          this.loading.set(false);
        },
      });
  }

  testDropi(): void {
    this.testingDropi.set(true);
    this.dropiAuthError.set(null);
    this.dropiAuth.set(null);

    this.integrationsApi
      .testDropiAuthentication()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (token) => {
          this.dropiAuth.set(token);
          this.testingDropi.set(false);
        },
        error: (error: Error) => {
          this.dropiAuthError.set(
            toClientFacingError(error.message, 'No fue posible conectar con Dropi.'),
          );
          this.testingDropi.set(false);
        },
      });
  }

  syncDropiNow(): void {
    this.syncingDropi.set(true);
    this.dropiSyncError.set(null);
    this.dropiSyncSummary.set(null);

    this.integrationsApi
      .syncDropiOrders(buildDropiSyncRequest())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (summary) => {
          this.dropiSyncSummary.set(summary);
          this.syncingDropi.set(false);
          this.lastChecked.set(new Date());
          this.refresh();
        },
        error: (error: Error) => {
          this.dropiSyncError.set(
            toClientFacingError(error.message, 'No fue posible sincronizar Dropi.'),
          );
          this.syncingDropi.set(false);
        },
      });
  }

  testMeta(): void {
    this.testingMeta.set(true);
    this.metaConnectionError.set(null);
    this.metaConnection.set(null);

    this.integrationsApi
      .testMetaConnection()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (connection) => {
          this.metaConnection.set(connection);
          this.testingMeta.set(false);
        },
        error: (error: Error) => {
          this.metaConnectionError.set(
            toClientFacingError(
              error.message,
              'Meta Ads necesita credenciales de la cuenta antes de conectar.',
            ),
          );
          this.testingMeta.set(false);
        },
      });
  }

  previewMeta(): void {
    this.loadingMetaPreview.set(true);
    this.metaPreviewError.set(null);
    this.metaPreview.set(null);

    this.integrationsApi
      .previewMetaAds()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (preview) => {
          this.metaPreview.set(preview);
          this.loadingMetaPreview.set(false);
        },
        error: (error: Error) => {
          this.metaPreviewError.set(
            toClientFacingError(error.message, 'No fue posible leer las campañas de Meta Ads.'),
          );
          this.loadingMetaPreview.set(false);
        },
      });
  }

  setSection(section: IntegrationSection): void {
    this.activeSection.set(section);
  }

  statusLabel(status: IntegrationStatus): string {
    const labels: Readonly<Record<IntegrationStatus, string>> = {
      connected: 'Conectado',
      warning: 'Revisar',
      error: 'Error',
      pending: 'Pendiente',
    };

    return labels[status];
  }

  formatLastChecked(date: Date | null): string {
    if (!date) return 'Sin revisión';

    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}

function healthStatusToIntegration(item: HealthCheckItem | undefined): IntegrationStatus {
  if (!item) return 'pending';
  if (item.status === 'ok') return 'connected';
  if (item.status === 'warning') return 'warning';
  return 'error';
}

function buildFirebaseStatus(health: HealthCheckResponse | null): IntegrationStatus {
  if (!health) return 'pending';
  if (health.firestore.status === 'error' || health.storage.status === 'error') return 'error';
  if (health.firestore.status === 'warning' || health.storage.status === 'warning')
    return 'warning';
  return 'connected';
}

function buildFirebaseSubtitle(health: HealthCheckResponse | null): string {
  if (!health) return 'Pendiente de revisión';
  const firestoreReady = health.firestore.status === 'ok';
  const storageReady = health.storage.status === 'ok';

  if (firestoreReady && storageReady) return 'Datos y archivos activos';
  if (firestoreReady) return 'Archivos requieren revisión';
  if (storageReady) return 'Base de datos requiere revisión';
  return 'Requiere configuración';
}

function buildDropiStatus(
  status: DropiIntegrationStatus | null,
  token: DropiAuthToken | null,
  authError: string | null,
): IntegrationStatus {
  if (authError) return 'error';
  if (token) return 'connected';
  if (!status) return 'pending';
  if (!status.configured || status.authMode === 'missing') return 'warning';
  return 'pending';
}

function buildDropiSubtitle(
  status: DropiIntegrationStatus | null,
  token: DropiAuthToken | null,
  authError: string | null,
): string {
  if (authError) return 'No se pudo conectar';
  if (token) return 'Conexión aprobada';
  if (!status) return 'Pendiente de revisión';
  if (!status.configured) return 'Pendiente de credenciales';
  return 'Lista para sincronizar';
}

function buildMetaStatus(
  status: MetaIntegrationStatus | null,
  connection: MetaConnectionCheck | null,
  connectionError: string | null,
): IntegrationStatus {
  if (connectionError) return 'error';
  if (connection) return 'connected';
  if (!status) return 'pending';
  if (status.configured) return 'pending';
  if (status.configurationStatus === 'partial') return 'warning';
  return 'pending';
}

function buildMetaSubtitle(
  status: MetaIntegrationStatus | null,
  connection: MetaConnectionCheck | null,
  connectionError: string | null,
): string {
  if (connectionError) return 'Pendiente de credenciales';
  if (connection) return connection.accountName ?? 'Conexión aprobada';
  if (!status) return 'Pendiente de revisión';
  if (status.configured) return 'Lista para probar conexión';
  if (status.configurationStatus === 'partial') return 'Configuración incompleta';
  return 'Pendiente de credenciales';
}

function toClientCheck(
  label: string,
  item: HealthCheckItem | undefined,
  connectedValue: string,
): IntegrationCheck {
  const status = healthStatusToIntegration(item);

  return {
    label,
    value:
      status === 'connected'
        ? connectedValue
        : status === 'pending'
          ? 'Pendiente de revisión'
          : status === 'warning'
            ? 'Requiere revisión'
            : 'No disponible',
    status,
  };
}

function buildDropiSyncRequest(): SyncDropiOrdersRequest {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30);

  return {
    dateFrom: formatDate(startDate),
    dateTo: formatDate(today),
    pageSize: 100,
    maxPages: 10,
    dryRun: false,
  };
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDropiSyncSummary(summary: DropiSyncSummary): string {
  return `${summary.received} órdenes revisadas`;
}

function toClientFacingError(message: string, fallback: string): string {
  const technicalPattern =
    /[A-Z0-9_]{6,}|token|secret|header|endpoint|graph api|firebase|firestore|storage/i;

  if (technicalPattern.test(message)) return fallback;

  return message || fallback;
}
