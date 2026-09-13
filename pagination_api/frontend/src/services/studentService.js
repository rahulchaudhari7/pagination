import axios from 'axios';

const API_URL = 'http://localhost:8080/api/students';

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

  return response.data;
};

export const createStudent = async (student) => {
  const response = await axios.post(API_URL, student);
  return response.data;
};
