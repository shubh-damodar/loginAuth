const Nexmo = require('nexmo');
const {redis} = require('./redis/redis')
const mongoose = require('mongoose')

class Sms{
    nexmo = new Nexmo({
        apiKey:'d2ef4ee9',
        apiSecret:'O5Z4lXzvvYqoA8pl'
    },{debug:true})
    otpexpireTime = 900
    otpattempt = 3
    id = new mongoose.Types.ObjectId().toHexString()

    async sendSms(to,otp){
        let otpToken =`OTP:${this.id}`;
        let otpDetails = {
            id:this.id,
            mobileNumber:to,
            otp:otp,
            attempts: 0
        }
      let text = `your otp is ${otp}`
    
     try {
        
         await redis.hmset(otpToken,JSON.stringify(otpDetails),0)
     await redis.expire(otpDetails.id,this.otpexpireTime) 
     } catch (error) {
         throw error
     }
     this.nexmo.message.sendSms(otp,to,text,{type:'unicode'},(err,responseData)=>{
        if(err){
            throw err
        }else{
            console.dir(responseData)
        }
    })
     return otpDetails
    }
    async newotp(to,otp){
        let otpDetails;
      try {
         otpDetails =  await this.sendSms(to,otp)
      } catch (error) {
          throw error
      }
      return otpDetails
    }
    async resendotp(id,newotp){
        let otpToken =`OTP:${id}`;

        let otpDetails;
        let details = await redis.get(otpToken)
        if(!Object.keys(details).length){
            throw{
                code:400,
                error:"Invalid id"
            }
        }
        await redis.delete(details.id)
        try {
           otpDetails = await this.newotp(details.mobileNumber,newotp) 
        } catch (error) {
            throw error
        }
        return otpDetails
    }
    async validateOtp(details){
        let otpToken =`OTP:${details.id}`;

        let tokenDetails = await redis.hgetall(otpToken)
        if(!tokenDetails){
            throw{
                code:400,
                error:"Invalid id"
            }
        }
        let hset = await redis.hmset(otpToken,{attempts:(Number(tokenDetails.Number)||0)+1})
        if(tokenDetails.attempts > this.otpattempt){
            throw{
                code:400,
                error:"You have exceeded limit"
            }
        }
        if(tokenDetails.otp!==details.otp){
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