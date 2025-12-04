import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, Mail, Phone, MapPin } from 'lucide-react';

export default function PrivacyPolicy({ isAuthenticated, setIsAuthenticated }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-10 h-10" />
              <h1 className="text-3xl font-bold">Privacy Policy</h1>
            </div>
            <p className="text-blue-100">Last updated: December 2025</p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-8">
            {/* Who we are */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Who We Are
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Welcome to atlasandarrow.in. By accessing or using our website, you agree to comply with and be bound by the following Terms & Conditions. Please read them carefully before proceeding.
              </p>
            </section>

            {/* Use of Website */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Use of the Website
              </h2>
              <p className="text-gray-600 leading-relaxed">
                By visiting atlasandarrow.in, you accept these Terms & Conditions and all applicable laws and regulations.
              </p>
            </section>

            {/* Products & Orders */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">Products & Orders</h2>
              <ul className="text-gray-600 space-y-2 list-disc list-inside">
                <li>We strive to ensure all product descriptions and prices are accurate. However, errors may occur. In such cases, we reserve the right to correct errors and update your order accordingly.</li>
                <li>Placing an order signifies your intention to purchase. All orders are subject to availability, confirmation, and acceptance.</li>
                <li>We may refuse or cancel orders for any reason, including limitations on quantities, inaccuracies, or suspected fraud.</li>
              </ul>
            </section>

            {/* Payment & Pricing */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">Payment & Pricing</h2>
              <ul className="text-gray-600 space-y-2 list-disc list-inside">
                <li>All payments are processed securely. We accept major payment methods as displayed on our website.</li>
                <li>Prices and promotions may change without prior notice.</li>
              </ul>
            </section>

            {/* Shipping & Returns */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">Shipping & Returns</h2>
              <ul className="text-gray-600 space-y-2 list-disc list-inside">
                <li>We aim to process and dispatch orders promptly. Delivery times are estimates and may vary based on location and circumstances.</li>
                <li>For information on returns, please refer to our Returns Policy.</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">Intellectual Property</h2>
              <ul className="text-gray-600 space-y-2 list-disc list-inside">
                <li>All website content, including text, images, logos, and graphics, are the property of atlasandarrow.in or its licensors and protected by copyright laws.</li>
                <li>You may not use, reproduce, or distribute any content from this site without written permission.</li>
              </ul>
            </section>

            {/* Privacy */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                Privacy
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Your privacy is important to us. We collect personal information such as name, email, phone number, and shipping address solely to process your orders and improve your experience. We do not sell or share your personal data with third parties except as necessary to fulfill orders (e.g., shipping partners).
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">Limitation of Liability</h2>
              <ul className="text-gray-600 space-y-2 list-disc list-inside">
                <li>atlasandarrow.in is not liable for any indirect, incidental, or consequential damages arising from your use of the website or purchased products.</li>
                <li>We make efforts to keep the site error-free and secure, but do not guarantee uninterrupted access.</li>
              </ul>
            </section>

            {/* Account & Security */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">Account & Security</h2>
              <ul className="text-gray-600 space-y-2 list-disc list-inside">
                <li>You are responsible for maintaining the confidentiality of your account information. Notify us immediately of any unauthorized activity.</li>
                <li>We reserve the right to suspend accounts in case of suspicious or fraudulent behavior.</li>
              </ul>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">Changes to Terms</h2>
              <ul className="text-gray-600 space-y-2 list-disc list-inside">
                <li>We may update these Terms & Conditions at any time. Changes take effect immediately upon posting.</li>
                <li>Continued use of the site constitutes acceptance of the revised terms.</li>
              </ul>
            </section>

            {/* Contact */}
            <section className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Contact Us</h2>
              <p className="text-gray-600 mb-4">
                For questions regarding these Terms & Conditions, please reach out:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span>atlasarrow75@gmail.com</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <span>+91 93699 14492</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>Gorakhpur, Uttar Pradesh, India</span>
                </div>
              </div>
            </section>

            {/* Agreement */}
            <div className="border-t pt-6">
              <p className="text-gray-600 text-center">
                By using atlasandarrow.in, you acknowledge that you have read, understood, and agree to these Terms & Conditions.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 py-6 text-center text-gray-500 text-sm">
        © 2025. All rights are reserved by Atlasandarrow.in
      </div>
    </div>
  );
}
