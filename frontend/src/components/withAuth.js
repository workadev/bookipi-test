import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function withAuth(Component, { requireAdmin = false } = {}) {
  return function AuthenticatedComponent(props) {
    const { user, loading, isAuthenticated, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        // If not authenticated, redirect to login
        if (!isAuthenticated) {
          router.replace('/login');
        } 
        // If admin required but user is not admin
        else if (requireAdmin && !isAdmin) {
          router.replace('/');
        }
      }
    }, [loading, isAuthenticated, isAdmin, router]);

    // Show nothing while loading or redirecting
    if (loading || !isAuthenticated || (requireAdmin && !isAdmin)) {
      return null;
    }

    // If authenticated (and admin if required), render the component
    return <Component {...props} />;
  };
}
