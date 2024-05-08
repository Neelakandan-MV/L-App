const mongoose = require('mongoose')
const User=require('../model/user_model')
const product=require('../model/productModel')

const cart = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
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
       
    }],
    totalPrice: {
        type: Number,
        required: false
    },
})
module.exports = mongoose.model('cart', cart)