import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// Exception Hierarchy (Equiv. to Spring Exceptions)
// ==========================================
export class ApiException extends Error {
  statusCode: number;
  error: string;
  details?: any;

  constructor(message: string, statusCode: number, error: string, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.error = error;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestException extends ApiException {
  constructor(message: string, details?: any) {
    super(message, 400, 'Bad Request', details);
  }
}

export class ResourceNotFoundException extends ApiException {
  constructor(resource: string, id: string | number) {
    super(`${resource} with ID '${id}' not found`, 404, 'Not Found', { resource, id });
  }
}

export class ValidationException extends ApiException {
  constructor(message: string, validationErrors: Array<{ field: string; message: string }>) {
    super(message, 422, 'Unprocessable Entity', { validationErrors });
  }
}

export class InternalServerException extends ApiException {
  constructor(message: string = 'Internal server processing error') {
    super(message, 500, 'Internal Server Error');
  }
}

// ==========================================
// Structured Logging & Observability Storage
// ==========================================
export interface StructuredLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  correlationId: string;
  method: string;
  url: string;
  route: string;
  statusCode: number;
  durationMs: number;
  clientIp: string;
  userAgent: string;
  message: string;
  details?: any;
  exception?: {
    type: string;
    message: string;
    details?: any;
    stack?: string;
  };
}

const MAX_LOGS = 200;
const logStore: StructuredLog[] = [];

function addStructuredLog(log: StructuredLog) {
  logStore.unshift(log);
  if (logStore.length > MAX_LOGS) {
    logStore.pop();
  }
  // Standard structured JSON output to stdout/stderr (e.g. for Datadog, GCP Cloud Logging, ELK)
  const logString = JSON.stringify(log);
  if (log.level === 'ERROR') {
    console.error(logString);
  } else if (log.level === 'WARN') {
    console.warn(logString);
  } else {
    console.log(logString);
  }
}

// In-Memory Student Database
interface Student {
  id: string;
  name: string;
  email: string;
  age: number;
  course: string;
}

const students: Student[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice.johnson@university.edu', age: 20, course: 'Computer Science' },
  { id: '2', name: 'Bob Smith', email: 'bob.smith@university.edu', age: 22, course: 'Mathematics' },
  { id: '3', name: 'Charlie Brown', email: 'charlie.brown@university.edu', age: 19, course: 'Physics' },
  { id: '4', name: 'Diana Prince', email: 'diana.prince@university.edu', age: 21, course: 'Electrical Engineering' },
  { id: '5', name: 'Ethan Hunt', email: 'ethan.hunt@university.edu', age: 23, course: 'Mechanical Engineering' },
  { id: '6', name: 'Fiona Gallagher', email: 'fiona.gallagher@university.edu', age: 20, course: 'Chemistry' },
  { id: '7', name: 'George Clark', email: 'george.clark@university.edu', age: 24, course: 'Economics' },
  { id: '8', name: 'Hannah Abbott', email: 'hannah.abbott@university.edu', age: 19, course: 'Biology' },
  { id: '9', name: 'Ian Malcolm', email: 'ian.malcolm@university.edu', age: 22, course: 'Computer Science' },
  { id: '10', name: 'Julia Roberts', email: 'julia.roberts@university.edu', age: 21, course: 'Literature' },
  { id: '11', name: 'Kevin Bacon', email: 'kevin.bacon@university.edu', age: 23, course: 'History' },
  { id: '12', name: 'Laura Croft', email: 'laura.croft@university.edu', age: 20, course: 'Archaeology' },
  { id: '13', name: 'Michael Scott', email: 'michael.scott@dunder.edu', age: 25, course: 'Business Administration' },
  { id: '14', name: 'Nancy Wheeler', email: 'nancy.wheeler@university.edu', age: 19, course: 'Journalism' },
  { id: '15', name: 'Oscar Martinez', email: 'oscar.martinez@university.edu', age: 22, course: 'Accounting' },
  { id: '16', name: 'Pam Beesly', email: 'pam.beesly@university.edu', age: 21, course: 'Fine Arts' },
  { id: '17', name: 'Quinn Fabray', email: 'quinn.fabray@university.edu', age: 20, course: 'Psychology' },
  { id: '18', name: 'Ron Weasley', email: 'ron.weasley@hogwarts.edu', age: 19, course: 'Astronomy' },
  { id: '19', name: 'Sarah Connor', email: 'sarah.connor@university.edu', age: 24, course: 'Philosophy' },
  { id: '20', name: 'Thomas Shelby', email: 'thomas.shelby@birmingham.edu', age: 23, course: 'Political Science' },
  { id: '21', name: 'Uma Thurman', email: 'uma.thurman@university.edu', age: 22, course: 'Drama & Film' },
  { id: '22', name: 'Victor Stone', email: 'victor.stone@university.edu', age: 21, course: 'Robotics' },
  { id: '23', name: 'Wanda Maximoff', email: 'wanda.maximoff@university.edu', age: 20, course: 'Biochemistry' },
  { id: '24', name: 'Xavier Thorpe', email: 'xavier.thorpe@nevermore.edu', age: 19, course: 'Art History' },
  { id: '25', name: 'Yara Greyjoy', email: 'yara.greyjoy@university.edu', age: 23, course: 'Marine Science' },
  { id: '26', name: 'Zachary Levi', email: 'zachary.levi@university.edu', age: 22, course: 'Communications' }
];

let nextStudentId = 27;

// Request metrics
let requestCount = 0;
let errorCount = 0;
let totalLatencyMs = 0;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ==========================================
  // 0. Secure Cross-Origin Resource Sharing (CORS)
  // ==========================================
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Correlation-ID, X-Request-ID');
    res.setHeader('Access-Control-Expose-Headers', 'X-Correlation-ID, X-Request-ID');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // ==========================================
  // 1. Correlation ID Middleware (Tracing)
  // ==========================================
  // Inspects incoming X-Correlation-ID / X-Request-ID or generates a UUID v4
  app.use((req: Request, res: Response, next: NextFunction) => {
    const rawCorrelationId = req.headers['x-correlation-id'] || req.headers['x-request-id'];
    const correlationId = (typeof rawCorrelationId === 'string' && rawCorrelationId.trim())
      ? rawCorrelationId.trim()
      : crypto.randomUUID();

    // Attach to request context
    (req as any).correlationId = correlationId;
    (req as any).startTime = process.hrtime.bigint();

    // Reflect correlation ID in response headers for end-to-end client tracing
    res.setHeader('X-Correlation-ID', correlationId);
    res.setHeader('X-Request-ID', correlationId);

    next();
  });

  // ==========================================
  // 2. Structured Request Logging Middleware
  // ==========================================
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Skip logging static asset and vite internal requests to keep observability feed clean
    const isApiRequest = req.path.startsWith('/api/');

    res.on('finish', () => {
      if (!isApiRequest) return;

      const startTime = (req as any).startTime as bigint;
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;

      requestCount++;
      totalLatencyMs += durationMs;
      if (res.statusCode >= 400) {
        errorCount++;
      }

      const correlationId = (req as any).correlationId || 'unknown';
      const level: 'INFO' | 'WARN' | 'ERROR' =
        res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';

      const log: StructuredLog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        level,
        correlationId,
        method: req.method,
        url: req.originalUrl,
        route: req.route?.path || req.path,
        statusCode: res.statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
        clientIp: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'unknown',
        message: `HTTP ${req.method} ${req.originalUrl} responded with ${res.statusCode} in ${durationMs.toFixed(2)}ms`,
        details: {
          query: req.query,
          params: req.params,
        },
      };

      addStructuredLog(log);
    });

    next();
  });

  // ==========================================
  // API Routes
  // ==========================================

  // GET /api/students
  app.get('/api/students', (req: Request, res: Response, next: NextFunction) => {
    try {
      const pageStr = req.query.page as string || '0';
      const sizeStr = req.query.size as string || '10';
      const sortBy = (req.query.sortBy as string || 'id').trim();
      const direction = (req.query.direction as string || 'asc').trim().toLowerCase();
      const search = ((req.query.search as string) || '').trim().toLowerCase();

      const page = parseInt(pageStr, 10);
      const size = parseInt(sizeStr, 10);

      // Controlled validation with specific bad request exceptions
      if (isNaN(page) || page < 0) {
        throw new BadRequestException('page must be greater than or equal to 0', {
          parameter: 'page',
          received: pageStr,
        });
      }
      if (isNaN(size) || size < 1 || size > 100) {
        throw new BadRequestException('size must be between 1 and 100', {
          parameter: 'size',
          received: sizeStr,
          min: 1,
          max: 100,
        });
      }
      const validSortFields = ['id', 'name', 'age', 'course'];
      if (!validSortFields.includes(sortBy)) {
        throw new BadRequestException(`sortBy must be one of: ${validSortFields.join(', ')}`, {
          parameter: 'sortBy',
          received: sortBy,
          allowed: validSortFields,
        });
      }
      if (direction !== 'asc' && direction !== 'desc') {
        throw new BadRequestException("direction must be either 'asc' or 'desc'", {
          parameter: 'direction',
          received: direction,
          allowed: ['asc', 'desc'],
        });
      }

      // Filter
      let filtered = students;
      if (search.length > 0) {
        filtered = students.filter(s =>
          s.name.toLowerCase().includes(search) ||
          s.course.toLowerCase().includes(search) ||
          s.id.toLowerCase().includes(search)
        );
      }

      // Sort
      const sorted = [...filtered].sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'id') {
          const numA = parseInt(a.id, 10);
          const numB = parseInt(b.id, 10);
          if (!isNaN(numA) && !isNaN(numB)) {
            comparison = numA - numB;
          } else {
            comparison = a.id.localeCompare(b.id);
          }
        } else if (sortBy === 'age') {
          comparison = a.age - b.age;
        } else if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortBy === 'course') {
          comparison = a.course.localeCompare(b.course);
        }
        return direction === 'desc' ? -comparison : comparison;
      });

      const totalElements = sorted.length;
      const totalPages = Math.ceil(totalElements / size);
      const startIdx = page * size;
      const content = sorted.slice(startIdx, startIdx + size);

      return res.json({
        content,
        pageable: {
          pageNumber: page,
          pageSize: size,
          sort: {
            sorted: true,
            unsorted: false,
            empty: false,
          },
          offset: startIdx,
          paged: true,
          unpaged: false,
        },
        totalElements,
        totalPages,
        last: page >= totalPages - 1,
        size,
        number: page,
        sort: {
          sorted: true,
          unsorted: false,
          empty: false,
        },
        numberOfElements: content.length,
        first: page === 0,
        empty: content.length === 0,
      });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/students/:id
  app.get('/api/students/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = String(req.params.id);
      const student = students.find(s => s.id === studentId);
      if (!student) {
        throw new ResourceNotFoundException('Student', studentId);
      }
      return res.json(student);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/students (Create Student - RESTful API with Bean Validation)
  app.post('/api/students', (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, age, course } = req.body || {};
      const validationErrors: Array<{ field: string; message: string }> = [];

      if (!name || typeof name !== 'string' || !name.trim()) {
        validationErrors.push({ field: 'name', message: 'Name is required and cannot be empty' });
      } else if (name.trim().length < 2 || name.trim().length > 50) {
        validationErrors.push({ field: 'name', message: 'Name must be between 2 and 50 characters long' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const effectiveEmail = email && typeof email === 'string' && email.trim()
        ? email.trim()
        : `${(name || 'student').trim().toLowerCase().replace(/\s+/g, '.')}@university.edu`;

      if (email && !emailRegex.test(email.trim())) {
        validationErrors.push({ field: 'email', message: 'Email must be a valid email address (e.g. user@domain.com)' });
      }

      const numAge = Number(age);
      if (age === undefined || age === null || isNaN(numAge)) {
        validationErrors.push({ field: 'age', message: 'Age is required and must be a number' });
      } else if (numAge < 1 || numAge > 150) {
        validationErrors.push({ field: 'age', message: 'Age must be between 1 and 150 years' });
      }

      if (!course || typeof course !== 'string' || !course.trim()) {
        validationErrors.push({ field: 'course', message: 'Course is required and cannot be empty' });
      }

      if (validationErrors.length > 0) {
        throw new ValidationException('Validation failed for student creation payload', validationErrors);
      }

      const newStudent: Student = {
        id: String(nextStudentId++),
        name: name.trim(),
        email: effectiveEmail,
        age: numAge,
        course: course.trim(),
      };

      students.unshift(newStudent);
      return res.status(201).json(newStudent);
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/students/:id (Update Student - RESTful API with Bean Validation)
  app.put('/api/students/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = String(req.params.id);
      const studentIndex = students.findIndex(s => s.id === studentId);
      if (studentIndex === -1) {
        throw new ResourceNotFoundException('Student', studentId);
      }

      const { name, email, age, course } = req.body || {};
      const validationErrors: Array<{ field: string; message: string }> = [];

      if (!name || typeof name !== 'string' || !name.trim()) {
        validationErrors.push({ field: 'name', message: 'Name is required and cannot be empty' });
      } else if (name.trim().length < 2 || name.trim().length > 50) {
        validationErrors.push({ field: 'name', message: 'Name must be between 2 and 50 characters long' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && !emailRegex.test(String(email).trim())) {
        validationErrors.push({ field: 'email', message: 'Email must be a valid email address' });
      }

      const numAge = Number(age);
      if (age === undefined || age === null || isNaN(numAge)) {
        validationErrors.push({ field: 'age', message: 'Age is required and must be a number' });
      } else if (numAge < 1 || numAge > 150) {
        validationErrors.push({ field: 'age', message: 'Age must be between 1 and 150 years' });
      }

      if (!course || typeof course !== 'string' || !course.trim()) {
        validationErrors.push({ field: 'course', message: 'Course is required and cannot be empty' });
      }

      if (validationErrors.length > 0) {
        throw new ValidationException('Validation failed for student update payload', validationErrors);
      }

      const updatedStudent: Student = {
        ...students[studentIndex],
        name: name.trim(),
        email: email ? String(email).trim() : students[studentIndex].email,
        age: numAge,
        course: course.trim(),
      };

      students[studentIndex] = updatedStudent;
      return res.status(200).json(updatedStudent);
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/students/:id (Delete Student - RESTful API)
  app.delete('/api/students/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = String(req.params.id);
      const studentIndex = students.findIndex(s => s.id === studentId);
      if (studentIndex === -1) {
        throw new ResourceNotFoundException('Student', studentId);
      }

      const deletedStudent = students.splice(studentIndex, 1)[0];
      return res.status(200).json({
        success: true,
        message: `Student '${deletedStudent.name}' (ID: ${studentId}) was deleted successfully.`,
        deletedStudent,
      });
    } catch (err) {
      next(err);
    }
  });

  // ==========================================
  // Observability & Log Management Endpoints
  // ==========================================

  // GET /api/observability/logs
  app.get('/api/observability/logs', (req: Request, res: Response) => {
    const level = req.query.level as string;
    const correlationId = req.query.correlationId as string;
    const search = req.query.search as string;

    let filtered = logStore;
    if (level) {
      filtered = filtered.filter(l => l.level === level.toUpperCase());
    }
    if (correlationId) {
      filtered = filtered.filter(l => l.correlationId.toLowerCase().includes(correlationId.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(l =>
        l.message.toLowerCase().includes(q) ||
        l.url.toLowerCase().includes(q) ||
        l.correlationId.toLowerCase().includes(q)
      );
    }

    return res.json({
      total: filtered.length,
      limit: MAX_LOGS,
      logs: filtered,
      stats: {
        totalRequests: requestCount,
        errorCount,
        averageLatencyMs: requestCount > 0 ? Math.round((totalLatencyMs / requestCount) * 100) / 100 : 0,
        activeCorrelationId: (req as any).correlationId,
      },
    });
  });

  // DELETE /api/observability/logs
  app.delete('/api/observability/logs', (_req: Request, res: Response) => {
    logStore.length = 0;
    return res.json({ message: 'Observability logs cleared successfully' });
  });

  // ==========================================
  // Exception Simulation Suite (for verification & testing)
  // ==========================================

  // POST /api/observability/simulate-error
  app.post('/api/observability/simulate-error', (req: Request, _res: Response, next: NextFunction) => {
    const type = req.body?.type || 'bad_request';

    try {
      switch (type) {
        case 'bad_request':
          throw new BadRequestException("Invalid pagination parameters: 'page=-5' is not acceptable", {
            parameter: 'page',
            value: -5,
            constraint: 'page >= 0',
          });
        case 'not_found':
          throw new ResourceNotFoundException('Student', '9999');
        case 'validation':
          throw new ValidationException('Student entity validation constraints violated', [
            { field: 'age', message: 'Age 185 exceeds the maximum allowed age of 150' },
            { field: 'course', message: 'Course field must not be blank' },
          ]);
        case 'unhandled':
          // Simulate an unexpected uncaught error / runtime exception
          throw new Error('Simulated unhandled RuntimeException (NullPointerException in StudentDataProcessor)');
        case 'database_timeout':
          throw new InternalServerException('Database connection pool timeout while acquiring connection');
        default:
          throw new BadRequestException(`Unknown simulation error type: '${type}'`);
      }
    } catch (err) {
      next(err);
    }
  });

  // ==========================================
  // 3. Centralized Global Exception Handler
  // (Direct equivalent to Spring's @ControllerAdvice)
  // ==========================================
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const correlationId = (req as any).correlationId || crypto.randomUUID();
    const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
    const errorTitle = err.error || (statusCode === 500 ? 'Internal Server Error' : 'Application Error');

    // Standardized RFC 7807 ProblemDetails / Spring Boot ErrorResponse payload
    const errorPayload = {
      timestamp: new Date().toISOString(),
      status: statusCode,
      error: errorTitle,
      message: err.message || 'An unexpected server error occurred',
      correlationId,
      path: req.originalUrl,
      details: err.details || null,
    };

    // Attach exception details to structured log
    const startTime = (req as any).startTime as bigint;
    const endTime = process.hrtime.bigint();
    const durationMs = startTime ? Number(endTime - startTime) / 1_000_000 : 0;

    const errorLog: StructuredLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level: statusCode >= 500 ? 'ERROR' : 'WARN',
      correlationId,
      method: req.method,
      url: req.originalUrl,
      route: req.route?.path || req.path,
      statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      clientIp: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'unknown',
      message: `[GlobalExceptionHandler] ${err.name || 'Error'}: ${err.message}`,
      exception: {
        type: err.name || 'Error',
        message: err.message,
        details: err.details,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
      },
    };

    addStructuredLog(errorLog);

    return res.status(statusCode).json(errorPayload);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
