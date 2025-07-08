const emailService = require('./emailService');
const ApiError = require('../utils/apiError');
const OTP = require('../models/OTP');

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Create and send OTP 
 * @param {string} email - User's email
 * @param {string} type - OTP type
 * @returns {Promise<object>} OTP data
 */
const createOTP = async (email, type) => {
  try {
    // Check if there's an existing unexpired OTP for this email
    const existingOTP = await OTP.findOne({
      email: email.toLowerCase(),
      type: type,
      expiresAt: { $gt: new Date() },
      isVerified: false
    });

    if (existingOTP) {
      // If OTP was created less than 1 minute ago, don't create a new one
      const timeDiff = Date.now() - existingOTP.createdAt.getTime();
      if (timeDiff < 60000) { // 1 minute
        throw new ApiError('Please wait before requesting another OTP', 'OTP_RATE_LIMIT', 429);
      }
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create OTP record
    const otpRecord = new OTP({
      type,
      email: email.toLowerCase(),
      otp,
      expiresAt,
    });

    await otpRecord.save();

    // Send OTP via email
    try {
    
        await emailService.sendReviewVerificationOTP(email, otp);
      
    } catch (emailError) {
      console.log(emailError,'--------- emailError');
      // If email fails, delete the OTP record
      await OTP.findByIdAndDelete(otpRecord._id);
      throw new ApiError('Failed to send OTP email. Please try again.', 'EMAIL_SEND_FAILED', 500);
    }

    return {
      email: otpRecord.email,
      expiresAt: otpRecord.expiresAt,
      message: 'OTP sent successfully'
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to create OTP', 'OTP_CREATE_ERROR', 500);
  }
};

/**
 * Verify OTP 
 * @param {string} email - User's email
 * @param {string} otp - OTP code to verify
 * @param {string} type - OTP type
 * @returns {Promise<object>} Verification result
 */
const verifyOTP = async (email, otp, type) => {
  try {
    // Find the OTP record
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      type: type,
      expiresAt: { $gt: new Date() },
      isVerified: false
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      throw new ApiError('Invalid or expired OTP', 'INVALID_OTP', 400);
    }

    // Check if maximum attempts exceeded
    if (otpRecord.attempts >= 5) {
      throw new ApiError('Maximum OTP attempts exceeded. Please request a new OTP.', 'MAX_ATTEMPTS_EXCEEDED', 400);
    }

    // Increment attempts
    otpRecord.attempts += 1;

    // Verify OTP
    if (otpRecord.otp !== otp) {
      await otpRecord.save();
      throw new ApiError('Invalid OTP code', 'INVALID_OTP_CODE', 400);
    }

    // Mark as verified
    otpRecord.isVerified = true;
    otpRecord.verifiedAt = new Date();
    await otpRecord.save();

    return {
      email: otpRecord.email,
      verifiedAt: otpRecord.verifiedAt,
      message: 'OTP verified successfully'
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to verify OTP', 'OTP_VERIFY_ERROR', 500);
  }
};

/**
 * Resend OTP 
 * @param {string} email - User's email
 * @param {string} type - OTP type
 * @returns {Promise<object>} OTP data
 */
const resendOTP = async (email, type) => {
  try {
    // Find existing OTP record
    const existingOTP = await OTP.findOne({
      email: email.toLowerCase(),
      type: type,
      expiresAt: { $gt: new Date() },
      isVerified: false
    });

    if (!existingOTP) {
      throw new ApiError('No active OTP found. Please request a new OTP.', 'NO_ACTIVE_OTP', 400);
    }

    // Check if resend is allowed (minimum 1 minute interval)
    const timeDiff = Date.now() - existingOTP.updatedAt.getTime();
    if (timeDiff < 60000) { // 1 minute
      throw new ApiError('Please wait before requesting another OTP', 'OTP_RATE_LIMIT', 429);
    }

    // Generate new OTP
    const newOTP = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Update existing record
    existingOTP.otp = newOTP;
    existingOTP.expiresAt = expiresAt;
    existingOTP.attempts = 0;
    await existingOTP.save();

    // Send new OTP via email
    try {
    
        await emailService.sendReviewVerificationOTP(email, newOTP);
      
    } catch (emailError) {
      console.log(emailError,'emailError');
      throw new ApiError('Failed to send OTP email. Please try again.', 'EMAIL_SEND_FAILED', 500);
    }

    return {
      email: existingOTP.email,
      expiresAt: existingOTP.expiresAt,
      message: 'OTP resent successfully'
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to resend OTP', 'OTP_RESEND_ERROR', 500);
  }
};

/**
 * Clean up expired OTPs
 * @returns {Promise<number>} Number of deleted OTPs
 */
const cleanupExpiredOTPs = async () => {
  try {
    const result = await OTP.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
    return 0;
  }
};

module.exports = {
  createOTP,
  verifyOTP,
  resendOTP,
  cleanupExpiredOTPs,
  generateOTP
}; 