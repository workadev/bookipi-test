import Head from 'next/head';
import { useState, useEffect } from 'react';
import { purchaseService } from '../services/api';
import withAuth from '../components/withAuth';

function MyPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPurchases() {
      try {
        const data = await purchaseService.getUserPurchases();
        setPurchases(data);
      } catch (err) {
        console.error('Error fetching purchases:', err);
        setError('Failed to load purchase history');
      } finally {
        setLoading(false);
      }
    }

    fetchPurchases();
  }, []);

  return (
    <div className="container mx-auto px-4">
      <Head>
        <title>My Purchases - BookiPi Shop</title>
      </Head>

      <h1 className="text-3xl font-bold mb-6">My Purchase History</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-xl text-gray-600">Loading purchase history...</div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : purchases.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-600">You haven't made any purchases yet.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {purchases.map((purchase) => (
              <li key={purchase.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-medium text-gray-900 truncate">
                      {purchase.product_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Purchase ID: {purchase.id}
                    </p>
                    <p className="text-sm text-gray-500">
                      Date: {new Date(purchase.purchase_date).toLocaleDateString()}
                    </p>
                    {purchase.flash_sale_id && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                        Flash Sale: {purchase.flash_sale_name}
                      </span>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0 flex flex-col items-end">
                    <span className="text-lg font-medium text-gray-900">
                      ${Number(purchase.purchase_price).toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Qty: {purchase.quantity}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      purchase.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {purchase.status}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default withAuth(MyPurchases);
