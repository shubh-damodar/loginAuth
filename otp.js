const {redis} = require('./redis/redis')
const mongoose = require('mongoose')
const accountSid ="ACd0a142dabb239969ac86e01a2ea890f5";
const authToken ="97948637007a8526ed9c8939ac9b6030 "


class Sms{
    client = require('twilio')(accountSid,authToken)
    otpexpireTime = 900
    otpattempt = 3;
    id = new mongoose.Types.ObjectId().toHexString()

    async sendSms(to,otp,countryCode){
        let otpToken =`OTP:${this.id}`;
        let otpDetails = {
            id:this.id,
            mobileNumber:to,
            countryCode,
            otp:otp,
            attempt:0,
        }
      let text = `your otp is ${otp}`
      try {
        await this.client.messages.create({
            from:"+12062086385",
            to:`${countryCode}${to}`,
            body:text
        })
      } catch (error) {
          throw {
              code:400,
              error:"incorrect number"
          }
      }
      
     
    //   for(let key in otpDetails){
    //       let fieldValue = `${key} ${otpDetails[key]}`
    //       try {
    //         await redis.hmset(otpToken,fieldValue,0)
    //       } catch (error) {
    //           throw error
    //       }
    //   }
    //  try {
        
    //  await redis.expire(otpToken,this.otpexpireTime) 
    //  } catch (error) {
    //      throw error
    //  }
           try {
            await redis.set(otpToken,JSON.stringify(otpDetails),this.otpexpireTime)
          } catch (error) {
              throw error
          }

    //  this.nexmo.message.sendSms("Vonage APIs",to,text,{type:'unicode'},(err,responseData)=>{
    //     if(err){
    //         throw err
    //     }else{
    //         console.dir(responseData)
    //     }
    // })
     return otpDetails
     
    }
    async newotp(to,otp,countryCode){
        let otpDetails;
      try {
         otpDetails =  await this.sendSms(to,otp,countryCode)
      } catch (error) {
          throw error
      }
      return otpDetails
    }
    async resendotp(id,newotp){

        let otpDetails;
        let otpToken =`OTP:${id}`
        let details = await redis.get(otpToken)
        this.value = 0;
        details = JSON.parse(details)
        console.log(details)
        if(details ===null ||!Object.keys(details).length){
            throw{
                code:400,
                error:"Invalid id"
            }
        }
        let res = await redis.delete(otpToken)
        try {
           otpDetails = await this.newotp(details.mobileNumber,newotp,details.countryCode) 
        } catch (error) {
            throw error
        }
        return otpDetails
    }
    async validateOtp(details){
        let otpToken =`OTP:${details.id}`;

        let tokenDetails = await redis.get(otpToken)
        tokenDetails = JSON.parse(tokenDetails)
        tokenDetails.attempt++
        if(!tokenDetails){
            throw{
                code:400,
                error:"Invalid id"
            }
        }
        if(tokenDetails.attempt > this.otpattempt){
            try {
               await redis.delete(otpToken) 
            } catch (error) {
                throw error
            }
            throw{
                code:400,
                error:"You have exceeded limit"
            }
        }
        if(tokenDetails.otp!==details.otp){
            try {
                await redis.delete(otpToken)
                await redis.set(otpToken,JSON.stringify(tokenDetails),this.otpexpireTime)
            } catch (error) {
                throw error
            }
            throw{
                code:400,
                error:"Invalid otp"
            }
        }
        return tokenDetails.mobileNumber
    }
}
module.exports={
    sms:new Sms
}