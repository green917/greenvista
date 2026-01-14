const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { generateOTP, sendOTPEmail } = require('../utils/emailService');

// Verify credentials and send OTP
const verifyCredentialsSendOTP = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('[Login] Validation errors:', errors.array());
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const emailLower = email.toLowerCase().trim();

    console.log('[Login] Attempting login with email:', emailLower);

    // Find user
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      console.log('[Login] User not found:', emailLower);
      return res.status(401).json({ error: 'Email not registered' });
    }

    console.log('[Login] User found:', emailLower);

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, user.passwordHash);
    console.log('[Login] Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('[Login] Invalid password for user:', emailLower);
      return res.status(401).json({ error: 'Incorrect password' });
    }

    console.log('[Login] Credentials verified successfully');

    // Generate OTP
    const otp = generateOTP();
    console.log('[Login] OTP generated:', otp);

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email: emailLower, purpose: 'login' });

    // Save OTP to database
    const otpRecord = new OTP({
      email: emailLower,
      otp,
      purpose: 'login',
      verified: false
    });

    await otpRecord.save();
    console.log('[Login] OTP saved to database');

    // Send OTP via email
    const emailResult = await sendOTPEmail(email, otp, 'login');

    if (emailResult.success) {
      console.log('[Login] OTP sent successfully to:', email);
      res.json({
        message: 'OTP sent successfully to your registered email',
        otpId: otpRecord._id
      });
    } else {
      console.log('[Login] Failed to send OTP to:', email, 'Error:', emailResult.error);
      res.status(500).json({
        error: 'Failed to send OTP',
        details: emailResult.error
      });
    }
  } catch (error) {
    console.error('Verify credentials and send OTP error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Send OTP for login (REQUIRED)
const sendLoginOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailLower = email.toLowerCase().trim();

    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate OTP
    const otp = generateOTP();

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email: emailLower, purpose: 'login' });

    // Save OTP to database
    const otpRecord = new OTP({
      email: emailLower,
      otp,
      purpose: 'login',
      verified: false
    });

    await otpRecord.save();

    // Send OTP via email
    const emailResult = await sendOTPEmail(email, otp, 'login');

    if (emailResult.success) {
      res.json({
        message: 'OTP sent successfully to your registered email',
        otpId: otpRecord._id
      });
    } else {
      res.status(500).json({
        error: 'Failed to send OTP',
        details: emailResult.error
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Verify OTP and login (COMPULSORY)
const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const emailLower = email.toLowerCase().trim();
    const otpString = String(otp).trim();

    console.log('[OTP Verify] Attempting verification');
    console.log('[OTP Verify] Email:', emailLower);
    console.log('[OTP Verify] OTP received:', otpString, 'Type:', typeof otpString);

    // Find OTP record - OTP is MANDATORY
    const otpRecord = await OTP.findOne({ email: emailLower, otp: otpString, purpose: 'login' });

    if (!otpRecord) {
      console.log('[OTP Verify] No matching OTP found in database');
      // Debug: Check what OTPs exist for this email
      const allOTPs = await OTP.find({ email: emailLower, purpose: 'login' });
      console.log('[OTP Verify] OTPs in DB for this email:', allOTPs.map(o => ({ otp: o.otp, otpType: typeof o.otp, email: o.email })));
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    // Check if OTP has expired
    const createdTime = new Date(otpRecord.createdAt).getTime();
    const currentTime = new Date().getTime();
    const timeDiff = (currentTime - createdTime) / 1000; // in seconds

    if (timeDiff > 60) { // 1 minute
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(401).json({ error: 'OTP has expired. Please request a new OTP' });
    }

    // Get user
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Delete OTP after successful verification
    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: error.message });
  }
};

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, password, apartmentNumber, address } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);

    const user = new User({
      name,
      email,
      phone,
      passwordHash,
      role: 'owner',
      apartmentNumber,
      address
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Register and send OTP for email verification
const registerSendOTP = async (req, res) => {
  try {
    const { name, email, phone, password, apartmentNumber, address } = req.body;

    if (!email || !password || !name || !phone || !address) {
      return res.status(400).json({ error: 'All required fields are missing' });
    }

    const emailLower = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered. Please login or use a different email.' });
    }

    // Generate OTP
    const otp = generateOTP();
    console.log('[Register] OTP generated:', otp);

    // Delete any existing OTP for this email for registration
    await OTP.deleteMany({ email: emailLower, purpose: 'registration' });

    // Save OTP to database
    const otpRecord = new OTP({
      email: emailLower,
      otp,
      purpose: 'registration',
      verified: false
    });

    await otpRecord.save();
    console.log('[Register] OTP saved to database');

    // Send OTP via email
    const emailResult = await sendOTPEmail(email, otp, 'registration');

    if (emailResult.success) {
      console.log('[Register] OTP sent successfully to:', email);
      res.json({
        message: 'OTP sent successfully to your email for verification',
        otpId: otpRecord._id
      });
    } else {
      console.log('[Register] Failed to send OTP to:', email, 'Error:', emailResult.error);
      res.status(500).json({
        error: 'Failed to send verification OTP',
        details: emailResult.error
      });
    }
  } catch (error) {
    console.error('Register send OTP error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Verify registration OTP and complete registration
const verifyRegistrationOTP = async (req, res) => {
  try {
    const { email, otp, name, phone, password, apartmentNumber, address } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    if (!name || !phone || !password || !address) {
      return res.status(400).json({ error: 'All registration fields are required' });
    }

    const emailLower = email.toLowerCase().trim();
    const otpString = String(otp).trim();

    console.log('[Register OTP Verify] Attempting verification');
    console.log('[Register OTP Verify] Email:', emailLower);
    console.log('[Register OTP Verify] OTP received:', otpString);

    // Find OTP record
    const otpRecord = await OTP.findOne({ email: emailLower, otp: otpString, purpose: 'registration' });

    if (!otpRecord) {
      console.log('[Register OTP Verify] No matching OTP found in database');
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    // Check if OTP has expired (1 minute)
    const createdTime = new Date(otpRecord.createdAt).getTime();
    const currentTime = new Date().getTime();
    const timeDiff = (currentTime - createdTime) / 1000; // in seconds

    if (timeDiff > 60) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(401).json({ error: 'OTP has expired. Please request a new OTP' });
    }

    // Check if user already exists (double check)
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);

    // Create new user
    const user = new User({
      name,
      email: emailLower,
      phone,
      passwordHash,
      role: 'owner',
      apartmentNumber,
      address
    });

    await user.save();
    console.log('[Register OTP Verify] User created successfully');

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Delete OTP after successful verification
    await OTP.deleteOne({ _id: otpRecord._id });

    res.status(201).json({
      message: 'Registration completed successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Verify registration OTP error:', error);
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    res.status(400).json({
      error: 'Login with password is disabled. Please use OTP verification.',
      instruction: 'Call POST /api/auth/send-otp with your email first, then verify with POST /api/auth/verify-otp'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const logout = (req, res) => {
  res.json({ message: 'Logout successful' });
};

// Forgot Password - Send OTP
const forgotPasswordSendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailLower = email.toLowerCase().trim();

    // Check if user exists
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.status(401).json({ error: 'Email not registered' });
    }

    // Generate OTP
    const otp = generateOTP();
    console.log('[Forgot Password] OTP generated:', otp);

    // Delete any existing OTP for this email for password reset
    await OTP.deleteMany({ email: emailLower, purpose: 'password-reset' });

    // Save OTP to database
    const otpRecord = new OTP({
      email: emailLower,
      otp,
      purpose: 'password-reset',
      verified: false
    });

    await otpRecord.save();
    console.log('[Forgot Password] OTP saved to database');

    // Send OTP via email
    const emailResult = await sendOTPEmail(email, otp, 'password-reset');

    if (emailResult.success) {
      console.log('[Forgot Password] OTP sent successfully to:', email);
      res.json({
        message: 'OTP sent successfully to your registered email',
        otpId: otpRecord._id
      });
    } else {
      console.log('[Forgot Password] Failed to send OTP to:', email, 'Error:', emailResult.error);
      res.status(500).json({
        error: 'Failed to send OTP',
        details: emailResult.error
      });
    }
  } catch (error) {
    console.error('Forgot password send OTP error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Reset Password - Verify OTP and set new password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const emailLower = email.toLowerCase().trim();
    const otpString = String(otp).trim();

    console.log('[Reset Password] Attempting verification');
    console.log('[Reset Password] Email:', emailLower);
    console.log('[Reset Password] OTP received:', otpString);

    // Find OTP record
    const otpRecord = await OTP.findOne({ email: emailLower, otp: otpString, purpose: 'password-reset' });

    if (!otpRecord) {
      console.log('[Reset Password] No matching OTP found in database');
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    // Check if OTP has expired (1 minute)
    const createdTime = new Date(otpRecord.createdAt).getTime();
    const currentTime = new Date().getTime();
    const timeDiff = (currentTime - createdTime) / 1000; // in seconds

    if (timeDiff > 60) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(401).json({ error: 'OTP has expired. Please request a new OTP' });
    }

    // Find user
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Hash new password
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(newPassword, salt);

    // Update user password
    user.passwordHash = passwordHash;
    await user.save();

    console.log('[Reset Password] User password updated successfully');

    // Delete OTP after successful verification
    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({
      message: 'Password reset successfully. You can now login with your new password.',
      success: true
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update user profile (name and optional password)
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const userId = req.user.userId;
    const { name, password } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update name if provided
    if (name && name.trim()) {
      user.name = name.trim();
    }

    // Update password if provided
    if (password && password.trim()) {
      const salt = await bcryptjs.genSalt(10);
      user.passwordHash = await bcryptjs.hash(password, salt);
    }

    // Update profile photo if provided
    if (req.file) {
      user.profilePhoto = `uploads/${req.file.filename}`;
    }

    await user.save();

    // Return updated user without passwordHash
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      apartmentNumber: user.apartmentNumber,
      address: user.address,
      profilePhoto: user.profilePhoto
    };

    res.json({
      message: 'Profile updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login, logout, sendLoginOTP, verifyLoginOTP, verifyCredentialsSendOTP, registerSendOTP, verifyRegistrationOTP, forgotPasswordSendOTP, resetPassword, updateProfile };
