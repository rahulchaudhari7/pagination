import axios from 'axios';

const API_URL = '/api/students';
const OBSERVABILITY_URL = '/api/observability';

export const fetchStudents = async ({ page = 0, size = 10, sortBy = 'id', direction = 'asc', search = '' }) => {
  const response = await axios.get(API_URL, {
    params: {
      page,
      size,
      sortBy,
      direction,
      search,
    },
  });

  return {
    ...response.data,
    correlationId: response.headers['x-correlation-id'] || response.headers['x-request-id'],
  };
};

export const createStudent = async (student) => {
  const response = await axios.post(API_URL, student);
  return {
    ...response.data,
    correlationId: response.headers['x-correlation-id'] || response.headers['x-request-id'],
  };
};

export const fetchStudentById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return {
    ...response.data,
    correlationId: response.headers['x-correlation-id'] || response.headers['x-request-id'],
  };
};

export const updateStudent = async (id, student) => {
  const response = await axios.put(`${API_URL}/${id}`, student);
  return {
    ...response.data,
    correlationId: response.headers['x-correlation-id'] || response.headers['x-request-id'],
  };
};

export const deleteStudent = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return {
    ...response.data,
    correlationId: response.headers['x-correlation-id'] || response.headers['x-request-id'],
  };
};

export const fetchObservabilityLogs = async ({ level, correlationId, search } = {}) => {
  const response = await axios.get(`${OBSERVABILITY_URL}/logs`, {
    params: { level, correlationId, search },
  });
  return response.data;
};

export const clearObservabilityLogs = async () => {
  const response = await axios.delete(`${OBSERVABILITY_URL}/logs`);
  return response.data;
};

export const simulateException = async (type) => {
  try {
    const response = await axios.post(`${OBSERVABILITY_URL}/simulate-error`, { type });
    return {
      success: true,
      data: response.data,
      correlationId: response.headers['x-correlation-id'],
    };
  } catch (err) {
    return {
      success: false,
      status: err.response?.status || 500,
      errorData: err.response?.data || { message: err.message },
      correlationId: err.response?.headers?.['x-correlation-id'] || err.response?.data?.correlationId,
    };
  }
};
