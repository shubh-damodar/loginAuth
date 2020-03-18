const jwt = require('jsonwebtoken');
const mongoose =require('mongoose')
const bcrypt = require('bcryptjs');
const User = require('./models/personal');
const Account = require('./models/account');
 const {redis} = require('./redis/redis')
const  getJwtToken =async(userDetails,type)=>{
    userDetails = userDetails[0]
    let signupid = mongoose.Types.ObjectId(userDetails._id).toHexString()
    let signupToken=`TOKEN:${signupid}`
    await redis.set(userDetails._id,signupToken,60000)
    // await redis.hmset(`TOKENLIST:${userDetails._id}`, signupid , -1);
   return jwt.sign({_id:userDetails._id,roles:userDetails.roles,email:userDetails[type+"Email"],type:type},"thismysecretkey")
}

const verifyToken = async(token)=>{
    let details = jwt.decode(token)
    try {
        let decodedid =  await redis.get(details._id) 
        if(decodedid){
            const verifyToken = jwt.verify(token,"thismysecretkey")
            let userDetails;
                    try {
                        if (verifyToken.roles.indexOf("user") === -1){
                            userDetails = await Account.findOne({business:{$elemMatch:{_id:verifyToken._id}}}).select('-personal').lean();
                            
                        }else{ 
                            userDetails = await Account.findOne({personal:{$elemMatch:{_id:verifyToken._id}}}).select('-business').lean();
                          
                        }

                    } catch (error) {
                        console.log('ERROR', error);
                        throw error;
                    }
                    if (!userDetails) {
                        throw {
                            code:400,
                            error:"you are unauthorized to perform this operation"
                        }
                    }
                    userDetails[verifyToken.type] = userDetails[verifyToken.type].filter(user=>user[`${verifyToken.type}Email`] === verifyToken.email)
                    verifyToken.type === "personal"?userDetails["isBusiness"] = false:userDetails["isBusiness"] = true
                    return userDetails  
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
    console.log(password,enteredpassword)
    const compare = await bcrypt.compare(enteredpassword,password)
    console.log(compare)
    if (!compare) {
       throw{
          code:400,
          error:"Incorrect password" 
       }
      }

}
const getHash=async(password)=>{
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    return hashed
}
const linkAccounts =async(type,userDetails,email,password)=>{
    let accountToLink;
    let detailsArray;
    let loginAccountArray;
    let objectToMerge;
    if(userDetails.isBusiness){
      loginAccountArray = userDetails["business"][0]
    }else{
      loginAccountArray = userDetails["personal"][0]
    }
    if(!loginAccountArray.emailVerified || !loginAccountArray.mobileVerified){
      throw{
        code:400,
        error:"Your account isn't verified"
      }
    }
    try {
      accountToLink = await Account.findOne({[type]:{$elemMatch:{[`${type}Email`]:email}}}).lean()
    } catch (error) {
       throw error
    }
    if(!accountToLink){
      throw{
        code:400,
        error:"No account found"
      }
    }try {
      userDetails = await Account.findOne({_id:userDetails._id}).lean()
    } catch (error) {
      throw{
        code:503,
        error:"service unavailable"
      }
    }
    let index = userDetails[type].findIndex(user=>user[`${type}Email`]=== email)
    if(index!== -1){
      throw{ 
        code:400,
        error:"Account already Linked"
      }
    }
    detailsArray = accountToLink[type].filter(user=>user[`${type}Email`]=== email)
    detailsArray = detailsArray[0]
    try {
      await bcryptcompare(detailsArray.password,password)
    } catch (error) {
      throw error
    }
    if(!detailsArray.emailVerified || !detailsArray.mobileVerified){
     throw{
       code:400,
       error:"Your account is not verified"
     }
    }
    userDetails[type].push(detailsArray)
    try {
      await Account.updateOne({_id:userDetails._id},{$push:{[type]:detailsArray}})
      await Account.deleteOne({_id:accountToLink._id})
    } catch (error) {
      throw{
        code:503,
        error:"service unavailable"
      }
    }
    try {
        objectToMerge =await mergeaccount(userDetails,accountToLink)
    } catch (error) {
        throw error
    }
    return {accountToLink,objectToMerge}
  }
  const mergeaccount=async(loginAccount,accountToLink)=>{
      let ObjectToUpdate={};
      for(let keys in loginAccount){
        if (['_id', '__v'].indexOf(keys) > -1)
        continue;
          switch(keys){
              case 'firstName':
                  if(loginAccount[keys].toLowerCase() === accountToLink[keys].toLowerCase())
                  ObjectToUpdate[keys] = loginAccount[keys].charAt(0).toUpperCase() + loginAccount[keys].slice(1)
                  else
                  ObjectToUpdate[keys] = loginAccount[keys].charAt(0).toUpperCase() + loginAccount[keys].slice(1)+" "+accountToLink[keys].charAt(0).toUpperCase() + accountToLink[keys].slice(1)
                  break;
                case 'lastName':
                    if(loginAccount[keys].toLowerCase() === accountToLink[keys].toLowerCase())
                    ObjectToUpdate[keys] = loginAccount[keys].charAt(0).toUpperCase() + loginAccount[keys].slice(1)
                    else
                    ObjectToUpdate[keys] = loginAccount[keys].charAt(0).toUpperCase() + loginAccount[keys].slice(1)+" "+accountToLink[keys].charAt(0).toUpperCase() + accountToLink[keys].slice(1)
                   break;
                case 'nickName':
                        if(loginAccount[keys].toLowerCase() === accountToLink[keys].toLowerCase())
                        ObjectToUpdate[keys] = loginAccount[keys].charAt(0).toUpperCase() + loginAccount[keys].slice(1)
                        else
                        ObjectToUpdate[keys] = loginAccount[keys].charAt(0).toUpperCase() + loginAccount[keys].slice(1)+" "+accountToLink[keys].charAt(0).toUpperCase() + accountToLink[keys].slice(1)
                    break
                case  "dateOfBirth":
                        if(loginAccount[keys] === accountToLink[keys])
                        ObjectToUpdate[keys] = loginAccount[keys] 
                        else
                        ObjectToUpdate[keys] = loginAccount[keys]+" "+accountToLink[keys]
                break
                case  "address":
                   ObjectToUpdate[keys] = mergeAddress(loginAccount[keys],accountToLink[keys])
                   break 
                default:null
                    break;   
                
          }
          
      }
      return ObjectToUpdate
    //   try {
    //     //   await Account.updateOne({_id:loginAccount._id},{$set:ObjectToUpdate})
    //   } catch (error) {
    //       throw error
    //   }
  }
  const mergeAddress=(loginAddress,accountToLinkadress)=>{
      let address={}
      for(let key in loginAddress){
          if(loginAddress[key] ===accountToLinkadress[key]){
            address[key] = loginAddress[key]
          }else{
            address[key] = loginAddress[key] + accountToLinkadress[key]
          }
      }
      return address
  }
 const profileUpdate =async(type,userDetails,body)=>{
   let objectToUpdate;
   let profileDetails;
    if(type === "business"){
       objectToUpdate ={
        ...userDetails[type][0],
        companyDetails:{
          companyId:body.companyId,
          companyName:userDetails[type][0].companyDetails.companyName,
          officeLocation:body.officeLocation
        },
        securityQuestion:body.securityQuestion
      }
    }else{
      objectToUpdate ={
        ...userDetails[type][0],
        securityQuestion:body.securityQuestion
      }
    }
     profileDetails = profileObj(body)
      try {
        await Account.updateOne({_id:userDetails._id},{$pull:{[type]:{_id:objectToUpdate._id}}})
        await Account.updateOne({_id:userDetails._id},{$push:{[type]:objectToUpdate}})
        await Account.updateOne({_id:userDetails._id},{$set:profileDetails})
      } catch (error) {
        throw error
      }
 } 

 const profileObj=(body)=>{
   let profileObject={}
   let profileUpdate={}
   let address={}
   for(let key in body){
   switch(key){
     case 'firstName':
       profileUpdate["firstName"] = body.firstName
       break;
     case 'lastName':
       profileUpdate["lastName"] = body.lastName
       break;
      case 'dateOfBirth':
        profileUpdate["dateOfBirth"] = body.dateOfBirth
        break;
      case 'nickName':
         profileUpdate["nickName"] = body.nickName
        break;
      case 'addressline1':
        address["addressline1"] = body.addressline1
          break;
      case 'addressline2':
         address["addressline2"] = body.addressline2
          break;
      case 'city':
        address["city"] = body.city
            break;
      case 'postalCode':
        address["postalCode"] = body.postalCode
            break; 
       case 'country':  
       address["country"] = body.country

      break;    
   }
 }
 profileObject={...profileUpdate,"address":{...address}}
 return profileObject 
 }
 const generateOtp = ()=>{
  var digits = '0123456789'; 
  let OTP = ''; 
  for (let i = 0; i < 4; i++ ) { 
      OTP += digits[Math.floor(Math.random() * 10)]; 
  } 
  return OTP; 

 }
module.exports ={
    getJwtToken,
    verifyToken,
    bcryptcompare,
    destroyToken,
    linkAccounts,
    profileUpdate,
    getHash,
    generateOtp
}