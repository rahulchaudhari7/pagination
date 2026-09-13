// State Management
const state = {
    page: 0,
    size: 10,
    sortBy: 'id',
    direction: 'asc',
    students: [],
    allStudents: [],
    filteredStudents: [],
    searchQuery: ''
};

// DOM Elements
const elements = {
    searchInput: document.querySelector('#searchInput'),
    clearSearchBtn: document.querySelector('#clearSearchBtn'),
    sortBy: document.querySelector('#sortBy'),
    pageSize: document.querySelector('#pageSize'),
    directionButton: document.querySelector('#directionButton'),
    previousButton: document.querySelector('#previousButton'),
    nextButton: document.querySelector('#nextButton'),
    pageNumbers: document.querySelector('#pageNumbers'),
    studentList: document.querySelector('#studentList'),
    resultCount: document.querySelector('#resultCount'),
    pageLabel: document.querySelector('#pageLabel'),
    resultMessage: document.querySelector('#resultMessage'),
    emptyState: document.querySelector('#emptyState'),
    errorState: document.querySelector('#errorState'),
    errorMessage: document.querySelector('#errorMessage'),
    resetFiltersBtn: document.querySelector('#resetFiltersBtn'),
    addStudentBtn: document.querySelector('#addStudentBtn'),
    addStudentModal: document.querySelector('#addStudentModal'),
    closeModal: document.querySelector('#closeModal'),
    cancelAddBtn: document.querySelector('#cancelAddBtn'),
    addStudentForm: document.querySelector('#addStudentForm'),
    connectionStatus: document.querySelector('#connectionStatus'),
    // Stats
    statTotal: document.querySelector('#statTotal'),
    statAvgAge: document.querySelector('#statAvgAge'),
    statCourses: document.querySelector('#statCourses'),
    // Views
    directoryView: document.querySelector('#directoryView'),
    statsView: document.querySelector('#statsView'),
    settingsView: document.querySelector('#settingsView'),
    viewTitle: document.querySelector('#viewTitle'),
    viewSubtitle: document.querySelector('#viewSubtitle')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadStudents();
});

// Event Listeners
function setupEventListeners() {
    // Search
    elements.searchInput.addEventListener('input', handleSearch);
    elements.clearSearchBtn.addEventListener('click', clearSearch);
    
    // Filters
    elements.sortBy.addEventListener('change', handleSortChange);
    elements.pageSize.addEventListener('change', handlePageSizeChange);
    elements.directionButton.addEventListener('click', handleDirectionChange);
    elements.resetFiltersBtn.addEventListener('click', resetFilters);
    
    // Pagination
    elements.previousButton.addEventListener('click', goToPreviousPage);
    elements.nextButton.addEventListener('click', goToNextPage);
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => switchView(e.target.closest('.nav-item').dataset.view));
    });
    
    // Modal
    elements.addStudentBtn.addEventListener('click', openAddModal);
    elements.closeModal.addEventListener('click', closeAddModal);
    elements.cancelAddBtn.addEventListener('click', closeAddModal);
    elements.addStudentForm.addEventListener('submit', handleAddStudent);
    elements.addStudentModal.addEventListener('click', (e) => {
        if (e.target === elements.addStudentModal) closeAddModal();
    });
}

// Load Students
async function loadStudents() {
    try {
        showLoading();
        const params = new URLSearchParams({
            page: 0,
            size: 1000,
            sortBy: state.sortBy,
            direction: state.direction
        });
        
        const response = await fetch(`/api/students?${params}`);
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        state.students = data.content || [];
        state.allStudents = data.content || [];
        
        // Update connection status
        elements.connectionStatus.textContent = 'Connected';
        document.querySelector('.status-dot').classList.add('active');
        
        applyFiltersAndRender(data);
    } catch (error) {
        showError(error.message);
        elements.connectionStatus.textContent = 'Disconnected';
        document.querySelector('.status-dot').classList.remove('active');
    }
}

// Apply Filters and Render
function applyFiltersAndRender(data) {
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        state.filteredStudents = state.students.filter(student => 
            (student.name && student.name.toLowerCase().includes(query)) ||
            (student.id && student.id.toLowerCase().includes(query)) ||
            (student.course && student.course.toLowerCase().includes(query)) ||
            (student.age && student.age.toString().includes(query))
        );
    } else {
        state.filteredStudents = state.students;
    }
    
    // Pagination
    const totalPages = Math.ceil(state.filteredStudents.length / state.size);
    const startIdx = state.page * state.size;
    const endIdx = startIdx + state.size;
    const pageStudents = state.filteredStudents.slice(startIdx, endIdx);
    
    render({
        content: pageStudents,
        totalElements: state.filteredStudents.length,
        totalPages: totalPages,
        number: state.page,
        first: state.page === 0,
        last: state.page >= totalPages - 1
    });
}

// Render Table
function render(data) {
    const { content, totalElements, totalPages, number, first, last } = data;
    
    // Update counts
    elements.resultCount.textContent = totalElements;
    elements.pageLabel.textContent = totalPages ? `Page ${number + 1} of ${totalPages}` : 'No pages';
    
    // Update message
    if (state.searchQuery) {
        elements.resultMessage.textContent = `Showing ${content.length} results for "${state.searchQuery}"`;
    } else {
        elements.resultMessage.textContent = `Total ${totalElements} student${totalElements !== 1 ? 's' : ''}`;
    }
    
    // Render rows
    if (content.length === 0) {
        showEmptyState();
        elements.previousButton.disabled = true;
        elements.nextButton.disabled = true;
        renderPageNumbers(0);
        return;
    }
    
    hideEmptyState();
    
    elements.studentList.innerHTML = content.map((student, index) => `
        <tr style="animation-delay: ${index * 30}ms">
            <td><code style="font-family: 'JetBrains Mono'; font-size: 12px; color: #6b7280;">${escapeHtml(student.id || '--')}</code></td>
            <td><strong>${escapeHtml(student.name || 'Unnamed')}</strong></td>
            <td>${student.age || '--'}</td>
            <td><span class="badge">${escapeHtml(student.course || 'Not assigned')}</span></td>
            <td><span class="status-badge">ACTIVE</span></td>
        </tr>
    `).join('');
    
    // Update pagination
    elements.previousButton.disabled = first;
    elements.nextButton.disabled = last;
    renderPageNumbers(totalPages);
    
    // Add row animations
    document.querySelectorAll('#studentList tr').forEach(row => {
        row.style.animation = 'slideIn 0.3s ease forwards';
    });
}

// Render Page Numbers
function renderPageNumbers(totalPages) {
    elements.pageNumbers.innerHTML = '';
    
    const maxVisible = 5;
    let startPage = Math.max(0, state.page - 2);
    let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible) {
        startPage = Math.max(0, endPage - maxVisible + 1);
    }
    
    for (let page = startPage; page <= endPage; page++) {
        const button = document.createElement('button');
        button.className = `page-number${page === state.page ? ' active' : ''}`;
        button.textContent = page + 1;
        button.addEventListener('click', () => goToPage(page));
        elements.pageNumbers.appendChild(button);
    }
}

// Search Handler
function handleSearch(e) {
    state.searchQuery = e.target.value.trim();
    state.page = 0;
    
    if (state.searchQuery) {
        elements.clearSearchBtn.style.display = 'block';
    } else {
        elements.clearSearchBtn.style.display = 'none';
    }
    
    applyFiltersAndRender({ content: [] });
}

// Clear Search
function clearSearch() {
    elements.searchInput.value = '';
    state.searchQuery = '';
    state.page = 0;
    elements.clearSearchBtn.style.display = 'none';
    applyFiltersAndRender({ content: [] });
}

// Sort Change
function handleSortChange(e) {
    state.sortBy = e.target.value;
    state.page = 0;
    loadStudents();
}

// Direction Change
function handleDirectionChange() {
    state.direction = state.direction === 'asc' ? 'desc' : 'asc';
    elements.directionButton.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="12 5 19 12 12 19"></polyline>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
    <span>${state.direction === 'asc' ? 'Ascending' : 'Descending'}</span>`;
    state.page = 0;
    loadStudents();
}

// Page Size Change
function handlePageSizeChange(e) {
    state.size = Number(e.target.value);
    state.page = 0;
    applyFiltersAndRender({ content: [] });
}

// Reset Filters
function resetFilters() {
    state.page = 0;
    state.sortBy = 'id';
    state.direction = 'asc';
    state.searchQuery = '';
    elements.searchInput.value = '';
    elements.clearSearchBtn.style.display = 'none';
    elements.sortBy.value = 'id';
    elements.pageSize.value = '10';
    state.size = 10;
    elements.directionButton.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="12 5 19 12 12 19"></polyline>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
    <span>Ascending</span>`;
    loadStudents();
}

// Pagination
function goToPage(page) {
    state.page = page;
    applyFiltersAndRender({ content: [] });
    window.scrollTo(0, 0);
}

function goToPreviousPage() {
    if (state.page > 0) {
        state.page--;
        applyFiltersAndRender({ content: [] });
    }
}

function goToNextPage() {
    state.page++;
    applyFiltersAndRender({ content: [] });
}

// View Switching
function switchView(view) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.view-container').forEach(container => {
        container.classList.remove('active');
    });
    document.querySelector(`#${view}View`).classList.add('active');
    
    // Update header
    const headers = {
        directory: { title: 'Student Directory', subtitle: 'Manage and explore all students' },
        stats: { title: 'Statistics', subtitle: 'Overview and analytics' },
        settings: { title: 'Settings', subtitle: 'Configuration and information' }
    };
    
    const header = headers[view];
    elements.viewTitle.textContent = header.title;
    elements.viewSubtitle.textContent = header.subtitle;
    
    // Load stats if needed
    if (view === 'stats') {
        updateStatistics();
    }
}

// Statistics
function updateStatistics() {
    if (state.allStudents.length === 0) {
        elements.statTotal.textContent = '0';
        elements.statAvgAge.textContent = '--';
        elements.statCourses.textContent = '0';
        return;
    }
    
    const totalStudents = state.allStudents.length;
    const avgAge = Math.round(
        state.allStudents.reduce((sum, s) => sum + (s.age || 0), 0) / totalStudents
    );
    const uniqueCourses = new Set(state.allStudents.map(s => s.course)).size;
    
    elements.statTotal.textContent = totalStudents;
    elements.statAvgAge.textContent = avgAge;
    elements.statCourses.textContent = uniqueCourses;
}

// Modal Functions
function openAddModal() {
    elements.addStudentModal.style.display = 'flex';
}

function closeAddModal() {
    elements.addStudentModal.style.display = 'none';
    elements.addStudentForm.reset();
}

async function handleAddStudent(e) {
    e.preventDefault();
    
    const name = document.querySelector('#studentName').value.trim();
    const age = parseInt(document.querySelector('#studentAge').value);
    const course = document.querySelector('#studentCourse').value.trim();
    
    if (!name || !course || isNaN(age)) {
        alert('Please fill all fields');
        return;
    }
    
    try {
        const response = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, age, course })
        });
        
        if (!response.ok) throw new Error('Failed to add student');
        
        closeAddModal();
        loadStudents();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// UI States
function showLoading() {
    elements.studentList.innerHTML = `
        <tr class="loading-row">
            <td colspan="5" class="loading-cell">
                <div class="spinner"></div>
                <span>Loading students...</span>
            </td>
        </tr>
    `;
    elements.emptyState.style.display = 'none';
    elements.errorState.style.display = 'none';
}

function showEmptyState() {
    elements.emptyState.style.display = 'block';
    elements.errorState.style.display = 'none';
}

function hideEmptyState() {
    elements.emptyState.style.display = 'none';
}

function showError(message) {
    elements.errorState.style.display = 'block';
    elements.emptyState.style.display = 'none';
    elements.errorMessage.textContent = message;
    elements.studentList.innerHTML = '';
    elements.resultCount.textContent = '--';
    elements.pageLabel.textContent = 'No pages';
}

// Utility
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}
