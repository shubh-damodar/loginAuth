const express = require("express");
const Personal = require("../models/personal");
const Business = require("../models/business");
const utils = require("../utilfunction");
const router = express.Router();
const mongoose = require('mongoose')

router.post("/register", async (req, res) => 
{   
  let personal;
  let business;
  const password = await utils.getHash(req.body.password);
  let personId = new mongoose.Types.ObjectId()
  console.log(password);
  if (req.body.isBusiness === true) {
    const businessSchema = new Business({
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      personal: [],
      password,
      personId,
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
      business: [],
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
  return res.status(200).json({
    ...userDetails,
    token
  });
});

router.post("/link-account", async (req, res) => {
  let userDetails;
  let isBusiness = req.body.isBusiness;
  // let user = req.body.user;
  let checkiflinked;
  let newPersonId;
  let ObjectId = (id)=>{
    return mongoose.Types.ObjectId(id)
  }
  let obj = {
    id: req.body._id,
    email: req.body.email,
  };

  if (!req.headers.token) {
    return res.status(400).json({ error: "user identifier not provided" });
  }
  try {
    userDetails = await utils.verifyToken(req.headers.token);
  } catch (error) {
    return res.status(400).json({ error });
  }
 
  checkiflinked = userDetails.personal
    ? userDetails.personal
    : userDetails.business;
  let index = checkiflinked.findIndex(checkif => checkif.email === obj.email);
  if (index !== -1) {
    return res.status(400).json({ error: "account already linked" });
  }
  ObjectId(userDetails.personId) <= ObjectId(obj.personId)?newPersonId = userDetails.personId.toString():newPersonId = req.body.personId.toString();
  let newobj = {
    id: userDetails._id.toString(),
    email: userDetails.email,
  };
  console.log(newPersonId)
  if (isBusiness) {
    try {
      let business = await Business.updateOne(
        { _id: req.body._id },
        {$set:{personId:newPersonId}},
        { $push: { personal: newobj } }
      );
      let personal = await Personal.updateOne(
        { _id: userDetails._id },
        { $push: { business: obj } },
        {$set:{personId:newPersonId}}
      );
    } catch (error) {
      console.log(error);
    }
  } else {
    try {
      let personal = await Personal.updateOne(
        { _id: req.body._id },
        { $push: { personal: newobj } },
        {$set:{personId:newPersonId}}
      );
      let business = await Business.updateOne(
        { _id: userDetails._id },
        { $push: { business: obj } },
        {$set:{personId:newPersonId}}
      );
    } catch (error) {
      console.log(error);
    }
  }
  return res.status(200).json({ msg: "link successfully" });
});

module.exports = router;
