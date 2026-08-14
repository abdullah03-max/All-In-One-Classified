import React, { useEffect, useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';
import { UnreadMessagesProvider } from './contexts/UnreadMessagesContext';
import { PresenceProvider } from './contexts/PresenceContext';

// Layout
import MainLayout from './components/layout/MainLayout';

// Public Pages
import HomePage from './pages/HomePage';
import ListingsPage from './pages/ListingsPage';
import ListingDetailPage from './pages/ListingDetailPage';
import CategoryPage from './pages/CategoryPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import NotFoundPage from './pages/NotFoundPage';

// Auth Pages
import { LoginPage, RegisterPage, ForgotPasswordPage, AdminLoginPage, ModeratorLoginPage } from './pages/auth/AuthPages';
import { BecomeSellerPage } from './pages/auth/BecomeSellerPage';
import { VerifyOtpPage } from './pages/auth/VerifyOtpPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { ConfirmInvitationPage } from './pages/auth/ConfirmInvitationPage';
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage';

import UnifiedDashboard, {
  MyListingsPage,
  BookmarksPage,
  OffersPage,
  AnalyticsPage,
  NewListingPage,
  EditListingPage,
  UserVerificationPage
} from './pages/dashboard';

// Moderator Pages
import { ModeratorDashboard, PendingListingsPage, ReportsPage, ModeratorPreviewPage, ModeratorPerformancePage, ReportReviewPage, ModeratorMessagesPage } from './pages/moderator/ModeratorPages';

// Admin Pages
import {
  AdminDashboard, AdminListingsPage, AdminUsersPage, AdminPaymentsPage, AdminVerificationPage
} from './pages/admin/AdminPages';
import {
  AdminCategoriesPage, AdminModeratorsPage, AdminAnalyticsPage
} from './pages/admin/AdminPages2';

// Super Admin Pages
import {
  SuperAdminDashboard, SuperAdminManagementPage, SuperAdminAnalyticsPage,
  SystemConfigPage, DatabaseSettingsPage, SuperAdminModeratorsPage
} from './pages/superadmin/SuperAdminPages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

const ScrollToTop: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    // Never scroll the page on the chat route — it manages its own scroll
    if (location.pathname.startsWith('/chat')) return;

    const originalScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';

    const scrollToTop = () => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
    };

    const scrollToHash = () => {
      if (location.hash) {
        const hashId = location.hash.replace('#', '');
        const target = document.getElementById(hashId) || document.querySelector(`[name="${hashId}"]`);
        if (target) {
          target.scrollIntoView({ behavior: 'auto', block: 'start' });
          return;
        }
      }
      scrollToTop();
    };

    scrollToHash();
    requestAnimationFrame(() => {
      scrollToHash();
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
    });
  }, [location.pathname, location.hash]);

  useEffect(() => {
    // Never scroll the page on the chat route
    if (location.pathname.startsWith('/chat')) return;

    const scrollToTop = () => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
    };

    const timer = window.setTimeout(scrollToTop, 0);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);

  return null;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <PresenceProvider>
            <UnreadMessagesProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  borderRadius: '12px',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                },
              }}
            />
            <Routes>
              {/* Auth routes (no layout) */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/login/admin" element={<AdminLoginPage />} />
              <Route path="/login/moderator" element={<ModeratorLoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/verify-otp" element={<VerifyOtpPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/confirm-invitation" element={<ConfirmInvitationPage />} />
              <Route path="/change-password" element={
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
              } />

              {/* Main layout routes */}
              <Route element={<MainLayout />}>
                {/* ============================================================
                    PUBLIC ROUTES
                    ============================================================ */}
                <Route path="/" element={<HomePage />} />
                <Route path="/listings" element={<ListingsPage />} />
                <Route path="/listings/:id" element={<ListingDetailPage />} />
                <Route path="/category/:slug" element={<CategoryPage />} />

                {/* ============================================================
                    PROTECTED ROUTES
                    ============================================================ */}
                <Route path="/profile" element={
                  <ProtectedRoute><ProfilePage /></ProtectedRoute>
                } />
                <Route path="/chat" element={
                  <ProtectedRoute><ChatPage /></ProtectedRoute>
                } />
                <Route path="/become-seller" element={
                  <ProtectedRoute><BecomeSellerPage /></ProtectedRoute>
                } />

                {/* ============================================================
                    UNIFIED USER DASHBOARD ROUTES
                    All routes under /dashboard
                    ============================================================ */}

                {/* Main Dashboard - Overview */}
                <Route path="/dashboard" element={
                  <ProtectedRoute><UnifiedDashboard /></ProtectedRoute>
                } />

                {/* My Listings */}
                <Route path="/dashboard/listings" element={
                  <ProtectedRoute><MyListingsPage /></ProtectedRoute>
                } />

                {/* Post New Ad */}
                <Route path="/dashboard/listings/new" element={
                  <ProtectedRoute><NewListingPage /></ProtectedRoute>
                } />

                {/* Edit Listing */}
                <Route path="/dashboard/listings/:id/edit" element={
                  <ProtectedRoute><EditListingPage /></ProtectedRoute>
                } />

                {/* Saved Listings (Bookmarks) */}
                <Route path="/dashboard/bookmarks" element={
                  <ProtectedRoute><BookmarksPage /></ProtectedRoute>
                } />

                {/* Offers (Both Received & Sent) */}
                <Route path="/dashboard/offers" element={
                  <ProtectedRoute><OffersPage /></ProtectedRoute>
                } />

                {/* Analytics */}
                <Route path="/dashboard/analytics" element={
                  <ProtectedRoute><AnalyticsPage /></ProtectedRoute>
                } />

                {/* Account Verification */}
                <Route path="/dashboard/verification" element={
                  <ProtectedRoute><UserVerificationPage /></ProtectedRoute>
                } />

                {/* ============================================================
                    MODERATOR ROUTES
                    ============================================================ */}
                <Route path="/moderator" element={
                  <ProtectedRoute allowedRoles={['moderator', 'super_admin']}>
                    <ModeratorDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/moderator/pending" element={
                  <ProtectedRoute allowedRoles={['moderator', 'super_admin']}>
                    <PendingListingsPage />
                  </ProtectedRoute>
                } />
                <Route path="/moderator/reports" element={
                  <ProtectedRoute allowedRoles={['moderator', 'super_admin']}>
                    <ReportsPage />
                  </ProtectedRoute>
                } />
                <Route path="/moderator/preview/:id" element={
                  <ProtectedRoute allowedRoles={['moderator', 'super_admin']}>
                    <ModeratorPreviewPage />
                  </ProtectedRoute>
                } />
                <Route path="/moderator/report/:id" element={
                  <ProtectedRoute allowedRoles={['moderator', 'super_admin']}>
                    <ReportReviewPage />
                  </ProtectedRoute>
                } />
                <Route path="/moderator/messages" element={
                  <ProtectedRoute allowedRoles={['moderator', 'super_admin']}>
                    <ModeratorMessagesPage />
                  </ProtectedRoute>
                } />
                <Route path="/moderator/performance" element={
                  <ProtectedRoute allowedRoles={['moderator', 'super_admin']}>
                    <ModeratorPerformancePage />
                  </ProtectedRoute>
                } />

                {/* ============================================================
                    ADMIN ROUTES
                    ============================================================ */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/listings" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <AdminListingsPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/verifications" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <AdminVerificationPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/payments" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminPaymentsPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/categories" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <AdminCategoriesPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/moderators" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <AdminModeratorsPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/analytics" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <AdminAnalyticsPage />
                  </ProtectedRoute>
                } />

                {/* ============================================================
                    SUPER ADMIN ROUTES
                    ============================================================ */}
                <Route path="/superadmin" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/superadmin/admins" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <SuperAdminManagementPage />
                  </ProtectedRoute>
                } />
                <Route path="/superadmin/moderators" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <SuperAdminModeratorsPage />
                  </ProtectedRoute>
                } />
                <Route path="/superadmin/users" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                } />
                <Route path="/superadmin/listings" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminListingsPage />
                  </ProtectedRoute>
                } />
                <Route path="/superadmin/categories" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminCategoriesPage />
                  </ProtectedRoute>
                } />
                <Route path="/superadmin/payments" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminPaymentsPage />
                  </ProtectedRoute>
                } />
                <Route path="/superadmin/analytics" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <SuperAdminAnalyticsPage />
                  </ProtectedRoute>
                } />
                <Route path="/superadmin/config" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <SystemConfigPage />
                  </ProtectedRoute>
                } />
                <Route path="/superadmin/database" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <DatabaseSettingsPage />
                  </ProtectedRoute>
                } />

                {/* ============================================================
                    BACKWARDS COMPATIBILITY REDIRECTS
                    Old routes redirect to unified dashboard
                    ============================================================ */}

                {/* Old Buyer routes */}
                <Route path="/buyer" element={<Navigate to="/dashboard" replace />} />
                <Route path="/buyer/bookmarks" element={<Navigate to="/dashboard/bookmarks" replace />} />
                <Route path="/buyer/offers" element={<Navigate to="/dashboard/offers" replace />} />

                {/* Old Seller routes */}
                <Route path="/seller" element={<Navigate to="/dashboard" replace />} />
                <Route path="/seller/listings" element={<Navigate to="/dashboard/listings" replace />} />
                <Route path="/seller/listings/new" element={<Navigate to="/dashboard/listings/new" replace />} />
                <Route path="/seller/listings/:id/edit" element={<Navigate to="/dashboard/listings/:id/edit" replace />} />
                <Route path="/seller/offers" element={<Navigate to="/dashboard/offers" replace />} />
                <Route path="/seller/analytics" element={<Navigate to="/dashboard/analytics" replace />} />

                {/* 404 Not Found - Must be last */}
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
          </UnreadMessagesProvider>
          </PresenceProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;