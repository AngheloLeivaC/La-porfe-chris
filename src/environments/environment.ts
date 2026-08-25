export const environment = {
  production: false,
  apiBaseUrl: 'https://crm.laprofechris.com/api/v1',
  storageBaseUrl: 'https://ipssoma-storage.s3.eu-west-1.amazonaws.com',
  // Panel de administrador existente (Blade/Laravel), con su propio login
  // basado en sesión — no comparte token con el login de alumnos.
  adminPanelUrl: 'https://crm.laprofechris.com',
};
