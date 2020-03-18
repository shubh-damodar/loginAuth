const mongoose  = require('mongoose')

const addressSchema = new mongoose.Schema({
    addressline1:{
        type:String
    },
    addressline2:{
        type:String
    },
    city:{
        type:String
    },
    state:{
        type:String
    },
    country:{
        type:String
    },
    postalCode:{
        type:String
    }
},{_id:false})

const personalSchema = new mongoose.Schema(
    {
        personalEmail:{
            type:String
        },
        password:{
            type:String
        },
        mobileNumber:{
            type:String
        },
        countryCode:{
            type:String
        },
        emailVerified:{
            type:Boolean,
            default:true
        },
        mobileVerified:{
            type:Boolean,
            default:true
        },
        roles:{
            type:Array
        },
        securityQuestion:{
            type:Array
        }
    }
)

const companyDetailsSchema = new mongoose.Schema({
    companyName:{
        type:String
    },
    companyId:{
        type:String
    },
    companyNumber:{
        type:String
    },
    officeLocation:{
        type:String
    }
   
},{_id:false})

const businessSchema = new mongoose.Schema([{
    businessEmail:{
        type:String,
    },
    emailVerified:{
        type:Boolean,
        default:true
    },
    mobileVerified:{
        type:Boolean,
        default:true
    },
    password:{
       type:String
   },
    mobileNumber:{
    type:String
    },
    countryCode:{
    type:String
    },
   securityQuestion:{
       type:Array
   },
   companyDetails:companyDetailsSchema,
   roles:{
       type:Array
   }
}
   
])

const profileSchema = new mongoose.Schema({
    firstName:{
        type:String
    },
    lastName:{
        type:String
    },
    nickName:{
        type:String
    },
    dateOfBirth:{
        type:String
    },
    personal:[personalSchema],
    
    business:[businessSchema],
    address:addressSchema
    

})
module.exports = mongoose.model('profile',profileSchema)