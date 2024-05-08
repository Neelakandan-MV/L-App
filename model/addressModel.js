const mongoose = require('mongoose')

const addressSchema = mongoose.Schema({

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
    selected :{
        type:Boolean,
        required :true,
        default :false
    }
})

module.exports = mongoose.model('address',addressSchema)