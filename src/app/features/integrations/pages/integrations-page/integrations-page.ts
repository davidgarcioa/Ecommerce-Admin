import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
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
        title: 'API',
        subtitle: health?.api.message ?? 'Pendiente de revisión',
        status: healthStatusToIntegration(health?.api),
        icon: 'lan',
        detail: 'Backend NestJS',
      },
      {
        id: 'firebase',
        title: 'Firebase',
        subtitle: buildFirebaseSubtitle(health),
        status: buildFirebaseStatus(health),
        icon: 'database',
        detail: 'Firestore y Storage',
      },
      {
        id: 'dropi',
        title: 'Dropi',
        subtitle: buildDropiSubtitle(dropi, dropiAuth, dropiAuthError),
        status: buildDropiStatus(dropi, dropiAuth, dropiAuthError),
        icon: 'sync_alt',
        detail: 'Órdenes externas',
      },
      {
        id: 'meta',
        title: 'Meta Ads',
        subtitle: buildMetaSubtitle(meta, metaConnection, metaConnectionError),
        status: buildMetaStatus(meta, metaConnection, metaConnectionError),
        icon: 'ads_click',
        detail: 'Campañas',
      },
    ];
  });

  readonly firebaseChecks = computed<readonly IntegrationCheck[]>(() => {
    const health = this.health();

    return [
      toCheck('API', health?.api),
      toCheck('Variables de entorno', health?.environment),
      toCheck('Firestore', health?.firestore),
      toCheck('Firebase Storage', health?.storage),
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
        label: 'URL base',
        value: dropi?.baseUrlConfigured ? 'Configurada' : 'Pendiente',
        status: dropi?.baseUrlConfigured ? 'connected' : 'warning',
      },
      {
        label: 'Autenticación',
        value: formatAuthMode(dropi?.authMode ?? 'missing'),
        status: dropi?.authMode === 'missing' ? 'warning' : 'connected',
      },
      {
        label: 'Header',
        value: dropi?.authHeader ?? 'Pendiente',
        status: dropi?.authHeader === 'X-Authorization' ? 'connected' : 'warning',
      },
      {
        label: 'Ruta de órdenes',
        value: dropi?.ordersPath ?? 'Pendiente',
        status: dropi?.ordersPath ? 'connected' : 'warning',
      },
      {
        label: 'Usuario Dropi',
        value: dropi?.userIdConfigured ? 'Configurado' : 'Pendiente',
        status: dropi?.userIdConfigured ? 'connected' : 'warning',
      },
      {
        label: 'Prueba de token',
        value: this.dropiAuthError() ?? (this.dropiAuth() ? 'Autorizado' : 'Sin probar'),
        status: authStatus,
      },
      {
        label: 'Registros por consulta',
        value: dropi ? `${dropi.pageSize}` : 'Pendiente',
        status: dropi ? 'connected' : 'pending',
      },
      {
        label: 'Consulta con fechas',
        value: syncError ?? (syncSummary ? formatDropiSyncSummary(syncSummary) : 'Sin probar'),
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
        label: 'Graph API',
        value: meta?.graphApiVersion ?? 'Pendiente',
        status: meta ? 'connected' : 'pending',
      },
      {
        label: 'App',
        value: meta?.appIdConfigured ? 'Configurada' : 'Pendiente',
        status: meta?.appIdConfigured ? 'connected' : 'warning',
      },
      {
        label: 'Token',
        value: meta?.accessTokenConfigured ? 'Configurado' : 'Pendiente',
        status: meta?.accessTokenConfigured ? 'connected' : 'warning',
      },
      {
        label: 'Cuenta publicitaria',
        value: connection?.accountName ?? (meta?.adAccountConfigured ? 'Configurada' : 'Pendiente'),
        status: connection ? 'connected' : meta?.adAccountConfigured ? 'pending' : 'warning',
      },
      {
        label: 'Business Manager',
        value: meta?.businessConfigured ? 'Configurado' : 'Opcional pendiente',
        status: meta?.businessConfigured ? 'connected' : 'warning',
      },
      {
        label: 'Prueba de conexión',
        value: error ?? connection?.message ?? 'Sin probar',
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
          this.errorMessage.set(error.message);
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
          this.dropiAuthError.set(error.message);
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
          this.dropiSyncError.set(error.message);
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
          this.metaConnectionError.set(error.message);
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
          this.metaPreviewError.set(error.message);
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
  if (health.firestore.status === 'warning' || health.storage.status === 'warning') return 'warning';
  return 'connected';
}

function buildFirebaseSubtitle(health: HealthCheckResponse | null): string {
  if (!health) return 'Pendiente de revisión';
  const firestoreReady = health.firestore.status === 'ok';
  const storageReady = health.storage.status === 'ok';

  if (firestoreReady && storageReady) return 'Firestore y Storage activos';
  if (firestoreReady) return 'Storage requiere revisión';
  if (storageReady) return 'Firestore requiere revisión';
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
  if (authError) return authError;
  if (token) return 'Token validado correctamente';
  if (!status) return 'Pendiente de revisión';
  if (!status.configured) return 'Faltan credenciales o URL';
  return `Configurado por ${formatAuthMode(status.authMode).toLowerCase()}`;
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
  if (connectionError) return connectionError;
  if (connection) return connection.accountName ?? connection.message;
  if (!status) return 'Pendiente de revisión';
  if (status.configured) return 'Lista para probar conexión';
  if (status.configurationStatus === 'partial') return 'Configuración incompleta';
  return 'Pendiente de credenciales';
}

function toCheck(label: string, item: HealthCheckItem | undefined): IntegrationCheck {
  return {
    label,
    value: item?.message ?? 'Pendiente de revisión',
    status: healthStatusToIntegration(item),
  };
}

function formatAuthMode(mode: DropiIntegrationStatus['authMode']): string {
  const labels: Readonly<Record<DropiIntegrationStatus['authMode'], string>> = {
    auto: 'Automática',
    'static-token': 'Token fijo',
    'email-password': 'Correo y contraseña',
    missing: 'No configurada',
  };

  return labels[mode];
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
  return `${summary.received} recibidas · ${summary.imported} nuevas · ${summary.updated} actualizadas`;
}
