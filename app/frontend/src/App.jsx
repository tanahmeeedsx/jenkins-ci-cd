import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API = '/api'
const emptyForm = { title: '', content: '', category: 'Personal' }

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('noteshub_token') || '')
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('noteshub_user') || 'null'))
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [notes, setNotes] = useState([])
  const [active, setActive] = useState('All Notes')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const request = async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.message || 'Request failed')
    return data
  }

  const logout = () => {
    localStorage.removeItem('noteshub_token')
    localStorage.removeItem('noteshub_user')
    setToken('')
    setUser(null)
    setNotes([])
  }

  const authenticate = async e => {
    e.preventDefault()
    setAuthError('')

    try {
      const data = await fetch(`${API}/auth/${authMode === 'register' ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      }).then(async r => {
        const result = await r.json()
        if (!r.ok) throw new Error(result.message || 'Authentication failed')
        return result
      })

      localStorage.setItem('noteshub_token', data.token)
      localStorage.setItem('noteshub_user', JSON.stringify(data.user))
      setToken(data.token)
      setUser(data.user)
    } catch (err) {
      setAuthError(err.message)
    }
  }

  const loadNotes = async () => {
    if (!token) return
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()
      params.set('archived', active === 'Archived' ? 'true' : 'false')
      if (search.trim()) params.set('search', search.trim())

      const data = await request(`/notes?${params.toString()}`)
      setNotes(data)
    } catch (err) {
      if (err.message.includes('token') || err.message.includes('Authentication')) {
        logout()
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) loadNotes()
  }, [token, active, search])

  const visibleNotes = useMemo(() => notes.filter(note => {
    if (active === 'Pinned') return note.pinned
    if (['Personal', 'Work', 'Ideas'].includes(active)) return note.category === active
    return true
  }), [notes, active])

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setModal(true)
  }

  const openEdit = note => {
    setEditing(note._id)
    setForm({
      title: note.title,
      content: note.content || '',
      category: note.category || 'Personal'
    })
    setModal(true)
  }

  const saveNote = async e => {
    e.preventDefault()
    if (!form.title.trim()) return

    try {
      if (editing) {
        await request(`/notes/${editing}`, {
          method: 'PATCH',
          body: JSON.stringify(form)
        })
      } else {
        await request('/notes', {
          method: 'POST',
          body: JSON.stringify(form)
        })
      }
      setModal(false)
      await loadNotes()
    } catch (err) {
      setError(err.message)
    }
  }

  const updateNote = async (id, updates) => {
    try {
      await request(`/notes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      })
      await loadNotes()
    } catch (err) {
      setError(err.message)
    }
  }

  const deleteNote = async id => {
    if (!window.confirm('Delete this note permanently?')) return
    try {
      await request(`/notes/${id}`, { method: 'DELETE' })
      await loadNotes()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!token) {
    return (
      <div className="auth-screen">
        <form className="note-modal auth-modal" onSubmit={authenticate}>
          <div className="brand">
            <div className="brand-icon">N</div>
            <span>Notes<span className="brand-light">Hub</span></span>
          </div>
          <h2>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p>Organize your thoughts in one place.</p>

          {authMode === 'register' && (
            <label>Name
              <input value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} required />
            </label>
          )}
          <label>Email
            <input type="email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} required />
          </label>
          <label>Password
            <input type="password" minLength="8" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} required />
          </label>

          {authError && <p className="auth-error">{authError}</p>}
          <button className="primary-btn" type="submit">
            {authMode === 'login' ? 'Login' : 'Register'}
          </button>
          <p>
            {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            {' '}
            <button type="button" className="auth-switch" onClick={() => {
              setAuthMode(authMode === 'login' ? 'register' : 'login')
              setAuthError('')
            }}>
              {authMode === 'login' ? 'Register' : 'Login'}
            </button>
          </p>
        </form>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-icon">N</div><span>Notes<span className="brand-light">Hub</span></span></div>
        <button className="new-note" onClick={openNew}>＋ <span>New note</span></button>

        <div className="nav-label">WORKSPACE</div>
        {[
          ['All Notes', '▤'],
          ['Pinned', '⌑'],
          ['Archived', '▣']
        ].map(([name, icon]) => (
          <button key={name} className={`nav-item ${active === name ? 'selected' : ''}`} onClick={() => setActive(name)}>
            <span>{icon}</span>{name}
            {name === 'All Notes' && <small>{notes.length}</small>}
          </button>
        ))}

        <div className="nav-label category-label">CATEGORIES</div>
        {['Personal', 'Work', 'Ideas'].map((name, i) => (
          <button key={name} className={`nav-item ${active === name ? 'selected' : ''}`} onClick={() => setActive(name)}>
            <span className={`category-dot dot-${i}`}></span>{name}
          </button>
        ))}

        <div className="sidebar-bottom">
          <div className="avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div><strong>{user?.name || 'My Workspace'}</strong><small>{user?.email || 'Personal account'}</small></div>
          <button className="more" title="Logout" onClick={logout}>↪</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>{active}</strong></div>
          <div className="top-actions">
            <span className="status-dot"></span>
            <span className="saved-label">Connected to database</span>
            <div className="avatar small-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          </div>
        </header>

        <section className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">YOUR WORKSPACE</div>
              <h1>{active}</h1>
              <p>Capture your thoughts and keep everything organized.</p>
            </div>
            <button className="primary-btn" onClick={openNew}>＋ Create note</button>
          </div>

          <div className="toolbar">
            <div className="search-box">
              <span>⌕</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your notes..." />
              <kbd>⌘ K</kbd>
            </div>
            <span className="note-count">{visibleNotes.length} notes</span>
          </div>

          {error && <p className="auth-error">{error}</p>}
          {active === 'All Notes' && !search && <div className="section-title">YOUR NOTES <span>RECENTLY UPDATED</span></div>}

          {loading ? <p>Loading notes...</p> : visibleNotes.length ? (
            <div className="notes-grid">
              {visibleNotes.map(note => (
                <article className={`note-card ${note.pinned ? 'pinned-card' : ''}`} key={note._id}>
                  <div className="card-top">
                    <span className={`category-tag tag-${(note.category || 'personal').toLowerCase()}`}>{note.category}</span>
                    <button className={`pin-btn ${note.pinned ? 'is-pinned' : ''}`} title="Pin note" onClick={() => updateNote(note._id, { pinned: !note.pinned })}>⌑</button>
                  </div>
                  <h3>{note.title}</h3>
                  <p className="note-content">{note.content}</p>
                  <div className="card-footer">
                    <span>{note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : 'Recently'}</span>
                    <div className="card-actions">
                      <button title="Edit" onClick={() => openEdit(note)}>✎</button>
                      <button title="Archive" onClick={() => updateNote(note._id, { archived: !note.archived })}>▣</button>
                      <button title="Delete" onClick={() => deleteNote(note._id)}>⌫</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div>▤</div><h3>No notes found</h3>
              <p>Create a note or try another search.</p>
              <button className="primary-btn" onClick={openNew}>Create your first note</button>
            </div>
          )}
        </section>
        <footer className="footer">NOTESHUB <span>·</span> YOUR THOUGHTS, ORGANIZED.</footer>
      </main>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <form className="note-modal" onSubmit={saveNote} onClick={e => e.stopPropagation()}>
            <div className="modal-heading">
              <h2>{editing ? 'Edit note' : 'Create a note'}</h2>
              <button type="button" onClick={() => setModal(false)}>×</button>
            </div>
            <label>Title
              <input autoFocus value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Give your note a title..." required />
            </label>
            <label>Content
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Start writing your thoughts..." rows="6" />
            </label>
            <label>Category
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option>Personal</option><option>Work</option><option>Ideas</option>
              </select>
            </label>
            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={() => setModal(false)}>Cancel</button>
              <button className="primary-btn" type="submit">Save note</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default App
