import { useState } from 'react';
import { useFlashSale } from '../context/FlashSaleContext';

export default function FlashSaleTimer() {
  const { flashSaleStatus, getRemainingTime } = useFlashSale();
  const [remainingTime, setRemainingTime] = useState(getRemainingTime());

  // Update time every second
  useState(() => {
    const timer = setInterval(() => {
      setRemainingTime(getRemainingTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (flashSaleStatus.status === 'loading') {
    return (
      <div className="bg-gray-100 p-4 rounded-md shadow-sm">
        <p className="text-center text-gray-500">Loading flash sale information...</p>
      </div>
    );
  }

  if (flashSaleStatus.status === 'none') {
    return null;
  }

  const { hours, minutes, seconds } = remainingTime;
  
  if (flashSaleStatus.status === 'active') {
    return (
      <div className="bg-red-500 text-white p-4 rounded-md shadow-sm flash-sale-badge">
        <h2 className="text-xl font-bold text-center mb-1">
          {flashSaleStatus.flash_sale.name} - LIVE NOW!
        </h2>
        <p className="text-center text-sm mb-2">
          Don't miss out! Limited stock available.
        </p>
        <div className="flex justify-center">
          <div className="bg-white text-red-600 rounded-md px-2 py-1 font-mono text-lg">
            {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <span className="ml-2 font-bold">remaining</span>
        </div>
      </div>
    );
  }

  if (flashSaleStatus.status === 'upcoming') {
    return (
      <div className="bg-blue-500 text-white p-4 rounded-md shadow-sm">
        <h2 className="text-xl font-bold text-center mb-1">
          {flashSaleStatus.flash_sale.name} - Coming Soon!
        </h2>
        <p className="text-center text-sm mb-2">
          Get ready for amazing deals!
        </p>
        <div className="flex justify-center">
          <div className="bg-white text-blue-600 rounded-md px-2 py-1 font-mono text-lg">
            {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <span className="ml-2 font-bold">until start</span>
        </div>
      </div>
    );
  }

  if (flashSaleStatus.status === 'ended') {
    return (
      <div className="bg-gray-500 text-white p-4 rounded-md shadow-sm">
        <h2 className="text-xl font-bold text-center mb-1">
          {flashSaleStatus.flash_sale.name} - Sale Ended
        </h2>
        <p className="text-center text-sm">
          The flash sale has ended. Check back later for more deals!
        </p>
      </div>
    );
  }

  return null;
}
