// Provider failure classes for browser-side registry calls. A page maps each class to its own message so a
// failed lookup is never shown as "not found". Browsers hide the difference between a CORS refusal and a
// network failure (both surface as a TypeError), so those two share one class, 'unreachable'.

export type ProviderErrorKind =
  | 'unreachable'   // network failure or CORS refusal: the browser cannot tell which
  | 'timeout'       // no answer within the time limit
  | 'rate-limited'  // HTTP 429
  | 'key-missing'   // HTTP 401/403: the provider wants a key we do not hold
  | 'not-found'     // HTTP 404: the provider answered and has no such record
  | 'unavailable'   // HTTP 5xx
  | 'bad-response'  // answered, but not with the expected shape

export function classifyStatus(status: number): ProviderErrorKind {
  if (status === 0) return 'unreachable'
  if (status === 429) return 'rate-limited'
  if (status === 401 || status === 403) return 'key-missing'
  if (status === 404) return 'not-found'
  if (status >= 500) return 'unavailable'
  return 'bad-response'
}

/** Kinds worth retrying or answering from another provider; the others will not change on a retry. */
export function isTransient(kind: ProviderErrorKind): boolean {
  return kind === 'unreachable' || kind === 'timeout' || kind === 'rate-limited' || kind === 'unavailable'
}

export const PROVIDER_ERROR_TEXT: Record<ProviderErrorKind, string> = {
  unreachable: 'could not be reached directly from your browser (network problem, or the service does not allow browser access)',
  timeout: 'did not answer in time',
  'rate-limited': 'has reached its request limit',
  'key-missing': 'requires an API key',
  'not-found': 'has no matching record',
  unavailable: 'is temporarily unavailable',
  'bad-response': 'returned an unexpected response',
}
