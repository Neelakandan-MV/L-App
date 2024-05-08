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

userRouter.get('/userLogout',isUser,userController.userLogout)

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

userRouter.get('/userAccount',isActive,isUser,userController.userAccountPage)

userRouter.post('/addAddress',isActive,isUser,userController.addAddress)

userRouter.get('/editAddress',isActive,isUser,userController.editAddressPage)

userRouter.post('/editAddress',isActive,isUser,userController.editAddress)

userRouter.get('/removeAddress',isActive,isUser,userController.removeAddress)

userRouter.post('/editUser',isActive,isUser,userController.editUser)

//cart
userRouter.get('/cart',isActive,isUser,userController.cartPage)
userRouter.post('/addToCart',isActive,isUser,userController.addToCart)
userRouter.put('/quantityIncrease',isActive,isUser,userController.quantityIncrease)
userRouter.put('/quantityDecrease',isActive,isUser,userController.quantityDecrease)
userRouter.get('/deleteCart',isActive,isUser,userController.deleteProductFromCart)

//wishList
userRouter.get('/userWishList',isActive,isUser,userController.wishListPage)
userRouter.patch('/addToWishList',isActive,isUser,userController.addToWishList)
userRouter.delete('/deleteWishList',isActive,isUser,userController.deleteWishList)

//checkout Page
userRouter.get('/checkoutPage',isActive,isUser,userController.checkoutPage)
userRouter.patch('/checkoutPage',isActive,isUser,userController.checkoutPageRefreshedForAddress)
userRouter.post('/cashOnDelivery',isActive,isUser,userController.cashOnDelivery)
userRouter.patch('/checkCoupon',isActive,isUser,userController.checkCoupon)

//razorPay
userRouter.post('/razorPay',isActive,isUser,userController.razorPay)
userRouter.post('/orderPlacing',isActive,isUser,userController.orderPlacing)

userRouter.get('/orders',isActive,isUser,userController.order)
userRouter.post('/failedOrder',isActive,isUser,userController.failedOrder)
userRouter.get('/orderDetails/:id',isActive,isUser,userController.orderDetailsPage)
userRouter.get('/downloadInvoice/:id',isActive,isUser,userController.downloadInvoice)
userRouter.get('/orderCancel',isActive,isUser,userController.orderCancel)
userRouter.get('/orderReturn',isActive,isUser,userController.orderReturn)
userRouter.post('/retryPayment',isActive,isUser,userController.retryPayment)
userRouter.get('/thankyou',isActive,isUser,userController.thankyouPage)

//change password
userRouter.get('/changePassword',isActive,isUser,userController.changePasswordPage)
userRouter.post('/changePassword',isActive,isUser,userController.changePassword)

//userWallet
userRouter.get('/wallet',isActive,isUser,userController.userWalletPage)
userRouter.post('/addAmount',isActive,isUser,userController.addAmount)
userRouter.post('/walletPayment',isActive,isUser,userController.walletPayment)


//singleOrderCancel
userRouter.get('/singleOrderCancel',isActive,isUser,userController.singleProductOrderCancel)



//other pages
userRouter.get('/aboutUs',isActive,userController.aboutUs)
userRouter.get('/services',isActive,userController.services)
userRouter.get('/blog',isActive,userController.blog)
userRouter.get('/contactUs',isActive,userController.contactUs)


module.exports = userRouter;