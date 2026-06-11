/** Response from the orchestrator's /api/extract-text (mirrors ExtractTextResponse). */
export interface ExtractTextResult {
  filename: string;
  charCount: number;
  text: string;
}

/**
 * Uploads a .docx to the orchestrator (via the Next.js /api/extract-text route) and
 * returns the extracted plain text. Throws with a readable message on failure.
 *
 * @param file    the selected .docx file
 * @param baseUrl orchestrator base URL (the active agent's url)
 */
export const extractText = async (file: File, baseUrl: string): Promise<ExtractTextResult> => {
  const form = new FormData();
  form.append("file", file);
  form.append("baseUrl", baseUrl);

  const response: Response = await fetch("/api/extract-text", {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    let message = `Не удалось извлечь текст (HTTP ${response.status})`;
    try {
      const body: { message?: string; error?: string } = await response.json();
      message = body.message ?? body.error ?? message;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  return (await response.json()) as ExtractTextResult;
};
