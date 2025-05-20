import axios from 'axios';

interface AIQueryResponse {
  response: string;
}

/**
 * Sends a question to the AI backend and returns the response
 * @param question The question to ask the AI
 * @returns The AI's response
 */
export async function queryAI(question: string): Promise<string> {
  try {
    // Make the request to the AI backend endpoint
    const response = await axios.post<AIQueryResponse>(`/ai/query`, {
      Question: question
    });

    // Return the response text
    return response.data.response;
  } catch (err) {
    console.error('Error querying AI:', err);
    throw new Error('Failed to get AI response');
  }
}