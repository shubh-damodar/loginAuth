const mongoose = require('mongoose');
const personalSchema = new mongoose.Schema({
    email:{
        type:String
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
        default:["users"]
    },
    personId:{
        type:String
    },

})

module.exports = mongoose.model('personal',personalSchema)