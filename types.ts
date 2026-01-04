
export enum Priority { LOW = 'LOW', MEDIUM = 'MEDIUM', HIGH = 'HIGH' }
export enum GoalStatus { IN_PROGRESS = 'IN_PROGRESS', COMPLETED = 'COMPLETED', ON_HOLD = 'ON_HOLD' }

export enum Qualification {
  NONE = 'Incaricato',
  PACESETTER = 'Pacesetter',
  DOUBLE_PACESETTER = 'Doppio Pacesetter',
  LEADERS_CLUB = 'Leaders Club',
  EXECUTIVE_LEADERS_CLUB = 'Executive Leaders Club',
  SILVER = 'Produttore Argento',
  PLATINO = 'Platino',
  SMERALDO = 'Smeraldo',
  DIAMANTE = 'Diamante'
}

// Definizione del ruolo IBO utilizzato in tutto l'applicativo
export type IBORole = 'TITOLARE' | 'COLLABORATORE' | 'OSPITE';

// Estensione dei Segni Vitali con i campi richiesti dai servizi di importazione e analisi
export interface VitalSigns {
  personalPV: number;
  groupPV: number;
  plansPresented: number;
  newPersonalSponsors: number;
  newRecruitsCount: number;
  hasCEP: boolean;
  bbsTickets: number; 
  wesTickets: number; 
  bbsGuests: number; 
  wesGuests: number;
  activeFrontlines: number;
  lcLines: number;
  totalTeamSize: number;
  lastUpdate: number;
  validatedByPlatinum: boolean;
  registrationDate?: string;
  history: Record<string, any>;
}

export interface IBO {
  id: string; 
  name: string;
  email: string;
  phone: string;
  uplineId: string | null;
  qualification: Qualification;
  role: IBORole;
  vitalSigns: VitalSigns;
  aliases?: string[];
  accessKey?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  status: GoalStatus;
  priority: Priority;
}

// Enum per lo stato dei Prospect (Lista Nomi)
export enum ProspectStatus {
  TO_CONTACT = 'DA CONTATTARE',
  CONTACTED = 'CONTATTATO',
  PLAN_SHOWN = 'PIANO MOSTRATO',
  FOLLOW_UP = 'FOLLOW UP',
  REGISTERED = 'REGISTRATO',
  NOT_INTERESTED = 'NON INTERESSATO'
}

// Enum per la qualità dei Prospect (Temperatura)
export enum ProspectQuality {
  HOT = 'HOT',
  WARM = 'WARM',
  COLD = 'COLD'
}

// Interfaccia per la gestione della Lista Nomi (Prospects)
export interface Prospect {
  id: string;
  name: string;
  phone: string;
  notes: string;
  dream: string;
  quality: ProspectQuality;
  status: ProspectStatus;
  createdAt: number;
  lastContactDate?: number;
}

// Interfaccia per i messaggi della Line Chat (Comunicazione di Squadra)
export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
}

// Interfaccia per le abitudini quotidiane (Scorecard)
export interface DailyHabits {
  reading: boolean;
  audio: boolean;
  productUse: boolean;
  planShown: boolean;
  lastUpdated: number;
}
