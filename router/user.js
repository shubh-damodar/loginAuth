const express = require("express");
const Account = require("../models/account");
const mongoose = require("mongoose");
const utils = require("../utilfunction");
const {sms} = require('../otp');
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
  return res.status(200).json({
    "code":200,
    ...objectToBesend,
    token
  });
});

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
      return res.status(400).json(error)
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
  const countryCode = req.body.countryCode
  const otp = utils.generateOtp()
  try {
    response = await sms.newotp(mobile,otp,countryCode)

  } catch (error) {
     return res.status(400).json(error)
  }
  return res.status(200).json({details:response})
})

router.post('/resend-otp',async(req,res)=>{
  let response;
  let id = req.body.id;
  const newotp = utils.generateOtp()
   try {
    response = await sms.resendotp(id,newotp)
   } catch (error) {
     return res.status(503).json(error)
   }
   return res.status(200).json({details:response})

})
router.post('/validate-otp',async(req,res)=>{
  let response;
  let details={
    id:req.body.id,
    otp:req.body.otp
  }
  try {
    response = await sms.validateOtp(details)
  } catch (error) {
    return res.status(error.code).json(error)
  }
  return res.status(200).json({code:200,msg:"otp validate successfully"})
})
module.exports = router;
