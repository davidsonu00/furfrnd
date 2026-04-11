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

        let existingUser = await userModel.findOne({ email });

        if (existingUser && existingUser.isVerified) {
            req.flash('error', 'Already registered, please login.');
            return res.redirect('/?modal=user-login');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const otp = generateOtp();
        const expiry = Date.now() + 10 * 60 * 1000;

        if (existingUser && !existingUser.isVerified) {
            existingUser.fullname = fullname;
            existingUser.password = hashedPassword;
            existingUser.verifyOtp = otp;
            existingUser.verifyOtpExpiry = expiry;
            await existingUser.save();
        } else {
            await userModel.create({
                fullname,
                email,
                password: hashedPassword,
                role: 'user',
                isVerified: false,
                verifyOtp: otp,
                verifyOtpExpiry: expiry
            });
        }

        await sendEmail(
            email,
            'Verify your account',
            `Your verification code is ${otp}. It will expire in 10 minutes.`
        );

        req.flash('success', 'OTP sent to your email.');
        return res.redirect(`/?modal=register&step=otp&email=${encodeURIComponent(email)}`);
    } catch (err) {
        console.log(err);
        req.flash('error', 'Registration failed.');
        return res.redirect('/?modal=register');
    }
};

module.exports.verifyRegistrationOtp = async function (req, res) {
    try {
        const { email, otp } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect('/?modal=register');
        }

        if (user.verifyOtp !== otp || user.verifyOtpExpiry < Date.now()) {
            req.flash('error', 'Invalid or expired OTP.');
            return res.redirect(`/?modal=register&step=otp&email=${encodeURIComponent(email)}`);
        }

        user.isVerified = true;
        user.verifyOtp = undefined;
        user.verifyOtpExpiry = undefined;
        await user.save();

        req.flash('success', 'Account verified. Please login.');
        return res.redirect('/?modal=user-login');
    } catch (err) {
        console.log(err);
        req.flash('error', 'OTP verification failed.');
        return res.redirect('/?modal=register');
    }
};

module.exports.loginUser = async function (req, res) {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            req.flash('error', 'Email or password incorrect.');
            return res.redirect('/?modal=user-login');
        }

        if (!user.isVerified) {
            req.flash('error', 'Please verify your email first.');
            return res.redirect(`/?modal=register&step=otp&email=${encodeURIComponent(email)}`);
        }

        const result = await bcrypt.compare(password, user.password);

        if (!result) {
            req.flash('error', 'Email or password incorrect.');
            return res.redirect('/?modal=user-login');
        }

        const token = generateToken(user);
        res.cookie('token', token, { httpOnly: true });

        req.flash('success', 'Login successful.');

        if (user.role === 'admin') {
            return res.redirect('/admin');
        }

        return res.redirect('/shop');
    } catch (err) {
        console.log(err);
        req.flash('error', 'Login failed.');
        return res.redirect('/?modal=user-login');
    }
};

module.exports.forgotPassword = async function (req, res) {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            req.flash('error', 'Email not registered.');
            return res.redirect('/?modal=forgot');
        }

        const otp = generateOtp();
        user.resetOtp = otp;
        user.resetOtpExpiry = Date.now() + 10 * 60 * 1000;
        await user.save();

        await sendEmail(
            email,
            'Reset your password',
            `Your password reset code is ${otp}. It will expire in 10 minutes.`
        );

        req.flash('success', 'Reset OTP sent to your email.');
        return res.redirect(`/?modal=reset-otp&email=${encodeURIComponent(email)}`);
    } catch (err) {
        console.log(err);
        req.flash('error', 'Could not send reset OTP.');
        return res.redirect('/?modal=forgot');
    }
};

module.exports.verifyResetOtp = async function (req, res) {
    try {
        const { email, otp } = req.body;
        const user = await userModel.findOne({ email });

        if (!user || user.resetOtp !== otp || user.resetOtpExpiry < Date.now()) {
            req.flash('error', 'Invalid or expired OTP.');
            return res.redirect(`/?modal=reset-otp&email=${encodeURIComponent(email)}`);
        }

        req.flash('success', 'OTP verified. Set a new password.');
        return res.redirect(`/?modal=reset-password&email=${encodeURIComponent(email)}`);
    } catch (err) {
        console.log(err);
        req.flash('error', 'OTP verification failed.');
        return res.redirect('/?modal=forgot');
    }
};

module.exports.resetPassword = async function (req, res) {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user || !user.resetOtp || user.resetOtpExpiry < Date.now()) {
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
        console.log(err);
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

        if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
           
            req.flash('error', 'Invalid admin credentials.');
            return res.redirect('/?modal=admin-login');
        }

        const adminData = {
            id: 'admin',
            email: process.env.ADMIN_EMAIL,
            role: 'admin'
        };

        const token = jwt.sign(adminData, process.env.JWT_KEY);
        res.cookie('token', token, { httpOnly: true });
      

        req.flash('success', 'Admin login successful.');
        return res.redirect('/admin');
    } catch (err) {
        console.log(err);
        req.flash('error', 'Admin login failed.');
        return res.redirect('/?modal=admin-login');
    }
};