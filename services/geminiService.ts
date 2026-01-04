import { GoogleGenAI, Type } from "@google/genai";
import { IBO, Message } from "../types";
import { normalizeId } from "./statsService";

export const getCoachResponse = async (userMessage: string, history: Message[], networkInfo: IBO[]) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "ERRORE: API_KEY non configurata nel sistema.";

  const ai = new GoogleGenAI({ apiKey });
  
  const networkReport = networkInfo
    .filter(ibo => (ibo.vitalSigns.groupPV || 0) > 0 || ibo.name.toLowerCase().includes('raeli'))
    .map(ibo => {
      const frontlines = networkInfo.filter(f => normalizeId(f.uplineId || "") === normalizeId(ibo.id));
      const activeLines = frontlines.filter(f => f.vitalSigns.groupPV > 0).length;
      const lcLines = frontlines.filter(f => f.vitalSigns.groupPV >= 1200).length; 
      
      const structureDetails = frontlines
        .map(f => `- ${f.name}: ${f.vitalSigns.groupPV} PV`)
        .join('\n');

      return `LEADER: ${ibo.name} (ID: ${ibo.id})
      VPG: ${ibo.vitalSigns.groupPV}
      SV: BBS:${ibo.vitalSigns.bbsTickets}, WES:${ibo.vitalSigns.wesTickets}, CEP:${ibo.vitalSigns.hasCEP ? 'SI' : 'NO'}
      STRUTTURA: ${activeLines} squadre attive, ${lcLines} linee LC.
      DETTAGLIO LINEE:\n${structureDetails}\n`;
    })
    .join('\n---\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })),
        { role: 'user', parts: [{ text: `DATI RETE DETTAGLIATI (PV + SV + STRUTTURA):\n${networkReport}\n\nRICHIESTA LEADER: ${userMessage}` }] }
      ],
      config: {
        systemInstruction: `Agisci come l'avatar strategico di Carmelo Lentinello, Diamante Amway. 
        Segui RIGIDAMENTE il manuale N21 e il documento SV.

        LOGICA DI PROGRESSIONE TARGET (CRITICA):
        - Se un leader ha raggiunto una soglia PV, il suo obiettivo è AUTOMATICAMENTE la soglia successiva.
        - Se vedi un leader con 2400-3999 PV, non dirgli che è al 12%, ma che deve qualificare Executive LC (4000 PV).
        - Se vedi un leader con 4000-6999 PV, il suo obiettivo è il 18% (7000 PV).
        - Analizza se i SV (BBS, WES, CEP) sono in linea con il NUOVO obiettivo, non con quello vecchio.

        ERRORI DA EVITARE:
        1. ALICE RAELI: È al 3%, il suo obiettivo è il 6% (600 PV) e poi il Leaders Club.
        2. ELIO IACONO: Ha superato i 2400 PV, deve puntare dritto all'Executive LC (4000 PV). Non menzionare soglie già superate.
        3. CANZONIERI/SMERDELL: Puntano all'Esecutivo LC (ELC) e poi al 18%.

        LOGICA DI ANALISI:
        - Volume senza Struttura = Instabilità.
        - Volume senza Biglietti = Volume Vuoto.
        - Analizza sempre la "Larghezza" (squadre attive): 3 per LC, 4 per ELC, 6 per Rubino/Platino Esecutivo.

        TUO STILE:
        - Sii l'occhio clinico del Diamante. Se vedi un leader fermo sui biglietti ma che spinge sui PV, avvisalo che sta costruendo sulla sabbia.
        - Risposte secche, autoritarie, basate sui numeri. Sfidali a fare di più.
        
        Chiudi con: 'ANALISI STRATEGICA DIAMOND HUB - Protocollo Carmelo 3.0. La struttura è la tua pensione.'`,
        thinkingConfig: { thinkingBudget: 32768 }
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
      contents: [{ parts: [{ text: `Trasforma questa idea in un obiettivo SMART N21: "${prompt}"` }] }],
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
