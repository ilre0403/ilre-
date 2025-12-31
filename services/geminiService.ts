import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const refinePrompt = async (originalPrompt: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) {
    return "API Key missing. Unable to refine prompt.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert AI Prompt Engineer for models like Midjourney, Stable Diffusion, and Sora.
      
      Please refine and enhance the following prompt to make it more descriptive, artistic, and likely to generate a high-quality result. 
      Keep the core meaning but add necessary details about lighting, style, camera angles, and atmosphere.
      
      Original Prompt: "${originalPrompt}"
      
      Return ONLY the refined prompt text. Do not add any conversational filler.`,
    });

    return response.text || "Could not generate response.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error communicating with AI service.";
  }
};