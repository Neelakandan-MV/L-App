const mongoose = require('mongoose')

const categories = new mongoose.Schema({
    category : {
        type: String,
        required :true
    },
    description : {
        type : String,
        required : true
    },
    isList : {
        type : Boolean,
        required : true,
        default : true
    }
})

module.exports = mongoose.model('Categories',categories)