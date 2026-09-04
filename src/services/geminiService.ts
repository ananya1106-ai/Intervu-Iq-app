export interface AtsGeminiAnalysis {
  score: number;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  grammarSuggestions: string[];
  formattingSuggestions: string[];
  improvementSuggestions: string[];
  overallFeedback: string;
}

/**
 * Sends extracted resume text and target role to server-side Gemini ATS analyzer endpoint.
 */
export async function analyzeResumeWithGemini(
  text: string, 
  targetRole: string
): Promise<AtsGeminiAnalysis> {
  if (!text || !text.trim()) {
    throw new Error("Resume text is empty. Cannot perform ATS analysis.");
  }

  const response = await fetch("/api/gemini/ats/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      targetRole: targetRole || "Software Engineer"
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `ATS Analysis failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!data.analysis) {
    throw new Error("Invalid response received from Gemini ATS analyzer service.");
  }

  return data.analysis as AtsGeminiAnalysis;
}
