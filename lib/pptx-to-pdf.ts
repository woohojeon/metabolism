// Browser half of the .pptx → PDF conversion. Talks only to our own API route,
// except for the file upload itself, which goes straight to CloudConvert using
// the signed form that route hands back.

const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 180_000

async function readError(res: Response, fallback: string) {
  try {
    const body = await res.json()
    return typeof body?.error === 'string' ? body.error : fallback
  } catch {
    return fallback
  }
}

export async function convertPptxToPdf(
  file: File,
  onProgress?: (stage: 'uploading' | 'converting') => void,
): Promise<string> {
  const createRes = await fetch('/api/convert-slides', { method: 'POST' })
  if (!createRes.ok) {
    throw new Error(await readError(createRes, '변환 작업을 시작하지 못했습니다.'))
  }
  const { jobId, upload } = await createRes.json()

  onProgress?.('uploading')
  const form = new FormData()
  for (const [k, v] of Object.entries(upload.parameters ?? {})) {
    form.append(k, String(v))
  }
  // CloudConvert requires the file field last.
  form.append('file', file)

  const uploadRes = await fetch(upload.url, { method: 'POST', body: form })
  if (!uploadRes.ok) throw new Error('슬라이드 업로드에 실패했습니다.')

  onProgress?.('converting')
  const deadline = Date.now() + POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))

    const statusRes = await fetch(
      `/api/convert-slides?jobId=${encodeURIComponent(jobId)}`,
      { cache: 'no-store' },
    )
    if (!statusRes.ok) {
      throw new Error(await readError(statusRes, '변환 상태를 확인하지 못했습니다.'))
    }

    const body = await statusRes.json()
    if (body.status === 'error') throw new Error(body.error ?? '변환에 실패했습니다.')
    if (body.status === 'finished') return body.url as string
  }

  throw new Error('변환이 너무 오래 걸립니다. 잠시 후 다시 시도하세요.')
}

// CloudConvert's export urls expire within a day, so inline the PDF instead of
// storing the link. Falls back to the raw url if it cannot be fetched (CORS).
export async function toStorableUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url)
    if (!res.ok) return url
    const blob = await res.blob()
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result as string)
      r.onerror = () => reject(r.error)
      r.readAsDataURL(blob)
    })
  } catch {
    return url
  }
}
