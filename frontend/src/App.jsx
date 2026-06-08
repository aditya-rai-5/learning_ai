import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
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
import CourseCatalog from './pages/courses/CourseCatalog'
import CourseDetail from './pages/courses/CourseDetail'
import CoursePlayer from './pages/courses/CoursePlayer'
import Community from './pages/community/Community'
import ThreadDetail from './pages/community/ThreadDetail'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public (Navbar + Footer) ── */}
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="courses" element={<CourseCatalog />} />
            <Route path="courses/:identifier" element={<CourseDetail />} />
            <Route path="community" element={<Community />} />
            <Route path="community/:id" element={<ThreadDetail />} />
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
              <Route path="my-courses" element={<div className="p-6 text-gray-500">My Courses — coming soon</div>} />
              <Route path="learning-paths" element={<div className="p-6 text-gray-500">Learning Paths — coming soon</div>} />
              <Route path="bookmarks" element={<Bookmarks />} />
              <Route path="profile" element={<div className="p-6 text-gray-500">Profile — coming soon</div>} />
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
  )
}