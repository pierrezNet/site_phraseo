/**
 * Moteurs de reconnaissance comparés par le banc vocal (Node).
 * Les formats d'API sont ceux documentés à la date du banc : à confirmer au premier lancement
 * (une erreur HTTP est rapportée telle quelle dans le rapport).
 */
import { readFile } from 'node:fs/promises';

export interface Engine {
  id: string;
  label: string;
  /** Coût estimé par minute d'audio, en dollars (tarifs publics) */
  costPerMinute: number;
  /** Variables d'environnement nécessaires (vide = toujours disponible) */
  env: string[];
  /** Délai minimal entre deux appels (quotas des offres gratuites) */
  minIntervalMs?: number;
  transcribe(file: string, lang: 'fr' | 'en', expected: string, vocabulary: string[]): Promise<string>;
}

const env = (name: string) => process.env[name] ?? '';

async function audioBlob(file: string): Promise<Blob> {
  return new Blob([await readFile(file)], { type: 'audio/wav' });
}

export class HttpError extends Error {
  constructor(readonly status: number, body: string) {
    super(`HTTP ${status} ${body.slice(0, 300)}`);
  }
}

async function ok(res: Response): Promise<Response> {
  if (!res.ok) throw new HttpError(res.status, await res.text());
  return res;
}

export const ENGINES: Engine[] = [
  {
    // Contrôle de la chaîne : renvoie la phrase attendue (doit donner 100 %)
    id: 'reference',
    label: 'Référence (texte attendu)',
    costPerMinute: 0,
    env: [],
    async transcribe(_file, _lang, expected) {
      return expected;
    },
  },
  {
    id: 'azure',
    label: 'Azure AI Speech (fast transcription)',
    costPerMinute: 0.006,
    env: ['AZURE_SPEECH_KEY', 'AZURE_SPEECH_REGION'],
    async transcribe(file, lang, _expected, vocabulary) {
      const url = `https://${env('AZURE_SPEECH_REGION')}.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=2024-11-15`;
      const send = async (withPhrases: boolean) => {
        const form = new FormData();
        form.append('audio', await audioBlob(file), 'audio.wav');
        const definition: Record<string, unknown> = { locales: [lang === 'fr' ? 'fr-FR' : 'en-US'] };
        if (withPhrases) definition.phraseList = { phrases: vocabulary };
        form.append('definition', JSON.stringify(definition));
        return fetch(url, { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': env('AZURE_SPEECH_KEY') }, body: form });
      };
      // Liste de vocabulaire : si la version d'API la refuse, on retente sans
      let res = await send(true);
      if (res.status === 400) res = await send(false);
      const json = (await (await ok(res)).json()) as { combinedPhrases?: { text: string }[] };
      return json.combinedPhrases?.[0]?.text ?? '';
    },
  },
  {
    id: 'mistral',
    label: 'Mistral Voxtral Mini Transcribe',
    costPerMinute: 0.003,
    env: ['MISTRAL_API_KEY'],
    minIntervalMs: 1200, // offre gratuite : environ 1 requête par seconde
    async transcribe(file, lang, _expected, vocabulary) {
      const send = async (withBias: boolean) => {
        const form = new FormData();
        form.append('file', await audioBlob(file), 'audio.wav');
        form.append('model', 'voxtral-mini-latest');
        form.append('language', lang);
        if (withBias) vocabulary.slice(0, 100).forEach((term) => form.append('context_bias', term));
        return fetch('https://api.mistral.ai/v1/audio/transcriptions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${env('MISTRAL_API_KEY')}` },
          body: form,
        });
      };
      let res = await send(true);
      if (res.status === 400 || res.status === 422) res = await send(false);
      const json = (await (await ok(res)).json()) as { text?: string };
      return json.text ?? '';
    },
  },
  {
    id: 'cloudflare',
    label: 'Whisper large v3 turbo (Cloudflare Workers AI)',
    costPerMinute: 0.0005,
    env: ['CF_ACCOUNT_ID', 'CF_API_TOKEN'],
    async transcribe(file, lang, _expected, vocabulary) {
      const url = `https://api.cloudflare.com/client/v4/accounts/${env('CF_ACCOUNT_ID')}/ai/run/@cf/openai/whisper-large-v3-turbo`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${env('CF_API_TOKEN')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: (await readFile(file)).toString('base64'),
          language: lang,
          // Whisper n'a pas de liste de mots : on l'oriente avec un court contexte
          initial_prompt: `Radiotéléphonie aéronautique. ${vocabulary.join(', ')}.`,
        }),
      });
      const json = (await (await ok(res)).json()) as { result?: { text?: string } };
      return json.result?.text ?? '';
    },
  },
];
