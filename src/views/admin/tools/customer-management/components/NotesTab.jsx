import { useEffect, useState } from 'react'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import { formatDateTime } from '@/utils/reportHelpers'

const NotesTab = ({ customerId, detail, canEdit }) => {
  const { showNotification } = useNotificationContext()

  const [notes, setNotes] = useState([])
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  useEffect(() => {
    setNotes(Array.isArray(detail?.notes) ? detail.notes : [])
  }, [detail])

  const handleAddNote = async () => {
    if (!noteTitle.trim() || !noteBody.trim()) {
      showNotification({ title: 'Failed', message: 'Please fill in both the title and the note.', variant: 'danger' })
      return
    }
    setAddingNote(true)
    try {
      await ApiService.addCustomerManagementNote(customerId, { title: noteTitle.trim(), note: noteBody.trim() })
      const data = await ApiService.getCustomerManagementDetail(customerId)
      setNotes(Array.isArray(data?.notes) ? data.notes : [])
      setNoteTitle('')
      setNoteBody('')
      showNotification({ title: 'Success', message: 'Note has been added.', variant: 'success' })
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to add note.', variant: 'danger' })
    } finally {
      setAddingNote(false)
    }
  }

  return (
    <Card>
      <Card.Header><h5 className="mb-0">Notes</h5></Card.Header>
      <Card.Body>
        {notes.length === 0 && <p className="text-muted small mb-3">No notes yet.</p>}
        {notes.map((n) => (
          <div key={n.id} className="border rounded p-2 mb-2">
            <div className="fw-semibold small">{n.title}</div>
            <div className="small">{n.note}</div>
            <div className="text-muted fs-xxs">{formatDateTime(n.create_date)}</div>
          </div>
        ))}
        {canEdit && (
          <Row className="g-2 mt-2">
            <Col md={3}><Form.Control size="sm" placeholder="Title" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} /></Col>
            <Col md={6}><Form.Control size="sm" placeholder="Note" value={noteBody} onChange={(e) => setNoteBody(e.target.value)} /></Col>
            <Col md="auto">
              <Button size="sm" variant="secondary" disabled={addingNote} onClick={handleAddNote}>
                <Icon icon="plus" className="me-1" /> {addingNote ? 'Adding...' : 'Add Note'}
              </Button>
            </Col>
          </Row>
        )}
      </Card.Body>
    </Card>
  )
}

export default NotesTab
