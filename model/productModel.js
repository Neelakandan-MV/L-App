const mongoose = require('mongoose')

const productSchema = mongoose.Schema({
    // brandId : {
    //     type : String,
    //     required : true
    // },
    productTitle : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true 
    },
    price : {
        type : Number,
        required : true
    },
    stock : {
        type : Number,
        required : true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the _id field of the Category collection
        ref: 'Categories', // Reference to the Category model
        required: true
    },
    productVariant : {
        type : String,
        required : true
    },
    image : {
        type : Array,
        required : true
    },
    isBlocked : {
        type : Boolean,
        required : true,
        default : false
    },
    date: {
        type: Date,
        default: new Date(),
        required: true
    },
})

module.exports = mongoose.model('product',productSchema)