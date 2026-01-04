
export interface N21Requirement {
  id: string;
  label: string;
  minVpg: number;
  cep: number;
  bbs: number;
  wes: number;
  minActiveLines: number; 
  minLcLines: number;     
  description: string;
}

export const N21_STANDARDS: Record<string, N21Requirement> = {
  THREE_PERCENT: { id: '3', label: '3%', minVpg: 200, cep: 1, bbs: 1, wes: 1, minActiveLines: 1, minLcLines: 0, description: 'Base del business.' },
  SIX_PERCENT: { id: '6', label: '6%', minVpg: 600, cep: 3, bbs: 3, wes: 5, minActiveLines: 2, minLcLines: 0, description: 'Sviluppo laterale: 2 squadre.' },
  LEADERS_CLUB: { id: 'LC', label: 'Leaders Club (9%)', minVpg: 1200, cep: 5, bbs: 5, wes: 10, minActiveLines: 3, minLcLines: 0, description: 'La pietra miliare: 3 squadre.' },
  TWELVE_PERCENT: { id: '12', label: '12%', minVpg: 2400, cep: 10, bbs: 10, wes: 15, minActiveLines: 3, minLcLines: 1, description: 'Inizio profondità: 1 linea LC.' },
  EXECUTIVE_LC: { id: 'ELC', label: 'Executive LC (15%)', minVpg: 4000, cep: 15, bbs: 15, wes: 20, minActiveLines: 4, minLcLines: 1, description: 'Leadership: 4 squadre + 1 LC.' },
  EIGHTEEN_PERCENT: { id: '18', label: '18%', minVpg: 7000, cep: 20, bbs: 25, wes: 35, minActiveLines: 4, minLcLines: 2, description: 'Quasi Argento: 2 linee LC.' },
  SILVER: { id: 'SILVER', label: 'Argento (21%)', minVpg: 10000, cep: 30, bbs: 30, wes: 50, minActiveLines: 4, minLcLines: 3, description: 'Qualifica Leader: 3 linee LC.' },
  RUBY: { id: 'RUBY', label: 'Rubino', minVpg: 20000, cep: 50, bbs: 60, wes: 100, minActiveLines: 6, minLcLines: 3, description: 'Massimo volume e larghezza.' },
  PLATINUM_EXEC: { id: 'PEXEC', label: 'Platino Esecutivo', minVpg: 10000, cep: 60, bbs: 70, wes: 120, minActiveLines: 6, minLcLines: 6, description: 'Stabilità per lo Smeraldo.' }
};

/**
 * Calcola il TARGET basandosi sul volume attuale.
 * Se un leader ha raggiunto una soglia, il target deve essere quella SUCCESSIVA.
 */
export const getAutoTarget = (vpg: number, activeLines: number = 0, lcLines: number = 0): N21Requirement => {
  if (vpg >= 10000) {
    if (vpg >= 20000) return N21_STANDARDS.PLATINUM_EXEC;
    return N21_STANDARDS.RUBY;
  }

  if (vpg >= 7000) return N21_STANDARDS.SILVER;
  if (vpg >= 4000) return N21_STANDARDS.EIGHTEEN_PERCENT;
  if (vpg >= 2400) return N21_STANDARDS.EXECUTIVE_LC;
  if (vpg >= 1200) return N21_STANDARDS.TWELVE_PERCENT;
  if (vpg >= 600) return N21_STANDARDS.LEADERS_CLUB;
  if (vpg >= 200) return N21_STANDARDS.SIX_PERCENT;

  return N21_STANDARDS.THREE_PERCENT;
};
