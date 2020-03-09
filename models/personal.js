const mongoose = require('mongoose');
const personalSchema = new mongoose.Schema({
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
    roles:{
        type:Array,
        default:["user"]
    },
    personId:{
        type:String
    },
    mobileNumber:{
        type:String
    },
    countryCode:{
        type:String
    }

})

module.exports = mongoose.model('personal',personalSchema)