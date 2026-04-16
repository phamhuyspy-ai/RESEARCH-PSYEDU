
import { GoogleGenAI } from "@google/genai";

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined");
  }
  return new GoogleGenAI({ apiKey });
};

export const aiService = {
  async analyzeResults(surveyName: string, results: any[]) {
    try {
      const ai = getGenAI();
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          Analyze the following survey results for "${surveyName}".
          Data: ${JSON.stringify(results)}
          
          Provide a concise summary of the findings, key trends, and recommendations.
          Format the output in Markdown.
        `
      });

      return response.text || "No analysis generated.";
    } catch (error) {
      console.error("AI Analysis Error:", error);
      return "Unable to perform AI analysis at this time.";
    }
  },

  async suggestQuestions(topic: string) {
    try {
      const ai = getGenAI();

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          Suggest 5 professional survey questions for the topic: "${topic}".
          Include question type (single_choice, multi_choice, text) and options if applicable.
          Return as a JSON array of objects with fields: title, type, options (array of strings).
        `
      });

      const text = response.text || "";
      // Basic extraction if the model wraps it in markdown
      const jsonMatch = text.match(/\[.*\]/s);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (error) {
      console.error("AI Suggestion Error:", error);
      return [];
    }
  }
};
