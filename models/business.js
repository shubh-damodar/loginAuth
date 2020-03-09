const mongoose = require('mongoose')
const businessSchema = new mongoose.Schema({
    email:{
        type:String,
        indexes:true
    },
    password:{
        type:String
    },
    firstName:{
        type:String
    },
    lastName:{
        type:String
    },
    companyName:{
        type:String
    },
    personId:{
        type:String
    },
    roles:{
        type:Array,
        defualt:["employee"]
    },
    mobileNumber:{
        type:String
    },
    countryCode:{
        type:String
    }

})

module.exports = mongoose.model('business',businessSchema)