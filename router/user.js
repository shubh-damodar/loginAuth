const express = require("express");
const Personal = require("../models/personal");
const mongoose = require("mongoose");
const Business = require("../models/business");
const LinkAccount = require("../models/linkaccount");
const utils = require("../utilfunction");
const {linkEmail} = require('../getNewEmail');
const router = express.Router();

router.post("/register", async (req, res) => {
  let personId = new mongoose.Types.ObjectId().toString();

  console.log("in");
  let personal;
  let business;
  const password = await utils.getHash(req.body.password);
  console.log(password);
  if (req.body.isBusiness === true) {
    const businessSchema = new Business({
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      personId,
      password,
      companyName: req.body.companyName,
      roles: ["employee"]
    });
    try {
      business = await businessSchema.save();
    } catch (error) {
      console.log(error);
      return res.status(503).json(error);
    }
    return res.status(200).json(business);
  } else {
    const personalSchema = new Personal({
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      password,
      personId,
      roles: ["user"]
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
  const email = req.body.email;
  const password = req.body.password;
  let token;
  let userDetails;
  userDetails = await Personal.findOne({ email: email }).lean();
  if (!userDetails) {
    userDetails = await Business.findOne({ email: email }).lean();
  }
  if (!userDetails) {
    return res.status(400).json({ error: "Incorrect email provided" });
  }
  const compare = await utils.bcryptcompare(userDetails.password, password);
  if (!compare) {
    return res.status(400).json({ error: "Incorrect password provided" });
  }
  try {
    token = await utils.getJwtToken(userDetails);
  } catch (error) {
    throw error;
  }
   try {
    let linkEmails = await linkEmail.getEmail(userDetails.personId)
    userDetails["personal"] = linkEmails.personalArray
    userDetails["business"] = linkEmails.businessArray
   } catch (error) {
     throw error
   }
  return res.status(200).json({
    ...userDetails,
    token
  });
});

router.post("/link-account", async (req, res) => {
  let userDetails;
  let isBusiness = req.body.isBusiness;
  let user = req.body.user;
  let personalArray = [];
  let businessArray = [];
  let linkUser;
  let linkAccount;
  let newPersonId;
  let oldPersonId;
  let obj = {};
  const checkPassword = async (userDetails, password) => {
    const compare = await utils.bcryptcompare(userDetails.password, password);
    if (!compare) {
      throw {
        error: "Incorrect password provided"
      };
    }
  };
  const ObjectId = id => {
    return mongoose.Types.ObjectId(id);
  };
  if (!req.headers.token) {
    return res.status(400).json({ error: "user identifier not provided" });
  }
  try {
    userDetails = await utils.verifyToken(req.headers.token);
  } catch (error) {
    return res.status(400).json({ error });
  }
  let newobj = {
    id: userDetails._id.toString(),
    email: userDetails.email,
    personId:userDetails.personId
  };
  // checkiflinked = userDetails.personal ? userDetails.personal :userDetails.business
  const checkiflinked = async (array) => {
    ObjectId(obj.personId) < ObjectId(userDetails.personId)
      ? ((newPersonId = obj.personId), (oldPersonId = userDetails.personId))
      : ((newPersonId = userDetails.personId), (oldPersonId = obj.personId));
    console.log(newPersonId, oldPersonId);
    linkAccount = await LinkAccount.find({ personId: oldPersonId }).lean();
    if (linkAccount.length) {
      for (let checkiflinked of linkAccount) {
        let index = checkiflinked[array].findIndex(
          checkif => checkif.email === obj.email
        );
        if (index !== -1) {
          throw {
            error: "already linked"
          };
        }
      
      }
    }
  };
  const acccountToLinked = async (personal, business) => {
    // let accountToBeLinked = await LinkAccount.find({
    //   personId: oldPersonId
    // }).lean();
    if (linkAccount.length) {
      try {
        await LinkAccount.updateMany(
          { personId: oldPersonId },
          { $set: { personId: newPersonId } }
        );
      } catch (error) {
        console.log(error);
      }
    } else {
      let linkedAccountObject = new LinkAccount({
        personId: newPersonId,
        personal,
        business
      });
      try {
        await linkedAccountObject.save();
      } catch (error) {
        throw error;
      }
    }
  };
  if (isBusiness) {
    try {
      linkUser = await Business.findOne({ email: req.body.email }).lean();
      if (!linkUser) {
        return res.status(400).json({ error: "Incorrect email provided" });
      }
      try {
        await checkPassword(linkUser, req.body.password);
      } catch (error) {
        return res.status(400).json(error);
      }
      obj["_id"] = linkUser._id.toString();
      obj["email"] = linkUser.email;
      obj["personId"] = linkUser.personId
      try {
        await checkiflinked("business");
      } catch (error) {
        return res.status(400).json(error);
      }
      await Business.updateOne(
        { _id: obj._id },
        { $set: { personId: newPersonId } }
      );
      if(userDetails.roles.includes ==="employee"){
        await Business.updateOne({_id:userDetails._id},{$set: { personId: newPersonId }})
        businessArray.push(obj,newobj)
      }else{
        await Personal.updateOne(
          { _id: userDetails._id },
          { $set: { personId: newPersonId } }
        );
        businessArray.push(obj);
        personalArray.push(newobj);

      }
     
      await acccountToLinked(personalArray, businessArray);
    } catch (error) {
      console.log(error);
    }
  } else {
    try {
    linkUser = await Personal.findOne({ email: req.body.email }).lean();
      if (!linkUser) {
        return res.status(400).json({ error: "Incorrect email provided" });
      }
      obj["_id"] = linkUser._id.toString();
      obj["email"] = linkUser.email;
      obj["personId"] = linkUser.personId
      try {
        await checkPassword(linkUser, req.body.password);
      } catch (error) {
        return res.status(400).json(error);
      }
      try {
        await checkiflinked( "personal");
      } catch (error) {
        return res.status(400).json(error);
      }
      await Personal.updateOne(
        { _id: obj._id },
        { $set: { personId: newPersonId } }
      );
      if(userDetails.roles.includes === "user"){
        await Personal.updateOne({_id:userDetails},{ $set: { personId: newPersonId } })
        personalArray.push(newobj,obj)
        
      }else{
        await Business.updateOne(
          { _id: userDetails._id },
          { $set: { personId: newPersonId } }
        );
        personalArray.push(obj);
        businessArray.push(newobj);
      }
      
     
      await acccountToLinked(personalArray, businessArray);
    } catch (error) {
      console.log(error);
    }
  }
  return res.status(200).json({ msg: "link successfully",user:linkUser });
});

module.exports = router;
