# 🏹 Atlas & Arrow - E-Commerce Platform

A modern, full-stack e-commerce platform for biometric devices, GPS trackers, and business equipment. Built with React + Vite frontend and Node.js/Express backend, featuring Razorpay payments, Google OAuth, and a comprehensive admin panel.

![Atlas & Arrow](https://img.shields.io/badge/Status-Live-brightgreen) ![React](https://img.shields.io/badge/React-18-blue) ![Node.js](https://img.shields.io/badge/Node.js-Express-green) ![MongoDB](https://img.shields.io/badge/Database-MongoDB-green)

---

## 🌐 Live Demo

| Platform | URL |
|----------|-----|
| **Website** | [atlasarrow.me](https://atlasarrow.me) |
| **Backend API** | [atlas-arrow-backend.onrender.com](https://atlas-arrow-backend.onrender.com) |
| **Admin Panel** | [atlasarrow.me/admin-login](https://atlasarrow.me/admin-login) |

---

## ✨ Features

### 🛒 Customer Features
- **Product Browsing** - Filter by category, price, brand with search functionality
- **User Authentication** - Email/Password & Google OAuth sign-in
- **Forgot Password** - OTP-based password reset via email
- **Shopping Cart** - Add, update, remove items with quantity management
- **Wishlist** - Save products for later
- **Razorpay Payments** - Secure online payments with order verification
- **Order Tracking** - Real-time order status updates
- **Email Notifications** - Order confirmations and status updates
- **Product Reviews** - Rate and review purchased products
- **User Profile** - Manage addresses, view order history

### 🔐 Admin Features
- **Dashboard** - Sales analytics, order stats, user metrics
- **Product Management** - CRUD operations with image uploads
- **Order Management** - Update status, add tracking info
- **User Management** - View, edit, delete users
- **Review Moderation** - Approve, reject, reply to reviews
- **Notification System** - Send announcements to users

---

## 🔑 Access Credentials

### Admin Panel
See `CREDENTIALS.txt` for admin login details (not committed to repo)

### Customer Account
- Register at [atlasarrow.me/register](https://atlasarrow.me/register)
- Or sign in with Google

---

## 📁 Project Structure

```
Atlas_Arrow/
├── client/                          # Frontend (React + Vite)
│   ├── public/                      # Static assets
│   │   ├── 404.html                 # SPA fallback for GitHub Pages
│   │   ├── CNAME                    # Custom domain config
│   │   ├── default-avatar.png       # Default user avatar
│   │   ├── products/                # Product images
│   │   ├── sitemap.xml              # SEO sitemap
│   │   └── google*.html             # Google verification files
│   │
│   ├── src/
│   │   ├── components/              # Reusable components
│   │   │   ├── AdminProtectedRoute.jsx  # Admin route guard
│   │   │   ├── Navbar.jsx           # Navigation bar
│   │   │   ├── MessageManager.jsx   # Admin messaging
│   │   │   ├── NotificationManager.jsx  # Admin notifications
│   │   │   ├── OrderManager.jsx     # Admin order management
│   │   │   ├── ProductManager.jsx   # Admin product CRUD
│   │   │   ├── ReviewManager.jsx    # Admin review moderation
│   │   │   ├── SettingsManager.jsx  # Admin settings
│   │   │   └── UserManager.jsx      # Admin user management
│   │   │
│   │   ├── pages/                   # Page components
│   │   │   ├── Home.jsx             # Landing page with stats
│   │   │   ├── Products.jsx         # Product listing with filters
│   │   │   ├── ProductDetail.jsx    # Product info & reviews
│   │   │   ├── Cart.jsx             # Shopping cart
│   │   │   ├── Checkout.jsx         # Checkout flow
│   │   │   ├── PaymentGateway.jsx   # Razorpay integration
│   │   │   ├── Orders.jsx           # Order history
│   │   │   ├── TrackOrder.jsx       # Order tracking
│   │   │   ├── Wishlist.jsx         # Saved products
│   │   │   ├── Profile.jsx          # User profile
│   │   │   ├── Login.jsx            # Login + Forgot Password
│   │   │   ├── Register.jsx         # User registration
│   │   │   ├── AdminLogin.jsx       # Admin authentication
│   │   │   ├── AdminPanel.jsx       # Admin dashboard layout
│   │   │   ├── AdminDashboard.jsx   # Admin analytics
│   │   │   ├── About.jsx            # About page
│   │   │   ├── Contact.jsx          # Contact form
│   │   │   ├── PrivacyPolicy.jsx    # Privacy policy
│   │   │   ├── Notifications.jsx    # User notifications
│   │   │   └── ChangePassword.jsx   # Password change
│   │   │
│   │   ├── config/
│   │   │   └── api.js               # Axios API configuration
│   │   │
│   │   ├── utils/
│   │   │   ├── adminAuth.js         # Admin authentication utils
│   │   │   └── authStorage.js       # Token storage helpers
│   │   │
│   │   ├── App.jsx                  # Main app with routes
│   │   ├── Main.jsx                 # React entry point
│   │   └── index.css                # Global styles + Tailwind
│   │
│   ├── index.html                   # HTML template
│   ├── package.json                 # Frontend dependencies
│   ├── vite.config.js               # Vite configuration
│   ├── tailwind.config.js           # Tailwind CSS config
│   └── postcss.config.js            # PostCSS config
│
├── server/                          # Backend (Node.js + Express)
│   ├── server.js                    # Main server file
│   │   └── Contains:
│   │       ├── MongoDB Models (User, Product, Order, etc.)
│   │       ├── Authentication (JWT, bcrypt, Google OAuth)
│   │       ├── Razorpay Payment Integration
│   │       ├── Email Service (Resend API)
│   │       ├── REST API Endpoints
│   │       └── Admin Endpoints
│   │
│   ├── models/                      # Mongoose models (if separate)
│   ├── uploads/                     # Uploaded product images
│   ├── package.json                 # Backend dependencies
│   ├── .env                         # Environment variables
│   │
│   └── Utility Scripts:
│       ├── addProducts.js           # Seed products
│       ├── createAdmin.js           # Create admin user
│       ├── cleanDatabase.js         # Database cleanup
│       ├── updateProducts.js        # Bulk product updates
│       └── fix*.js                  # Various fix scripts
│
├── product-images/                  # Local product images
├── CNAME                            # GitHub Pages domain
└── README.md                        # This file
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| React Router DOM | Routing |
| React Hot Toast | Notifications |
| Lucide React | Icons |
| @react-oauth/google | Google Sign-In |
| Axios | HTTP Client |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | Web Framework |
| MongoDB Atlas | Database |
| Mongoose | ODM |
| JWT | Authentication |
| bcryptjs | Password Hashing |
| Razorpay | Payment Gateway |
| Resend | Email Service |
| Multer | File Uploads |

### Deployment
| Service | Purpose |
|---------|---------|
| GitHub Pages | Frontend Hosting |
| Render | Backend Hosting |
| MongoDB Atlas | Database |
| Cloudflare | DNS & SSL |

---

## 📄 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/google` | Google OAuth |
| POST | `/api/auth/forgot-password` | Send OTP |
| POST | `/api/auth/verify-otp` | Verify OTP |
| POST | `/api/auth/reset-password` | Reset password |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create product (Admin) |
| PUT | `/api/products/:id` | Update product (Admin) |
| DELETE | `/api/products/:id` | Delete product (Admin) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get user orders |
| POST | `/api/orders` | Create order |
| PUT | `/api/orders/:id/status` | Update status (Admin) |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/create-order` | Create Razorpay order |
| POST | `/api/payment/verify` | Verify payment |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/products/:id/reviews` | Add review |
| PUT | `/api/admin/reviews/:pid/:rid/status` | Moderate review |
| DELETE | `/api/admin/reviews/:pid/:rid` | Delete review |

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Razorpay account
- Resend API key

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/Ayush-Pandey0/Ayush-Pandey0.github.io.git
cd Atlas_Arrow
```

2. **Backend Setup**
```bash
cd server
npm install

# Create .env file with:
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
RESEND_API_KEY=your_resend_api_key

npm start
```

3. **Frontend Setup**
```bash
cd client
npm install
npm run dev
```

### Build & Deploy

**Frontend (GitHub Pages):**
```bash
cd client
npm run build
Copy-Item -Path "public/404.html" -Destination "dist/404.html"
npx gh-pages -d dist -b main
```

**Backend:**
Push to main branch - auto-deploys on Render

---

## 📱 Pages Overview

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with hero, stats, featured products |
| Products | `/products` | Product grid with filters & search |
| Product Detail | `/product/:id` | Full product info, reviews, add to cart |
| Cart | `/cart` | Shopping cart management |
| Checkout | `/checkout` | Shipping address & order summary |
| Payment | `/payment` | Razorpay payment gateway |
| Orders | `/orders` | Order history & details |
| Track Order | `/track-order` | Order tracking by ID |
| Wishlist | `/wishlist` | Saved products |
| Profile | `/profile` | User info & addresses |
| Login | `/login` | Email/Google sign-in + Forgot Password |
| Register | `/register` | New user registration |
| Admin Login | `/admin-login` | Admin authentication |
| Admin Panel | `/admin-panel` | Admin dashboard & management |
| About | `/about` | Company information |
| Contact | `/contact` | Contact form |
| Privacy | `/privacy-policy` | Privacy policy |

---

## 🔒 Environment Variables

See `CREDENTIALS.txt` for environment variable configuration (not committed to repo)

### Required Backend Variables
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `RAZORPAY_KEY_ID` - Razorpay API key
- `RAZORPAY_KEY_SECRET` - Razorpay secret
- `RESEND_API_KEY` - Email service API key
- `PORT` - Server port (default: 5000)

### Required Frontend Variables
- `VITE_API_URL` - Backend API URL
- `VITE_RAZORPAY_KEY_ID` - Razorpay public key
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID

---

## 👨‍💻 Author

**Ayush Pandey**
- GitHub: [@Ayush-Pandey0](https://github.com/Ayush-Pandey0)
- Website: [atlasarrow.me](https://atlasarrow.me)

---

## 📜 License

This project is proprietary software for Atlas & Arrow.

---

<p align="center">
  Made with ❤️ by Ayush Pandey
</p>
