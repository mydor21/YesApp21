
import { GoogleGenAI, Type } from "@google/genai";
import { IBO, Message } from "../types";

export const getCoachResponse = async (userMessage: string, history: Message[], networkInfo: IBO[]) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "ERRORE: API_KEY non configurata nel sistema.";

  const ai = new GoogleGenAI({ apiKey });
  
  // Creazione report sintetico della rete per il contesto AI
  const networkReport = networkInfo
    .filter(ibo => (ibo.vitalSigns.groupPV || 0) > 0)
    .map(ibo => `LEADER: ${ibo.name} (ID: ${ibo.id}) - VPG: ${ibo.vitalSigns.groupPV}, BBS: ${ibo.vitalSigns.bbsTickets}, WES: ${ibo.vitalSigns.wesTickets}, CEP: ${ibo.vitalSigns.hasCEP ? 'SI' : 'NO'}`)
    .join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })),
        { role: 'user', parts: [{ text: `DATI RETE ATTUALI:\n${networkReport}\n\nRICHIESTA LEADER: ${userMessage}` }] }
      ],
      config: {
        systemInstruction: `Agisci come l'avatar strategico di Carmelo Lentinello, Diamante Amway e leader del Diamond Hub. 
        Il tuo obiettivo è l'analisi PUNTIGLIOSA della rete secondo il metodo N21. 
        REGOLE DI RISPOSTA:
        1. Sii tecnico, autorevole, diretto e pragmatico. 
        2. Se il rapporto PV/Biglietti è sbilanciato (pochi biglietti per troppi PV), avvisa subito del rischio crollo.
        3. Identifica sempre i "motori in profondità" che stanno spingendo.
        4. Parla di "bilanciamento tra Sponsor e Profondità".
        5. Chiudi ogni analisi con: 'ANALISI STRATEGICA DIAMOND HUB - Protocollo Carmelo 3.0. Consulta il tuo Upline per azione immediata.'`,
        thinkingConfig: { thinkingBudget: 16000 }
      },
    });

    return response.text || "Nessuna risposta generata.";
  } catch (error) {
    console.error("Errore Gemini:", error);
    return "Connessione con l'Hub AI interrotta. Riprova tra poco.";
  }
};

export const suggestNewGoal = async (prompt: string) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY mancante.");

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Trasforma questa idea in un obiettivo SMART N21: "${prompt}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            targetDate: { type: Type.STRING },
            priority: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
          },
          required: ["title", "description", "targetDate", "priority"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    throw error;
  }
};

