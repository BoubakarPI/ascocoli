export function extractJsonFromText(raw: string): string {
  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']') + 1

  if (start === -1 || end === -1) {
    throw new Error('JSON array not found in the response')
  }

  return raw.slice(start, end)
}
