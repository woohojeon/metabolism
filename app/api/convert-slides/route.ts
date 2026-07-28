import { NextResponse } from 'next/server'

// Converts an uploaded .pptx deck to PDF through CloudConvert, so the lecture
// slides can be opened inline without downloading PowerPoint.
//
// The API key never reaches the browser. Instead:
//   POST  → creates a job, hands back CloudConvert's signed upload form
//   (the browser uploads the .pptx straight to CloudConvert, which keeps the
//    deck clear of this function's 4.5 MB request-body limit)
//   GET   → polls that job with the key and returns the finished PDF url
const API = 'https://api.cloudconvert.com/v2'

function key() {
  const k = process.env.CLOUDCONVERT_API_KEY
  if (!k) throw new Error('CLOUDCONVERT_API_KEY is not set')
  return k
}

export async function POST() {
  let auth: string
  try {
    auth = key()
  } catch {
    return NextResponse.json(
      { error: 'CLOUDCONVERT_API_KEY 가 설정되지 않았습니다.' },
      { status: 500 },
    )
  }

  const res = await fetch(`${API}/jobs`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tasks: {
        'upload-deck': { operation: 'import/upload' },
        'convert-deck': {
          operation: 'convert',
          input: 'upload-deck',
          input_format: 'pptx',
          output_format: 'pdf',
        },
        'export-deck': { operation: 'export/url', input: 'convert-deck' },
      },
    }),
  })

  if (!res.ok) {
    return NextResponse.json(
      { error: `CloudConvert 작업 생성 실패 (${res.status})` },
      { status: 502 },
    )
  }

  const job = await res.json()
  const upload = job.data?.tasks?.find(
    (t: { name: string }) => t.name === 'upload-deck',
  )?.result?.form

  if (!upload?.url) {
    return NextResponse.json({ error: '업로드 주소를 받지 못했습니다.' }, { status: 502 })
  }

  return NextResponse.json({ jobId: job.data.id, upload })
}

export async function GET(request: Request) {
  const jobId = new URL(request.url).searchParams.get('jobId')
  if (!jobId) {
    return NextResponse.json({ error: 'jobId 가 필요합니다.' }, { status: 400 })
  }

  let auth: string
  try {
    auth = key()
  } catch {
    return NextResponse.json(
      { error: 'CLOUDCONVERT_API_KEY 가 설정되지 않았습니다.' },
      { status: 500 },
    )
  }

  const res = await fetch(`${API}/jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${auth}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    return NextResponse.json(
      { error: `변환 상태 조회 실패 (${res.status})` },
      { status: 502 },
    )
  }

  const job = await res.json()
  const status: string = job.data?.status

  if (status === 'error') {
    const failed = job.data?.tasks?.find((t: { status: string }) => t.status === 'error')
    return NextResponse.json({
      status: 'error',
      error: failed?.message ?? '변환에 실패했습니다.',
    })
  }

  if (status !== 'finished') return NextResponse.json({ status: 'processing' })

  const url = job.data?.tasks?.find((t: { name: string }) => t.name === 'export-deck')
    ?.result?.files?.[0]?.url

  if (!url) {
    return NextResponse.json({ status: 'error', error: '변환 결과를 찾지 못했습니다.' })
  }

  return NextResponse.json({ status: 'finished', url })
}
