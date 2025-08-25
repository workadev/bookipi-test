import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { FlashSaleProvider } from '../context/FlashSaleContext';
import { Toaster } from 'react-hot-toast';
import Navbar from '../components/Navbar';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <FlashSaleProvider>
        <Toaster position="top-right" />
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <Component {...pageProps} />
          </main>
        </div>
      </FlashSaleProvider>
    </AuthProvider>
  );
}

export default MyApp;
