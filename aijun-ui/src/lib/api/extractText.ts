import { backendUrl } from '@/lib/api/client'

/** Response from the orchestrator's POST /api/extract-text (mirrors ExtractTextResponse). */
export interface ExtractTextResult {
  filename: string
  charCount: number
  text: string
}

/**
 * Uploads a .docx to the orchestrator's deterministic Loader/Parser and returns the extracted
 * plain text for the user to review/edit before generating. No LLM involved.
 */
export async function extractText(file: File, signal?: AbortSignal): Promise<ExtractTextResult> {
  const form = new FormData()
  form.append('file', file)

  const response = await fetch(backendUrl('/api/extract-text'), {
    method: 'POST',
    body: form,
    signal,
  })

  if (!response.ok) {
    let message = `Не удалось извлечь текст (HTTP ${response.status})`
    try {
      const body = (await response.json()) as { message?: string; error?: string }
      message = body.message ?? body.error ?? message
    } catch {
      // keep default message
    }
    throw new Error(message)
  }

  return (await response.json()) as ExtractTextResult
}
