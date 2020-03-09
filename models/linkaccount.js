const mongoose = require('mongoose');
const linkAccountSchema = new mongoose.Schema({
    personal:{
        type:Array
    },
    business:{
        type:Array
    },
    personId:{
        type:String,
        indexes:true
    }
})

module.exports = mongoose.model('linkAccount',linkAccountSchema)