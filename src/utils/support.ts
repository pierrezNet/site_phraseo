/**
 * Soutien au projet : page du collectif Open Collective (frais de voix et d'hébergement, sur factures publiques).
 * Vide tant que l'hôte fiscal n'a pas accepté le collectif : les boutons « Soutenir » restent masqués.
 * Activation : 'https://opencollective.com/phraseo'
 */
const COLLECTIVE_URL = '';

/** Développement seulement : `?soutien=demo` affiche boutons et fonds fictif, sans relais */
export const SUPPORT_DEMO =
  import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).get('soutien') === 'demo';

export const SUPPORT_URL: string = COLLECTIVE_URL || (SUPPORT_DEMO ? 'https://opencollective.com/phraseo' : '');
