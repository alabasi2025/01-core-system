import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Dynamic routes - use client-side rendering
  {
    path: 'users/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'roles/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'stations/:id',
    renderMode: RenderMode.Client,
  },
  // All other routes - use client-side rendering for SPA behavior
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
