import { useEffect, useRef } from 'react'
import Quill from '@/utils/quillLink'
import 'quill/dist/quill.snow.css'

const QuillEditor = ({ theme = 'snow', modules = {}, value = '', onChange }) => {
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
      theme,
      modules,
    })

    quill.clipboard.dangerouslyPasteHTML(value || '', 'silent')
    quill.on('text-change', () => {
      onChangeRef.current?.(quill.root.innerHTML)
    })

    quillRef.current = quill
  }, [modules, theme, value])

  useEffect(() => {
    const quill = quillRef.current
    if (!quill) {
      return
    }

    const nextValue = value || ''
    if (quill.root.innerHTML === nextValue) {
      return
    }

    quill.clipboard.dangerouslyPasteHTML(nextValue, 'silent')
  }, [value])

  return <div ref={editorRef} />
}

export default QuillEditor
