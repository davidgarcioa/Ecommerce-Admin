import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/files-manager-page/files-manager-page').then(
        (m) => m.FilesManagerPageComponent,
      ),
    data: { title: 'Archivos', reuse: true },
  },
  {
    path: 'subir',
    loadComponent: () =>
      import('./pages/file-upload-page/file-upload-page').then((m) => m.FileUploadPageComponent),
    data: { title: 'Subir archivo' },
  },
  {
    path: 'importar',
    loadComponent: () => import('./pages/files-page/files-page').then((m) => m.FilesPageComponent),
    data: { title: 'Importar datos' },
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./pages/file-edit-page/file-edit-page').then((m) => m.FileEditPageComponent),
    data: { title: 'Editar archivo' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/file-detail-page/file-detail-page').then((m) => m.FileDetailPageComponent),
    data: { title: 'Detalle de archivo' },
  },
];
