import { useState, useEffect, useCallback } from 'react';
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiCode,
  FiCopy,
  FiFilter,
  FiRefreshCw,
  FiTrash2,
  FiZap,
  FiSearch,
  FiCheck,
  FiTerminal,
} from 'react-icons/fi';
import {
  fetchObservabilityLogs,
  clearObservabilityLogs,
  simulateException,
} from '../services/studentService';

export default function ObservabilityView() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    errorCount: 0,
    averageLatencyMs: 0,
    activeCorrelationId: '',
  });
  const [loading, setLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [correlationIdFilter, setCorrelationIdFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' | 'simulator' | 'architecture'

  const loadLogs = useCallback(async () => {
    try {
      const data = await fetchObservabilityLogs({
        level: selectedLevel === 'ALL' ? undefined : selectedLevel,
        correlationId: correlationIdFilter || undefined,
        search: searchFilter || undefined,
      });
      setLogs(data.logs || []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load observability logs', err);
    }
  }, [selectedLevel, correlationIdFilter, searchFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadLogs();
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadLogs]);

  const handleClearLogs = async () => {
    if (!window.confirm('Clear all in-memory structured logs?')) return;
    await clearObservabilityLogs();
    setLogs([]);
    loadLogs();
  };

  const handleSimulate = async (type) => {
    setIsSimulating(true);
    setSimulationResult(null);
    try {
      const res = await simulateException(type);
      setSimulationResult(res);
      // Refresh logs immediately so the user sees the error log in the viewer
      await loadLogs();
    } finally {
      setIsSimulating(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="observability-container">
      {/* Header Metric Cards */}
      <div className="obs-metrics-grid">
        <div className="obs-metric-card">
          <div className="metric-header">
            <span>Total Logged Requests</span>
            <FiActivity className="metric-icon" />
          </div>
          <strong>{stats.totalRequests}</strong>
          <small>Monitored via structured logger</small>
        </div>

        <div className="obs-metric-card error-card-accent">
          <div className="metric-header">
            <span>Handled Exceptions</span>
            <FiAlertTriangle className="metric-icon error-icon" />
          </div>
          <strong>{stats.errorCount}</strong>
          <small>Caught centrally by Global Handler</small>
        </div>

        <div className="obs-metric-card">
          <div className="metric-header">
            <span>Avg Response Latency</span>
            <FiZap className="metric-icon" />
          </div>
          <strong>{stats.averageLatencyMs} ms</strong>
          <small>High-precision timer metric</small>
        </div>

        <div className="obs-metric-card correlation-card">
          <div className="metric-header">
            <span>Latest Correlation ID</span>
            <button
              type="button"
              className="copy-btn"
              title="Copy Correlation ID"
              onClick={() => copyToClipboard(stats.activeCorrelationId, 'main-cid')}
            >
              {copiedId === 'main-cid' ? <FiCheck /> : <FiCopy />}
            </button>
          </div>
          <code className="correlation-code">{stats.activeCorrelationId || 'None yet'}</code>
          <small>Propagated via X-Correlation-ID</small>
        </div>
      </div>

      {/* Observability Sub-Navigation Tabs */}
      <div className="obs-tabs">
        <button
          type="button"
          className={`obs-tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <FiTerminal />
          <span>Structured Logs Stream ({logs.length})</span>
        </button>
        <button
          type="button"
          className={`obs-tab ${activeTab === 'simulator' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulator')}
        >
          <FiZap />
          <span>Global Exception Simulator</span>
        </button>
        <button
          type="button"
          className={`obs-tab ${activeTab === 'architecture' ? 'active' : ''}`}
          onClick={() => setActiveTab('architecture')}
        >
          <FiCode />
          <span>@ControllerAdvice & Tracing Architecture</span>
        </button>
      </div>

      {/* TAB 1: Structured Logs Stream */}
      {activeTab === 'logs' && (
        <div className="obs-panel">
          <div className="obs-toolbar">
            <div className="filter-chips">
              {['ALL', 'INFO', 'WARN', 'ERROR'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  className={`filter-chip ${selectedLevel === lvl ? 'active' : ''} chip-${lvl.toLowerCase()}`}
                  onClick={() => setSelectedLevel(lvl)}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div className="search-group">
              <div className="search-field">
                <FiFilter />
                <input
                  type="text"
                  placeholder="Filter by Correlation ID..."
                  value={correlationIdFilter}
                  onChange={(e) => setCorrelationIdFilter(e.target.value)}
                />
              </div>

              <div className="search-field">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search logs message/URL..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="obs-actions">
              <button
                type="button"
                className={`secondary-btn auto-refresh-btn ${autoRefresh ? 'refreshing' : ''}`}
                onClick={() => setAutoRefresh(!autoRefresh)}
                title="Toggle Live Polling (3s)"
              >
                <FiRefreshCw className={autoRefresh ? 'spin' : ''} />
                <span>Live: {autoRefresh ? 'ON' : 'OFF'}</span>
              </button>

              <button type="button" className="secondary-btn" onClick={loadLogs}>
                <FiRefreshCw />
                <span>Refresh</span>
              </button>

              <button type="button" className="danger-btn" onClick={handleClearLogs}>
                <FiTrash2 />
                <span>Clear Logs</span>
              </button>
            </div>
          </div>

          {/* Logs List */}
          <div className="logs-stream">
            {logs.length === 0 ? (
              <div className="empty-logs">
                <FiTerminal className="empty-icon" />
                <p>No logs match the current filters.</p>
                <small>Trigger requests or simulate exceptions to see real-time structured logs.</small>
              </div>
            ) : (
              logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const statusClass =
                  log.statusCode >= 500
                    ? 'status-5xx'
                    : log.statusCode >= 400
                    ? 'status-4xx'
                    : 'status-2xx';

                return (
                  <div key={log.id} className={`log-entry log-entry-${log.level.toLowerCase()}`}>
                    <div className="log-summary" onClick={() => setExpandedLogId(isExpanded ? null : log.id)}>
                      <div className="log-meta">
                        <span className={`log-level-badge badge-${log.level.toLowerCase()}`}>{log.level}</span>
                        <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className="log-method">{log.method}</span>
                        <span className="log-url">{log.url}</span>
                      </div>

                      <div className="log-badges">
                        <span className={`status-badge ${statusClass}`}>{log.statusCode}</span>
                        <span className="latency-badge">{log.durationMs}ms</span>
                        <div
                          className="correlation-tag"
                          title="Filter by this correlation ID"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCorrelationIdFilter(log.correlationId);
                          }}
                        >
                          <span>CID: {log.correlationId.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </div>

                    <div className="log-message-row">
                      <span className="log-message">{log.message}</span>
                      <button
                        type="button"
                        className="details-toggle-btn"
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      >
                        {isExpanded ? 'Hide JSON' : 'Inspect JSON'}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="log-json-panel">
                        <div className="json-header">
                          <span>Structured Log Payload (RFC JSON format):</span>
                          <button
                            type="button"
                            className="copy-json-btn"
                            onClick={() => copyToClipboard(JSON.stringify(log, null, 2), log.id)}
                          >
                            {copiedId === log.id ? <FiCheck /> : <FiCopy />}
                            <span>{copiedId === log.id ? 'Copied' : 'Copy JSON'}</span>
                          </button>
                        </div>
                        <pre className="json-block">{JSON.stringify(log, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Global Exception Simulator */}
      {activeTab === 'simulator' && (
        <div className="obs-panel simulator-panel">
          <div className="simulator-intro">
            <h3>Interactive Centralized Exception Handling Studio</h3>
            <p>
              Trigger various backend exception scenarios to observe how the centralized
              exception handler (<code>@ControllerAdvice</code> pattern) intercepts errors, attaches a unique{' '}
              <strong>Correlation ID</strong>, logs structured diagnostics, and produces a standardized ProblemDetails
              JSON payload.
            </p>
          </div>

          <div className="simulator-buttons-grid">
            <button
              type="button"
              disabled={isSimulating}
              className="sim-btn sim-bad-request"
              onClick={() => handleSimulate('bad_request')}
            >
              <div className="sim-status">400</div>
              <div className="sim-info">
                <strong>Bad Request Exception</strong>
                <span>Invalid query parameter (page &lt; 0)</span>
              </div>
            </button>

            <button
              type="button"
              disabled={isSimulating}
              className="sim-btn sim-not-found"
              onClick={() => handleSimulate('not_found')}
            >
              <div className="sim-status">404</div>
              <div className="sim-info">
                <strong>Resource Not Found</strong>
                <span>Student ID 9999 does not exist</span>
              </div>
            </button>

            <button
              type="button"
              disabled={isSimulating}
              className="sim-btn sim-validation"
              onClick={() => handleSimulate('validation')}
            >
              <div className="sim-status">422</div>
              <div className="sim-info">
                <strong>Validation Exception</strong>
                <span>Payload constraints violated (age &gt; 150)</span>
              </div>
            </button>

            <button
              type="button"
              disabled={isSimulating}
              className="sim-btn sim-server-error"
              onClick={() => handleSimulate('unhandled')}
            >
              <div className="sim-status">500</div>
              <div className="sim-info">
                <strong>Unhandled RuntimeException</strong>
                <span>Simulated NullPointerException</span>
              </div>
            </button>

            <button
              type="button"
              disabled={isSimulating}
              className="sim-btn sim-database-error"
              onClick={() => handleSimulate('database_timeout')}
            >
              <div className="sim-status">500</div>
              <div className="sim-info">
                <strong>Database Timeout</strong>
                <span>Simulated Connection Pool Exhaustion</span>
              </div>
            </button>
          </div>

          {/* Simulation Output Display */}
          {simulationResult && (
            <div className="sim-output-card">
              <div className="sim-output-head">
                <div className="output-status-pill status-4xx">
                  HTTP Status: {simulationResult.status} (
                  {simulationResult.errorData?.error || 'Exception Handled'})
                </div>
                <div className="output-cid">
                  <span>Correlation ID:</span>
                  <code>{simulationResult.correlationId}</code>
                  <button
                    type="button"
                    className="copy-btn-inline"
                    onClick={() =>
                      copyToClipboard(simulationResult.correlationId, 'sim-cid')
                    }
                  >
                    {copiedId === 'sim-cid' ? <FiCheck /> : <FiCopy />}
                  </button>
                </div>
              </div>

              <div className="sim-output-body">
                <h4>Centralized Exception Response Body:</h4>
                <pre className="json-block">
                  {JSON.stringify(simulationResult.errorData, null, 2)}
                </pre>
              </div>

              <div className="sim-output-footer">
                <FiCheckCircle className="success-icon" />
                <span>
                  The error was captured centrally, tagged with Correlation ID{' '}
                  <code>{simulationResult.correlationId}</code>, and recorded into structured observability logs.
                </span>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    setCorrelationIdFilter(simulationResult.correlationId);
                    setActiveTab('logs');
                  }}
                >
                  View Related Logs &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Spring Boot & Tracing Architecture */}
      {activeTab === 'architecture' && (
        <div className="obs-panel arch-panel">
          <div className="arch-section">
            <h3>Centralized Exception Handling & Tracing Architecture</h3>
            <p>
              In modern distributed microservices and robust backends, two core pillars ensure system reliability and
              debuggability:
            </p>

            <div className="arch-pillars-grid">
              <div className="arch-pillar-card">
                <h4>1. Global Exception Handling (@ControllerAdvice)</h4>
                <ul>
                  <li>Catches all controller-layer and service exceptions in a single unified component.</li>
                  <li>Prevents stack trace leakage to external callers, avoiding security vulnerabilities.</li>
                  <li>Ensures consistent RFC 7807 Problem Details error responses across the entire API.</li>
                  <li>Automatically extracts and logs error context alongside request metadata.</li>
                </ul>
              </div>

              <div className="arch-pillar-card">
                <h4>2. Correlation IDs & Mapped Diagnostic Context (MDC)</h4>
                <ul>
                  <li>Generates or propagates a unique identifier (UUID) per HTTP request.</li>
                  <li>Binds the ID to thread-local storage (SLF4J MDC) in Spring or async context in Node.js.</li>
                  <li>Enables tracing a single user interaction through API gateways, microservices, and databases.</li>
                  <li>Appends the ID to every log line and response header (<code>X-Correlation-ID</code>).</li>
                </ul>
              </div>
            </div>

            <div className="code-comparison">
              <h4>Spring Boot Implementation Reference (@ControllerAdvice):</h4>
              <pre className="java-code-block">
{`@ControllerAdvice
public class ApiExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(
            ResponseStatusException ex, WebRequest req) {

        String correlationId = MDC.get("correlationId");
        logger.warn("[CorrelationId: {}] Handled exception: {}", correlationId, ex.getReason());

        Map<String, Object> body = Map.of(
            "timestamp", Instant.now().toString(),
            "status", ex.getStatusCode().value(),
            "error", HttpStatus.valueOf(ex.getStatusCode().value()).getReasonPhrase(),
            "message", ex.getReason(),
            "correlationId", correlationId,
            "path", req.getDescription(false)
        );
        return ResponseEntity.status(ex.getStatusCode()).body(body);
    }
}`}
              </pre>
            </div>

            <div className="code-comparison">
              <h4>Spring Boot Correlation ID Filter (OncePerRequestFilter with MDC):</h4>
              <pre className="java-code-block">
{`@Component
public class CorrelationIdFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String correlationId = request.getHeader("X-Correlation-ID");
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }
        MDC.put("correlationId", correlationId);
        response.setHeader("X-Correlation-ID", correlationId);
        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove("correlationId"); // Prevent memory leaks in thread pools
        }
    }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
