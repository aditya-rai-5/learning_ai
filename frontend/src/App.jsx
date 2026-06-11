import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProtectedRoute, GuestRoute } from './components/RoleRoute'

import PublicLayout from './layouts/PublicLayout'
import AuthLayout from './layouts/AuthLayout'
import StudentDashboardLayout from './layouts/StudentDashboardLayout'
import CoursePlayerLayout from './layouts/CoursePlayerLayout'

import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/dashboard/Dashboard'
import Bookmarks from './pages/dashboard/Bookmarks'
import Certificates from './pages/dashboard/Certificates'
import MyCourses from './pages/dashboard/MyCourses'
import Profile from './pages/dashboard/Profile'
import LearningPaths from './pages/learning_paths/LearningPaths'
import LearningPathDetail from './pages/learning_paths/LearningPathDetail'
import CourseCatalog from './pages/courses/CourseCatalog'
import CourseDetail from './pages/courses/CourseDetail'
import CoursePlayer from './pages/courses/CoursePlayer'
import Community from './pages/community/Community'
import ThreadDetail from './pages/community/ThreadDetail'
import NotFound from './pages/NotFound'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors />
          <Routes>
          {/* ── Public (Navbar + Footer) ── */}
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="courses" element={<CourseCatalog />} />
            <Route path="courses/:identifier" element={<CourseDetail />} />
          </Route>

          {/* ── Auth (clean card, guests only) ── */}
          <Route element={<GuestRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
            </Route>
          </Route>

          {/* ── Protected Routes ── */}
          <Route element={<ProtectedRoute />}>
            {/* Student dashboard (sidebar + header) */}
            <Route element={<StudentDashboardLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="my-courses" element={<MyCourses />} />
              <Route path="learning-paths" element={<LearningPaths />} />
              <Route path="learning-paths/:pathId" element={<LearningPathDetail />} />
              <Route path="certificates" element={<Certificates />} />
              <Route path="bookmarks" element={<Bookmarks />} />
              <Route path="community" element={<Community />} />
              <Route path="community/:id" element={<ThreadDetail />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Course player (distraction-free) */}
            <Route element={<CoursePlayerLayout />}>
              <Route path="learn/:courseId" element={<CoursePlayer />} />
              <Route path="learn/:courseId/module/:moduleId" element={<CoursePlayer />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
        </AuthProvider>
        </ThemeProvider>
        </QueryClientProvider>
        )
        }