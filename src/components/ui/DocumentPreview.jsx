import { useCallback, useEffect, useState } from 'react'
import { APP } from '../../config/app'
import { supabase } from '../../lib/supabase'
import { Button, Skeleton } from '.'

// Menampilkan dokumen yang diunggah di dalam kotak: gambar (JPG/PNG) atau PDF.
// Bucket privat, jadi file dimuat lewat signed URL yang berlaku 5 menit.
const kindOf = (path) => (/\.pdf$/i.test(path) ? 'pdf' : /\.(jpe?g|png)$/i.test(path) ? 'image' : 'other')

export function DocumentPreview({ path }) {
  const [url, setUrl] = useState(null)
  const [failed, setFailed] = useState(false)
  const [imgReady, setImgReady] = useState(false)
  const kind = kindOf(path)
  const name = path.split('/').pop().replace(/^[0-9a-f-]{36}-/, '')

  const load = useCallback(async () => {
    setFailed(false); setUrl(null); setImgReady(false)
    const { data, error } = await supabase.storage.from(APP.bucket).createSignedUrl(path, 300)
    if (error) setFailed(true); else setUrl(data.signedUrl)
  }, [path])
  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-medium">{name}</p>
        {url && <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-medium text-accent underline">Open in new tab</a>}
      </div>
      <div className="mt-2 overflow-hidden rounded-lg border border-line-strong bg-canvas">
        {failed ? (
          <div className="space-y-3 p-6 text-center">
            <p className="text-sm text-muted">We could not load the document preview.</p>
            <Button variant="outline" onClick={load}>Try again</Button>
          </div>
        ) : !url ? (
          <Skeleton className="h-72 rounded-none" />
        ) : kind === 'image' ? (
          <>
            {!imgReady && <Skeleton className="h-72 rounded-none" />}
            <img src={url} alt={`Uploaded document: ${name}`} onLoad={() => setImgReady(true)} onError={() => setFailed(true)}
              className={imgReady ? 'mx-auto block max-h-[32rem] w-full object-contain' : 'hidden'} />
          </>
        ) : kind === 'pdf' ? (
          <iframe title={`Uploaded document: ${name}`} src={url} className="block h-[32rem] w-full max-w-full bg-surface" />
        ) : (
          <p className="p-6 text-center text-sm text-muted">Preview is not available for this file type. Use “Open in new tab”.</p>
        )}
      </div>
    </div>
  )
}
