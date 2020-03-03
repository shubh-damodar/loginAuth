const mongoose = require('mongoose')
const businessSchema = new mongoose.Schema({
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
    companyName:{
        type:String
    },
    personId:{
        type:String
    },
    roles:{
        type:Array,
        defualt:["employee"]
    }

})

module.exports = mongoose.model('business',businessSchema)