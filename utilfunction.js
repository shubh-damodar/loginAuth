const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/personal');
const Business = require('./models/business');
 
const  getJwtToken =async(userDetails)=>{
   return jwt.sign({_id:userDetails,roles:userDetails.roles},"thismysecretkey")
}

const verifyToken = async(token)=>{
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
    getHash
}