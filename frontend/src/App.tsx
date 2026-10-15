
import { useEffect, useState, type FormEvent } from 'react'
import './App.css'

type Student = {
  id: number
  name: string
  email: string
  course: string
  phone: string
  date_of_birth: string
  enrollment_date: string
  status: string
}

const API_URL = "https://sms-app-za6b.onrender.com";
function App() {
  const [students, setStudents] = useState<Student[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [course, setCourse] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [enrollmentDate, setEnrollmentDate] = useState('')
  const [status, setStatus] = useState('Active')

  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadStudents() {
    try {
      const response = await fetch(`${API_URL}/students`)

      if (!response.ok) {
        throw new Error('Could not load students.')
      }

      const data: Student[] = await response.json()
      setStudents(data)
      setError('')
    } catch {
      setError('Cannot connect to the backend. Make sure it is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadStudents()
  }, [])

  function clearForm() {
    setName('')
    setEmail('')
    setCourse('')
    setPhone('')
    setDateOfBirth('')
    setEnrollmentDate('')
    setStatus('Active')
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  async function saveStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const studentData = {
      name,
      email,
      course,
      phone,
      date_of_birth: dateOfBirth,
      enrollment_date: enrollmentDate,
      status,
    }

    const url =
      editingId === null
        ? `${API_URL}/students`
        : `${API_URL}/students/${editingId}`

    try {
      const response = await fetch(url, {
        method: editingId === null ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'Please check the student details.',
        )
      }

      await loadStudents()
      clearForm()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while saving.',
      )
    }
  }

  function editStudent(student: Student) {
    setEditingId(student.id)
    setName(student.name)
    setEmail(student.email)
    setCourse(student.course)
    setPhone(student.phone || '')
    setDateOfBirth(student.date_of_birth || '')
    setEnrollmentDate(student.enrollment_date || '')
    setStatus(student.status || 'Active')
    setError('')
    setShowForm(true)
  }

  async function deleteStudent(id: number) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this student?',
    )

    if (!confirmed) return

    setError('')

    try {
      const response = await fetch(`${API_URL}/students/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Could not delete student.')
      }

      await loadStudents()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while deleting.',
      )
    }
  }

  const filteredStudents = students.filter((student) =>
    [
      student.name,
      student.email,
      student.course,
      student.phone || '',
      student.status || '',
    ]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>🎓 Student Portal</h2>
        <p className="active">Dashboard</p>
        <p>Students</p>
        <p>Courses</p>
        <p>Settings</p>
      </aside>

      <main className="main">
        <header>
          <div>
            <h1>Student Management System</h1>
            <p>Welcome! Manage your students in one place.</p>
          </div>

          <button
            onClick={() => {
              if (showForm && editingId === null) {
                clearForm()
              } else {
                clearForm()
                setShowForm(true)
              }
            }}
          >
            + Add Student
          </button>
        </header>

        {error && <p role="alert">{error}</p>}

        {showForm && (
          <section className="students form-section">
            <h2>{editingId !== null ? 'Edit Student' : 'Add a Student'}</h2>

            <form onSubmit={saveStudent} className="student-form">
              <label>
                Full name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter student name"
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="student@example.com"
                  required
                />
              </label>

              <label>
                Course
                <select
                  value={course}
                  onChange={(event) => setCourse(event.target.value)}
                  required
                >
                  <option value="">Select a course</option>
                  <option>Computer Science</option>
                  <option>Data Science</option>
                  <option>Artificial Intelligence</option>
                  <option>Software Engineering</option>
                </select>
              </label>

              <label>
                Phone number
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Enter phone number"
                />
              </label>

              <label>
                Date of birth
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(event) => setDateOfBirth(event.target.value)}
                />
              </label>

              <label>
                Enrollment date
                <input
                  type="date"
                  value={enrollmentDate}
                  onChange={(event) => setEnrollmentDate(event.target.value)}
                />
              </label>

              <label>
                Student status
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>

              <button type="submit">
                {editingId !== null ? 'Update Student' : 'Save Student'}
              </button>

              <button type="button" onClick={clearForm}>
                Cancel
              </button>
            </form>
          </section>
        )}

        <section className="cards">
          <div className="card">
            <p>Total Students</p>
            <h2>{students.length}</h2>
          </div>

          <div className="card">
            <p>Active Students</p>
            <h2>
              {students.filter((student) => student.status === 'Active').length}
            </h2>
          </div>

          <div className="card">
            <p>Matching Students</p>
            <h2>{filteredStudents.length}</h2>
          </div>
        </section>

        <section className="students">
          <h2>Students</h2>

          <input
            className="search-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, course, phone or status..."
          />

          {loading ? (
            <p>Loading students...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Course</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>{student.course}</td>
                    <td>{student.phone || '—'}</td>
                    <td>{student.status || 'Active'}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => editStudent(student)}
                      >
                        Edit
                      </button>{' '}
                      <button
                        type="button"
                        onClick={() => void deleteStudent(student.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={6}>No students found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
