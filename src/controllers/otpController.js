const otpService = require('../services/otpService');
const apiResponse = require('../utils/apiResponse');
const { logEvent } = require('../services/auditService');

/**
 * Create OTP for review verification
 * POST /api/v1/otp/create
 */
exports.createOTP = async (req, res, next) => {
  try {
    const { email, type } = req.body;
    
    const result = await otpService.createOTP(email, type);
    
    // Log the OTP creation
    await logEvent({
      user: req.user,
      action: "otp_created",
      target: "OTP",
      targetId: null,
      details: { email: email.toLowerCase(), type },
      req,
    });
    
    return res.json(apiResponse.success(
      result, 
      'OTP sent successfully. Please check your email.'
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * Verify OTP for review verification
 * POST /api/v1/otp/verify
 */
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp, type } = req.body;
    
    const result = await otpService.verifyOTP(email, otp, type);
    
    // Log the OTP verification
    await logEvent({
      user: req.user,
      action: "otp_verified",
      target: "OTP",
      targetId: null,
      details: { email: email.toLowerCase(), type },
      req,
    });
    
    return res.json(apiResponse.success(
      result, 
      'OTP verified successfully'
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * Resend OTP for review verification
 * POST /api/v1/otp/resend
 */
exports.resendOTP = async (req, res, next) => {
  try {
    const { email, type } = req.body;
    
    const result = await otpService.resendOTP(email, type);
    
    // Log the OTP resend
    await logEvent({
      user: req.user,
      action: "otp_resent",
      target: "OTP",
      targetId: null,
      details: { email: email.toLowerCase(), type },
      req,
    });
    
    return res.json(apiResponse.success(
      result, 
      'OTP resent successfully. Please check your email.'
    ));
  } catch (err) {
    next(err);
  }
}; 