import { createBrowserRouter } from 'react-router-dom'
import App from '../App'

export const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/onboarding', element: <App /> },
  { path: '/dashboard', element: <App /> },
  { path: '/habits', element: <App /> },
  { path: '/habits/:habitId', element: <App /> },
  { path: '/journal', element: <App /> },
  { path: '/urges', element: <App /> },
  { path: '/statistics', element: <App /> },
  { path: '/settings', element: <App /> },
])
