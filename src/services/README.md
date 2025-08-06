# Système de connexion à l'API IVAO

Ce module fournit un système complet pour se connecter à l'API IVAO et utiliser ses services. Il peut également être étendu pour d'autres APIs.

## Architecture

Le système est composé de plusieurs modules:

1. **Utils API** (`src/utils/api.ts`)
   - Fonctions utilitaires HTTP avec gestion d'erreurs avancée
   - Support pour les requêtes GET et POST avec timeout

2. **Auth Store** (`src/stores/auth.ts`)
   - Store Pinia pour gérer l'authentification OAuth 2.0
   - Gestion des tokens et de leur expiration

3. **ApiService** (`src/services/ApiService.ts`)
   - Classe de base pour les services API
   - Méthodes pour les requêtes authentifiées et non-authentifiées

4. **IvaoApiService** (`src/services/IvaoApiService.ts`)
   - Implémentation spécifique pour l'API IVAO
   - Méthodes pour accéder aux endpoints IVAO (METAR, TAF, etc.)

5. **MockApiService** (`src/services/MockApiService.ts`)
   - Service mock pour tests sans connexion externe
   - Simule les réponses de l'API IVAO

6. **WeatherFormatter** (`src/utils/weatherFormatter.ts`)
   - Utilitaires pour formater les données météorologiques
   - Remplacement du tag [MET] dans le texte

## Configuration

La configuration du système se fait via des variables d'environnement dans le fichier `.env`:

```
VITE_IVAO_CLIENT_ID=votre_client_id
VITE_IVAO_CLIENT_SECRET=votre_client_secret
```

## Utilisation

### Authentification

```typescript
import { useAuthStore } from '../stores/auth';

// Dans un composant ou service
const authStore = useAuthStore();
await authStore.authenticate();

// Vérifier l'état d'authentification
if (authStore.isAuthenticated) {
  // Accès authentifié
}
```

### Requêtes API

```typescript
import { ivaoApi } from '../services/IvaoApiService';

// Obtenir un METAR
const metar = await ivaoApi.getMetar('LFPG');

// Obtenir un TAF
const taf = await ivaoApi.getTaf('LFPG');
```

### Utilisation du tag [MET]

Le tag [MET] peut être utilisé dans le texte pour insérer les données météo formatées:

```typescript
import { replaceMetarTag } from '../utils/weatherFormatter';

// Obtenir le METAR
const metar = await ivaoApi.getMetar('LFPG');

// Remplacer le tag dans un texte
const text = "La météo actuelle est: [MET]";
const formatted = replaceMetarTag(text, metar, { lang: 'fr' });

// Résultat: "La météo actuelle est: vent 210 degrés 8 noeuds, visibilité supérieure à 10 km, température 16, QNH 1024"
```

### Mode mock

Pour le développement et les tests, vous pouvez utiliser le service mock:

```typescript
import { mockIvaoApi } from '../services/MockApiService';

// Utiliser l'API mock au lieu de l'API réelle
const metar = await mockIvaoApi.getMetar('LFPG');
```

## Proxy CORS

Le système utilise un proxy configuré dans `vite.config.ts` pour éviter les problèmes CORS. Les requêtes à l'API IVAO sont redirigées via ce proxy:

```
/api/ivao/* -> https://api.ivao.aero/*
```

## Formats de données

### METAR

```typescript
interface Metar {
  icao: string;
  name: string;
  created_at: string;
  message: string;
  decoded: {
    visibility: string;
    wind: {
      direction: number;
      speed: number;
      gust: number | null;
      variable_direction: {
        from: number;
        to: number;
      } | null;
    };
    temperature: number;
    dew_point: number;
    altimeter: number;
    clouds: Array<{
      type: string;
      altitude: number;
    }>;
  };
}
```

## Extension à d'autres APIs

Pour ajouter le support d'une nouvelle API, créez une nouvelle classe qui étend `ApiService`:

```typescript
import { ApiService } from './ApiService';

export class NewApiService extends ApiService {
  constructor() {
    super('https://api.exemple.com/v1');
  }
  
  async getSomeResource(id: string) {
    return this.getAuthenticated<any>(`/resources/${id}`);
  }
}

export const newApi = new NewApiService();
