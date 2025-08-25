import { createContext, useContext, useEffect, useState } from 'react';
import { flashSaleService } from '../services/api';

const FlashSaleContext = createContext();

export function FlashSaleProvider({ children }) {
  const [flashSaleStatus, setFlashSaleStatus] = useState({
    status: 'loading',
    flash_sale: null
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch flash sale status
  const fetchFlashSaleStatus = async () => {
    try {
      setLoading(true);
      const data = await flashSaleService.getFlashSaleStatus();
      setFlashSaleStatus(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching flash sale status:', err);
      setError('Failed to load flash sale status');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and set up refresh interval
  useEffect(() => {
    fetchFlashSaleStatus();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchFlashSaleStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Calculate remaining time for the flash sale
  const getRemainingTime = () => {
    if (!flashSaleStatus.flash_sale) return { hours: 0, minutes: 0, seconds: 0 };
    
    let targetTime;
    
    if (flashSaleStatus.status === 'active') {
      // Time until end
      targetTime = new Date(flashSaleStatus.flash_sale.end_time).getTime();
    } else if (flashSaleStatus.status === 'upcoming') {
      // Time until start
      targetTime = new Date(flashSaleStatus.flash_sale.start_time).getTime();
    } else {
      return { hours: 0, minutes: 0, seconds: 0 };
    }
    
    const now = Date.now();
    const diff = targetTime - now;
    
    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { hours, minutes, seconds };
  };

  return (
    <FlashSaleContext.Provider
      value={{
        flashSaleStatus,
        loading,
        error,
        refreshStatus: fetchFlashSaleStatus,
        getRemainingTime,
      }}
    >
      {children}
    </FlashSaleContext.Provider>
  );
}

export function useFlashSale() {
  return useContext(FlashSaleContext);
}
