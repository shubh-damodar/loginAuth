const express = require("express");
const Account = require("../models/account");
const mongoose = require("mongoose");
const Business = require("../models/business");
const LinkAccount = require("../models/linkaccount");
const utils = require("../utilfunction");
const {linkEmail} = require('../getNewEmail');
const {sms} = require('../nexmo');
const router = express.Router();

router.post("/register", async (req, res) => {
  let personal;
  let business;
  let userDetails;
  const password = await utils.getHash(req.body.password);
  if (req.body.isBusiness === true) {
    userDetails = await Account.findOne({business:{$elemMatch:{'businessEmail':req.body.email}}}).lean()
    if(userDetails){
      return res.status(400).json({error:"account already exist"})
    }
    userDetails = await Account.findOne({personal:{$elemMatch:{'personalEmail':req.body.email}}}).lean()
    if(userDetails){
      return res.status(400).json({error:"Email Registered with personal account"})
    }
    let businessArray =[
      {
        businessEmail:req.body.email,
        password:password,
        roles: ["employee"],
        countryCode:req.body.countryCode,
        mobileNumber:req.body.mobileNumber,
        companyDetails:{
          companyName:req.body.companyName,
        }
      }
    ]
    const businessSchema = new Account({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      business:businessArray,
    });
    try {
      business = await businessSchema.save();
    } catch (error) {
      console.log(error);
      return res.status(503).json(error);
    }
    return res.status(200).json(business);
  } else {
    userDetails = await Account.findOne({personal:{$elemMatch:{'personalEmail':req.body.email}}}).lean()
    if(userDetails){
      return res.status(400).json({error:"account already exist"})
    }
    userDetails = await Account.findOne({business:{$elemMatch:{'businessEmail':req.body.email}}}).lean()
    if(userDetails){
      return res.status(400).json({error:"Email Registered with Business account"})
    }
    let personalArray =[
      {
        personalEmail:req.body.email,
        password:password,
        roles: ["user"],
        mobileNumber:req.body.mobileNumber,
        countryCode:req.body.countryCode
        
      }
    ]
    const personalSchema = new Account({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      personal:personalArray,
     
    });
    try {
      personal = await personalSchema.save();
    } catch (error) {
      console.log(error);
      return res.status(503).json(error);
    }
    return res.status(200).json(personal);
  }
});
router.post("/login", async (req, res) => {
  const email = req.body.email.toLowerCase();
  const password = req.body.password;
  let token;
  let type;
  let userDetails;
  let userArray;
  // let otherDetails;
  // if(req.body.isBusiness === true){
  //   userDetails = await Account.findOne({business:{$elemMatch:{'businessEmail':email}}}).lean()
  // }
  // else if(req.body.isBusiness === false){
  //   userDetails = await Account.findOne({personal:{$elemMatch:{'personalEmail':email}}}).lean()
  // }
  // else{
    try {
      userDetails = await Account.findOne({personal:{$elemMatch:{'personalEmail':email}}}).lean();
      if(userDetails){
        userDetails["isBusiness"] = false,
        userArray = userDetails["personal"].filter(user=>user.personalEmail === email)
        userDetails["personal"] = userDetails["personal"].filter(user=>user.personalEmail !== email)
        type = "personal"
        try {
          await utils.bcryptcompare(userArray[0].password,password)
        } catch (error) {
           return res.status(error.code).json(error)
        }
        // otherDetails = await Business.findOne({email:email}).lean();
        // userDetails["isBusiness"] = false
        // if(otherDetails){
        //   return res.status(423).json({error:"You have both account with same email please select an option",code:423})
        // }
      }
      if (!userDetails) {
        userDetails = await Account.findOne({business:{$elemMatch:{'businessEmail':email}}}).lean();
        if(userDetails){
          userDetails["isBusiness"] = true,
          userArray = userDetails["business"].filter(user=>user.businessEmail === email)
          userDetails["business"] = userDetails["business"].filter(user=>user.businessEmail !== email)
          type = "business"
          try {
            await utils.bcryptcompare(userArray[0].password,req.body.password)
          } catch (error) {
             return res.status(error.code).json(error)
          }
        }
      }
      
      if (!userDetails) {
        return res.status(400).json({ error: "Incorrect email provided" ,code:400});
      }
    } catch (error) {
      return res.status(503).json({error:"service unavailable"})
    }
  
  // }
  // try {
  //   await utils.bcryptcompare(userDetails.password, password);
  // } catch (error) {
  //   return res.status(503).json({error:"service unavailable"})
  // }
  for(let userObj of userDetails["personal"]){
    delete userObj.password
  }
  for(let userObj of userDetails["business"]){
    delete userObj.password
  }
  let objectToBesend={
    ...userDetails,
    user:{
      ...userArray[0]
    } 
  }
  delete objectToBesend.user.password
  try {
    token = await utils.getJwtToken(userArray,type);
  } catch (error) {
    throw error;
  }
  //  try {
  //   let linkEmails = await linkEmail.getEmail(userDetails)
  //   userDetails["personal"] = linkEmails.personalArray
  //   userDetails["business"] = linkEmails.businessArray
  //  } catch (error) {
  //    throw error
  //  }
  return res.status(200).json({
    "code":200,
    ...objectToBesend,
    token
  });
});

// router.post("/link-account", async (req, res) => {
//   let userDetails;
//   let isBusiness = req.body.isBusiness;
//   let user = req.body.user;
//   let personalArray = [];
//   let businessArray = [];
//   let linkUser;
//   let token;
//   let linkAccount;
//   let newPersonId;
//   let session;
//   let opts;
//   let oldPersonId;
//   let obj = {};
//   const checkPassword = async (userDetails, password) => {
//     const compare = await utils.bcryptcompare(userDetails.password, password);
//     if (!compare) {
//       throw {
//         code:400,
//         error: "Incorrect password provided"
//       };
//     }
//   };
//   const ObjectId = id => {
//     return mongoose.Types.ObjectId(id);
//   };
//   if (!req.headers.token) {
//     return res.status(400).json({ error: "user identifier not provided" ,code:400});
//   }
//   try {
//     userDetails = await utils.verifyToken(req.headers.token);
//   } catch (error) {
//     return res.status(400).json(error);
//   }router.post('/delink-account',async(req,res)=>{
//   let userDetails;
//   let accountType;
//   let accountTobeLinkid = req.body.id;
//   let accountTobeDeLink;
//   let session;
//   let opts;
//   const checkPassword = async (userDetails, password) => {
//     const compare = await utils.bcryptcompare(userDetails.password, password);
//     if (!compare) {
//       throw {
//         error: "Incorrect password provided"
//       };
//     }
//   };
//   const removeAccount=async(personId,type,account,opts)=>{
//     let newid = new mongoose.Types.ObjectId();
//     let link;
//     try {
//       await LinkAccount.updateMany({personId:personId},{$pull:{[type]:{email:account.email}}},opts)
//      link =  await LinkAccount.updateMany({[type]:{$elemMatch:{email:account.email}}},{$pull:{[type]:{email:account.email}}},opts)
//      } catch (error) {
//          throw error
//      }
//     if(type === "business"){
//        await Business.updateOne({_id:account._id},{$set:{personId:newid}},opts)
//     }else{
//       await Personal.updateOne({_id:account._id},{$set:{personId:newid}},opts)
//     }
//   }
//   if (!req.headers.token) {
//     return res.status(412).json({ error: "user identifier not provided" ,code:412});
//   }
//   try {
//     userDetails = await utils.verifyToken(req.headers.token);
//   } catch (error) {
//     return res.status(400).json({ error :"token expired",code:412});
//   } 
//   try {
//     session = await LinkAccount.startSession()
//   } catch (error) {
//      throw error
//   }
//  if(req.body.isBusiness){
//    try {
//     accountTobeDeLink = await Business.findOne({_id:accountTobeLinkid}).lean()
//     accountType = "business"
//    } catch (error) {
//      throw error
//    }
//  }else{
//    try {
//     accountTobeDeLink = await Personal.findOne({_id:accountTobeLinkid}).lean()
//     accountType = "personal"
//    } catch (error) {
//      throw error
//    }
//  }
//  if(!accountTobeDeLink){
//    return res.status(400).json({error:"Incorrect id provided",code:400})
//  }
//  try {
//   await checkPassword(accountTobeDeLink,req.body.password)
// } catch (error) {
//   return res.status(400).json(error)
// }
// try {
//   session.startTransaction()
//   opts={session,new:true}
//   await removeAccount(accountTobeDeLink.personId,accountType,accountTobeDeLink,opts)
//   await session.commitTransaction()
//   session.endSession()
// } catch (error) {
//   console.log(error)
//   await session.abortTransaction()
//   session.endSession()
//   return res.status(503).json({error:"service unavailable",code:503})
// }
//  return res.status(200).json({message:"Account Delink Successfully",code:200})
// })

// router.post('/logout',async(req,res)=>{
//   let userDetails;
//   if (!req.headers.token) {
//     return res.status(400).json({ error: "user identifier not provided" ,code:400});
//   }
  
//    try{
//       await utils.destroyToken(req.headers.token)
//    }catch(error){
//      return res.status(400).json(error)
//    }
//    return res.status(200).json({message:"logout successfully",code:200})
// })

// router.get('/get-linked-accounts',async(req,res)=>{
//    let userDetails;
//    let emails;
//     if (!req.headers.token) {
//       return res.status(400).json({ error: "user identifier not provided" ,code:400});
//     }
//     try {
//       userDetails = await utils.verifyToken(req.headers.token);
//       try {
//         emails = await linkEmail.getEmail(userDetails)
//       } catch (error) {
//          return res.status(503).json({error:"service unavaliable",code:503})
//       }
//     } catch (error) {
//       return res.status(400).json(error);
//     }
//      return res.status(200).json({emails:emails})
// })
// router.post('/get-accounts',async(req,res)=>{
//   let email = req.body.email.toLowerCase()
//   try {
//     userDetails = await Personal.findOne({ email: email }).lean();
//     if(userDetails){
//       otherDetails = await Business.findOne({email:email}).lean();
//       if(otherDetails){
//         return res.status(423).json({error:"You have both account with same email please select an option",code:423})
//       }
//       userDetails["isBusiness"] = false
//     }
//   } catch (error) {
//       return res.status(503).json({error:"service unavailable"})
//   }
//   try {
//     if (!userDetails) {
//       userDetails = await Business.findOne({ email: email }).lean();
//       userDetails["isBusiness"] = true
//     }
//   } catch (error) {
//     return res.status(503).json({error:"service unavailable"})
//   }
//     if (!userDetails) {
//       return res.status(400).json({ error: "Incorrect email provided" ,code:400});
//     }
//     let objectToBesend ={
//       email:userDetails.email,
//       isBusiness:userDetails.isBusiness
//     }
//   return res.status(200).json({user:objectToBesend})

// })
//   let newobj = {
//     id: userDetails._id.toString(),
//     email: userDetails.email,
//     personId:userDetails.personId
//   };
//   // checkiflinked = userDetails.personal ? userDetails.personal :
//   const checkiflinked = async (array) => {
//     ObjectId(obj.personId) < ObjectId(userDetails.personId)
//       ? ((newPersonId = obj.personId), (oldPersonId = userDetails.personId))
//       : ((newPersonId = userDetails.personId), (oldPersonId = obj.personId));
//     linkAccount = await LinkAccount.find({ personId: oldPersonId }).lean();
//     if (linkAccount.length) {
//       for (let checkiflinked of linkAccount) {
//         let index = checkiflinked[array].findIndex(
//           checkif => checkif.email === obj.email
//         );
//         if (index !== -1) {
//           throw {
//             error: "already linked",
//             code:400
//           };
//         }
      
//       }
//     }
//   };
//   const acccountToLinked = async (personal, business,link,opts) => {
//     let objectToUpdate; 
//     // let accountToBeLinked = await LinkAccount.find({
//     //   personId: oldPersonId
//     // }).lean();
//     if (linkAccount.length) {
//       objectToUpdate = link === "personal"?personal[0] : business[0]
//       try {
//         await LinkAccount.updateMany(
//           { personId: oldPersonId },
//           { $set: { personId: newPersonId } },{$push:{[link]:objectToUpdate},opts}
//         );
//       } catch (error) {
//         console.log(error);
//       }
//     } else {
//       let linkedAccountObject = new LinkAccount({
//         personId: newPersonId,
//         personal,
//         business
//       });
//       console.log('linkAccount',linkedAccountObject)
//       try {
//         await linkedAccountObject.save(opts);
//       } catch (error) {
//         throw error;
//       }
//     }
//   };
  
//   if (isBusiness) {
//     try {
//       session = await Business.startSession()
//     } catch (error) {
//       throw error
//     }
//     try {
//       linkUser = await Business.findOne({ email: req.body.email }).lean();
//       if (!linkUser) {
//         return res.status(400).json({ error: "Incorrect email provided" });
//       }
//       try {
//         await checkPassword(linkUser, req.body.password);
//       } catch (error) {
//         return res.status(400).json(error);
//       }
//       obj["id"] = linkUser._id.toString();
//       obj["email"] = linkUser.email;
//       obj["personId"] = linkUser.personId
//       try {
//         await checkiflinked("business");
//       } catch (error) {
//         return res.status(400).json(error);
//       }
//       session.startTransaction()
//       opts = {session,new:true}
//       await Business.updateOne(
//         { _id: obj.id },
//         { $set: { personId: newPersonId } ,opts}
//       );
//       if(userDetails.roles.indexOf("employee") !==-1){
//         await Business.updateOne({_id:userDetails._id},{$set: { personId: newPersonId }},opts)
//         businessArray.push(obj,newobj)
//       }else{
//         await Personal.updateOne(
//           { _id: userDetails._id },
//           { $set: { personId: newPersonId } ,opts}
//         );
//         businessArray.push(obj);
//         personalArray.push(newobj);
//       }
//       await acccountToLinked(personalArray, businessArray,'business',opts);
//       await session.commitTransaction()
//       session.endSession()
//     } catch (error) {
//       await session.abortTransaction()
//        session.endSession()
//       throw error
//     }
//   } else {
//     try {
//      session =  await Personal.startSession()
//     } catch (error) {
//       throw error
//     }
//     try {
//     linkUser = await Personal.findOne({ email: req.body.email }).lean();
//       if (!linkUser) {
//         return res.status(400).json({ error: "Incorrect email provided" });
//       }
//       obj["id"] = linkUser._id.toString();
//       obj["email"] = linkUser.email;
//       obj["personId"] = linkUser.personId
//       try {
//         await checkPassword(linkUser, req.body.password);
//       } catch (error) {
//         return res.status(400).json(error);
//       }
//       try {
//         await checkiflinked( "personal");
//       } catch (error) {
//         return res.status(400).json(error);
//       }
//       session.startTransaction()
//       opts = {session,new:true}
//       await Personal.updateOne(
//         { _id: obj.id },
//         { $set: { personId: newPersonId },opts }
//       );
//       if(userDetails.roles.indexOf("user") !== -1 ){
//         await Personal.updateOne({_id:userDetails._id},{ $set: { personId: newPersonId } },opts)
//         personalArray.push(newobj,obj)
        
//       }else{
//         await Business.updateOne(
//           { _id: userDetails._id },
//           { $set: { personId: newPersonId },opts }
//         );
//         personalArray.push(obj);
//         businessArray.push(newobj);
//       }  
//       await acccountToLinked(personalArray, businessArray,'personal',opts);
//       await session.commitTransaction()
//        session.endSession()
//     } catch (error) {
//       await session.abortTransaction()
//        session.endSession()
//       throw error
//     }
//     try {
//       token = await utils.getJwtToken(linkUser);
//     } catch (error) {
//       throw error;
//     }
//   }
//   return res.status(200).json({ msg: "link successfully",user:linkUser ,token});
// });
// router.post('/delink-account',async(req,res)=>{
//   let userDetails;
//   let accountType;
//   let accountTobeLinkid = req.body.id;
//   let accountTobeDeLink;
//   let session;
//   let opts;
//   const checkPassword = async (userDetails, password) => {
//     const compare = await utils.bcryptcompare(userDetails.password, password);
//     if (!compare) {
//       throw {
//         error: "Incorrect password provided"
//       };
//     }
//   };
//   const removeAccount=async(personId,type,account,opts)=>{
//     let newid = new mongoose.Types.ObjectId();
//     let link;
//     try {
//       await LinkAccount.updateMany({personId:personId},{$pull:{[type]:{email:account.email}}},opts)
//      link =  await LinkAccount.updateMany({[type]:{$elemMatch:{email:account.email}}},{$pull:{[type]:{email:account.email}}},opts)
//      } catch (error) {
//          throw error
//      }
//     if(type === "business"){
//        await Business.updateOne({_id:account._id},{$set:{personId:newid}},opts)
//     }else{
//       await Personal.updateOne({_id:account._id},{$set:{personId:newid}},opts)
//     }
//   }
//   if (!req.headers.token) {
//     return res.status(412).json({ error: "user identifier not provided" ,code:412});
//   }
//   try {
//     userDetails = await utils.verifyToken(req.headers.token);
//   } catch (error) {
//     return res.status(400).json({ error :"token expired",code:412});
//   } 
//   try {
//     session = await LinkAccount.startSession()
//   } catch (error) {
//      throw error
//   }
//  if(req.body.isBusiness){
//    try {
//     accountTobeDeLink = await Business.findOne({_id:accountTobeLinkid}).lean()
//     accountType = "business"
//    } catch (error) {
//      throw error
//    }
//  }else{
//    try {
//     accountTobeDeLink = await Personal.findOne({_id:accountTobeLinkid}).lean()
//     accountType = "personal"
//    } catch (error) {
//      throw error
//    }
//  }
//  if(!accountTobeDeLink){
//    return res.status(400).json({error:"Incorrect id provided",code:400})
//  }
//  try {
//   await checkPassword(accountTobeDeLink,req.body.password)
// } catch (error) {
//   return res.status(400).json(error)
// }
// try {
//   session.startTransaction()
//   opts={session,new:true}
//   await removeAccount(accountTobeDeLink.personId,accountType,accountTobeDeLink,opts)
//   await session.commitTransaction()
//   session.endSession()
// } catch (error) {
//   console.log(error)
//   await session.abortTransaction()
//   session.endSession()
//   return res.status(503).json({error:"service unavailable",code:503})
// }
//  return res.status(200).json({message:"Account Delink Successfully",code:200})
// })

router.post('/logout',async(req,res)=>{
  let userDetails;
  if (!req.headers.token) {
    return res.status(400).json({ error: "user identifier not provided" ,code:400});
  }
  
   try{
      await utils.destroyToken(req.headers.token)
   }catch(error){
     return res.status(400).json(error)
   }
   return res.status(200).json({message:"logout successfully",code:200})
})

// router.get('/get-linked-accounts',async(req,res)=>{
//    let userDetails;
//    let emails;
//     if (!req.headers.token) {
//       return res.status(400).json({ error: "user identifier not provided" ,code:400});
//     }
//     try {
//       userDetails = await utils.verifyToken(req.headers.token);
//       try {
//         emails = await linkEmail.getEmail(userDetails)
//       } catch (error) {
//          return res.status(503).json({error:"service unavaliable",code:503})
//       }
//     } catch (error) {
//       return res.status(400).json(error);
//     }
//      return res.status(200).json({emails:emails})
// })
router.get('/get-linked-accounts',async(req,res)=>{
  let userDetails;
  let email;
  let loginAccount;
  if (!req.headers.token) {
    return res.status(400).json({ error: "user identifier not provided" ,code:400});
    }
    try {
      userDetails = await utils.verifyToken(req.headers.token);
    } catch (error) {
      return res.status(400).json(error);
    }
    try {
      loginAccount = await Account.findOne({_id:userDetails._id}).select('personal business').lean()
    } catch (error) {
      return res.status(503).json({error:"Service unavaliable"})
    }
    if(userDetails.isBusiness){
      email = userDetails.business[0].email
      loginAccount.business = loginAccount.business.filter(user=>user.email)
    }else{
      email = userDetails.personal[0].email
      loginAccount.personal = loginAccount.personal.filter(user=>user.email)
    }
  return res.status(200).json({linkedAccount:loginAccount})

})
router.post('/link-account',async(req,res)=>{
  let userDetails;
  let isBusiness = req.body.isBusiness;
  let password = req.body.password
 
  if (!req.headers.token) {
      return res.status(400).json({ error: "user identifier not provided" ,code:400});
      }
      try {
        userDetails = await utils.verifyToken(req.headers.token);
      } catch (error) {
        return res.status(400).json(error);
      }
    if(isBusiness){
      try {
       userDetails = await utils.linkAccounts("business",userDetails,req.body.email,password)
      } catch (error) {
        return res.status(400).json(error)
      }
   }else{
    try {
      userDetails = await utils.linkAccounts("personal",userDetails,req.body.email,password)
    } catch (error) {
      return res.status(error.code).json(error)
    }
   }
   return res.status(200).json({message:"Linked SuceessFully",userDetails:userDetails.accountToLink,objectToMerge:userDetails.objectToMerge,code:200})
})
router.post('/profile-update',async(req,res)=>{
  let userDetails;
  if (!req.headers.token) {
    return res.status(400).json({ error: "user identifier not provided" ,code:400});
    }
    try {
      userDetails = await utils.verifyToken(req.headers.token);
    } catch (error) {
      return res.status(400).json(error);
    }

    if(userDetails.isBusiness){
     utils.profileUpdate("business",userDetails,req.body)
    }else{
      utils.profileUpdate("personal",userDetails,req.body)
    }
    return res.status(200).json({message:"successfully updated"}) 
})
router.post('/send-otp',async(req,res)=>{
  let response;
  const mobile = req.body.mobileNumber;
  const otp = utils.generateOtp()
  response = await sms.newotp(mobile,otp)
  return res.status(200).json({details:response})
})

router.post('/resend-otp',async(req,res)=>{
  let response;
  let id = req.body.id;
  let newotp = req.body.otp
   try {
    response = await sms.resendotp(id,newotp)
   } catch (error) {
     return res.status(503).json(error)
   }
   return res.status(200).json({details:response})

})
module.exports = router;
