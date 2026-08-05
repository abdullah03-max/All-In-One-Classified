import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const MainLayout: React.FC = () => {
  const location = useLocation();
  const showFooter = !location.pathname.startsWith('/admin') && 
                     !location.pathname.startsWith('/moderator') &&
                     !location.pathname.startsWith('/superadmin');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default MainLayout;
