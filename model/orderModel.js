const mongoose = require('mongoose');
        const Product=require('./productModel')
        const User=require('./user_model')

        const orderSchema = new mongoose.Schema({
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            date: {
                type: Date,
                default: new Date(),
                required: true
            },
            totalAmount: {
                type: Number,
                required: true
            },
            paymentMethod: {
                type: String
            },
            products: [{
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'product',
                    required: true
                },
                price: {
                    type: Number,
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true
                },
                orderStatus: {
                    type: Boolean,
                    default:false
                }
            }],
            addresstoDeliver:{
                houseName : {
                    type : String,
                    required : true
                },
                place : {
                    type:String,
                    required : true
                },
                district : {
                    type:String,
                    required : true
                },
                pinCode : {
                    type:Number,
                    required : true
                },
                userEmail : {
                    type:String,
                    required : true
                },

            },
            orderStatus:{
                type:String,
                default: "Pending"
            },
            deliveredDate:{
                type:Date,
                default:''
            },
            couponDiscount:{
                type:Number,
                default:0,
            },
            paymentStatus:{
                type:String,
                default:'Pending'
            }
        });


        module.exports = mongoose.model('Order', orderSchema);