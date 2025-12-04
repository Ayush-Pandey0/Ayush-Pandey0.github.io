// Auth Storage Utility
// Using sessionStorage - user is logged out when browser/tab is closed
// Change to localStorage if you want persistent login across browser sessions

const storage = sessionStorage; // Change to localStorage for persistent login

export const authStorage = {
  getToken: () => storage.getItem('token'),
  setToken: (token) => storage.setItem('token', token),
  removeToken: () => storage.removeItem('token'),
  
  getUser: () => {
    const user = storage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  setUser: (user) => storage.setItem('user', JSON.stringify(user)),
  removeUser: () => storage.removeItem('user'),
  
  // Clear all auth data
  clear: () => {
    storage.removeItem('token');
    storage.removeItem('user');
  },
  
  // Check if user is authenticated
  isAuthenticated: () => !!storage.getItem('token')
};

export default authStorage;
