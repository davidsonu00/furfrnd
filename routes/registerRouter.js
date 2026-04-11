const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/', authController.registerUser);
router.post('/verify-otp', authController.verifyRegistrationOtp);
router.post('/login', authController.loginUser);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOtp);
router.post('/reset-password', authController.resetPassword);
router.get('/logout', authController.logout);

module.exports = router;