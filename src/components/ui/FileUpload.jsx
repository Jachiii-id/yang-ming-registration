import { useRef } from 'react'
import { APP } from '../../config/app'
import { Button, cx } from '.'

// Kotak unggah dokumen: memilih file, menampilkan nama + ukuran. Validasi ada di halaman.
export function FileUpload({ id, file, onChange, error, busy }) {
  const ref = useRef(null)
  const accept = Object.entries(APP.accept).flatMap(([m, e]) => [m, e]).join(',')
  return (
    <div>
      <input ref={ref} id={id} type="file" accept={accept} className="sr-only"
        aria-invalid={!!error || undefined} aria-describedby={error ? id + '-err' : undefined}
        onChange={(e) => e.target.files[0] && onChange(e.target.files[0])} />
      <div className={cx('flex flex-col items-start gap-3 rounded-lg border border-dashed bg-surface p-4 sm:flex-row sm:items-center sm:justify-between', error ? 'border-danger' : 'border-line-strong')}>
        <div className="min-w-0 text-sm">
          {file ? (
            <>
              <p className="truncate font-medium">{file.name}</p>
              <p className="text-xs text-muted">{(file.size / 1048576).toFixed(2)} MB{busy ? ' · uploading' : ''}</p>
            </>
          ) : (
            <p className="text-muted">PDF, JPG or PNG, up to {APP.maxFileMB} MB</p>
          )}
        </div>
        <Button variant="outline" onClick={() => ref.current.click()} disabled={busy}>{file ? 'Replace file' : 'Choose file'}</Button>
      </div>
    </div>
  )
}
