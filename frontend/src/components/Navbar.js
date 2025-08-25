import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const router = useRouter();

  return (
    <nav className="bg-primary-600 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link 
              href="/"
              className="flex items-center text-white font-bold text-xl"
            >
              Bookipi Shop
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link 
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  router.pathname === '/'
                    ? 'bg-primary-700 text-white'
                    : 'text-primary-100 hover:bg-primary-500'
                }`}
              >
                Home
              </Link>

              {isAuthenticated && (
                <Link 
                  href="/my-purchases"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    router.pathname === '/my-purchases'
                      ? 'bg-primary-700 text-white'
                      : 'text-primary-100 hover:bg-primary-500'
                  }`}
                >
                  My Purchases
                </Link>
              )}

              {isAdmin && (
                <Link 
                  href="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    router.pathname.startsWith('/admin')
                      ? 'bg-primary-700 text-white'
                      : 'text-primary-100 hover:bg-primary-500'
                  }`}
                >
                  Admin Dashboard
                </Link>
              )}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {isAuthenticated ? (
                <div className="flex items-center">
                  <span className="text-primary-100 mr-4">
                    Welcome, {user?.username}
                  </span>
                  <button
                    onClick={logout}
                    className="bg-primary-700 px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-primary-800"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link 
                  href="/login"
                  className="bg-primary-700 px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-primary-800"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
