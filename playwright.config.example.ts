import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright exemple pour Dashwright
 * 
 * Cette configuration montre comment :
 * - Intégrer le reporter Dashwright
 * - Activer les screenshots, vidéos et traces
 * - Configurer les retries et workers
 */

export default defineConfig({
  testDir: './tests',
  
  // Tests en parallèle
  fullyParallel: true,
  
  // Interdire .only en CI
  forbidOnly: !!process.env.CI,
  
  // Retries : 2 en CI, 0 en local
  retries: process.env.CI ? 2 : 0,
  
  // Workers : 1 en CI, auto en local
  workers: process.env.CI ? 1 : undefined,
  
  // Reporters
  reporter: [
    // 🚀 Reporter Dashwright - Upload des résultats et artifacts
    ['@dashwright/playwright-reporter', {
      apiUrl: process.env.DASHWRIGHT_API_URL || 'http://localhost:3000/api',
      apiToken: process.env.DASHWRIGHT_API_TOKEN || '',
      organizationId: process.env.DASHWRIGHT_ORG_ID || '',
      
      // Upload des artifacts
      uploadScreenshots: true,
      uploadVideos: true,
      uploadTraces: true,      // 📊 IMPORTANT : Activer l'upload des traces
      uploadLogs: true,
      
      // Configuration des retries
      retryAttempts: 3,
      retryDelay: 1000,
    }],
    
    // Reporter HTML standard de Playwright
    ['html'],
    
    // Reporter en ligne de commande
    ['list'],
  ],
  
  // Configuration globale
  use: {
    // Base URL pour les tests
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // 📸 Screenshots : seulement en cas d'échec
    screenshot: 'only-on-failure',
    
    // 🎥 Vidéos : conserver seulement en cas d'échec
    video: 'retain-on-failure',
    
    // 📊 TRACES : Générer au premier retry (RECOMMANDÉ)
    // Options disponibles :
    // - 'on-first-retry' : Génère une trace au premier retry (équilibre performance/debug)
    // - 'retain-on-failure' : Génère une trace seulement si le test échoue
    // - 'on' : Génère une trace pour tous les tests (très lourd, seulement pour debug)
    // - 'off' : Pas de traces (déconseillé)
    trace: 'on-first-retry',
    
    // Timeouts
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  
  // Projets (navigateurs)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Tests mobile
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  // Serveur de développement (optionnel)
  // Démarre automatiquement avant les tests
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
