const express = require('express')
const router = express.Router()
const adminController = require('../controllers/admin/admin.Controller')
const addExplore = require('../controllers/explore/addOn.controller')
const { uploadImage } = require('../controllers/upload/images.controller')
const product = require('./../controllers/product/product.controller')
const bulkCreate = require('./../controllers/product/product.controller.example')
const { authentication, authrization } = require('./../middleware/admin/auth.middleware')

router.post('/uploadImage', uploadImage)
router.post('/register', adminController.create)
router.post('/login', adminController.login)

// product
router.post('/product/create', authentication, authrization, product.create)
router.put('/product/:productId', authentication, authrization, product.update)
router.delete('/product/:productId', authentication, authrization, product.remove)

// product create bulk
router.post('/product/create/bulk', authentication, authrization, bulkCreate)


// explore content here
router.post('/explore/create', authentication, authrization, addExplore)





module.exports = router