import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'
import { AdminLayout } from './components/admin/AdminLayout'
import { useAuth } from './context/AuthContext'
import { useDevToolsProtection } from './hooks/useDevToolsProtection'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { SignUpPage } from './pages/SignUpPage'
import { PostListPage } from './pages/PostListPage'
import { UserGridPage } from './pages/UserGridPage'
import { ProfilePage } from './pages/ProfilePage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminUserListPage } from './pages/admin/AdminUserListPage'
import { AdminGroupsPage } from './pages/admin/AdminGroupsPage'
import { AdminPostListPage } from './pages/admin/AdminPostListPage'
import { PostCreatePage } from './pages/PostCreatePage'
import { GroupListPage } from './pages/GroupListPage'
import { GroupDetailPage } from './pages/GroupDetailPage'
import { GroupCreatePage } from './pages/GroupCreatePage'
import { NewGroupsPage } from './pages/NewGroupsPage'
import { PopularGroupsPage } from './pages/PopularGroupsPage'

function App() {
  const { isAuthenticated } = useAuth()
  useDevToolsProtection()

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/app" replace /> : <LoginPage />}
      />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<GroupListPage />} />
        <Route path="/app/posts" element={<PostListPage />} />
        <Route path="/app/posts/new" element={<PostCreatePage />} />
        <Route element={<AdminRoute />}>
          <Route path="/app/users" element={<UserGridPage />} />
        </Route>
        <Route path="/app/groups" element={<GroupListPage />} />
        <Route path="/app/groups/new" element={<GroupCreatePage />} />
        <Route path="/app/groups/recent" element={<NewGroupsPage />} />
        <Route path="/app/groups/popular" element={<PopularGroupsPage />} />
        <Route path="/app/groups/:groupId" element={<GroupDetailPage />} />
        <Route path="/app/profile" element={<ProfilePage />} />
        <Route path="/app/profile/:username" element={<ProfilePage />} />
        <Route path="/app/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUserListPage />} />
          <Route path="groups" element={<AdminGroupsPage />} />
          <Route path="posts" element={<AdminPostListPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
