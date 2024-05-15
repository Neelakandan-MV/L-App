const User = require('../../model/user_model');
const otpGenerator = require('otp-generator')
const OTP = require('../../model/otpModel')
const Product = require('../../model/productModel')
const Category = require('../../model/categoriesModel')
const Variant = require('../../model/variantModel')
const Address = require('../../model/addressModel')
const District = require('../../model/districtModel')
const Cart = require('../../model/cartModel')
const Order = require('../../model/orderModel')
const Wallet = require('../../model/walletModel')
const Coupon = require('../../model/couponModel')
const emailController = require('../userController/emailController')
const Razorpay = require('razorpay');
const easyinvoice = require('easyinvoice');
const { default: mongoose } = require("mongoose");
const WishList = require('../../model/wishListModel');
const fs = require('fs')
const path = require('path')
// const {RAZORPAY_KEY_ID,RAZORPAY_SECRET_KEY} = process.env

var instanceOfRazorPay = new Razorpay({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_SECRET_KEY,
  });


const userLoginPage = async (req, res) => {
    try {
        res.render('userLogin')
    } catch (error) {
        console.error(error)
        res.render('error',{error})
    }
}

const userSignupPage = async (req, res) => {
    try {
        res.render('userSignup',{title:'Signup'})
    } catch (error) {
        console.error(error)
        res.render('error',{error})
    }
}


const userLogin = async (req, res) => {
    try {
        const data = await User.findOne({ email: req.body.email })
        if(data){
        if (data.isBlocked == false) {
            if (req.body.email != data.email && req.body.password != data.password) {
                res.render('userLogin', { alert: 'Entered Email or Password is incorrect' })
            } else if (req.body.email != data.email) {
                res.render('userLogin', { alert: 'Entered Email is incorrect' })
            } else if (req.body.password != data.password) {
                res.render('userLogin', { alert: 'Entered Password is incorrect' })
            } else {
                req.session.user = req.body.email
                req.session.userId = data._id
                req.session.isLoggedUser = true;
                res.redirect('/')
            }
        } else {
            res.render('userLogin', { alert: "User is Blocked Temporarly" })
        }
    }else{
        res.render('userLogin',{ alert:'Signup and Try again'})
    }
    }
    catch (error) {
        console.error(error)
        res.render('error',{error})
    }
}

const userHomepage = async(req,res)=>{
    try {
        let userData = req.session.user
        let userId = req.session.userId
        const cart = await Cart.findOne({userId:userId})
        const products = await Product.find({isBlocked:false}).sort({date:-1})
        res.render('userHome',{ userData,page:'home',cart,products })
    } catch (error) {
        console.error(error)
        res.render('error',{error})
    }
}

const userLogout = (req,res)=>{
    try {
        req.session.user = null;
        req.session.isLoggedUser = false;
        res.redirect('/');
    } catch (error) {
        console.error(error)
        res.render('error')
    }
}

const userSignup =async (req,res)=>{
        try {
             req.session.userDetails = req.body;
             const email = req.session.userDetails.email
            // Check if user is already present
            const checkUserPresent = await User.findOne({ email: email});
            // If user found with provided email
            if (checkUserPresent) {
                return res.render('userSignup',{signupAlert:'Email already exist',title:'Signup'});
            }else{
              // Generate OTP
              let otp = otpGenerator.generate(6, {
                  upperCaseAlphabets: false,
                  lowerCaseAlphabets: false,
                  specialChars: false,
              });
      
              // Ensure OTP is unique
              let result = await OTP.findOne({ otp });
              while (result) {
                  otp = otpGenerator.generate(6, {
                      upperCaseAlphabets: false,
                      lowerCaseAlphabets: false,
                      specialChars: false,
                  });
                  result = await OTP.findOne({ otp });
              }
              //saving OTP to session

              req.session.otp = otp;

              // Save OTP to the database
              const otpPayload = { email, otp };
              const otpBody = await OTP.create(otpPayload);
              console.log('mail and otp',otpBody);
              let mailSender= emailController.mailSender;
              // Send OTP via email
              await mailSender(email, 'Verification Email', `<h3>Confirm your OTP</h3><h5>Here is your OTP: <b>${otp}</b></h5>`);
              // Rendering otp page
              return res.render('otp',{emailAlert:email })
            }      
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ success: false, error: error.message });
        }
    };


const shop = async (req, res) => {
    try {
        let userData = req.session.user;
        let userId = req.session.userId
        const cart = await Cart.findOne({userId})
        const category = await Category.find({isList:true})

        // Perform aggregation
        const product = await Product.aggregate([
            {
                $match: { isBlocked: false } // Match active products
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "category"
                }
            },
            {
                $unwind: "$category"
            },
            {
                $match: { "category.isList": true } // Match products with category.isList = true
            },
            
        ])
        res.render('shop', { product, userData, page: 'shop',cart,category });

    } catch (error) {
        console.log(error.message);
        res.render('error',{error})
    }
};


const productPages = async(req,res)=>{
    try {
        let userId = req.session.userId
        const cart = await Cart.findOne({userId})
        let userData = req.session.user
        const userArray = await User.find({email:userData},{_id:true})
        const [user] = userArray;
        const productId = req.query.productId
        const product = await Product.findById({_id:productId})
        const categoryId = product.category
        const category = await Category.findById({_id:categoryId})
        const variantId = product.productVariant
        const productVariant = await Variant.findById({_id:variantId})
        const variant = await Variant.find({})
        const allProducts = await Product.find({category:product.category}).populate('category');
        let productInWishlist = false
        if(req.session.userId){
        const userWishList = await WishList.findOne({userId})
        const productExist = userWishList.items.map((item)=>{
            if(item.product == productId){
                return productInWishlist = true
            }
        })
    }
        res.render('productPage',{product,page:'shop',userData,category,productVariant,variant,allProducts,user,cart,productInWishlist})
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}

//userAccount Details
const userAccountPage = async(req,res)=>{
    try {
        
        let userId = req.session.userId
        const cart = await Cart.findOne({userId})
        userData = req.session.user
        if(userData){
        const userDetails = await User.findOne({email:userData})
        const address = await Address.find({userEmail:userData})
        const districts = await District.find({},{name:true,_id:false})
        res.render('userAccountPage',{page:'accountpage',userData,user:userDetails,address,districts,cart})
        }else{
            res.redirect('/')
        }
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}

    const addAddress = async (req,res)=>{
        try {
            userData = req.session.user
            const {houseName,place,districts,pinCode,email} = req.body
            const address = await Address.find()
            if(address.length<1){
                const newAddress = new Address({
                    houseName:houseName,
                    place:place,
                    district:districts,
                    pinCode:pinCode,
                    userEmail:email,
                    selected:true
                })
                await newAddress.save()
            }else{
                const newAddress = new Address({
                    houseName:houseName,
                    place:place,
                    district:districts,
                    pinCode:pinCode,
                    userEmail:email,
                    selected:false
                })
                await newAddress.save()
            }
            res.redirect('/userAccount')
        } catch (error) {
            console.error(error);
        }
    }

const editUser = async(req,res)=>{
    try {
        const userData = req.session.user;
        const {username,email,phone} = req.body
        const existUsers = await User.find({email:email})
            await User.updateOne({email:userData},{$set:{username:username,email:email,phone:phone}})
            res.redirect('/userAccount')
        
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}

const editAddressPage = async(req,res)=>{
    try {
        let userId = req.session.userId
        const cart = await Cart.findOne({userId})
        const userData = req.session.user
        const addressId = req.query.addressId
        const address = await Address.findById({_id:addressId})
        const districts = await District.find()
        res.render('addressEdit',{userData,page:'hello',districts,address,cart})

    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}

const editAddress = async(req,res)=>{
    try {
        userData = req.session.user
        const {houseName,place,districts,pinCode,email,addressId} = req.body    
        await Address.updateOne({_id:addressId},{$set:{houseName,place,district:districts,pinCode,userEmail:email}})
        res.redirect('/userAccount')

    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}

const removeAddress = async(req,res)=>{
    try {
        const addressId = req.query.addressId
        await Address.deleteOne({_id:addressId})
        res.redirect('/userAccount')
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}


// cart

const cartPage = async (req,res)=>{
    try {
        const userData = req.session.user
        const address = await Address.find({userEmail:userData})
        const userId = req.session.userId
        const cart = await Cart.findOne({userId:userId}).populate('items.product')
        res.render('cartPage',{page:"cart",userData,cart,address})
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}

const addToCart = async (req, res) => {
    try {
        const productId = req.body.productId;
        const userId = req.body.userId;
        const cartDetails = await Cart.find({ userId: userId });
        const product = await Product.findById(productId);

        let cart;
        if (cartDetails.length === 0) {
            cart = new Cart({
                userId,
                items: [],
                totalPrice:0
            });
        } else {
            cart = cartDetails[0];
        }
        const productIndex = cart.items.findIndex(item => item.product.toString() === productId);
        if (productIndex === -1) {          //findIndex will return -1 if the condition not get satified
            cart.items.push({ product: productId, quantity:1, price: product.price ,});
            // await Product.updateOne({_id:productId},{$inc:{stock:-1}})
        } else {
            if(cart.items[productIndex].quantity >= product.stock){
                return res.json({success:false})
            }
            cart.items[productIndex].quantity += 1;
            cart.items[productIndex].price = product.price*cart.items[productIndex].quantity
            // await Product.updateOne({_id:productId},{$inc:{stock:-1}})        
        }
        let totalPrice = 0;
        for(i=0;i<cart.items.length;i++){
            totalPrice += cart.items[i].price*cart.items[i].quantity
        }
        cart.totalPrice = totalPrice

        await cart.save();
        return res.json({success:true})

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const quantityIncrease = async(req,res)=>{
    try {
        const userData = req.session.user
        const indexOfItems = req.query.index
        const user = await User.findOne({email:userData})
        const cart = await Cart.findOne({userId:user._id})
        const product = await Product.findOne({_id:cart.items[indexOfItems].product})
        if(cart.items[indexOfItems].quantity >= product.stock || cart.items[indexOfItems].quantity>=10){
            let data = false
            return res.json(data)
        }else{
        cart.items[indexOfItems].quantity++

        cart.items[indexOfItems].price = product.price*cart.items[indexOfItems].quantity

        let totalPrice = 0
        for(i=0;i<cart.items.length;i++){
            totalPrice += cart.items[i].price
            // totalPrice += cart.items[i].price*cart.items[i].quantity
        }
        cart.totalPrice = totalPrice
        await cart.save()

        // product.stock--
        await product.save()
        const data = await Cart.findOne({userId:user._id})
            res.json(data)
        }
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}

const quantityDecrease = async(req,res)=>{
    try {
        const userData = req.session.user
        const indexOfItems = req.query.index
        const user = await User.findOne({email:userData})
        const cart = await Cart.findOne({userId:user._id})
        const product = await Product.findOne({_id:cart.items[indexOfItems].product})
        cart.items[indexOfItems].quantity--

        cart.items[indexOfItems].price = product.price*cart.items[indexOfItems].quantity

        let totalPrice = 0
        for(i=0;i<cart.items.length;i++){
            // totalPrice += cart.items[i].price*cart.items[i].quantity
            totalPrice += cart.items[i].price
        }
        cart.totalPrice = totalPrice
        await cart.save()

        // product.stock++
        await product.save()
        const data = await Cart.findOne({userId:user._id})
        res.json(data)
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}


const deleteProductFromCart = async(req,res)=>{
    try {
        const productId = req.query.productId
        const userData = req.session.user
        const user = await User.findOne({email:userData})
        const cart = await Cart.findOne({userId:user._id})
        const product = await Product.findOne({_id:productId})
        await Cart.updateOne({userId:user._id},{$pull:{items:{product:productId}}})
        const newCart = await Cart.findOne({userId:user._id})

        let totalPrice = 0
        for(i=0;i<newCart.items.length;i++){
            totalPrice += newCart.items[i].price * newCart.items[i].quantity
        }
        newCart.totalPrice = totalPrice
        newCart.save()

        // product.stock++
        await product.save()

        res.redirect('/cart')
        // cart.totalPrice = 0
        
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}


const checkoutPage = async(req,res)=>{
    try { 
        const userData = req.session.user
        const userId = req.session.userId
        const user = await User.findOne({email:userData})
        const cartDetails = await Cart.findOne({userId:user._id}).populate('items.product')
        const address = await Address.findOne({userEmail:userData})
        const addresses = await Address.find({userEmail:userData})
        const districts = await District.find()
        const coupons = await Coupon.find({ userId:{$nin:userId}});
        const currentDate = new Date();
        const couponToUser = coupons.filter(coupon => {
            return (
                coupon.minimumAmount <= cartDetails.totalPrice &&
                coupon.isListed === true &&
                coupon.expiryDate >= currentDate
            );
        });
        res.render('checkoutPage',{userData,page:'checkoutPage',cart:cartDetails,address,addresses,user,districts,couponToUser})
        }
     catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}

const checkoutPageRefreshedForAddress = async(req,res)=>{
    try {
            const selectedAddressId = req.query.selectedAddressId
            const userData = req.session.user
            const user = await User.findOne({email:userData})
            const cartDetails = await Cart.findOne({userId:user._id}).populate('items.product')
            const address = await Address.findOne({_id:selectedAddressId})
            const addresses = await Address.find({userEmail:userData})

            const data = address
            res.json(data)
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}


const cashOnDelivery = async(req,res)=>{
    try {
        const userData = req.session.user
        const addressId = req.body.addressId
        const address = await Address.findOne({_id:addressId})
        const userId = req.session.userId
        const couponId = req.body.couponId
        const user = await User.findOne({email:userData})
        const cart = await Cart.findOne({userId:user._id}).populate('items.product')
        let products = cart.items.map((item)=>{
            return item
        })
        const productStocks = products.map(item=>item.quantity)
        const productIds = products.map(item=>item.product._id)
        for(let i=0;i<productIds.length;i++){
            let productStock = await Product.findOne({_id:productIds[i]},{stock:true})
            if(productStock.stock<=0){
                return res.json({success:false})
            }
            await Product.updateOne({_id:productIds[i]},{$inc:{stock:-productStocks[i]}})
            // await Product.updateOne({_id:productId},{$inc:{stock:-1}})
        }
        let totalAmount = cart.totalPrice
        let discountAmount = 0
        if (couponId) {
            const selectedCoupon = await Coupon.findOne({_id:couponId})
            const discountPrice = Math.ceil(cart.totalPrice*selectedCoupon.percentage/100)
            if(discountPrice > selectedCoupon.maximumAmount){
                 totalAmount =cart.totalPrice - selectedCoupon.maximumAmount
                 discountAmount = selectedCoupon.maximumAmount
            }else{
                totalAmount = cart.totalPrice - discountPrice
                discountAmount = discountPrice
            }
            await Coupon.updateOne({ _id: couponId }, {$push: { userId:userId }})
        }


        const orderDetails = new Order({
            userId:user._id,
            totalAmount :totalAmount,
            paymentMethod:'CashOnDelivery',
            products,
            addresstoDeliver:{
                houseName:address.houseName,
                place:address.place,
                district:address.district,
                pinCode:address.pinCode,
                userEmail:address.userEmail,
            },
            couponDiscount:discountAmount
            
        })
        await orderDetails.save()
        await Cart.updateOne({userId:user._id},{$set:{items:[]}})
        return res.json({success:true})
    }
     catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}

const razorPay = async(req,res)=>{
    try {
        const userId = req.session.userId
        const couponId = req.body.couponId
        const cart = await Cart.findOne({userId})
        let totalAmount = cart.totalPrice
        if (couponId) {
            const selectedCoupon = await Coupon.findOne({_id:couponId})
            const discountPrice = Math.ceil(cart.totalPrice*selectedCoupon.percentage/100)
            if(discountPrice > selectedCoupon.maximumAmount){
                 totalAmount =cart.totalPrice - selectedCoupon.maximumAmount+50
            }else{
                totalAmount = cart.totalPrice - discountPrice+50
            }
        }
        
        const paymentData = {
            amount: totalAmount*100,
            currency: 'INR',
            receipt: 'receipt_order_123',
            payment_capture: 1
        };
        const response = await instanceOfRazorPay.orders.create(paymentData);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
        res.render('error',{error})
    }
}

const orderPlacing = async(req,res)=>{
    try {
        const couponId = req.body.couponId
        const addressId = req.body.addressId
        const userData = req.session.user
        const userId = req.session.userId
        const user = await User.findOne({_id:userId})
        const cart = await Cart.findOne({userId})
        const addressforDelivery = await Address.findOne({_id:addressId})
        
        let products = cart.items.map((item)=>{
            return item
        })
        const productStocks = products.map(item=>item.quantity)
        const productIds = products.map(item=>item.product._id)
        for(let i=0;i<productIds.length;i++){
            let productStock = await Product.findOne({_id:productIds[i]},{stock:true})
            if(productStock.stock<=0){
                return res.json({success:false})
            }
            await Product.updateOne({_id:productIds[i]},{$inc:{stock:-productStocks[i]}})
            // await Product.updateOne({_id:productId},{$inc:{stock:-1}})
        }

        let totalAmount = cart.totalPrice
        let discountAmount = 0
        if (couponId) {
            const selectedCoupon = await Coupon.findOne({_id:couponId})
            const discountPrice = Math.ceil(cart.totalPrice*selectedCoupon.percentage/100)
            if(discountPrice > selectedCoupon.maximumAmount){
                 totalAmount =cart.totalPrice - selectedCoupon.maximumAmount
                 discountAmount = selectedCoupon.maximumAmount
            }else{
                totalAmount = cart.totalPrice - discountPrice
                discountAmount = discountPrice
            }
            await Coupon.updateOne({ _id: couponId }, {$push: { userId:userId }})
        }

        const orderDetails = new Order({
            userId:user._id,
            totalAmount :totalAmount,
            paymentMethod:'razorPay',
            products,
            addresstoDeliver:{
                houseName:addressforDelivery.houseName,
                place:addressforDelivery.place,
                district:addressforDelivery.district,
                pinCode:addressforDelivery.pinCode,
                userEmail:addressforDelivery.userEmail,
            },
            paymentStatus:'paid',
            couponDiscount:discountAmount,
        })
        await orderDetails.save()
        await Cart.updateOne({userId:user._id},{$set:{items:[]}})
        return res.json({success:true})
        // res.render('thankyou',{userData,page:'thankyou',cart})
        
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}

const thankyouPage = async (req,res)=>{
    try {
        const userData = req.session.user
        const userId = req.session.userId
        const cart = await Cart.findOne({userId})
        res.render('thankyou',{userData,cart,page:'thankyouPage'})
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}

const order = async(req,res)=>{
    try {
        const userData = req.session.user
        const perPage = 8;
        const page = req.query.page || 1;
        let userId = req.session.userId
        let orders = await Order.find({userId}).sort({date:-1}).skip(perPage * page - perPage).limit(perPage);
        let cart = await Cart.findOne({userId})
        const user = await User.findOne({email:userData})
        const totalOrders = await Order.countDocuments({ userId });
        const totalPages = Math.ceil(totalOrders / perPage);
        res.render('orders',{cart,orders,totalPages,currentPage:page,user,page:'order',userData})
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}

const orderDetailsPage = async(req,res)=>{
    try {
        const id = req.params.id
        const userData = req.session.user
        const userId = req.session.Id
        const cart = await Cart.findOne(userId).populate('items.product')
        const order = await Order.findById(id).populate('products.product')
        let totalPages = 1
        let currentPage = 1
        res.render('orderDetails',{cart,totalPages,currentPage,order,page:''})
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}

const orderCancel = async(req,res)=>{
    try {
        const userId = req.session.userId
        const orderId = req.query.orderId
        const order = await Order.findOne({_id:orderId})
        const wallet = await Wallet.findOne({userId})
        const products = await Product.find()
        order.orderStatus = 'Cancelled'
        order.products.map(async (item)=>{
            item.orderStatus = true
            const productId = item.product
            const stock = item.quantity
            return await Product.updateOne({ _id: productId }, { $inc: { stock: stock } });
        })
        await order.save()
        if(order.paymentStatus == 'paid'){
            order.paymentStatus = 'refunded'
            wallet.balance = wallet.balance+order.totalAmount
            wallet.history.push({
                amount:order.totalAmount,
                type:'credit',
                description:'Amount credited by the order cancellation'
            })
            await order.save()
            await wallet.save()
        }
        
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}

const orderReturnRequest = async(req,res)=>{
    try{
        const userId = req.session.userId
        const orderId = req.query.orderId
        const order = await Order.findOne({_id:orderId})
        const wallet = await Wallet.findOne({userId})
        // if(order.orderStatus == )
        order.orderStatus = 'waitingForAdminApproval'
        await order.save();
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}
const orderReturn = async(req,res)=>{
    try {
        const userId = req.session.userId
        const orderId = req.query.orderId
        const order = await Order.findOne({_id:orderId})
        const wallet = await Wallet.findOne({userId})
        // if(order.orderStatus == )
        order.orderStatus = 'returned'
        order.products.map(async (item)=>{
            item.orderStatus = true
            const productId = item.product
            const stock = item.quantity
            return await Product.updateOne({ _id: productId }, { $inc: { stock: stock } });
        })
        await order.save()
        if(order.paymentStatus == 'paid'){
            order.paymentStatus = 'refunded'
            wallet.balance = wallet.balance+order.totalAmount
            wallet.history.push({
                amount:order.totalAmount,
                type:'credit',
                description:'Amount credited by the Returning the order'
            })
            await order.save()
            await wallet.save()
        }

    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}


const changePasswordPage = async(req,res)=>{
    try{
    const userData = req.session.user
    const user = await User.findOne({email:userData})
    const cart = await Cart.findOne({userId:user._id})
    res.render('changePassword',{user,userData,page:'changePassword',cart})
    }catch(error){
        console.error(error);
        res.render('error',{error})
    }
}

const changePassword = async(req,res)=>{
    try {
        const userData = req.session.user
        const user = await User.findOne({email:userData})
        const cart = await Cart.findOne({userId:user._id})
        const {currentPassword,newPassword,newPasswordConfirm} = req.body
        if(user.password === currentPassword){
            user.password = newPassword
            user.save()
            res.render('changePassword',{user,userData,page:'changePassword',cart,success:'Password changed successfully'})
        }else{
            res.render('changePassword',{user,userData,page:'changePassword',cart,alert:'Entered password is wrong'})
        }
        
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}

const userWalletPage = async(req,res)=>{
    try {
        const userId = req.session.userId
        const user = await User.findOne({_id:userId})
        const wallet = await Wallet.findOne({userId:userId}).populate('userId')
        const cart = await Cart.findOne({ userId: userId })
        const cartLength = cart ? cart.items.length : 0;
        res.status(200).render('userWallet',{wallet,user,cartLength,page:'wallet',cart})

    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}

const addAmount = async (req, res) => {
    try {
        const userId = req.session.userId;
        const amount = req.body.amount;
        const userWallet = await Wallet.findOne({ userId: userId });
        userWallet.balance += parseInt(amount);
        userWallet.history.push({
            amount: parseInt(amount),
            type: 'credit',
            description:'Amount added through RazorPay'
        });
        await userWallet.save();
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ error: 'Internal server error' });
        res.render('error',{error})
    }
}

const walletPayment = async(req,res)=>{
    try {
        const userData = req.session.user
        const userId = req.session.userId
        const addressId = req.body.addressId
        const couponId = req.body.couponId
        const address = await Address.findOne({_id:addressId})
        const user = await User.findOne({email:userData})
        const cart = await Cart.findOne({userId:user._id}).populate('items.product')
        const wallet = await Wallet.findOne({userId:user._id})


        let totalAmount = cart.totalPrice
        let discountAmount =0
        if (couponId) {
            const selectedCoupon = await Coupon.findOne({_id:couponId})
            const discountPrice = Math.ceil(cart.totalPrice*selectedCoupon.percentage/100)
            
            if(discountPrice > selectedCoupon.maximumAmount){
                 totalAmount =cart.totalPrice - selectedCoupon.maximumAmount
                 discountAmount = selectedCoupon.maximumAmount;
            }else{
                totalAmount = cart.totalPrice - discountPrice
                discountAmount = discountPrice;
            }
            await Coupon.updateOne({ _id: couponId }, {$push: { userId:userId }})
        }

        if(wallet.balance >= totalAmount){

        let products = cart.items.map((item)=>{
            return item
        })
        const productStocks = products.map(item=>item.quantity)
        const productIds = products.map(item=>item.product._id)
        for(let i=0;i<productIds.length;i++){
            let productStock = await Product.findOne({_id:productIds[i]},{stock:true})
            if(productStock.stock<=0){
                return res.json({success:false})
            }
            await Product.updateOne({_id:productIds[i]},{$inc:{stock:-productStocks[i]}})
            // await Product.updateOne({_id:productId},{$inc:{stock:-1}})
        }


        const orderDetails = new Order({
            userId:user._id,
            totalAmount :totalAmount,
            paymentMethod:'Wallet',
            products,
            addresstoDeliver:{
                houseName:address.houseName,
                place:address.place,
                district:address.district,
                pinCode:address.pinCode,
                userEmail:address.userEmail,
            },
            paymentStatus:'paid',
            couponDiscount:discountAmount,
        })
        await orderDetails.save()
        await Cart.updateOne({userId:user._id},{$set:{items:[]}})

        wallet.balance -= parseInt(totalAmount)
        wallet.history.push({
            amount: parseInt(totalAmount),
            type:'debit',
            description:'Amount Paid to Order'
        }
        )
        await wallet.save()
        let data = true
        res.json(data)
    }else{
        let data = false
        res.json(data)
    }
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}

const singleProductOrderCancel = async(req,res)=>{
    try {
        const userId = req.session.userId
        const orderId = req.query.orderId
        const productId = req.query.productId
        const product = await Product.findOne({_id:productId})
        const wallet = await Wallet.findOne({userId})
        const order = await Order.findOne({_id:orderId})
        order.products.map(async (item)=>{
            if(productId == item.product._id){
                item.orderStatus = true
                product.stock += item.quantity
                if(order.paymentStatus = 'paid'){
                wallet.balance += item.price
                wallet.history.push({
                    amount:item.price,
                    type:'credit',
                    description:'Amount credited by cancelling a product from the Order',
                })
                await wallet.save()
            }
                await product.save()
                await order.save()
                //functionality for changing the orderStatus in the order if all the orderStatus field from the product array is true
                const orderStatusValues = order.products.map(item=> item.orderStatus)
                const allValuesTrue = orderStatusValues.every(value => value === true);
                if(allValuesTrue){
                    order.orderStatus = 'Cancelled'
                    await order.save()
                }
                return res.json(success=true)
            }})
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}


const shopFilteredProducts = async(req,res)=>{
    try {
        const userData = req.session.user
        const userId = req.session.userId
        const product = await Product.find({isBlocked:false})
        const category = await Category.find()
        const cart = await Cart.findOne({userId})
        const selectedCategoryId = req.body.selectedCategory
        if(selectedCategoryId != 'filterByCategory'){
        const filteredProduct = product.filter((item)=>{
            if(item.category == selectedCategoryId){
                return item
            }
        })
        const data = filteredProduct
        // res.render('shop', { product:filteredProduct, userData, page: 'shop',cart,category });
        res.json(filteredProduct)
    }else{
        res.json(filteredProduct = product)
    }
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}


const sortedShop = async(req,res)=>{
    try {
        const userData = req.session.user
        const userId = req.session.userId
        const cart = await Cart.findOne({userId})
        const category = await Category.find({isList:true})
        const product = await Product.find({isBlocked:false})
        const selectedOption = req.query.selectedOption
        if(selectedOption == 'ascending'){
            const product = await Product.find({isBlocked:false}).sort({price:1})
            res.render('shop', { product, userData, page: 'shop',cart,category });
        }else if(selectedOption == 'descending'){
            const product = await Product.find({isBlocked:false}).sort({price:-1})
            res.render('shop', { product, userData, page: 'shop',cart,category });
        }else {
            res.render('shop', { product, userData, page: 'shop',cart,category });
        }
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}

const addToWishList = async (req,res)=>{
    try {
        const userId = req.session.userId
        const productId = req.query.productId
        const userWishList = await WishList.findOne({userId})
        if (!userWishList) {
            const newWishlist = new WishList({
                userID: userId,
                items: [{
                    product: productId
                }],
            });
            await newWishlist.save();
        }
        const existingProduct = userWishList.items.find(item=>item.product == productId)
        if(existingProduct){
            return(res.json({message:'Product Already in WishList',icon:'warning'}))
        }else{
            userWishList.items.push({
                product:productId
            })
            res.json({ message: 'Product added to wishlist',icon:"success"});
        }
        await userWishList.save()

    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}


const wishListPage = async(req,res)=>{
    try {
        const userData = req.session.user
        const userId = req.session.userId
        const cart = await Cart.findOne({userId})
        const userWishList = await WishList.findOne({userId}).populate('items.product')
        res.render('wishList',{cart,userData,page:'wishList',userWishList})
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}

const deleteWishList = async(req,res)=>{
    try {
        const productId = req.query.productId
        const userId = req.session.userId
        const userWishList = await WishList.findOne({userId})
        userWishList.items =  userWishList.items.filter(item=>{
            return item.product != productId
        })
        userWishList.save()
        res.json({success:true})
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}


const checkCoupon = async(req,res)=>{
    try {
        const userId = req.session.userId
        const couponId = req.body.couponId
        const cart = await Cart.findOne({userId})
        const selectedCoupon = await Coupon.findOne({_id:couponId})
        const discountPrice = Math.ceil(cart.totalPrice*selectedCoupon.percentage/100)
        
        if(discountPrice > selectedCoupon.maximumAmount){
            const amountToPay =cart.totalPrice - selectedCoupon.maximumAmount
            res.json({totalAmount:amountToPay+50,couponId,discountAmount:selectedCoupon.maximumAmount,couponCode:selectedCoupon.coupon_code})
        }else{
            const amountToPay = cart.totalPrice - discountPrice
            res.json({totalAmount:amountToPay+50,couponId,discountAmount:discountPrice,couponCode:selectedCoupon.coupon_code})
        }
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}


const forgotPasswordPage = async(req,res)=>{
    try {
        res.render('forgotPasswordPage')
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}

const emailValidationForPasswordResetting = async(req,res)=>{
    try{
        const emailToVerify = req.query.email
        const userExists = await User.findOne({email:emailToVerify})
        if(userExists){
            req.session.userEmailToChangePassword = emailToVerify
            let data = true
            res.json(data)
        }else{
            let data = false
            res.json(data)
        }
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}


const otpPage = async(req,res)=>{
    try{
        const email = req.query.email

        let otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        // Ensure OTP is unique
        let result = await OTP.findOne({ otp });
        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
            result = await OTP.findOne({ otp });
        }
        //saving OTP to session

        req.session.otp = otp;

        // Save OTP to the database
        const otpPayload = { email, otp };
        const otpBody = await OTP.create(otpPayload);
        console.log('mail and otp',otpBody);
        let mailSender= emailController.mailSender;
        // Send OTP via email
        await mailSender(email, 'Verification Email', `<h3>Confirm your OTP</h3><h5>Here is your OTP: <b>${otp}</b></h5>`);
        // Rendering otp page
        return res.render('otpPageForPasswordResetting',{emailAlert:email })


    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}

const otpVerification = async (req,res)=>{
    try{
        const email = req.session.userEmailToChangePassword
        const userOtp = req.body.otp
        let response =await OTP.find({ email: email }).sort({ createdAt: -1 }).limit(1)
        let otp = response[0]?.otp;
        if(userOtp !== otp){
            res.status(200).json({ message: 'failed' });
            // res.render('otp',{signupAlert:'Invalid OTP'})
        }else{
            res.render('passwordResettingPage')
        }
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}


const passwordResettingValidation = async(req,res)=>{
    try{
        const email = req.session.userEmailToChangePassword
        const newPassword = req.body.newPassword
        if(newPassword && email){
            await User.updateOne({email},{$set:{password:newPassword}})
            res.redirect('/userLogin')
        }else{
            res.render('passwordResettingPage',{signupAlert:'Something Went Wrong'})
        }
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}


const downloadInvoice = async (req, res) => {
    try {
        const userId = req.session.userId
        const user = await User.findOne({_id:userId})
        const orderId = req.params.id;
        const order = await Order.findById(orderId);
        console.log('order:',order);
        let totalAmount = 0;
        for(let i=0;i<order.products.length;i++){
            totalAmount = totalAmount+ order.products[i].price*order.products[i].quantity
        }
        console.log("totalAmount : ",totalAmount);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const productsData = await Promise.all(order.products.map(async item => {
            const product = await Product.findById(item.product);
            if (!product) {
                throw new Error(`Product not found for ID: ${item.product}`);
            }
            return {
                "quantity": item.quantity,
                "description": product.productTitle,
                "taxRate": - order.couponDiscount/totalAmount*100,
                "price": product.price,
            };
        }));
        console.log('productData:-',productsData);
        
        const data = {
            "currency": "INR",
            "taxNotation": "vat",
            "marginTop": 25,
            "marginRight": 25,
            "marginLeft": 25,
            "marginBottom": 25,
            "logo": "https://public.easyinvoice.cloud/img/logo_en_original.png",
            "sender": {
                "company": "L-App",
                "address": "Maradu Kochi",
                "zip": "680013",
                "city": "Kerala",
                "country": "India"
            },
            "client": {
                "company": user.username,
                "address": order.addresstoDeliver.houseName,
                "zip": order.addresstoDeliver.pinCode,
                "city": order.addresstoDeliver.place,
                "country": "India"
            },
            "invoiceDate": order.date.toISOString(),
            "products": productsData,
            "bottomNotice": `Total Amount Paid : ${order.totalAmount}+50(Delivery charge)=${order.totalAmount+50}`,
        };

        const result = await easyinvoice.createInvoice(data);
        // result.calculations.subtotal = order.totalAmount
        // result.calculations.total = order.totalAmount+50

        const invoicesDir = path.join(__dirname, '..', 'invoices');
        if (!fs.existsSync(invoicesDir)) {
            fs.mkdirSync(invoicesDir);
        }

        const filePath = path.join(invoicesDir, `invoice_${orderId}.pdf`);
        fs.writeFileSync(filePath, result.pdf, 'base64');

        // Send the file as a response
        res.download(filePath, `invoice_${orderId}.pdf`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ err: 'Failed to generate invoice',error});
        res.render('error',{error})
    }
}


const failedOrder = async(req,res)=>{
    try {
        const couponId = req.body.couponId
        const addressId = req.body.addressId
        const userId = req.session.userId
        const user = await User.findOne({_id:userId})
        const cart = await Cart.findOne({userId})
        const addressforDelivery = await Address.findOne({_id:addressId})

        let products = cart.items.map((item)=>{
            return item
        })
        const productStocks = products.map(item=>item.quantity)
        const productIds = products.map(item=>item.product._id)
        for(let i=0;i<productIds.length;i++){
            let productStock = await Product.findOne({_id:productIds[i]},{stock:true})
            if(productStock.stock<=0){
                return res.json({success:false})
            }
            await Product.updateOne({_id:productIds[i]},{$inc:{stock:-productStocks[i]}})
            // await Product.updateOne({_id:productId},{$inc:{stock:-1}})
        }

        let totalAmount = cart.totalPrice
        if (couponId) {
            const selectedCoupon = await Coupon.findOne({_id:couponId})
            const discountPrice = Math.ceil(cart.totalPrice*selectedCoupon.percentage/100)
            if(discountPrice > selectedCoupon.maximumAmount){
                 totalAmount =cart.totalPrice - selectedCoupon.maximumAmount
            }else{
                totalAmount = cart.totalPrice - discountPrice
            }
            await Coupon.updateOne({ _id: couponId }, {$push: { userId:userId }})
        }

        const orderDetails = new Order({
            userId:user._id,
            totalAmount :totalAmount,
            paymentMethod:'razorPay',
            products,
            addresstoDeliver:{
                houseName:addressforDelivery.houseName,
                place:addressforDelivery.place,
                district:addressforDelivery.district,
                pinCode:addressforDelivery.pinCode,
                userEmail:addressforDelivery.userEmail,
            },
            paymentStatus:'failed'
        })
        await orderDetails.save()
        await Cart.updateOne({userId:user._id},{$set:{items:[]}})
        // res.render('thankyou',{userData,page:'thankyou',cart})
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}

const retryPayment = async(req,res)=>{
    try{
        const orderId = req.body.orderId
        const order = await Order.findOne({_id:orderId})
        if(order){
            order.paymentStatus = 'paid'
            order.save()
        }
        res.json(success = true)
    } catch (error) {
        console.error(error);
        res.render('error',{error})
    }
}


const aboutUs = async(req,res)=>{
    try {
        const userId = req.session.userId
        const userData = req.session.user
        const cart = await Cart.findById(userId) || null
        res.render('aboutUs',{userData,cart,page:'aboutUs'})
    } catch (error) {
        console.error(error);
    }
}
const services = async(req,res)=>{
    try {
        const userId = req.session.userId
        const userData = req.session.user
        const cart = await Cart.findById(userId) || null
        res.render('services',{userData,cart,page:'services'})
    } catch (error) {
        console.error(error);
    }
}
const blog = async(req,res)=>{
    try {
        const userId = req.session.userId
        const userData = req.session.user
        const cart = await Cart.findById(userId) || null
        res.render('blog',{userData,cart,page:'blog'})
    } catch (error) {
        console.error(error);
    }
}
const contactUs = async(req,res)=>{
    try {
        const userId = req.session.userId
        const userData = req.session.user
        const cart = await Cart.findById(userId) || null
        res.render('contactUs',{userData,cart,page:'contactUs'})
    } catch (error) {
        console.error(error);
    }
}



module.exports = {
    userLoginPage,
    userSignupPage,
    userLogin,
    userHomepage,
    userLogout,
    userSignup,
    shop,
    productPages,
    userAccountPage,
    addAddress,
    editUser,
    editAddressPage,
    editAddress,
    cartPage,
    addToCart,
    quantityIncrease,
    quantityDecrease,
    deleteProductFromCart,
    checkoutPage,
    checkoutPageRefreshedForAddress,
    cashOnDelivery,
    order,
    orderDetailsPage,
    orderCancel,
    orderReturn,
    changePasswordPage,
    changePassword,
    razorPay,
    orderPlacing,
    thankyouPage,
    userWalletPage,
    addAmount,
    walletPayment,
    singleProductOrderCancel,
    shopFilteredProducts,
    sortedShop,
    addToWishList,
    wishListPage,
    deleteWishList,
    checkCoupon,
    removeAddress,
    forgotPasswordPage,
    emailValidationForPasswordResetting,
    otpPage,
    otpVerification,
    passwordResettingValidation,
    downloadInvoice,
    failedOrder,
    retryPayment,
    aboutUs,
    services,
    blog,
    contactUs,
    orderReturnRequest,
    

}