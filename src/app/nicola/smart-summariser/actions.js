'use server'

export async function getGeminiSummary(text) {
  // 1. Retrieve the key safely from the server environment
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY is missing in .env.local");
    throw new Error("Server configuration error: API Key missing.");
  }

  // 2. Use the stable, fast model (Gemini 1.5 Flash)
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `
    You are a professional summarisation tool.
    Please provide a concise summary of the following text, focusing on the key points, core arguments, and main takeaways.
    
    Text to summarise:
    ${text}
  `;

  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }]
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    // 3. Extract and return just the summary text
    const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return summary || "No summary could be generated.";
    
  } catch (error) {
    console.error("Gemini API Call Failed:", error);
    throw new Error("Failed to generate summary. Please try again.");
  }
}