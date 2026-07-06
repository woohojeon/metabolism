'use client'

import { useState } from 'react'
import { Download, Lock } from 'lucide-react'
import { useAuth } from './auth-provider'
import { LoginDialog } from './login-dialog'

export function SlideDownload({
  href,
  filename,
}: {
  href: string
  filename: string
}) {
  const { user } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <div className="border-l-4 border-science-red bg-panel p-5">
      <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-science-red">
        <Download className="size-[14px]" />
        Lecture Slides
      </h3>

      {user ? (
        <>
          <p className="mt-2 text-[13px] leading-snug text-neutral-700">
            강의 슬라이드(.pptx)를 다운로드할 수 있습니다.
          </p>
          <a
            href={href}
            download={filename}
            className="mt-3 inline-flex items-center gap-2 rounded bg-science-red px-4 py-2 text-[12px] font-bold text-white transition-opacity hover:opacity-90"
          >
            <Download className="size-[15px]" />
            Download .pptx
          </a>
        </>
      ) : (
        <>
          <p className="mt-2 flex items-start gap-1.5 text-[13px] leading-snug text-neutral-700">
            <Lock className="mt-0.5 size-[13px] shrink-0 text-neutral-400" />
            로그인한 사용자만 강의 슬라이드를 받을 수 있습니다.
          </p>
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="mt-3 inline-flex items-center gap-2 rounded border border-science-red px-4 py-2 text-[12px] font-bold text-science-red transition-colors hover:bg-science-red hover:text-white"
          >
            <Lock className="size-[14px]" />
            로그인 후 다운로드
          </button>
        </>
      )}

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  )
}
