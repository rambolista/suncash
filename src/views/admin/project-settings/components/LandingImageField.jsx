import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Form, Image } from 'react-bootstrap'

const LandingImageField = ({
  label,
  note,
  accept,
  currentUrl,
  currentAlt = '',
  file,
  cleared = false,
  error,
  onFileChange,
  onClear,
}) => {
  const inputRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }

    const nextUrl = URL.createObjectURL(file)
    setPreviewUrl(nextUrl)

    return () => URL.revokeObjectURL(nextUrl)
  }, [file])

  const displayUrl = useMemo(() => previewUrl || (!cleared ? currentUrl : null), [cleared, currentUrl, previewUrl])

  const clearValue = () => {
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    onClear()
  }

  return (
    <Form.Group className="mb-3">
      <Form.Label>{label}</Form.Label>
      <div className="border rounded p-3">
        {displayUrl ? (
          <Image src={displayUrl} alt={currentAlt || label} fluid rounded className="mb-3" />
        ) : (
          <div className="bg-body-tertiary border rounded d-flex align-items-center justify-content-center text-muted mb-3" style={{ minHeight: 160 }}>
            No image selected
          </div>
        )}
        <Form.Control
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
          isInvalid={Boolean(error)}
        />
        {note && <Form.Text>{note}</Form.Text>}
        {displayUrl && (
          <div className="mt-2">
            <Button type="button" variant="outline-danger" size="sm" onClick={clearValue}>
              Remove image
            </Button>
          </div>
        )}
        {error && <Form.Control.Feedback type="invalid" className="d-block">{error}</Form.Control.Feedback>}
      </div>
    </Form.Group>
  )
}

export default LandingImageField
