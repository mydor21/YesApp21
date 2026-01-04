
export interface N21Requirement {
  id: string;
  label: string;
  minVpg: number;
  cep: number;
  bbs: number;
  wes: number;
  description: string;
}

export const N21_STANDARDS: Record<string, N21Requirement> = {
  THREE_PERCENT: { id: '3', label: '3% Core', minVpg: 200, cep: 1, bbs: 1, wes: 1, description: 'Base del sistema.' },
  LEADERS_CLUB: { id: 'LC', label: 'Leaders Club', minVpg: 1200, cep: 5, bbs: 5, wes: 10, description: 'La pietra miliare.' },
  EXECUTIVE_LC: { id: 'ELC', label: 'Executive LC', minVpg: 4000, cep: 15, bbs: 15, wes: 20, description: 'Motore Argento.' },
  SILVER: { id: 'SILVER', label: 'Argento', minVpg: 10000, cep: 30, bbs: 30, wes: 50, description: 'Leadership Massima.' }
};

export const getAutoTarget = (vpg: number): N21Requirement => {
  if (vpg < 200) return N21_STANDARDS.THREE_PERCENT;
  if (vpg < 1200) return N21_STANDARDS.LEADERS_CLUB;
  if (vpg < 4000) return N21_STANDARDS.EXECUTIVE_LC;
  return N21_STANDARDS.SILVER;
};
