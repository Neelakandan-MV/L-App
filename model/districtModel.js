const mongoose = require('mongoose')

const districtSchema = mongoose.Schema({

    name : {
        type : String,
        required : true
    }
})

module.exports = mongoose.model('district',districtSchema)