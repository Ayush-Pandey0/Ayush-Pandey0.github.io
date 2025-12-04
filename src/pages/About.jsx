import { Clock, Star, MapPin, Phone, Mail } from 'lucide-react';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';

export default function About({ isAuthenticated, setIsAuthenticated }) {
  const team = [
    {
      name: 'Rajesh Kumar',
      position: 'CEO & Founder',
      image: '👨‍💼',
      description: 'Leading Atlas Arrow with 20+ years in business technology'
    },
    {
      name: 'Priya Sharma',
      position: 'CTO',
      image: '👩‍💻',
      description: 'Technology expert specializing in biometric solutions'
    },
    {
      name: 'Amit Patel',
      position: 'Head of Sales',
      image: '👨‍💼',
      description: 'Building relationships with enterprise clients nationwide'
    },
    {
      name: 'Sneha Singh',
      position: 'Customer Success',
      image: '👩‍💼',
      description: 'Ensuring exceptional customer experience and support'
    }
  ];

  const timeline = [
    { year: '2009', title: 'Company Founded', description: 'Started as a small biometric device distributor' },
    { year: '2015', title: 'Expanded Portfolio', description: 'Added GPS tracking and printing solutions' },
    { year: '2020', title: 'Digital Transformation', description: 'Launched e-commerce platform for B2B clients' },
    { year: '2023', title: 'Pan-India Presence', description: 'Serving 500+ cities across India' },
    { year: '2024', title: 'Innovation Lab', description: 'Established R&D center for emerging technologies' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold mb-6">About Atlas & Arrow</h1>
            <p className="text-xl text-gray-200 max-w-3xl mx-auto">
              Your trusted partner in business technology solutions for over 15 years. 
              We specialize in biometric devices, GPS tracking, printing solutions, and Aadhaar services.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-lg text-gray-700 mb-6">
                Founded in 2009, Atlas & Arrow began as a vision to provide reliable, 
                cutting-edge business technology solutions to enterprises across India. 
                What started as a small distributor has grown into a leading provider of 
                biometric devices, GPS tracking systems, and business equipment.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                Our commitment to quality, innovation, and customer satisfaction has 
                enabled us to serve over 50,000 customers and expand to 500+ cities 
                nationwide. We pride ourselves on being more than just a vendor – 
                we're your technology partner.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">R</div>
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">P</div>
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">A</div>
                </div>
                <p className="text-gray-600">Trusted by industry leaders</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                <p className="text-lg">
                  To empower businesses with innovative technology solutions that 
                  enhance security, efficiency, and growth while providing exceptional 
                  customer service and support.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Our Journey</h2>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-gray-300"></div>
            {timeline.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'} mb-8`}
              >
                <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                  <div className="bg-gray-50 p-6 rounded-lg shadow-md">
                    <div className="text-2xl font-bold text-blue-600 mb-2">{item.year}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-700">{item.description}</p>
                  </div>
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Meet Our Team</h2>
          <p className="text-center text-gray-600 mb-12">The experts behind Atlas & Arrow's success</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="text-6xl mb-4">{member.image}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-blue-600 font-semibold mb-3">{member.position}</p>
                <p className="text-gray-600 text-sm">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Work Together?</h2>
          <p className="text-xl mb-8">Let's discuss how we can help your business grow with the right technology solutions</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Contact Us Today
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition"
            >
              View Our Products
            </motion.button>
          </div>
        </div>
      </section>
    </div>
  );
}
