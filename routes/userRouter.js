const express = require('express')
const userController = require('../controller/userController/userController')
const emailController = require('../controller/userController/emailController')
const otpController = require('../controller/userController/otpController')
const {isUser,isLoggedUser,isActive} = require('../middleware/userAuth')

const userRouter = express();

userRouter.set('views','views/user');

userRouter.get('/userLogin',isLoggedUser,userController.userLoginPage)

userRouter.post('/userLogin',userController.userLogin)

userRouter.get('/userSignup',userController.userSignupPage)

userRouter.post('/userSignup',userController.userSignup)

userRouter.get('/',isActive,userController.userHomepage)

userRouter.get('/userLogout',userController.userLogout)

userRouter.post('/send-email', emailController.mailSender);

userRouter.get('/otpSignup', otpController.otpSignupPage)

userRouter.post('/otpSignup',otpController.otpSignup)

userRouter.get('/resendOtp',otpController.resendOtp)

//forgot Password
userRouter.get('/forgotPassword',userController.forgotPasswordPage)
userRouter.put('/emailInput',userController.emailValidationForPasswordResetting)
userRouter.get('/otpVerification',userController.otpPage)
userRouter.post('/otpSignupForPasswordResetting',userController.otpVerification)
userRouter.post('/resetPassword',userController.passwordResettingValidation)

//shop
userRouter.get('/shop',isActive,userController.shop)
userRouter.get('/sortedShop',isActive,userController.sortedShop)
userRouter.post('/shopFilteredProducts',isActive,userController.shopFilteredProducts)


//productpage

userRouter.get('/productPage',isActive,userController.productPages)

//userAccount

userRouter.get('/userAccount',isActive,userController.userAccountPage)

userRouter.post('/addAddress',isActive,userController.addAddress)

userRouter.get('/editAddress',isActive,userController.editAddressPage)

userRouter.post('/editAddress',isActive,userController.editAddress)

userRouter.get('/removeAddress',isActive,userController.removeAddress)

userRouter.post('/editUser',isActive,userController.editUser)

//cart
userRouter.get('/cart',isActive,userController.cartPage)
userRouter.post('/addToCart',isActive,userController.addToCart)
userRouter.put('/quantityIncrease',isActive,userController.quantityIncrease)
userRouter.put('/quantityDecrease',isActive,userController.quantityDecrease)
userRouter.get('/deleteCart',isActive,userController.deleteProductFromCart)

//wishList
userRouter.get('/userWishList',isActive,userController.wishListPage)
userRouter.patch('/addToWishList',isActive,userController.addToWishList)
userRouter.delete('/deleteWishList',isActive,userController.deleteWishList)

//checkout Page
userRouter.get('/checkoutPage',userController.checkoutPage)
userRouter.patch('/checkoutPage',userController.checkoutPageRefreshedForAddress)
userRouter.post('/cashOnDelivery',userController.cashOnDelivery)
userRouter.patch('/checkCoupon',userController.checkCoupon)

//razorPay
userRouter.post('/razorPay',userController.razorPay)
userRouter.post('/orderPlacing',userController.orderPlacing)

userRouter.get('/orders',userController.order)
userRouter.post('/failedOrder',userController.failedOrder)
userRouter.get('/orderDetails/:id',userController.orderDetailsPage)
userRouter.get('/downloadInvoice/:id',userController.downloadInvoice)
userRouter.get('/orderCancel',userController.orderCancel)
userRouter.get('/orderReturn',userController.orderReturn)
userRouter.post('/retryPayment',userController.retryPayment)
userRouter.get('/thankyou',userController.thankyouPage)

//change password
userRouter.get('/changePassword',userController.changePasswordPage)
userRouter.post('/changePassword',userController.changePassword)

//userWallet
userRouter.get('/wallet',userController.userWalletPage)
userRouter.post('/addAmount',userController.addAmount)
userRouter.post('/walletPayment',userController.walletPayment)


//singleOrderCancel
userRouter.get('/singleOrderCancel',userController.singleProductOrderCancel)


module.exports = userRouter;