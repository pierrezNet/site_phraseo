/**
 * Sous-ensemble du METAR renvoyé par AVWX (via le relais) utilisé par l'application.
 * Les valeurs sont numériques côté AVWX ; les chaînes restent acceptées (données saisies, tests).
 */
export interface MetarValue {
  value: number | string | null;
  repr?: string;
}

export interface Metar {
  station?: string;
  raw?: string;
  altimeter?: MetarValue | null;
  temperature?: MetarValue | null;
  wind_direction?: MetarValue | null;
  wind_speed?: MetarValue | null;
  visibility?: MetarValue | null;
  /** Ancien format : données imbriquées */
  decoded?: Metar;
}

/** Données METAR effectives, qu'elles soient à la racine ou sous `.decoded`. */
export const metarFields = (metar: Metar): Metar => metar.decoded ?? metar;
