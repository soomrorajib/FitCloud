import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PublicLayout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]); // naya page upar se shuru ho

  return (
    <>
      <Navbar />
      <main><Outlet /></main>
      <Footer />
    </>
  );
}
