const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema({
  email: {
    type: String
  },
  password: {
    type: String
  },
  firstName: {
    type: String
  },
  lastName: {
    type: String
  },
  companyName: {
    type: String
  },
  personal: {
    type: Array
  },
  roles: {
    type: Array,
    defualt: ["employee"]
  },
  personId:{
    type:String
  }
});

module.exports = mongoose.model("business", businessSchema);
