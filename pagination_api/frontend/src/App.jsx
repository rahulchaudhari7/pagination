import { useEffect, useState } from 'react';
import { FiBookOpen, FiBarChart2, FiChevronLeft, FiChevronRight, FiRefreshCw, FiSearch, FiSettings, FiUserPlus } from 'react-icons/fi';
import { createStudent, fetchStudents } from './services/studentService';
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
  const [isAdding, setIsAdding] = useState(false);
  const [activeView, setActiveView] = useState('directory');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', age: '', course: '' });

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
      setError('Unable to connect to backend. Make sure Spring Boot is running on port 8080.');
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
      await createStudent({ ...addForm, age: Number(addForm.age) });
      setShowAddModal(false);
      setAddForm({ name: '', age: '', course: '' });
      setSearchTerm('');
      setSortBy('id');
      setDirection('desc');
      setPage(0);
      setSuccessMessage('Student added successfully and shown in the directory.');
      await fetchPage(0, size, 'id', 'desc', '');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to add student. Please check the form and try again.');
    } finally {
      setIsAdding(false);
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
            <h1>Student Directory</h1>
            <p>Manage and explore all students</p>
          </div>

          <div className="header-actions">
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
                        <th>Age</th>
                        <th>Course</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.length > 0 ? (
                        students.map((student) => (
                          <tr key={student.id || `${student.name}-${student.course}`}>
                            <td>{student.id || '--'}</td>
                            <td>{student.name || 'Unnamed'}</td>
                            <td>{student.age ?? '--'}</td>
                            <td>{student.course || 'Not assigned'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="empty-state">
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
            <h2>Settings</h2>
            <p>Connected to Spring Boot API at http://localhost:8080/api/students</p>
            <p>Current sort: {sortBy} / {direction}</p>
            <p>Rows per page: {size}</p>
          </section>
        )}
      </main>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>Add Student</h3>
              <button type="button" className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <form onSubmit={handleAddSubmit} className="student-form">
              <label>
                <span>Name</span>
                <input type="text" value={addForm.name} onChange={(event) => setAddForm({ ...addForm, name: event.target.value })} placeholder="Enter student name" required />
              </label>

              <label>
                <span>Age</span>
                <input type="number" min="1" value={addForm.age} onChange={(event) => setAddForm({ ...addForm, age: event.target.value })} placeholder="Enter age" required />
              </label>

              <label>
                <span>Course</span>
                <input type="text" value={addForm.course} onChange={(event) => setAddForm({ ...addForm, course: event.target.value })} placeholder="Enter course" required />
              </label>

              <div className="form-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={isAdding}>{isAdding ? 'Adding...' : 'Add Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
