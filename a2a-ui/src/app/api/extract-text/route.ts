import { NextRequest } from "next/server";

/**
 * Forwards an uploaded .docx to the orchestrator's POST /api/extract-text (Loader/Parser).
 * Multipart can't go through the JSON `/api/proxy` route, so this dedicated route streams
 * the file server-side (avoids CORS), mirroring the proxy's same-origin check.
 *
 * Expects multipart form-data: `file` (the .docx) and `baseUrl` (orchestrator base URL).
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const requestUrl = new URL(request.url);
    const allowedOrigin = `${requestUrl.protocol}//${requestUrl.host}`;

    if (origin && origin !== allowedOrigin) {
      return jsonError("Unauthorized origin", 403);
    }
    if (!origin && referer && new URL(referer).origin !== allowedOrigin) {
      return jsonError("Unauthorized origin", 403);
    }

    const form = await request.formData();
    const file = form.get("file");
    const baseUrl = form.get("baseUrl");

    if (!(file instanceof File)) {
      return jsonError("No file uploaded", 400);
    }
    if (typeof baseUrl !== "string" || !baseUrl) {
      return jsonError("baseUrl is required", 400);
    }

    const upstream = new FormData();
    upstream.append("file", file, file.name);

    const target = `${baseUrl.replace(/\/$/, "")}/api/extract-text`;
    const response: Response = await fetch(target, {
      method: "POST",
      body: upstream,
      signal: AbortSignal.timeout(60_000),
    });

    const responseBody = await response.text();
    return new Response(responseBody, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("Content-Type") || "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(`Failed to extract text: ${message}`, 500);
  }
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
