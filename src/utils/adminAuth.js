// Admin authentication utilities

export const isAdminAuthenticated = () => {
  // Check both sessionStorage (from Login.jsx) and localStorage
  const isAuthenticated = sessionStorage.getItem('adminAuthenticated') || localStorage.getItem('adminAuthenticated');
  const adminUser = sessionStorage.getItem('adminUser') || localStorage.getItem('adminUser');
  
  if (!isAuthenticated || !adminUser) {
    return false;
  }
  
  try {
    const user = JSON.parse(adminUser);
    // Check if login is within 24 hours (optional session timeout)
    const loginTime = new Date(user.loginTime);
    const now = new Date();
    const timeDiff = (now - loginTime) / (1000 * 60 * 60); // Hours
    
    // Session expires after 24 hours
    if (timeDiff > 24) {
      logoutAdmin();
      return false;
    }
    
    return true;
  } catch (error) {
    logoutAdmin();
    return false;
  }
};

export const getAdminUser = () => {
  try {
    const adminUser = sessionStorage.getItem('adminUser') || localStorage.getItem('adminUser');
    return adminUser ? JSON.parse(adminUser) : null;
  } catch (error) {
    return null;
  }
};

export const logoutAdmin = () => {
  // Clear from both storages
  sessionStorage.removeItem('adminAuthenticated');
  sessionStorage.removeItem('adminUser');
  localStorage.removeItem('adminAuthenticated');
  localStorage.removeItem('adminUser');
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
};

export const ADMIN_CREDENTIALS = {
  username: 'admin@atlas.com',
  password: 'arrow123'
};