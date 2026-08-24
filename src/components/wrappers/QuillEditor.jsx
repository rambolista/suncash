import { useEffect, useRef } from 'react'
import { Form } from 'react-bootstrap'
import Quill from '@/utils/quillLink'
import 'quill/dist/quill.snow.css'

export const modules = {
  toolbar: [
    [{ font: [] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ script: 'super' }, { script: 'sub' }],
    [{ header: [false, 1, 2, 3, 4, 5, 6] }],
    ['blockquote', 'code-block'],
    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
    [{ align: [] }],
    ['link', 'image', 'video'],
    ['clean'],
  ],
}

const isEmptyHtml = (value) => {
  const normalized = String(value ?? '').trim()
  return normalized === '' || normalized === '<p><br></p>'
}

const QuillEditor = ({ label, value, onChange, placeholder = 'Write content...', note, error, className = '', modules: editorModules = modules }) => {
  const editorRef = useRef(null)
  const quillRef = useRef(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!editorRef.current || quillRef.current) {
      return
    }

    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      placeholder,
      modules: editorModules,
    })

    quill.clipboard.dangerouslyPasteHTML(value || '', 'silent')
    quill.on('text-change', () => {
      const html = quill.root.innerHTML
      onChangeRef.current?.(isEmptyHtml(html) ? '' : html)
    })

    quillRef.current = quill
  }, [editorModules, placeholder, value])

  useEffect(() => {
    const quill = quillRef.current
    if (!quill) {
      return
    }

    const nextValue = value || ''
    const currentValue = quill.root.innerHTML
    if (currentValue === nextValue) {
      return
    }

    const selection = quill.getSelection()
    quill.clipboard.dangerouslyPasteHTML(nextValue, 'silent')
    if (selection) {
      quill.setSelection(selection)
    }
  }, [value])

  return (
    <Form.Group className={className}>
      {label && <Form.Label>{label}</Form.Label>}
      <div ref={editorRef} />
      {note && <Form.Text>{note}</Form.Text>}
      {error && <Form.Control.Feedback type="invalid" className="d-block">{error}</Form.Control.Feedback>}
    </Form.Group>
  )
}

export default QuillEditor
