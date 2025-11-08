/**
 * WikidAI System Prompts
 *
 * This module exports different system instruction variants for the Gemini orchestrator.
 * Choose the appropriate prompt based on your use case.
 */

import { getSystemInstructions } from './system-instructions';
import { getWikidataFocusedInstructions } from './wikidata-focused-instructions';

export { getSystemInstructions, getWikidataFocusedInstructions };

/**
 * Prompt Selection Guide
 *
 * Use `getWikidataFocusedInstructions()` when:
 * - Wikidata is the primary knowledge source
 * - SPARQL generation is the main task
 * - Educational focus on showing SPARQL queries
 * - Users ask structured factual questions
 * - DEFAULT CHOICE for WikidAI
 *
 * Use `getSystemInstructions()` when:
 * - Multi-source orchestration (Wikidata + Wikipedia + DuckDuckGo + OpenMeteo + Nominatim)
 * - Balanced approach across all agents
 * - Geographic and weather queries are frequent
 * - Need comprehensive multi-step workflow handling
 */

export const PromptMode = {
  /** Wikidata/SPARQL focused with extensive examples (DEFAULT) */
  WIKIDATA_FOCUSED: 'wikidata-focused',

  /** Balanced multi-agent orchestration */
  BALANCED: 'balanced',
} as const;

export type PromptModeType = (typeof PromptMode)[keyof typeof PromptMode];

/**
 * Get system instructions by mode
 */
export function getPromptByMode(mode: PromptModeType): string {
  switch (mode) {
    case PromptMode.WIKIDATA_FOCUSED:
      return getWikidataFocusedInstructions();
    case PromptMode.BALANCED:
      return getSystemInstructions();
    default:
      return getWikidataFocusedInstructions();
  }
}
