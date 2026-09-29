/**
 * Vol complet : construction d'un vol à partir d'un scénario (src/data/scenarios.json)
 * et des tâches de phraséologie du mode. Logique pure, sans Vue ni store.
 */
import type { UserLevel } from '../stores/form';

export interface PhraseoLine {
  _class: string;
  _lang: string;
  __text: string;
}

interface Task {
  _id: string;
  _name?: string;
  _level?: string;
  _levelExact?: boolean;
  para?: PhraseoLine[];
}

export interface ScenarioStep {
  /** Tâche de la séquence (compoundTask.call) */
  task: string;
  /** Variantes possibles : une seule est tirée au hasard parmi celles visibles au niveau */
  then?: string[];
  /** Probabilité que l'étape se produise (imprévu). Absente = toujours */
  chance?: number;
}

export interface Scenario {
  id: string;
  mode: 'VFR' | 'IFR';
  name: string;
  description?: string;
  steps: ScenarioStep[];
}

export interface FlightStep {
  /** Tâche principale, puis variante retenue éventuelle */
  taskIds: string[];
  tab: string;
  title: string;
  subtitle: string;
  incident: boolean;
  lines: PhraseoLine[];
}

/** Ordre des phases d'un vol (onglets) */
export const FLIGHT_PHASES = ['SO', 'DE', 'CR', 'AP', 'AT'] as const;

// Niveaux cumulatifs : débutant < intermédiaire < avancé
const LEVEL_HIERARCHY = ['débutant', 'intermédiaire', 'avancé'] as const;

/** Visibilité d'une tâche au niveau de l'utilisateur (`_levelExact` = ce niveau uniquement). */
export function isTaskVisibleAtLevel(task: { _level?: string; _levelExact?: boolean } | undefined | null, level: string): boolean {
  if (!task || !task._level) return true; // pas de niveau = toujours visible
  const userLevelIndex = LEVEL_HIERARCHY.indexOf(level as UserLevel);
  const taskLevelIndex = LEVEL_HIERARCHY.indexOf(task._level as UserLevel);
  if (task._levelExact) return taskLevelIndex === userLevelIndex;
  return taskLevelIndex <= userLevelIndex;
}

interface PhraseoData {
  processChain: {
    tasks: {
      compoundTask: { call: { _refid: string; _tab: string }[] };
      spawnTask?: Task[];
      orTask?: Task[];
    };
  };
}

/**
 * Construit la suite des étapes d'un vol :
 * - une étape dont la tâche n'est pas visible au niveau est ignorée ;
 * - un imprévu (`chance`) n'a lieu que si le tirage le décide ;
 * - une variante est tirée parmi celles visibles ; sans variante ni texte propre, l'étape est ignorée.
 */
export function buildFlight(
  scenario: Scenario,
  data: PhraseoData,
  level: string,
  rng: () => number = Math.random
): FlightStep[] {
  const { tasks } = data.processChain;
  const byId = new Map<string, Task>([...(tasks.spawnTask || []), ...(tasks.orTask || [])].map((t) => [t._id, t]));
  const tabOf = new Map(tasks.compoundTask.call.map((c) => [c._refid, c._tab]));

  const steps: FlightStep[] = [];
  for (const step of scenario.steps) {
    const task = byId.get(step.task);
    if (!task || !isTaskVisibleAtLevel(task, level)) continue;

    const incident = step.chance !== undefined && step.chance < 1;
    if (incident && rng() >= (step.chance as number)) continue;

    const variants = (step.then || []).map((id) => byId.get(id)).filter((t): t is Task => !!t && isTaskVisibleAtLevel(t, level));
    const variant = variants.length ? variants[Math.floor(rng() * variants.length)] : undefined;

    const lines = [...(task.para || []), ...(variant?.para || [])];
    if (!lines.length) continue;

    steps.push({
      taskIds: variant ? [task._id, variant._id] : [task._id],
      tab: tabOf.get(task._id) || '??',
      title: task._name || task._id,
      subtitle: variant?._name || '',
      incident,
      lines,
    });
  }
  return steps;
}
