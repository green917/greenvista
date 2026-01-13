require('dotenv').config();
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const User = require('../models/User');
const Staff = require('../models/Staff');
const ServiceRequest = require('../models/ServiceRequest');
const Schedule = require('../models/Schedule');
const Invoice = require('../models/Invoice');
const Notice = require('../models/Notice');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    await User.deleteMany({});
    await Staff.deleteMany({});
    await ServiceRequest.deleteMany({});
    await Schedule.deleteMany({});
    await Invoice.deleteMany({});
    await Notice.deleteMany({});

    const adminPassword = 'Password123!';
    const adminSalt = await bcryptjs.genSalt(10);
    const adminPasswordHash = await bcryptjs.hash(adminPassword, adminSalt);

    const admin = await User.create({
      name: 'Admin User',
      email: 'greenvista@zohomail.in',
      phone: '+1234567890',
      passwordHash: adminPasswordHash,
      role: 'admin'
    });

    const ownerPassword = 'Password123!';
    const ownerSalt = await bcryptjs.genSalt(10);
    const ownerPasswordHash = await bcryptjs.hash(ownerPassword, ownerSalt);

    const owner1 = await User.create({
      name: 'John Doe',
      email: 'owner1@local.test',
      phone: '+1111111111',
      passwordHash: ownerPasswordHash,
      role: 'owner',
      apartmentNumber: 'A101',
      address: '123 Green Street, Garden City'
    });

    const owner2 = await User.create({
      name: 'Jane Smith',
      email: 'owner2@local.test',
      phone: '+2222222222',
      passwordHash: ownerPasswordHash,
      role: 'owner',
      apartmentNumber: 'A102',
      address: '456 Flower Lane, Plant Town'
    });

    const staff1 = await Staff.create({
      name: 'Mike Johnson',
      role: 'Plumber',
      phone: '+3333333333'
    });

    const staff2 = await Staff.create({
      name: 'Sarah Lee',
      role: 'Electrician',
      phone: '+4444444444'
    });

    await ServiceRequest.create({
      ownerId: owner1._id,
      type: 'Plumbing',
      details: 'Leaking faucet in kitchen',
      status: 'pending',
      images: []
    });

    await ServiceRequest.create({
      ownerId: owner2._id,
      type: 'Electrical',
      details: 'Broken light switch in bedroom',
      status: 'assigned',
      assignedTo: staff2._id,
      images: []
    });

    await Schedule.create({
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      serviceType: 'Garden Maintenance',
      staffId: staff1._id,
      owners: [owner1._id, owner2._id],
      notes: 'Weekly garden watering and pruning'
    });

    await Invoice.create({
      ownerId: owner1._id,
      amount: 5000,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paid: false
    });

    await Invoice.create({
      ownerId: owner1._id,
      amount: 2500,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      paid: true,
      paymentTxId: 'TXN-2024-001'
    });

    await Invoice.create({
      ownerId: owner2._id,
      amount: 3500,
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      paid: false
    });

    await Notice.create({
      title: 'Scheduled Maintenance - Building Lobby',
      body: 'Dear Residents,\n\nPlease note that maintenance work will be conducted in the building lobby on December 5, 2024, from 9 AM to 5 PM. We apologize for any inconvenience. Access to the lobby will be limited during this period.',
      visibleTo: 'all'
    });

    await Notice.create({
      title: 'Updated Maintenance Policy',
      body: 'Effective January 1, 2025, the following changes will be implemented:\n\n1. All maintenance requests must be submitted 48 hours in advance\n2. Emergency services available 24/7\n3. Payment terms updated to Net 30 days',
      visibleTo: 'all'
    });

    await Notice.create({
      title: 'Garden Maintenance Schedule',
      body: 'The garden and landscaping maintenance will be conducted every Monday and Thursday from 7 AM to 10 AM. Please ensure gates are unlocked for staff access.',
      visibleTo: 'owners'
    });

    console.log('\n=== SEED DATA CREATED SUCCESSFULLY ===\n');
    console.log('Admin Credentials:');
    console.log(`  Email: greenvista@zohomail.in`);
    console.log(`  Password: ${adminPassword}\n`);

    console.log('Owner 1 Credentials:');
    console.log(`  Email: owner1@local.test`);
    console.log(`  Password: ${ownerPassword}`);
    console.log(`  Apartment: A101\n`);

    console.log('Owner 2 Credentials:');
    console.log(`  Email: owner2@local.test`);
    console.log(`  Password: ${ownerPassword}`);
    console.log(`  Apartment: A102\n`);

  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

connectDB().then(seedDatabase);
