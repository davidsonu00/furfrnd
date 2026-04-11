const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middlewares/isLoggedIn');
const productModel = require('../models/product-model');
const upload = require('../config/multer-config');
const authController = require('../controllers/authController');

router.post('/login', authController.adminLogin);

router.get('/', isLoggedIn, async (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
        req.flash('error', 'Unauthorized access.');

        return res.redirect('/');
    }
   
    res.render('dashboard');
});

router.get('/create', isLoggedIn, (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
        req.flash('error', 'Unauthorized access.');
        return res.redirect('/');
    }
    res.render('createProduct');
});

router.post('/create', isLoggedIn, upload.single('image'), async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            req.flash('error', 'Unauthorized access.');
            return res.redirect('/');
        }

        const {
            name,
            price,
            discount,
            bgcolor,
            textcolor,
            panelcolor,
            age,
            vaccination,
            size,
            traits,
            description
        } = req.body;

        const newProduct = new productModel({
            image: req.file.buffer,
            name,
            price,
            discount,
            bgcolor,
            textcolor,
            panelcolor,
            age,
            vaccination,
            size,
            traits: traits ? traits.split(',').map(item => item.trim()) : [],
            description
        });

        await newProduct.save();

        req.flash('success', 'Product created successfully.');
        return res.redirect('/shop');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Something went wrong while creating product.');
        return res.redirect('/admin/create');
    }
});

module.exports = router;