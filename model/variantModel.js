const mongoose = require('mongoose')

const variantSchema = mongoose.Schema({
    variant : {
        type : String,
        required : true
    }
})

module.exports = mongoose.model('variant',variantSchema)