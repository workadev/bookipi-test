import { useState, useEffect } from 'react';
import Head from 'next/head';
import { flashSaleService, productService } from '../../../services/api';
import withAuth from '../../../components/withAuth';
import { toast } from 'react-hot-toast';

function FlashSalesAdmin() {
  const [flashSales, setFlashSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFlashSale, setEditingFlashSale] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [selectedFlashSale, setSelectedFlashSale] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    start_time: '',
    end_time: '',
    is_active: true
  });
  const [productFormData, setProductFormData] = useState({
    product_id: '',
    discount_percentage: 10,
    max_quantity_per_user: 1
  });

  useEffect(() => {
    fetchFlashSales();
    fetchProducts();
  }, []);

  const fetchFlashSales = async () => {
    try {
      setLoading(true);
      const data = await flashSaleService.getAllFlashSales();
      setFlashSales(data);
    } catch (error) {
      console.error('Error fetching flash sales:', error);
      toast.error('Failed to load flash sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await productService.getAllProducts();
      // Filter only active products that are flash sale eligible
      setProducts(data.filter(p => p.is_active && p.is_flash));
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductFormData({
      ...productFormData,
      [name]: name === 'product_id' ? value : parseInt(value)
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      start_time: '',
      end_time: '',
      is_active: true
    });
    setEditingFlashSale(null);
  };

  const resetProductForm = () => {
    setProductFormData({
      product_id: '',
      discount_percentage: 10,
      max_quantity_per_user: 1
    });
  };

  const handleCreateClick = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEditClick = (flashSale) => {
    // Format dates for form inputs
    const startDate = new Date(flashSale.start_time);
    const endDate = new Date(flashSale.end_time);
    
    setFormData({
      name: flashSale.name,
      start_time: startDate.toISOString().slice(0, 16),
      end_time: endDate.toISOString().slice(0, 16),
      is_active: flashSale.is_active
    });
    setEditingFlashSale(flashSale.id);
    setShowForm(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this flash sale?')) {
      try {
        await flashSaleService.deleteFlashSale(id);
        toast.success('Flash sale deleted successfully');
        fetchFlashSales();
      } catch (error) {
        console.error('Error deleting flash sale:', error);
        toast.error('Failed to delete flash sale');
      }
    }
  };

  const handleViewProducts = async (flashSale) => {
    try {
      const data = await flashSaleService.getFlashSaleById(flashSale.id);
      setSelectedFlashSale(data);
    } catch (error) {
      console.error('Error fetching flash sale details:', error);
      toast.error('Failed to load flash sale details');
    }
  };

  const handleAddProductClick = (flashSale) => {
    setSelectedFlashSale(flashSale);
    resetProductForm();
    setShowAddProductForm(true);
  };

  const handleRemoveProduct = async (flashSaleId, productId) => {
    if (window.confirm('Are you sure you want to remove this product from the flash sale?')) {
      try {
        await flashSaleService.removeProductFromFlashSale(flashSaleId, productId);
        toast.success('Product removed from flash sale');
        
        // Refresh the selected flash sale data if needed
        if (selectedFlashSale && selectedFlashSale.id === flashSaleId) {
          const data = await flashSaleService.getFlashSaleById(flashSaleId);
          setSelectedFlashSale(data);
        }
        
        fetchFlashSales();
      } catch (error) {
        console.error('Error removing product:', error);
        toast.error('Failed to remove product from flash sale');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.name || !formData.start_time || !formData.end_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingFlashSale) {
        // Update existing flash sale
        await flashSaleService.updateFlashSale(editingFlashSale, formData);
        toast.success('Flash sale updated successfully');
      } else {
        // Create new flash sale
        await flashSaleService.createFlashSale(formData);
        toast.success('Flash sale created successfully');
      }
      
      // Reset form and refresh flash sales list
      setShowForm(false);
      resetForm();
      fetchFlashSales();
    } catch (error) {
      console.error('Error saving flash sale:', error);
      toast.error('Failed to save flash sale');
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    if (!productFormData.product_id) {
      toast.error('Please select a product');
      return;
    }

    try {
      await flashSaleService.addProductToFlashSale(selectedFlashSale.id, productFormData);
      toast.success('Product added to flash sale');
      setShowAddProductForm(false);
      resetProductForm();
      
      // Refresh data
      fetchFlashSales();
      
      // Update selected flash sale if we're viewing it
      if (selectedFlashSale) {
        const data = await flashSaleService.getFlashSaleById(selectedFlashSale.id);
        setSelectedFlashSale(data);
      }
    } catch (error) {
      console.error('Error adding product to flash sale:', error);
      toast.error(error.response?.data?.message || 'Failed to add product to flash sale');
    }
  };

  function formatDateTime(dateString) {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }

  return (
    <div className="container mx-auto px-4">
      <Head>
        <title>Flash Sale Management - Admin Dashboard</title>
      </Head>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Flash Sale Management</h1>
        <button
          onClick={handleCreateClick}
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
        >
          Create Flash Sale
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingFlashSale ? 'Edit Flash Sale' : 'Create Flash Sale'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flash Sale Name*
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time*
                </label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time*
                </label>
                <input
                  type="datetime-local"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                {editingFlashSale ? 'Update Flash Sale' : 'Create Flash Sale'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showAddProductForm && selectedFlashSale && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Add Product to "{selectedFlashSale.name}"
          </h2>
          
          <form onSubmit={handleProductSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product*
                </label>
                <select
                  name="product_id"
                  value={productFormData.product_id}
                  onChange={handleProductFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Select a product</option>
                  {products.filter(p => p.quantity > 0).map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ${product.price.toFixed(2)} - (In Stock: {product.quantity})
                    </option>
                  ))}
                </select>
                {products.length === 0 && (
                  <p className="mt-1 text-sm text-red-600">
                    No eligible products found. Make sure products are active and marked as flash sale eligible.
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Percentage*
                </label>
                <input
                  type="number"
                  name="discount_percentage"
                  value={productFormData.discount_percentage}
                  onChange={handleProductFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  min="1"
                  max="99"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Quantity Per User*
                </label>
                <input
                  type="number"
                  name="max_quantity_per_user"
                  value={productFormData.max_quantity_per_user}
                  onChange={handleProductFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  min="1"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddProductForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                disabled={products.length === 0}
              >
                Add Product
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Selected Flash Sale Products */}
      {selectedFlashSale && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Products in "{selectedFlashSale.name}"
            </h2>
            <div>
              <button
                onClick={() => handleAddProductClick(selectedFlashSale)}
                className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 mr-2"
              >
                Add Product
              </button>
              <button
                onClick={() => setSelectedFlashSale(null)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
          
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                <span className="font-medium">Start:</span> {formatDateTime(selectedFlashSale.start_time)}
              </div>
              <div className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                <span className="font-medium">End:</span> {formatDateTime(selectedFlashSale.end_time)}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${
                selectedFlashSale.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {selectedFlashSale.is_active ? 'Active' : 'Inactive'}
              </div>
            </div>
            
            {selectedFlashSale.products?.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Original Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sale Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Max Per User
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedFlashSale.products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.discount_percentage}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-red-600 font-semibold">${product.discounted_price.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.max_quantity_per_user}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleRemoveProduct(selectedFlashSale.id, product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No products added to this flash sale yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Flash Sales List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-xl text-gray-600">Loading flash sales...</div>
        </div>
      ) : flashSales.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No flash sales found. Create your first flash sale!</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {flashSales.map((flashSale) => (
                <tr key={flashSale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{flashSale.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDateTime(flashSale.start_time)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDateTime(flashSale.end_time)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      flashSale.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {flashSale.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {flashSale.product_count || 0} products
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewProducts(flashSale)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Products
                    </button>
                    <button
                      onClick={() => handleEditClick(flashSale)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(flashSale.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default withAuth(FlashSalesAdmin, { requireAdmin: true });
