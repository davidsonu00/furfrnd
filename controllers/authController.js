const userModel = require('../models/user-model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports.registerUser = async function (req, res) {
  try {
    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
      req.flash('error', 'All fields are required.');
      return res.redirect('/?modal=register');
    }

    const normalizedEmail = email.toLowerCase().trim();
   

    let existingUser = await userModel.findOne({ email: normalizedEmail });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    if (existingUser && existingUser.isVerified) {
      req.flash('error', 'Already registered, please login.');
      return res.redirect('/?modal=user-login');
    }

    if (existingUser && !existingUser.isVerified) {
      existingUser.fullname = fullname.trim();
      existingUser.password = hashedPassword;
      existingUser.verifyOtp = otp;
      existingUser.verifyOtpExpiry = expiry;
      await existingUser.save();
    } else {
      existingUser = await userModel.create({
        fullname: fullname.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: 'user',
        isVerified: false,
        verifyOtp: otp,
        verifyOtpExpiry: expiry
      });
    }

  

   await sendEmail(
  existingUser.email,
  'Furfrnd email verification code',
  `Welcome to Furfrnd.

Your email verification code is: ${otp}

This code expires in 10 minutes.

If you did not create this account, ignore this email.

- Furfrnd Team`
);

   

    req.flash('success', 'OTP sent to your email.');
    return res.redirect(`/?modal=otp&email=${encodeURIComponent(existingUser.email)}`);
  } catch (err) {
    console.log('registerUser error:', err);
    req.flash('error', 'Registration failed.');
    return res.redirect('/?modal=register');
  }
};

module.exports.verifyRegistrationOtp = async function (req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      req.flash('error', 'Email and OTP are required.');
      return res.redirect('/?modal=otp');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await userModel.findOne({ email: normalizedEmail });

    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/?modal=register');
    }

    if (
      !user.verifyOtp ||
      user.verifyOtp !== otp.trim() ||
      !user.verifyOtpExpiry ||
      user.verifyOtpExpiry.getTime() < Date.now()
    ) {
      req.flash('error', 'Invalid or expired OTP.');
      return res.redirect(`/?modal=otp&email=${encodeURIComponent(normalizedEmail)}`);
    }

    user.isVerified = true;
    user.verifyOtp = undefined;
    user.verifyOtpExpiry = undefined;
    await user.save();

    req.flash('success', 'Account verified. Please login.');
    return res.redirect('/?modal=user-login');
  } catch (err) {
    console.log('verifyRegistrationOtp error:', err);
    req.flash('error', 'OTP verification failed.');
    return res.redirect('/?modal=otp');
  }
};

module.exports.loginUser = async function (req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error', 'Email and password are required.');
      return res.redirect('/?modal=user-login');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await userModel.findOne({ email: normalizedEmail });

    if (!user) {
      req.flash('error', 'Email or password incorrect.');
      return res.redirect('/?modal=user-login');
    }

    if (!user.isVerified) {
      req.flash('error', 'Please verify your email first.');
      return res.redirect(`/?modal=otp&email=${encodeURIComponent(normalizedEmail)}`);
    }

    const result = await bcrypt.compare(password, user.password);

    if (!result) {
      req.flash('error', 'Email or password incorrect.');
      return res.redirect('/?modal=user-login');
    }

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    req.flash('success', 'Login successful.');
    return res.redirect('/shop');
  } catch (err) {
    console.log('loginUser error:', err);
    req.flash('error', 'Login failed.');
    return res.redirect('/?modal=user-login');
  }
};

module.exports.forgotPassword = async function (req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      req.flash('error', 'Email is required.');
      return res.redirect('/?modal=forgot');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await userModel.findOne({ email: normalizedEmail });

    if (!user) {
      req.flash('error', 'Email not registered.');
      return res.redirect('/?modal=forgot');
    }

    const otp = generateOtp();
    user.resetOtp = otp;
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendEmail(
      normalizedEmail,
      'Reset your password',
      `Your password reset code is ${otp}. It will expire in 10 minutes.`
    );

    req.flash('success', 'Reset OTP sent to your email.');
    return res.redirect(`/?modal=reset-otp&email=${encodeURIComponent(normalizedEmail)}`);
  } catch (err) {
    console.log('forgotPassword error:', err);
    req.flash('error', 'Could not send reset OTP.');
    return res.redirect('/?modal=forgot');
  }
};

module.exports.verifyResetOtp = async function (req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      req.flash('error', 'Email and OTP are required.');
      return res.redirect('/?modal=forgot');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await userModel.findOne({ email: normalizedEmail });

    if (
      !user ||
      !user.resetOtp ||
      user.resetOtp !== otp.trim() ||
      !user.resetOtpExpiry ||
      user.resetOtpExpiry.getTime() < Date.now()
    ) {
      req.flash('error', 'Invalid or expired OTP.');
      return res.redirect(`/?modal=reset-otp&email=${encodeURIComponent(normalizedEmail)}`);
    }

    req.flash('success', 'OTP verified. Set a new password.');
    return res.redirect(`/?modal=reset-password&email=${encodeURIComponent(normalizedEmail)}`);
  } catch (err) {
    console.log('verifyResetOtp error:', err);
    req.flash('error', 'OTP verification failed.');
    return res.redirect('/?modal=forgot');
  }
};

module.exports.resetPassword = async function (req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error', 'Email and new password are required.');
      return res.redirect('/?modal=reset-password');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await userModel.findOne({ email: normalizedEmail });

    if (!user || !user.resetOtp || !user.resetOtpExpiry || user.resetOtpExpiry.getTime() < Date.now()) {
      req.flash('error', 'Reset session expired. Try again.');
      return res.redirect('/?modal=forgot');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    req.flash('success', 'Password updated successfully. Please login.');
    return res.redirect('/?modal=user-login');
  } catch (err) {
    console.log('resetPassword error:', err);
    req.flash('error', 'Password reset failed.');
    return res.redirect('/?modal=forgot');
  }
};

module.exports.logout = function (req, res) {
  res.clearCookie('token');
  req.flash('success', 'Logged out successfully.');
  return res.redirect('/');
};

module.exports.adminLogin = async function (req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error', 'Email and password are required.');
      return res.redirect('/?modal=admin-login');
    }

    if (email.trim() !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
      req.flash('error', 'Invalid admin credentials.');
      return res.redirect('/?modal=admin-login');
    }

    const adminData = {
      id: 'admin',
      email: process.env.ADMIN_EMAIL,
      role: 'admin'
    };

    const token = jwt.sign(adminData, process.env.JWT_KEY, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    req.flash('success', 'Admin login successful.');
    return res.redirect('/admin');
  } catch (err) {
    console.log('adminLogin error:', err);
    req.flash('error', 'Admin login failed.');
    return res.redirect('/?modal=admin-login');
  }
};