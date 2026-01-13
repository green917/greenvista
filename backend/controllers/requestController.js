const ServiceRequest = require('../models/ServiceRequest');
const Staff = require('../models/Staff');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { validationResult } = require('express-validator');
const { generateOTP, sendOTPEmail, sendServiceRequestNotification } = require('../utils/emailService');

// Send OTP for service request
const sendRequestOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const ownerId = req.user.userId;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findById(ownerId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate OTP
    const otp = generateOTP();

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email, purpose: 'service-request' });

    // Save OTP to database
    const otpRecord = new OTP({
      email,
      otp,
      purpose: 'service-request',
      verified: false
    });

    await otpRecord.save();

    // Send OTP via email
    const emailResult = await sendOTPEmail(email, otp, 'service-request');

    if (emailResult.success) {
      res.json({
        message: 'OTP sent successfully',
        otpId: otpRecord._id
      });
    } else {
      res.status(500).json({ error: 'Failed to send OTP' });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create request with OPTIONAL OTP verification
const createRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, details, images, otp, email, requestedDate, requestedTime } = req.body;
    const ownerId = req.user.userId;

    // OTP verification is OPTIONAL
    if (otp && email) {
      // Only verify OTP if both otp and email are provided
      const otpRecord = await OTP.findOne({ email, otp, purpose: 'service-request' });

      if (!otpRecord) {
        return res.status(401).json({ error: 'Invalid OTP' });
      }

      // Check if OTP has expired
      const createdTime = new Date(otpRecord.createdAt).getTime();
      const currentTime = new Date().getTime();
      const timeDiff = (currentTime - createdTime) / 1000; // in seconds

      if (timeDiff > 600) { // 10 minutes
        await OTP.deleteOne({ _id: otpRecord._id });
        return res.status(401).json({ error: 'OTP has expired' });
      }

      // Delete OTP after verification
      await OTP.deleteOne({ email, otp, purpose: 'service-request' });
    }

    const request = new ServiceRequest({
      ownerId,
      type,
      details,
      images: images || [],
      requestedDate: requestedDate ? new Date(requestedDate) : null,
      requestedTime: requestedTime || null
    });

    await request.save();

    // Get user details for notification
    const user = await User.findById(ownerId);

    // Send notification email
    if (user) {
      await sendServiceRequestNotification(user.email, user.name, {
        type,
        details,
        requestId: request._id
      });
    }

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find()
      .populate('ownerId', 'name email phone apartmentNumber address')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const requests = await ServiceRequest.find({ ownerId })
      .skip(skip)
      .limit(limit);

    const total = await ServiceRequest.countDocuments({ ownerId });

    res.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo } = req.body;

    const request = await ServiceRequest.findByIdAndUpdate(
      id,
      { status, assignedTo, updatedAt: new Date() },
      { new: true }
    ).populate('ownerId', 'name email phone');

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await ServiceRequest.findById(id);

    if (req.user.role !== 'admin' && request.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await ServiceRequest.findByIdAndDelete(id);
    res.json({ message: 'Request deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  sendRequestOTP,
  createRequest,
  getRequests,
  getMyRequests,
  updateRequest,
  deleteRequest
};
