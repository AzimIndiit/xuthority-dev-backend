const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import the Admin model
const Admin = require('../src/models/Admin');

const SALT_ROUNDS = 12;

/**
 * Create an admin user
 */
const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/xuthority');
    console.log('✅ Connected to MongoDB');

    const adminData = {
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@xuthority.com',
      password: 'Password@1'
    };

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('❌ Admin already exists with this email:', adminData.email);
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, SALT_ROUNDS);

    // Create admin
    const admin = new Admin({
      firstName: adminData.firstName,
      lastName: adminData.lastName,
      email: adminData.email,
      password: hashedPassword,
      isActive: true,
      notes: 'Initial admin user created via script'
    });

    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password:', adminData.password);
    console.log('👤 Name:', `${adminData.firstName} ${adminData.lastName}`);
    console.log('🆔 Admin ID:', admin._id);

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔒 Database connection closed');
    process.exit(0);
  }
};

// Run the script
createAdmin(); 