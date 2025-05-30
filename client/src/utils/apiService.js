/**
 * API Service utility to handle API endpoint differences between development and production
 * This ensures that the correct API endpoints are used in both environments
 */

// Configure base URL based on environment
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return window.location.protocol === 'https:' 
      ? 'https://www.yabellobingo.com'
      : 'http://www.yabellobingo.com';
  }
  return 'http://localhost:5001';
};

// Base URL for API requests
const baseUrl = getBaseUrl();

/**
 * Format the API endpoint with the correct prefix based on environment
 * @param {string} endpoint - The API endpoint path without leading slash
 * @returns {string} - The formatted endpoint with correct prefix
 */
const formatEndpoint = (endpoint) => {
  // Remove any leading slash from the endpoint
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Format the endpoint with the correct base URL and prefix
  const formattedEndpoint = `${baseUrl}/api/${cleanEndpoint}`;
  
  // Log the formatted endpoint for debugging
  console.log(`API Request: ${endpoint} → ${formattedEndpoint}`);
  
  return formattedEndpoint;
};

/**
 * Get the authentication token from localStorage
 * @returns {string|null} - Authentication token or null if not found
 */
const getAuthToken = () => {
  return localStorage.getItem('token');
};

/**
 * Add authentication headers to request options if token exists
 * @param {Object} options - Fetch options
 * @returns {Object} - Updated fetch options with auth headers
 */
const addAuthHeaders = (options = {}) => {
  const token = getAuthToken();
  if (!token) return options;
  
  return {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  };
};

/**
 * Make a GET request to the API
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch promise
 */
const get = async (endpoint, options = {}) => {
  const formattedEndpoint = formatEndpoint(endpoint);
  const authOptions = addAuthHeaders(options);
  return fetch(formattedEndpoint, {
    method: 'GET',
    ...authOptions
  });
};

/**
 * Make a POST request to the API
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch promise
 */
const post = async (endpoint, data, options = {}) => {
  const formattedEndpoint = formatEndpoint(endpoint);
  const authOptions = addAuthHeaders(options);
  
  // Special handling for reports/sales endpoint
  if (endpoint === 'reports/sales') {
    console.log('Special handling for reports/sales POST request');
    
    // Ensure dates are properly formatted
    const processedData = { ...data };
    
    // Make sure fromDate and toDate are strings in YYYY-MM-DD format
    if (processedData.fromDate instanceof Date) {
      processedData.fromDate = processedData.fromDate.toISOString().split('T')[0];
    }
    
    if (processedData.toDate instanceof Date) {
      processedData.toDate = processedData.toDate.toISOString().split('T')[0];
    }
    
    console.log('Processed sales report data:', processedData);
    
    return fetch(formattedEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authOptions.headers
      },
      body: JSON.stringify(processedData)
    });
  }
  
  // Debug the request data for user creation
  if (endpoint === 'users/create-user') {
    console.log('Creating user with data:', data);
  }
  
  // Standard POST request for other endpoints
  return fetch(formattedEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authOptions.headers
    },
    body: JSON.stringify(data)
  });
};

/**
 * Make a PUT request to the API
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch promise
 */
const put = async (endpoint, data, options = {}) => {
  const formattedEndpoint = formatEndpoint(endpoint);
  const authOptions = addAuthHeaders(options);
  return fetch(formattedEndpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authOptions.headers
    },
    body: JSON.stringify(data),
    ...authOptions
  });
};

/**
 * Make a PATCH request to the API
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch promise
 */
const patch = async (endpoint, data, options = {}) => {
  const formattedEndpoint = formatEndpoint(endpoint);
  const authOptions = addAuthHeaders(options);
  return fetch(formattedEndpoint, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authOptions.headers
    },
    body: JSON.stringify(data),
    ...authOptions
  });
};

/**
 * Make a DELETE request to the API
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch promise
 */
const del = async (endpoint, options = {}) => {
  const formattedEndpoint = formatEndpoint(endpoint);
  const authOptions = addAuthHeaders(options);
  return fetch(formattedEndpoint, {
    method: 'DELETE',
    ...authOptions
  });
};

// Export the API service functions
const apiService = {
  get,
  post,
  put,
  patch,
  delete: del,
  formatEndpoint
};

export default apiService;
