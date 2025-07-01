const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');
const otpValidator = require('../validators/otpValidator');

/**
 * @openapi
 * /otp/create:
 *   post:
 *     tags:
 *       - OTP
 *     summary: Create OTP for review verification
 *     description: Send OTP to user's email for review verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - type
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "john.doe@example.com"
 *               type:
 *                 type: string
 *                 enum: [review_verification, password_reset, email_verification]
 *                 description: Type of OTP
 *                 example: "review_verification"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP sent successfully. Please check your email."
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "john.doe@example.com"
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-01T12:00:00.000Z"
 *       400:
 *         description: Validation error
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Server error
 */
router.post('/create', otpValidator.create, otpController.createOTP);

/**
 * @openapi
 * /otp/verify:
 *   post:
 *     tags:
 *       - OTP
 *     summary: Verify OTP for review verification
 *     description: Verify the OTP code sent to user's email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - type
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "john.doe@example.com"
 *               otp:
 *                 type: string
 *                 description: 6-digit OTP code
 *                 example: "123456"
 *               type:
 *                 type: string
 *                 enum: [review_verification, password_reset, email_verification]
 *                 description: Type of OTP
 *                 example: "review_verification"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP verified successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "john.doe@example.com"
 *                     verifiedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-01T12:00:00.000Z"
 *       400:
 *         description: Invalid OTP or validation error
 *       500:
 *         description: Server error
 */
router.post('/verify', otpValidator.verify, otpController.verifyOTP);

/**
 * @openapi
 * /otp/resend:
 *   post:
 *     tags:
 *       - OTP
 *     summary: Resend OTP for review verification
 *     description: Resend OTP to user's email if the previous one expired
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - type
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "john.doe@example.com"
 *               type:
 *                 type: string
 *                 enum: [review_verification, password_reset, email_verification]
 *                 description: Type of OTP
 *                 example: "review_verification"
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP resent successfully. Please check your email."
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "john.doe@example.com"
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-01T12:00:00.000Z"
 *       400:
 *         description: No active OTP found
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Server error
 */
router.post('/resend', otpValidator.resend, otpController.resendOTP);

module.exports = router; 