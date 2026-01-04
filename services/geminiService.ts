
import { GoogleGenAI, Type } from "@google/genai";
import { IBO, Message } from "../types";

/**
 * Funzione per ottenere una risposta strategica dal Coach AI (YES-Bot)
 * basata sulla situazione attuale della rete e lo storico chat.
 */
export const getCoachResponse = async (userMessage: string, history: Message[], networkInfo: IBO[]) => {
  // Recupero dell'API Key esclusivamente dalle variabili d'ambiente
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "ERRORE: API_KEY non configurata.";

  // Inizializzazione del client Google GenAI secondo le linee guida
  const ai = new GoogleGenAI({ apiKey });
  
  const networkReport = networkInfo
    .filter(ibo => (ibo.vitalSigns.groupPV || 0) > 0)
    .map(ibo => `LEADER: ${ibo.name} (ID: ${ibo.id}) - VPG: ${ibo.vitalSigns.groupPV}, BBS: ${ibo.vitalSigns.bbsTickets}, WES: ${ibo.vitalSigns.wesTickets}, CEP: ${ibo.vitalSigns.hasCEP ? 'SI' : 'NO'}`)
    .join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })),
        { role: 'user', parts: [{ text: `DATI RETE:\n${networkReport}\n\nRICHIESTA: ${userMessage}` }] }
      ],
      config: {
        systemInstruction: "Sei YES-Bot, l'avatar strategico di Carmelo Lentinello (Diamond Hub). Analizza la rete Amway secondo il metodo N21. Sii tecnico, autorevole e diretto. Se il rapporto PV/Biglietti è basso, avvisa del rischio. Chiudi sempre con: 'ANALISI STRATEGICA AI - CONSULTA IL TUO UPLINE DIAMOND PER CONFERMA.'",
        thinkingConfig: { thinkingBudget: 16000 }
      },
    });

    // Accesso alla proprietà .text (non è un metodo)
    return response.text || "Nessun output generato.";
  } catch (error) {
    console.error(error);
    return "Errore di connessione con Gemini AI.";
  }
};

/**
 * FIX: Implementazione della funzione mancante richiesta da GoalManager.tsx
 * Genera un obiettivo SMART strutturato basato su un input testuale.
 */
export const suggestNewGoal = async (prompt: string) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("ERRORE: API_KEY non configurata.");

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Agisci come un esperto di pianificazione N21. Genera un obiettivo SMART (Specific, Measurable, Achievable, Relevant, Time-bound) basato sulla seguente richiesta: "${prompt}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Titolo dell'obiettivo (es: Qualifica 9% Core).",
            },
            description: {
              type: Type.STRING,
              description: "Descrizione dettagliata dell'azione da compiere.",
            },
            targetDate: {
              type: Type.STRING,
              description: "Data di completamento prevista (YYYY-MM-DD).",
            },
            priority: {
              type: Type.STRING,
              enum: ["LOW", "MEDIUM", "HIGH"],
              description: "Urgenza dell'obiettivo.",
            },
          },
          required: ["title", "description", "targetDate", "priority"],
        },
      },
    });

    // Parsing della risposta JSON generata dal modello
    const jsonStr = response.text || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Errore generazione obiettivo AI:", error);
    throw error;
  }
};
