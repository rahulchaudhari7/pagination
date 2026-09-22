import { useEffect, useState } from 'react';
import {
  FiBookOpen,
  FiBarChart2,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiUserPlus,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiMail,
  FiCheckCircle,
} from 'react-icons/fi';
import { createStudent, fetchStudents, fetchStudentById, updateStudent, deleteStudent } from './services/studentService';
import './App.css';

const SORT_OPTIONS = [
  { value: 'id', label: 'ID' },
  { value: 'name', label: 'Name' },
  { value: 'age', label: 'Age' },
  { value: 'course', label: 'Course' },
];

const PAGE_SIZES = [5, 10, 20, 50];

function App() {
  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState('id');
  const [direction, setDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [lastCorrelationId, setLastCorrelationId] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [activeView, setActiveView] = useState('directory');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', age: '', course: '' });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', name: '', email: '', age: '', course: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [pagination, setPagination] = useState({
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 10,
  });

  const fetchPage = async (nextPage = page, nextSize = size, nextSortBy = sortBy, nextDirection = direction, nextSearch = searchTerm) => {
    setLoading(true);
    setError('');

    try {
      const data = await fetchStudents({
        page: nextPage,
        size: nextSize,
        sortBy: nextSortBy,
        direction: nextDirection,
        search: nextSearch,
      });

      if (data.correlationId) {
        setLastCorrelationId(data.correlationId);
      }

      setStudents(data.content || []);
      setPagination({
        content: data.content || [],
        totalElements: data.totalElements || 0,
        totalPages: data.totalPages || 0,
        number: data.number || 0,
        size: data.size || nextSize,
        numberOfElements: data.numberOfElements || 0,
      });
      setIsConnected(true);
    } catch {
      setIsConnected(false);
      setStudents([]);
      setPagination({
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: nextSize,
      });
      setError('Unable to connect to backend API (/api/students). Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => fetchPage(0, size, sortBy, direction, searchTerm), 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm, size, sortBy, direction]);

  const handleSortChange = (event) => {
    const newSortBy = event.target.value;
    setSortBy(newSortBy);
    setPage(0);
  };

  const handleDirectionToggle = () => {
    const newDirection = direction === 'asc' ? 'desc' : 'asc';
    setDirection(newDirection);
    setPage(0);
  };

  const handleSizeChange = (event) => {
    const newSize = Number(event.target.value);
    setSize(newSize);
    setPage(0);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 0 || newPage >= pagination.totalPages) return;
    setPage(newPage);
    fetchPage(newPage, size, sortBy, direction, searchTerm);
  };

  const handleRetry = () => {
    fetchPage();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSortBy('id');
    setDirection('asc');
    setSize(10);
    setPage(0);
  };

  const handleAddSubmit = async (event) => {
    event.preventDefault();
    setIsAdding(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await createStudent({ ...addForm, age: Number(addForm.age) });
      if (res.correlationId) {
        setLastCorrelationId(res.correlationId);
      }
      setShowAddModal(false);
      setAddForm({ name: '', email: '', age: '', course: '' });
      setSearchTerm('');
      setSortBy('id');
      setDirection('desc');
      setPage(0);
      setSuccessMessage(`Student '${res.name || addForm.name}' created successfully (HTTP 201 Created). [CID: ${(res.correlationId || '').slice(0, 8)}...]`);
      await fetchPage(0, size, 'id', 'desc', '');
    } catch (err) {
      const fieldErrors = err.response?.data?.details?.validationErrors;
      const errorMsg = fieldErrors
        ? Object.entries(fieldErrors).map(([field, msg]) => `${field}: ${msg}`).join(', ')
        : (err.response?.data?.message || 'Unable to add student. Please check the form.');
      setError(errorMsg);
    } finally {
      setIsAdding(false);
    }
  };

  const handleOpenEdit = (student) => {
    setEditForm({
      id: student.id,
      name: student.name || '',
      email: student.email || `${(student.name || 'student').toLowerCase().replace(/\s+/g, '.')}@university.edu`,
      age: student.age || '',
      course: student.course || '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    setIsUpdating(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await updateStudent(editForm.id, {
        name: editForm.name,
        email: editForm.email,
        age: Number(editForm.age),
        course: editForm.course,
      });
      if (res.correlationId) {
        setLastCorrelationId(res.correlationId);
      }
      setShowEditModal(false);
      setSuccessMessage(`Student '${res.name}' (ID: ${editForm.id}) updated successfully (HTTP 200 OK). [CID: ${(res.correlationId || '').slice(0, 8)}...]`);
      await fetchPage();
    } catch (err) {
      const fieldErrors = err.response?.data?.details?.validationErrors;
      const errorMsg = fieldErrors
        ? Object.entries(fieldErrors).map(([field, msg]) => `${field}: ${msg}`).join(', ')
        : (err.response?.data?.message || 'Unable to update student.');
      setError(errorMsg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenView = async (student) => {
    try {
      const res = await fetchStudentById(student.id);
      if (res.correlationId) {
        setLastCorrelationId(res.correlationId);
      }
      setSelectedStudent(res);
      setShowViewModal(true);
    } catch (err) {
      setSelectedStudent(student);
      setShowViewModal(true);
    }
  };

  const handleOpenDelete = (student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await deleteStudent(studentToDelete.id);
      if (res.correlationId) {
        setLastCorrelationId(res.correlationId);
      }
      setShowDeleteModal(false);
      setSuccessMessage(`Student '${studentToDelete.name}' deleted successfully (HTTP 200 OK). [CID: ${(res.correlationId || '').slice(0, 8)}...]`);
      setStudentToDelete(null);
      await fetchPage();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete student.');
    } finally {
      setIsDeleting(false);
    }
  };

  const stats = {
    totalStudents: pagination.totalElements,
    currentPage: pagination.totalPages ? pagination.number + 1 : 0,
    totalPages: pagination.totalPages,
    studentsOnPage: pagination.numberOfElements ?? students.length,
  };

  const renderPageNumbers = () => {
    const total = pagination.totalPages || 0;
    if (total <= 1) return null;

    const maxVisible = 5;
    let start = Math.max(0, page - 2);
    let end = Math.min(total - 1, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(0, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, index) => {
      const pageNumber = start + index;
      return (
        <button
          key={pageNumber}
          type="button"
          className={`page-number ${page === pageNumber ? 'active' : ''}`}
          onClick={() => handlePageChange(pageNumber)}
        >
          {pageNumber + 1}
        </button>
      );
    });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-logo">S</div>
          <div>
            <p className="brand-name">StudHub</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button type="button" className={`nav-item ${activeView === 'directory' ? 'active' : ''}`} onClick={() => setActiveView('directory')}>
            <FiBookOpen />
            <span>Directory</span>
          </button>
          <button type="button" className={`nav-item ${activeView === 'statistics' ? 'active' : ''}`} onClick={() => setActiveView('statistics')}>
            <FiBarChart2 />
            <span>Statistics</span>
          </button>
          <button type="button" className={`nav-item ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')}>
            <FiSettings />
            <span>Settings</span>
          </button>
        </nav>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <h1>{activeView === 'directory' ? 'Student Directory' : activeView === 'statistics' ? 'Student Statistics' : 'System Settings'}</h1>
            <p>{activeView === 'directory' ? 'Manage and explore all students with pagination & search' : activeView === 'statistics' ? 'Directory distributions & page metrics' : 'API and server configurations'}</p>
          </div>

          <div className="header-actions">
            {lastCorrelationId && (
              <div className="cid-pill" title={`Latest Request Correlation ID: ${lastCorrelationId}`}>
                <span className="cid-dot" />
                <span className="cid-text">CID: {lastCorrelationId.slice(0, 8)}...</span>
              </div>
            )}
            {!loading && <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              <span className="status-dot" />
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>}
            <button type="button" className="primary-btn" onClick={() => setShowAddModal(true)}>
              <FiUserPlus />
              Add Student
            </button>
          </div>
        </header>

        {successMessage && <div className="success-banner" role="status">{successMessage}</div>}

        {activeView === 'directory' && (
          <section className="panel-card">
            <div className="toolbar">
              <div className="search-box">
                <FiSearch />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name, ID, or course..."
                />
              </div>

              <div className="filter-group">
                <label>
                  <span>Sort By</span>
                  <select value={sortBy} onChange={handleSortChange}>
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Direction</span>
                  <button type="button" className="direction-button" onClick={handleDirectionToggle}>
                    {direction === 'asc' ? 'Ascending' : 'Descending'}
                  </button>
                </label>

                <label>
                  <span>Rows per Page</span>
                  <select value={size} onChange={handleSizeChange}>
                    {PAGE_SIZES.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <button type="button" className="secondary-btn reset-btn" onClick={handleResetFilters}>Reset Filters</button>
              </div>
            </div>

            {error ? (
              <div className="error-card">
                <p>{error}</p>
                <button type="button" className="secondary-btn" onClick={handleRetry}>
                  <FiRefreshCw /> Retry
                </button>
              </div>
            ) : loading ? (
              <div className="loading-card" aria-live="polite">
                <div className="spinner" />
                <span>Loading students...</span>
              </div>
            ) : (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email (JSR-380)</th>
                        <th>Age</th>
                        <th>Course</th>
                        <th style={{ textAlign: 'center' }}>REST Actions (CRUD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.length > 0 ? (
                        students.map((student) => {
                          const studentEmail = student.email || `${(student.name || 'student').toLowerCase().replace(/\s+/g, '.')}@university.edu`;
                          return (
                            <tr key={student.id || `${student.name}-${student.course}`}>
                              <td><span className="id-badge">#{student.id || '--'}</span></td>
                              <td><strong>{student.name || 'Unnamed'}</strong></td>
                              <td>
                                <span className="email-chip">
                                  <FiMail />
                                  <span>{studentEmail}</span>
                                </span>
                              </td>
                              <td>{student.age ?? '--'}</td>
                              <td><span className="course-badge">{student.course || 'Not assigned'}</span></td>
                              <td className="actions-cell">
                                <div className="action-btn-group">
                                  <button
                                    type="button"
                                    className="action-icon-btn view"
                                    title="Read Details (GET /api/students/:id)"
                                    onClick={() => handleOpenView(student)}
                                  >
                                    <FiEye />
                                    <span>View</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="action-icon-btn edit"
                                    title="Update Resource (PUT /api/students/:id)"
                                    onClick={() => handleOpenEdit(student)}
                                  >
                                    <FiEdit2 />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="action-icon-btn delete"
                                    title="Delete Resource (DELETE /api/students/:id)"
                                    onClick={() => handleOpenDelete(student)}
                                  >
                                    <FiTrash2 />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="empty-state">
                            No students match your current search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="pagination-footer">
                  <div className="meta-info">
                    <span>Total Students: {pagination.totalElements}</span>
                    <span>Page {pagination.totalPages ? pagination.number + 1 : 0} of {pagination.totalPages || 0}</span>
                  </div>

                  <div className="pager-controls">
                    <button type="button" className="page-btn" disabled={page === 0} onClick={() => handlePageChange(page - 1)}>
                      <FiChevronLeft /> Previous
                    </button>

                    <div className="page-numbers">{renderPageNumbers()}</div>

                    <button type="button" className="page-btn" disabled={page >= (pagination.totalPages || 1) - 1} onClick={() => handlePageChange(page + 1)}>
                      Next <FiChevronRight />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {activeView === 'statistics' && (
          <section className="stats-grid">
            <div className="stat-card">
              <span>Total Students</span>
              <strong>{stats.totalStudents}</strong>
            </div>
            <div className="stat-card">
              <span>Current Page</span>
              <strong>{stats.currentPage}</strong>
            </div>
            <div className="stat-card">
              <span>Total Pages</span>
              <strong>{stats.totalPages}</strong>
            </div>
            <div className="stat-card">
              <span>Students on Current Page</span>
              <strong>{stats.studentsOnPage}</strong>
            </div>
          </section>
        )}

        {activeView === 'settings' && (
          <section className="panel-card settings-panel">
            <h2>Backend Architecture & Observability Settings</h2>
            <div className="settings-grid">
              <div className="setting-card">
                <strong>API Endpoint</strong>
                <p><code>/api/students</code> (with query params: <code>page, size, sortBy, direction, search</code>)</p>
              </div>
              <div className="setting-card">
                <strong>Centralized Exception Handling</strong>
                <p>Enabled (Express Error Middleware &amp; Spring <code>@ControllerAdvice</code> equivalent)</p>
              </div>
              <div className="setting-card">
                <strong>Request Tracing (Correlation IDs)</strong>
                <p>Enabled (Automatic UUID v4 generation &amp; propagation via <code>X-Correlation-ID</code>)</p>
              </div>
              <div className="setting-card">
                <strong>Structured JSON Logging</strong>
                <p>Enabled (Logs capture timestamp, level, correlationId, method, url, latency, client IP, exception)</p>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* 1. CREATE STUDENT MODAL (POST /api/students) */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="http-badge post">POST</span>
                <h3>Create New Student (Bean Validation)</h3>
              </div>
              <button type="button" className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <form onSubmit={handleAddSubmit} className="student-form">
              <label>
                <span>Student Full Name (@NotBlank, @Size(min=2))</span>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(event) => setAddForm({ ...addForm, name: event.target.value })}
                  placeholder="e.g. Aryan Sharma"
                  required
                />
              </label>

              <label>
                <span>Email Address (@Email - JSR 380)</span>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(event) => setAddForm({ ...addForm, email: event.target.value })}
                  placeholder="e.g. aryan.sharma@university.edu"
                />
              </label>

              <label>
                <span>Age (@NotNull, @Min(1), @Max(150))</span>
                <input
                  type="number"
                  min="1"
                  max="150"
                  value={addForm.age}
                  onChange={(event) => setAddForm({ ...addForm, age: event.target.value })}
                  placeholder="e.g. 21"
                  required
                />
              </label>

              <label>
                <span>Enrolled Course (@NotBlank)</span>
                <input
                  type="text"
                  value={addForm.course}
                  onChange={(event) => setAddForm({ ...addForm, course: event.target.value })}
                  placeholder="e.g. Distributed Systems & Cloud Computing"
                  required
                />
              </label>

              <div className="form-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={isAdding}>
                  {isAdding ? 'Validating & Creating...' : 'Submit POST /api/students'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. UPDATE STUDENT MODAL (PUT /api/students/:id) */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="http-badge put">PUT</span>
                <h3>Update Student Resource (ID: #{editForm.id})</h3>
              </div>
              <button type="button" className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>

            <form onSubmit={handleEditSubmit} className="student-form">
              <label>
                <span>Student Full Name (@NotBlank)</span>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                  required
                />
              </label>

              <label>
                <span>Email Address (@Email)</span>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(event) => setEditForm({ ...editForm, email: event.target.value })}
                  required
                />
              </label>

              <label>
                <span>Age (@Min(1), @Max(150))</span>
                <input
                  type="number"
                  min="1"
                  max="150"
                  value={editForm.age}
                  onChange={(event) => setEditForm({ ...editForm, age: event.target.value })}
                  required
                />
              </label>

              <label>
                <span>Enrolled Course (@NotBlank)</span>
                <input
                  type="text"
                  value={editForm.course}
                  onChange={(event) => setEditForm({ ...editForm, course: event.target.value })}
                  required
                />
              </label>

              <div className="form-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Submit PUT /api/students/' + editForm.id}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. VIEW STUDENT DETAILS MODAL (GET /api/students/:id) */}
      {showViewModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-card view-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="http-badge get">GET</span>
                <h3>Student Resource Entity (ID: #{selectedStudent.id})</h3>
              </div>
              <button type="button" className="close-btn" onClick={() => setShowViewModal(false)}>×</button>
            </div>

            <div className="student-detail-body">
              <div className="detail-row">
                <span className="detail-label">Resource URI:</span>
                <code>GET /api/students/{selectedStudent.id}</code>
              </div>
              <div className="detail-row">
                <span className="detail-label">Student Name:</span>
                <strong>{selectedStudent.name}</strong>
              </div>
              <div className="detail-row">
                <span className="detail-label">Official Email:</span>
                <span>{selectedStudent.email || `${selectedStudent.name?.toLowerCase().replace(/\s+/g, '.')}@university.edu`}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Age:</span>
                <span>{selectedStudent.age} years old</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Department / Course:</span>
                <span className="course-badge">{selectedStudent.course}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Trace Correlation ID:</span>
                <code>{selectedStudent.correlationId || lastCorrelationId || 'auto-propagated-v4'}</code>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="primary-btn" onClick={() => setShowViewModal(false)}>
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. DELETE STUDENT MODAL (DELETE /api/students/:id) */}
      {showDeleteModal && studentToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-card delete-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="http-badge delete">DELETE</span>
                <h3>Delete Student Resource</h3>
              </div>
              <button type="button" className="close-btn" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>

            <div className="delete-modal-content">
              <p>
                Are you sure you want to delete student <strong>"{studentToDelete.name}"</strong> (ID: #{studentToDelete.id})?
              </p>
              <div className="api-call-hint">
                <code>DELETE /api/students/{studentToDelete.id}</code>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="secondary-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button type="button" className="delete-confirm-btn" onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Confirm Delete (HTTP 200)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
