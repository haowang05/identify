import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DetectionResult, AIResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    primaryIdentity: {
      type: Type.OBJECT,
      description: "The identity the algorithm thinks is most accurate.",
      properties: {
        bio: { type: Type.STRING, description: "Instagram bio style: Short, 1-2 lines, emojis." },
        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 Hashtags #gender #age #vibe" },
        matchScore: { type: Type.NUMBER, description: "Confidence score 80-99%" }
      },
      required: ["bio", "tags", "matchScore"]
    },
    alternatives: {
      type: Type.ARRAY,
      description: "20 alternative 'misinterpretations'.",
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "Instagram bio text." },
          gender: { type: Type.STRING },
          age: { type: Type.STRING, description: "Numeric string (e.g. '25', '30s', '19')." },
          biasType: { type: Type.STRING, description: "Type of bias/error." },
        },
        required: ["text", "gender", "age", "biasType"],
      },
    },
  },
  required: ["primaryIdentity", "alternatives"],
};

export const generateIdentity = async (data: DetectionResult): Promise<AIResponse> => {
  const dominantExpression = Object.entries(data.expressions).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  
  const prompt = `
    You are an algorithmic mirror on social media. 
    
    INPUT DATA:
    - Visual Gender: ${data.gender}
    - Visual Age: ${Math.round(data.age)}
    - Expression: ${dominantExpression}

    TASK:
    1. Primary Identity: Generate an "Instagram Bio" that perfectly matches the visual data. Use emojis. It should feel like a standard, slightly basic influencer profile or a normal user.
    2. Alternatives: Generate 20 DIFFERENT Instagram bios that are WRONG or BIASED. 
       - Imagine the algorithm makes mistakes: thinks a 20yo guy is a 50yo mom, or a 30yo woman is a 15yo gamer.
       - Include wild hallucinations (e.g., "Bot account", "Crypto scammer", "Cat lover", "Conspiracy Theorist", "NPC").
       - These represent the "Noise" and "Projected Identities" of the internet.

    CONSTRAINTS:
    - Age MUST be a number or number range (e.g., "25", "18", "40s"). DO NOT use words like "Teen" or "Adult".
    - Use emojis 🧢 ✨ 💅 🚀
    - Use hashtags #fyp #mood
    - Short, punchy text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 1.3, // High creativity for wild variations
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AIResponse;
    }
    throw new Error("No text response from Gemini");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return {
      primaryIdentity: {
         bio: "Error 404: Identity Not Found 🤖",
         tags: ["#error", "#glitch", "#system_fail"],
         matchScore: 0
      },
      alternatives: []
    };
  }
};