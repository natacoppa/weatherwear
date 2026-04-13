// Attaches the shared X-WW-Key header to every API request so the server
// accepts them. See src/lib/api-auth.ts for the auth contract.

const HEADER = "x-ww-key";
const KEY = process.env.NEXT_PUBLIC_WW_API_KEY ?? "";

export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (KEY) headers.set(HEADER, KEY);
  return fetch(input, { ...init, headers });
}
