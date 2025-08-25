import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import withAuth from '../../components/withAuth';

function AdminDashboard() {
  const router = useRouter();
  
  const menuItems = [
    { name: 'Products', href: '/admin/products', icon: '📦' },
    { name: 'Flash Sales', href: '/admin/flash-sales', icon: '⚡' },
    { name: 'Users', href: '/admin/users', icon: '👤' },
  ];

  return (
    <div className="container mx-auto px-4">
      <Head>
        <title>Admin Dashboard - BookiPi Shop</title>
      </Head>

      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h2 className="text-2xl font-semibold text-gray-900">{item.name}</h2>
              <p className="mt-2 text-sm text-gray-500">
                Manage your {item.name.toLowerCase()}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default withAuth(AdminDashboard, { requireAdmin: true });
