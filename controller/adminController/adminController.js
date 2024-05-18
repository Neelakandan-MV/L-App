require('dotenv').config()
const User = require('../../model/user_model')
const Categories = require('../../model/categoriesModel')
const Products = require('../../model/productModel')
const Variant = require('../../model/variantModel')
const Order = require('../../model/orderModel')
const Coupon = require('../../model/couponModel')
const Offer = require('../../model/offerModel')
const multer = require('multer')



async function chart() {
    try {
      const ordersPie = await Order.find()
      const ordersCount = {
        cashOnDelivery: 0,
        razorPay: 0,
        wallet: 0
      }
      const paymentMethod = {
        cashOnDelivery:'CashOnDelivery',
        razorPay:'razorPay',
        wallet :'Wallet'
      }
      ordersPie.forEach((order) => {
        if (order.paymentMethod === paymentMethod.cashOnDelivery) {
          ordersCount.cashOnDelivery++
        } else if (order.paymentMethod === paymentMethod.razorPay) {
          ordersCount.razorPay++
        } else if (order.paymentMethod === paymentMethod.wallet) {
          ordersCount.wallet++
        }
      })
  
      return ordersCount;
    } catch (error) {
      console.log("An error occured in orders count function chart", error.message);
    }
  }

//multer
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix);
    }
});

var upload = multer({
    storage: storage,
}).array("images", 5);
//

const adminLoginPage = (req, res) => {
    try {
        res.render('admin/adminLogin')
    } catch (error) {
        console.error(error);
    }
}
//Admin credentials
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

const adminLogin = (req, res) => {
    try {
        if (email != req.body.email &&
            password != req.body.password) {
            res.render('admin/adminLogin', { adminAlert: "invalid email and password", title: 'Admin Loginpage' })
        } else if (email != req.body.email) {
            res.render('admin/adminLogin', { adminAlert: 'Invalid Email or password', title: 'Admin Loginpage' })
        } else if (password != req.body.password) {
            res.render('admin/adminLogin', { adminAlert: 'Invalid password', title: 'Admin Loginpage' })
        } else if (
            email == req.body.email &&
            password == req.body.password
        ) {
            req.session.admin = req.body.email;
            req.session.isLoggedAdmin = true
            res.redirect('/adminHome');
        }
    } catch (error) {
        console.error(error)
    }
}

const adminHome = async (req, res) => {
    try {
        const products = await Products.find()
        const users = await User.find()
        const orders = await Order.find({paymentStatus:'paid'})
        const categories = await Categories.find()
        let totalOrderPrice = 0;
        orders.forEach(order => {
        totalOrderPrice += order.totalAmount || 0;
        });
        res.render('admin/adminHome', { title: 'Admin Dashboard',users,orders,categories,products,totalOrderPrice })
    } catch (error) {
        console.error(error)
    }
}


const generateReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
  
        const orders = await Order.find({
            date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }).populate('products.product');
        
        const reportData = orders.map((order, index) => {

            return {
                orderId: order._id,
                date: order.date,
                totalAmount:order.totalAmount,
                products: order.products.map(product => {
                    return {
                        productName: product.product.productTitle,
                        quantity: product.quantity,
                        price: product.price
                    };
                }),
                email: order.addresstoDeliver.userEmail,
                place: order.addresstoDeliver.place,
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus
            };
        });
        res.status(200).json({ reportData });
    } catch (err) {
        console.error('Error generating report:', err);
        res.status(500).json({ error: 'Failed to generate report' });
    }
  };


const fetchDashboard = async (req, res, next) => {
    try {
      const users = await User.find().exec();
      const orders = await Order.find().exec();
      const products = await Products.find().exec();
      const ordersPie = await chart();

      res.json({
        users: users,
        orders: orders,
        products: products,
        ordersPie: ordersPie,
      });
    } catch (err) {
      next(err);
    }
  }

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const sales = async (req, res) => {
    try {
      const { timeframe } = req.query;
      let startDate, endDate;
  
      if (timeframe === 'weekly') {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 6); 
        endDate = new Date();
      } else if (timeframe === 'monthly') {
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1); 
        endDate = new Date();
      } else if (timeframe === 'yearly') {
        endDate = new Date();
        startDate = new Date(endDate.getFullYear(), 0, 1);
      } else {
        return res.status(400).json({ error: 'Invalid timeframe' });
      }
  
      const orders = await Order.find({
        date: { $gte: startDate, $lte: endDate },
        paymentStatus: 'paid'
      });
      
      const salesData = {};
      if (timeframe === 'weekly') {
        for (let i = 0; i < 7; i++) {
          const date = formatDate(new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000)));
          salesData[date] = 0;
        }
      } else if (timeframe === 'monthly') {
        for (let i = 0; i < 30; i++) {
          const date = formatDate(new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000)));
          salesData[date] = 0;
        }
      }else if (timeframe === 'yearly') {
        for (let i = 0; i < 12; i++) {
          const monthStartDate = new Date(startDate.getFullYear(), i, 1);
          const monthEndDate = new Date(startDate.getFullYear(), i + 1, 1);
          const monthSales = orders.filter(order => order.date >= monthStartDate && order.date <= monthEndDate);
          const monthTotalSales = monthSales.reduce((total, order) => total + order.totalPrice, 0);
          salesData[monthStartDate.toISOString()] = monthTotalSales;
        }
      }
      orders.forEach(order => {
        const date = formatDate(order.date);
        salesData[date] += order.totalAmount;
      });
      const labels = Object.keys(salesData).map(date => formatDate(new Date(date)));
      const values = Object.values(salesData);
      res.json({ labels, values });
    } catch (error) {
      console.error('Error fetching sales:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
const adminLogout = (req, res) => {
    try {
        req.session.admin = null;
        req.session.isLoggedAdmin = false;
        res.render('admin/adminLogin', { adminAlert: 'Logged Out Successfully', title: 'Admin Login' })
        // res.redirect('adminLogin')
    } catch (error) {
        console.error(error)
    }
}
const adminCategories = async (req, res) => {
    try {
        const categoryDetails = await Categories.find({})
        res.render('admin/categoriesPage', { title: 'Caterogies', cat: categoryDetails })
    } catch (error) {
        console.error(error)
    }
}

//variants
const variantPage = (req, res) => {
    try {
        res.render('admin/addvariantPage')
    } catch (error) {
        console.error(error);
    }
}

const createVariant = async (req, res) => {
    try {
        const variants = req.body.variant
        const variantsDB = await Variant.find({ variant: variants })
        if (variantsDB[0]?.variant) {
            res.render('admin/addvariantPage', { alert: 'Variant already exists' })
        } else {
            const variantDetails = new Variant({
                variant: variants
            })
            await variantDetails.save()
            res.redirect('/adminProductPage')
        }
    } catch (error) {
        console.error(error);
    }
}


//create new categories

const createNewCategorypage = (req, res) => {
    try {
        res.render('admin/createCat')

    } catch (error) {
        console.error(error);
    }
}

//post method for new categories

const createNewCategory = async (req, res) => {
    try {
        
        const categoryName = req.body.category
        const categories = await Categories.find({},{category:true,_id:false})
        const categoryDescription = req.body.description
        const categoryRegx = /^[a-zA-Z0-9]+(?:[ -][a-zA-Z0-9]+)*$/;
        const categoryRegxCheck = categoryRegx.test(categoryName)
        categoryExists = categories.some(item=>item.category == categoryName)
        if(categoryExists){
            res.render('admin/createCat',{catAlert:'The category is already exists'})
        }else if(!categoryRegxCheck) {
            res.render('admin/createCat',{catAlert:'Invalid category name!'})
        }else{
        const categoryDetails = new Categories({
            category: categoryName,
            description: categoryDescription
        })
        const categorySaveDetails = await categoryDetails.save();
        
        res.redirect('/adminCategories')
    }
    } catch (error) {
        console.error();
    }
}

//edit Categories

const editCategoryPage = async (req, res) => {
    try {
        const _id = req.query.id;
        const categoryDetails = await Categories.findById({ _id: _id })
        res.render('admin/editCategory', { catDetails: categoryDetails })
    } catch (error) {
        console.error();
    }
}


const editCategory = async (req, res) => {
    try {
        const { category, description, id } = req.body;
        const categoryForEdit = await Categories.findById(id)
        if(category === categoryForEdit.category){
            await Categories.findOneAndUpdate({ _id: id }, { category, description })
            console.log('if works');
            res.redirect('/adminCategories')
        }else{
        const categoryRegx = /^[a-zA-Z0-9]+(?:[ -][a-zA-Z0-9]+)*$/;
        const allCategories = await Categories.find({},{category:true,_id:false})
        const categoryExists = allCategories.some(item=>item.category == category)
        const categoryRegxCheck = categoryRegx.test(category)
        const categoryDetails =await Categories.findById({_id:id})
        if(categoryExists){
            res.render('admin/editCategory',{catAlert:'The category is already exists',catDetails: categoryDetails})
        }else if(!categoryRegxCheck){
            res.render('admin/editCategory',{catAlert:'Invalid category name',catDetails: categoryDetails})
        }else{
        await Categories.findOneAndUpdate({ _id: id }, { category, description })
        res.redirect('/adminCategories')
        }
    }
    } catch (error) {
        console.error(error);
    }
}

const isList = async (req, res) => {
    try {
        const categoryId = req.query.catId
        const cats = await Categories.findOne({ _id: categoryId })
        if (cats.isList == true) {
            await Categories.findOneAndUpdate({ _id: categoryId }, { isList: false })
        } else {
            await Categories.findOneAndUpdate({ _id: categoryId }, { isList: true })
        }
    } catch (error) {
        console.error(error);
    }
}


//product page
const productPage = async (req, res) => {
    try {
        const page = req.query.page;
        const products = await Products.find({})
        res.render('admin/ProductPage', { products })
    } catch (error) {
        console.error(error);
    }
}


const isList_product = async (req, res) => {
    try {
        const productId = req.query.productId
        const products = await Products.findById({ _id: productId })
        const updatedIsBlocked = !products.isBlocked;
        await Products.updateOne({_id:productId},{ $set: { isBlocked: updatedIsBlocked } }, { new: true })
      

    } catch (error) {
        console.error(error);
    }
}


const addProductPage = async (req, res) => {
    try {

        const variants = await Variant.find({})
        const category = await Categories.find({isList:true})
        res.render('admin/addProductPage', { category, variant: variants, title: 'Add Products' })
    } catch (error) {
        console.error(error);
    }
}
const addProduct = async (req, res) => {
    upload(req, res,async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json(err);
        } else if (err) {
            return res.status(500).json(err);
        }
        const { productTitle, description, price, stock, category, productVariant } = req.body;
        
        const productExists = await Products.findOne({productTitle:productTitle})
        if(productExists){
            const variants = await Variant.find({})
        const category = await Categories.find({isList:true})
        return res.render('admin/addProductPage', { category, variant: variants, title: 'Add Products',alert:'Product Already Exists' })
        }

        const images = req.files.map(file => file.filename);

        const product = new Products({
            productTitle: productTitle,
            description: description,
            price: price,
            originalPrice: price,
            stock: stock,
            category: category,
            productVariant: productVariant,
            image: images
        });

        product.save()
            .then(() => {
                res.redirect('/adminProductPage');
            })
            .catch(error => {
                console.error('Error saving product:', error);
                res.status(500).send('Internal Server Error');
            });
    });
}

const productEditPage = async(req,res)=>{
    try {
        let category = await Categories.find({})
        let variant = await Variant.find({})
        let productId = req.query.productId
        let product = await Products.findById({_id:productId})
        // let image = product.image
        //this is for the retrieve the category and variant of the selected product
        let categorySelected = await Categories.findById({_id:product.category})
        let variantSelected = await Variant.findById({_id:product.productVariant})

        res.render('admin/productEdit',{category,categorySelected,variant,variantSelected,product})
    } catch (error) {
        console.error(error);
    }
}

const productEdit = async (req,res)=>{
    try {
        upload (req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                return res.status(500).json(err);
            } else if (err) {
                return res.status(500).json(err);
            }
            const { productTitle, description, price, stock, category, productVariant, productId } = req.body;
            let images = req.files.map(file => file.filename);
            const product = await Products.findOne({_id:productId})
            if(product.productTitle === productTitle){
            images = [...images,...product.image]
            await Products.findOneAndUpdate({_id:productId},{
                productTitle: productTitle,
                description: description,
                price: price,
                originalPrice: price,
                stock: stock,
                category: category,
                productVariant: productVariant,
                image:images,
            })
            .then(()=>{
                res.redirect('/adminProductPage')
            })
        }else{
            const productExists = await Products.findOne({productTitle})
            if(productExists){
                const variants = await Variant.find({})
                const category = await Categories.find({isList:true})
                res.render('admin/addProductPage', { category, variant: variants, title: 'Add Products',alert:'Product already exists' })
            }else{
                images = [...images,...product.image]
            await Products.findOneAndUpdate({_id:productId},{
                productTitle: productTitle,
                description: description,
                price: price,
                stock: stock,
                category: category,
                productVariant: productVariant,
                image:images,
            })
            .then(()=>{
                res.redirect('/adminProductPage')
            })
            }
        }
            
        });
    } catch (error) {
        console.error(error);
    }
}

const deleteImage = async (req, res) => {
    try {
        const imageToDelete = req.query.image;
        const productId = req.query.productId;
        const product = await Products.findById(productId);
        const updatedImages = product.image.filter(item => item !== imageToDelete);

        const updatedProduct = await Products.findByIdAndUpdate(
            productId,
            { image: updatedImages },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Failed to update product' });
        }
        //to render the edit page
        let category = await Categories.find({})
        let variant = await Variant.find({})
        let categorySelected = await Categories.findById({_id:product.category})
        let variantSelected = await Variant.findById({_id:product.productVariant})
        res.render('admin/productEdit',{category,categorySelected,variant,variantSelected,product:updatedProduct})
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


const orders = async(req,res)=>{
    try {
        const currentPage = +req.query.page || 1;
        const skip = (currentPage - 1) * 10;
        const ordersCount = await Order.countDocuments()
        const totalPages = Math.ceil(ordersCount / 10);
        const adminRequests = await Order.find({orderStatus:'waitingForAdminApproval'}).populate('userId')
        const orders = await Order.find().populate('userId').sort({_id:-1}).skip(skip).limit(10)
        res.render('admin/orderPage',{orders,currentPage,totalPages,adminRequests})
    } catch (error) {
        console.error(error);
    }
}
const orderDetails = async(req,res)=>{
    try {
        const orderId = req.query.orderId
        const order = await Order.findOne({_id:orderId}).populate('userId').populate('products.product')

        res.render('admin/orderDetailsPage',{order})
    } catch (error) {
        console.error(error);
    }
}

const orderStatusUpdate = async(req,res)=>{
    try {
        const orderStatus = req.query.value
        
        const orderId = req.query.orderId
        
        const order = await Order.findOne({_id:orderId})
        order.orderStatus = orderStatus
        order.save()
        res.status(200).json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


const couponList = async (req, res) => {
    try {
        const perPage = 8;
        const page = req.query.page || 1;

        const totalCoupons = await Coupon.countDocuments();
        const coupon = await Coupon.find()
            .skip(perPage * page - perPage)
            .limit(perPage);
        const totalPages = Math.ceil(totalCoupons / perPage);
        res.render('admin/coupon', {coupon,totalPages,currentPage: page,perPage});
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const addCouponPage = async(req,res)=>{
    try {
      res.status(200).render('admin/addCoupon')  
    } catch (error) {
        console.error(error);
    }
}

const addCoupon = async(req,res)=>{
    try {
        const {coupon_code,description,percentage,min_amount,max_amount,expiry_date}=req.body
        const existCoupon = await Coupon.findOne({coupon_code:coupon_code})
        if(existCoupon){
            return res.status(200).render('admin/addCoupon',{alert:'The Coupon already exists'})
        }
         const newCoupon = new Coupon({
            coupon_code:coupon_code,
            description:description,
            percentage:percentage,
            minimumAmount:min_amount,
            maximumAmount:max_amount,
            expiryDate:expiry_date
         })
         await newCoupon.save()
         res.redirect('/couponList')
    } catch (error) {
        console.error(error);
    }
}

const editCouponPage = async (req,res)=>{
    try {
        const couponId  =req.query.couponId
        const coupon = await Coupon.findById(couponId)
        res.status(200).render('admin/editCoupon',{coupon})
    } catch (error) {
        console.error(error);
        res.status(500).json({error:'Internal server error'})
    }
}

const editCoupon = async(req,res)=>{
    try{
        const {coupon_code,description,percentage,min_amount,max_amount,expiry_date,couponId}=req.body
        const coupon = await Coupon.findOne({_id:couponId})
        if(coupon.coupon_code === coupon_code){
            coupon.coupon_code = coupon_code;
            coupon.description = description;
            coupon.percentage = percentage;
            coupon.minimumAmount = min_amount;
            coupon.maximumAmount = max_amount;
            coupon.expiryDate = expiry_date;
            await coupon.save()
            res.redirect('/couponList')
        }else {
            const couponExists = await Coupon.findOne({coupon_code})
            if(couponExists){
            res.render('admin/editCoupon',{coupon,alert:'Coupon already exists'})
            }else{
                coupon.coupon_code = coupon_code;
                coupon.description = description;
                coupon.percentage = percentage;
                coupon.minimumAmount = min_amount;
                coupon.maximumAmount = max_amount;
                coupon.expiryDate = expiry_date;
                await coupon.save()
                res.redirect('/couponList')
            }
        }   
    } catch (error) {
        console.error(error);
        res.status(500).json({error:'Internal server error'})
    }
}

const couponUnblock = async(req,res)=>{
    try{
        const couponId = req.body.couponId
        await Coupon.updateOne({_id:couponId},{
            isListed:true
        })
        res.json({success:true})
    }catch (error) {
        console.error(error);
        res.status(500).json({error:'Internal server error'})
    }
}
const couponBlock = async(req,res)=>{
    try{
        const couponId = req.body.couponId
        await Coupon.updateOne({_id:couponId},{
            isListed:false
        })
        res.json({success:true})
    }catch (error) {
        console.error(error);
        res.status(500).json({error:'Internal server error'})
    }
}

const bestProductPage = async (req, res) => {
    try {
        const bestSellingProducts = await Order.aggregate([
            { $unwind: '$products' },
            { 
                $group: {
                    _id: '$products.product',
                    totalQuantity: { $sum: '$products.quantity' },
                },
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'products', 
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: '$product' },
            {
                $project: {
                    _id: '$product._id',
                    productTitle: '$product.productTitle',
                    totalQuantity: 1,
                },
            },
        ]);

        res.status(200).render('admin/bestProduct', { bestSellingProducts });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error'); 
    }
};

const bestCategoryPage = async (req, res) => {
    try {
        const CategoryIdsandTotalSales = await Order.aggregate([
            {
                $unwind: "$products"
            },
            {
                $group: {
                    _id: "$products.product",
                    totalSales: { $sum: "$products.quantity" }
                }
            },
            
        ]);

        const categoryId = CategoryIdsandTotalSales.map(async(item)=>{
            let products = await Products.findById(item._id)
            let category = await Categories.findById(products.category)
            return category._id
        })


        Promise.all(categoryId)
        .then(async(categoryIds) => {
            const bestSellingCategories = [];
        for (let i = 0; i < categoryIds.length; i++) {
            const category = await Categories.findOne({ _id: categoryIds[i] }, { category: true, _id: false });
            bestSellingCategories.push({ category, bestSellingCategory: CategoryIdsandTotalSales[i].totalSales });
        }
        bestSellingCategories.sort((a, b) => b.bestSellingCategory - a.bestSellingCategory);
        res.render('admin/bestCategory',{bestSellingCategories});
        })
        .catch((error) => {
            console.error('Error fetching category IDs:', error);
        });
    } catch (error) {
        console.error("Error:", error);
    }
};


const adminNotification = async(req,res)=>{
    try{
        const orders = await Order.find({orderStatus:'waitingForAdminApproval'}).populate('userId')
        res.render('admin/adminApprovalPage',{orders})
    } catch (error) {
        console.error("Error:", error);
    }
}

const adminApprove = async(req,res)=>{
    try{
        const orderId = req.query.orderId;
        console.log(orderId);
        const order = await Order.findById(orderId)
        order.orderStatus = 'approvedForReturn';
        order.save()
        res.redirect('/adminNotification')
    } catch (error) {
        console.error("Error:", error);
    }
}

const offerPage = async(req,res)=>{
    try{
        const offers = await Offer.find()
        const products = await Products.find()
        res.render('admin/offerPage',{offers})
    } catch (error) {
        console.error("Error:", error);
    }
}

const addOfferPage = async(req,res)=>{
    try{
        const category = await Categories.find({isList:true})
        const products = await Products.find({isBlocked:false})
        res.render('admin/addOfferPage',{category,products})
    } catch (error) {
        console.error("Error:", error);
    }
}

const createOffer = async(req,res)=>{
    try{
        const category = await Categories.find({isList:true})
        const products = await Products.find({isBlocked:false})
        const {name,discountOn,discountType,discountValue,expireOn,discountedProduct,discountedCategory}=req.body
        if(discountOn === 'category'){
            let categoryOfferExists = await Offer.findOne({discountedCategory})
            if(categoryOfferExists){
            return res.render('admin/addOfferPage',{category,products,alert:'Category offer already exists'}) 
            }
        const newOffer = new Offer({
            name,
            discountOn,
            discountType,
            discountValue,
            expireOn,
            discountedCategory,
        })
        await newOffer.save()
        const offerCategoryProducts = await Products.find({category:discountedCategory})
        if(discountType ==="fixedAmount"){
            const offerAmount = discountValue
            offerCategoryProducts.forEach(async(item)=>{
                item.price = item.price - offerAmount
                await item.save()
            })
            
        }else{
            offerCategoryProducts.forEach(async(item)=>{
                item.price = item.price - Math.floor((item.originalPrice*discountValue))/100
                await item.save()
            })
        }

    }else{
        let productOfferExists = await Offer.findOne({discountedProduct})
            if(productOfferExists){
            return res.render('admin/addOfferPage',{category,products,alert:'Product offer already exists'}) 
            }
        const newOffer = new Offer({
            name,
            discountOn,
            discountType,
            discountValue,
            expireOn,
            discountedProduct,
        })
        await newOffer.save()
        const offerProduct = await Products.findOne({_id:discountedProduct})
        if(discountType ==="fixedAmount"){
            const offerAmount = discountValue
            offerProduct.price = offerProduct.price - offerAmount
            offerProduct.save()
        }else{
            const offerAmount = Math.floor((offerProduct.originalPrice*discountValue))/100
            offerProduct.price = offerProduct.price - offerAmount
            offerProduct.save()
        }
    }
    res.redirect('/offers')
    } catch (error) {
        console.error("Error:", error);
    }
}

const offerToggle = async(req,res)=>{
    try{
        const offerId = req.query.offerId
        const offer = await Offer.findById(offerId)

        if(offer.discountOn === 'category'){
        const offerCategoryProducts = await Products.find({category:offer.discountedCategory})
            if(offer.discountType ==="fixedAmount"){
                const offerAmount = offer.discountValue
                offerCategoryProducts.forEach(async (item)=>{
                    if(offer.isActive){
                    item.price = item.price + offerAmount
                    }else{
                    item.price = item.price - offerAmount
                    }
                    await item.save()
                })
            }else{
                offerCategoryProducts.forEach(async(item)=>{
                if(offer.isActive){
                    item.price = item.price + Math.floor((item.originalPrice*offer.discountValue))/100 
                }else{
                    item.price = item.price - Math.floor((item.originalPrice*offer.discountValue))/100
                    }
                await item.save()
                })
        }
        }else{
            const offerProduct = await Products.findOne({_id:offer.discountedProduct})
            if(offer.discountType ==="fixedAmount"){
                const offerAmount = offer.discountValue
                if(offer.isActive){
                offerProduct.price = offerProduct.price + offerAmount
                }else{
                    offerProduct.price = offerProduct.price - offerAmount
                }
                offerProduct.save()
            }else{
                const offerAmount = Math.floor((offerProduct.originalPrice * offer.discountValue))/100
                if(offer.isActive){
                offerProduct.price = offerProduct.price + offerAmount
                }else{
                    offerProduct.price = offerProduct.price - offerAmount
                }
                offerProduct.save()
            }

        }
        offer.isActive = !offer.isActive
        offer.save()

    } catch (error) {
        console.error("Error:", error);
    }
}


module.exports = {
    adminLoginPage,
    adminLogin,
    adminHome,
    fetchDashboard,
    sales,
    adminLogout,
    adminCategories,
    createNewCategorypage,
    createNewCategory,
    editCategoryPage,
    editCategory,
    isList,
    productPage,
    addProductPage,
    addProduct,
    isList_product,
    variantPage,
    createVariant,
    productEditPage,
    productEdit,
    deleteImage,
    orders,
    orderDetails,
    orderStatusUpdate,
    couponList,
    addCouponPage,
    addCoupon,
    editCouponPage,
    bestProductPage,
    bestCategoryPage,
    editCoupon,
    couponUnblock,
    couponBlock,
    generateReport,
    adminNotification,
    adminApprove,
    offerPage,
    addOfferPage,
    createOffer,
    offerToggle,
}