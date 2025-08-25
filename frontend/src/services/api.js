import axios from 'axios';
import Cookies from 'js-cookie';

// Create axios instance with base URL from environment variable
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor for adding token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response && error.response.status === 401) {
      // Only redirect if we're not already on the login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth service
export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data && response.data.token) {
      Cookies.set('token', response.data.token, { expires: 1 }); // Expires in 1 day
      Cookies.set('user', JSON.stringify(response.data.user), { expires: 1 });
    }
    return response.data;
  },

  logout: () => {
    Cookies.remove('token');
    Cookies.remove('user');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  getCurrentUser: async () => {
    return await api.get('/auth/me');
  },

  getUser: () => {
    const userStr = Cookies.get('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  isAuthenticated: () => {
    return !!Cookies.get('token');
  },

  isAdmin: () => {
    const user = authService.getUser();
    return user && user.is_admin;
  }
};

// Products service
export const productService = {
  getAllProducts: async () => {
    const response = await api.get('/products');
    return response.data;
  },

  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  }
};

// Flash sales service
export const flashSaleService = {
  getFlashSaleStatus: async () => {
    const response = await api.get('/flash-sales/status');
    return response.data;
  },

  getAllFlashSales: async () => {
    const response = await api.get('/flash-sales');
    return response.data;
  },

  getFlashSaleById: async (id) => {
    const response = await api.get(`/flash-sales/${id}`);
    return response.data;
  },

  createFlashSale: async (flashSaleData) => {
    const response = await api.post('/flash-sales', flashSaleData);
    return response.data;
  },

  updateFlashSale: async (id, flashSaleData) => {
    const response = await api.put(`/flash-sales/${id}`, flashSaleData);
    return response.data;
  },

  deleteFlashSale: async (id) => {
    const response = await api.delete(`/flash-sales/${id}`);
    return response.data;
  },

  addProductToFlashSale: async (flashSaleId, productData) => {
    const response = await api.post(`/flash-sales/${flashSaleId}/products`, productData);
    return response.data;
  },

  removeProductFromFlashSale: async (flashSaleId, productId) => {
    const response = await api.delete(`/flash-sales/${flashSaleId}/products/${productId}`);
    return response.data;
  }
};

// Purchases service
export const purchaseService = {
  createPurchase: async (purchaseData) => {
    const response = await api.post('/purchases', purchaseData);
    return response.data;
  },

  getUserPurchases: async () => {
    const response = await api.get('/purchases/my-purchases');
    return response.data;
  },

  checkUserPurchasedProduct: async (productId) => {
    const response = await api.get(`/purchases/check-product/${productId}`);
    return response.data;
  }
};

// Users service (Admin only)
export const userService = {
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  getUserPurchases: async (id) => {
    const response = await api.get(`/users/${id}/purchases`);
    return response.data;
  }
};

export default api;
