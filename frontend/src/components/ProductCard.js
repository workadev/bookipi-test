import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { purchaseService } from '../services/api';
import { useFlashSale } from '../context/FlashSaleContext';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { flashSaleStatus } = useFlashSale();
  const [isPurchased, setIsPurchased] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Check if user has purchased this product
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (isAuthenticated) {
        try {
          const result = await purchaseService.checkUserPurchasedProduct(product.id);
          setIsPurchased(result.has_purchased);
        } catch (error) {
          console.error('Error checking purchase status:', error);
        }
      }
    };

    checkPurchaseStatus();
  }, [isAuthenticated, product.id]);

  // Check if product is in active flash sale
  const isInActiveFlashSale = product.flash_sale && flashSaleStatus.status === 'active' && 
    flashSaleStatus.flash_sale?.id === product.flash_sale.id;

  // Calculate price display
  const displayPrice = isInActiveFlashSale 
    ? product.flash_sale.discounted_price 
    : product.price;

  // Handle buy click
  const handleBuy = (e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setModalOpen(true);
  };

  // Handle purchase
  const handlePurchase = async () => {
    try {
      setIsLoading(true);
      
      const purchaseData = {
        product_id: product.id,
        quantity: 1
      };

      // If this is a flash sale purchase, add flash sale id
      if (isInActiveFlashSale) {
        purchaseData.flash_sale_id = product.flash_sale.id;
      }

      const result = await purchaseService.createPurchase(purchaseData);
      toast.success('Purchase successful!');
      setIsPurchased(true);
      setModalOpen(false);
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(error.response?.data?.message || 'Failed to complete purchase');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine card style based on product status
  const isDisabled = product.quantity <= 0 || isPurchased;
  const cardClass = `bg-white rounded-lg shadow-md overflow-hidden transform transition ${
    isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'
  }`;

  return (
    <>
      <div 
        className={cardClass}
        onClick={() => !isDisabled && setModalOpen(true)}
      >
        <div className="h-48 bg-gray-200 flex items-center justify-center">
          <div className="text-4xl text-gray-400">📱</div>
        </div>
        <div className="p-4">
          {isInActiveFlashSale && (
            <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md mb-2 inline-block flash-sale-badge">
              FLASH SALE
            </div>
          )}

          <h3 className="text-lg font-semibold mb-1">{product.name}</h3>
          
          <div className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              {isInActiveFlashSale && (
                <span className="text-gray-500 line-through mr-2">
                  ${product.price.toFixed(2)}
                </span>
              )}
              <span className={`font-bold ${isInActiveFlashSale ? 'text-red-600' : ''}`}>
                ${displayPrice.toFixed(2)}
              </span>
            </div>
            
            <button
              disabled={isDisabled}
              onClick={handleBuy}
              className={`px-4 py-1 rounded ${
                isDisabled
                  ? 'bg-gray-300 text-gray-500'
                  : isInActiveFlashSale
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {isPurchased ? 'Purchased' : 'Buy'}
            </button>
          </div>
          
          {product.quantity <= 0 && (
            <div className="text-red-500 text-xs mt-1">Out of stock</div>
          )}
        </div>
      </div>

      {/* Purchase Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Purchase Confirmation</h2>
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-gray-600">{product.description}</p>
            </div>
            
            <div className="flex justify-between mb-6 border-t border-b py-2">
              <span className="font-medium">Price:</span>
              <span className="font-bold">${displayPrice.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                disabled={isLoading}
                className={`px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Processing...' : 'Confirm Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
