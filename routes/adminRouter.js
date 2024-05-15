const express = require('express')
const adminRouter = express.Router()

//controllers
const adminController = require('../controller/adminController/adminController')
const userDetailsController = require('../controller/adminController/userDetailsController')
const {isLoggedAdmin,isLogoutAdmin} = require('../middleware/adminAuth')


//login
adminRouter.get("/adminLogin",isLogoutAdmin,adminController.adminLoginPage)

//login post
adminRouter.post('/adminLogin',adminController.adminLogin)

//admin Home
adminRouter.get('/adminHome',isLoggedAdmin,adminController.adminHome)
adminRouter.get('/fetchdashboard',isLoggedAdmin,adminController.fetchDashboard)
adminRouter.get('/sales',isLoggedAdmin,adminController.sales)
adminRouter.post('/generate-report',isLoggedAdmin,adminController.generateReport)

//admin Logout
adminRouter.get('/adminLogout',adminController.adminLogout)

//user Page
adminRouter.get('/adminUserPage',isLoggedAdmin,userDetailsController.adminUserPage)
adminRouter.put('/usertoggle',isLoggedAdmin,userDetailsController.toggle)             //isBlocked toggle

//categories
adminRouter.get('/adminCategories',isLoggedAdmin,adminController.adminCategories)
//variant
adminRouter.get('/variantPage',isLoggedAdmin,adminController.variantPage)
adminRouter.post('/createVariant',isLoggedAdmin,adminController.createVariant)
//create new catgories
adminRouter.get('/createCategory',isLoggedAdmin,adminController.createNewCategorypage)
adminRouter.post('/createCategory',isLoggedAdmin,adminController.createNewCategory)
//edit Categories
adminRouter.get('/catEdit',isLoggedAdmin,adminController.editCategoryPage)
adminRouter.post('/catEdit',isLoggedAdmin,adminController.editCategory)
//list and unlist categories
adminRouter.put('/isList',isLoggedAdmin,adminController.isList)

//product page
adminRouter.get('/adminProductPage',isLoggedAdmin,adminController.productPage)
adminRouter.put('/isList_product',isLoggedAdmin,adminController.isList_product)
adminRouter.get('/createProduct',isLoggedAdmin,adminController.addProductPage)
adminRouter.post('/createProduct',isLoggedAdmin,adminController.addProduct)
adminRouter.get('/productEdit',isLoggedAdmin,adminController.productEditPage)
adminRouter.post('/productEdit',isLoggedAdmin,adminController.productEdit)
adminRouter.get('/deleteImage',isLoggedAdmin,adminController.deleteImage)
adminRouter.get('/bestProductPage',isLoggedAdmin,adminController.bestProductPage)
adminRouter.get('/bestCategoryPage',isLoggedAdmin,adminController.bestCategoryPage)

//order page
adminRouter.get('/adminOrders',isLoggedAdmin,adminController.orders)
adminRouter.get('/adminOrderDetails',isLoggedAdmin,adminController.orderDetails)
adminRouter.patch('/orderStatusUpdate',isLoggedAdmin,adminController.orderStatusUpdate)
adminRouter.get('/adminNotification',isLoggedAdmin,adminController.adminNotification)
adminRouter.get('/adminApprove',isLoggedAdmin,adminController.adminApprove)


//coupon 
adminRouter.get('/couponList',isLoggedAdmin,adminController.couponList)
adminRouter.get('/addCoupon',isLoggedAdmin,adminController.addCouponPage)
adminRouter.post('/addCoupon',isLoggedAdmin,adminController.addCoupon)
adminRouter.get('/editCoupon',isLoggedAdmin,adminController.editCouponPage)
adminRouter.post('/editCoupon',isLoggedAdmin,adminController.editCoupon)
adminRouter.patch('/unlistCoupon',isLoggedAdmin,adminController.couponBlock)
adminRouter.patch('/listCoupon',isLoggedAdmin,adminController.couponUnblock)


//offerModules

adminRouter.get('/offers',isLoggedAdmin,adminController.offerPage)
adminRouter.get('/createOffer',isLoggedAdmin,adminController.addOfferPage)
adminRouter.post('/createOffer',isLoggedAdmin,adminController.createOffer)
adminRouter.put('/offerToggle',isLoggedAdmin,adminController.offerToggle)


module.exports = adminRouter;
