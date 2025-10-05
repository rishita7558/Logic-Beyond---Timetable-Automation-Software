import axios from 'axios'

export const api = axios.create({ 
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.config?.url, error.response?.data)
    return Promise.reject(error)
  }
)

export const uploadCSV = (path: string, file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(path, form)
}

export const createTimetable = (name: string) => api.post('/timetables/', { name })
export const generateTimetable = (id: number) => api.post(`/timetables/${id}/generate/`)
export const rescheduleTimetable = (id: number) => api.post(`/timetables/${id}/reschedule/`)
export const syncCalendar = (id: number) => api.post(`/timetables/${id}/sync-calendar/`)
export const getTimetableData = (id: number) => api.get(`/timetables/${id}/data/`)
export const getTimetableSections = (id: number) => api.get(`/timetables/${id}/sections/`)
export const checkTimetableConflicts = (id: number) => api.get(`/timetables/${id}/conflicts/`)
export const optimizeTimetable = (id: number) => api.post(`/timetables/${id}/optimize/`)
export const exportTimetablePDF = (id: number) => `/api/timetables/${id}/export/`
export const clearTimetable = (id: number) => api.delete(`/timetables/${id}/clear/`)
export const getTimetableStatistics = (id: number) => api.get(`/timetables/${id}/statistics/`)

export const generateExams = () => api.post('/exams/generate/')
export const generateSeating = (id: number) => api.post(`/exams/${id}/generate-seating/`)
export const seatingPdfUrl = (id: number) => `/api/exams/${id}/export-seating-pdf/`


