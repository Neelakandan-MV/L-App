const mongoose = require('mongoose')
const wishListSchema  = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        require:true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
            require: true
        }
    }]
})
module.exports = mongoose.model('WishList',wishListSchema)