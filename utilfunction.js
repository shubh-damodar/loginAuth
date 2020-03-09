const jwt = require('jsonwebtoken');
const mongoose =require('mongoose')
const bcrypt = require('bcryptjs');
const User = require('./models/personal');
const Business = require('./models/business');
 const {redis} = require('./redis/redis')
const  getJwtToken =async(userDetails)=>{
    let signupid = mongoose.Types.ObjectId(userDetails._id).toHexString()
    let signupToken=`TOKEN:${signupid}`
    await redis.set(userDetails._id,signupToken,60000)
    await redis.hmset(`TOKENLIST:${userDetails._id}`, signupid , -1);
   return jwt.sign({_id:userDetails._id,roles:userDetails.roles},"thismysecretkey")
}

const verifyToken = async(token)=>{
    let details = jwt.decode(token)
    try {
        let decodedid =  await redis.get(details._id) 
        console.log(decodedid)
        if(decodedid){
            const verifyToken = jwt.verify(token,"thismysecretkey")
            let userDetails;
                    try {
                        if (verifyToken.roles.indexOf("user") === -1)
                            userDetails = await Business.find({ _id: verifyToken._id }).lean();
                        else userDetails = await User.find({ _id: verifyToken._id }).lean();
                    } catch (error) {
                        console.log('ERROR', error);
                        throw error;
                    }
                    if (!userDetails.length) {
                        throw error
                    }
                    return userDetails[0]  
        }else{
            throw {error:"Token expired",code:412}
        }
    } catch (error) {
        throw error
    }
    	
}
const destroyToken = async(token)=>{
    let decode = jwt.decode(token)
    let deletedToken = await redis.delete(decode._id)
    console.log(deletedToken)
    if(deletedToken){
        return true;
    }else{
        throw{
            code:412,
            error:"Invalid token"
        }
    }
}

const bcryptcompare = async(password,enteredpassword)=>{
    return await bcrypt.compare(enteredpassword,password)

}
const getHash=async(password)=>{
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    return hashed
}
module.exports ={
    getJwtToken,
    verifyToken,
    bcryptcompare,
    destroyToken,
    getHash
}