import { Routes } from '@angular/router';

import { FileDetailPageComponent } from './pages/file-detail-page/file-detail-page';
import { FileEditPageComponent } from './pages/file-edit-page/file-edit-page';
import { FileUploadPageComponent } from './pages/file-upload-page/file-upload-page';
import { FilesManagerPageComponent } from './pages/files-manager-page/files-manager-page';
import { FilesPageComponent } from './pages/files-page/files-page';

export const routes: Routes = [
  {
    path: '',
    component: FilesManagerPageComponent,
  },
  {
    path: 'subir',
    component: FileUploadPageComponent,
  },
  {
    path: 'importar',
    component: FilesPageComponent,
  },
  {
    path: ':id/editar',
    component: FileEditPageComponent,
  },
  {
    path: ':id',
    component: FileDetailPageComponent,
  },
];
