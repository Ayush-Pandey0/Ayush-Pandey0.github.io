import axios from 'axios';

const api = axios.create({
  baseURL: 'https://atlas-arrow-backend.onrender.com/api',
});

export default api;