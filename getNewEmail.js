const LinkAccount = require('./models/linkaccount')
class Email{
    async getEmail(userDetails){
    let personalArray=[];
    let businessArray=[];
    let linkaccounts = await LinkAccount.find({personId:userDetails.personId}).lean()
     for(let linkaccount of linkaccounts){
       for(let key in linkaccount){
         if(key ==="personal"){
          personalArray= [...personalArray,...linkaccount.personal]
         }else if(key==="business"){
          businessArray= [...businessArray,...linkaccount.business]
         }
       }
     }
     personalArray = this.removeDuplicates(personalArray,userDetails.email)
     businessArray = this.removeDuplicates(businessArray,userDetails.email)
     console.log(personalArray,businessArray)
     return{
       personalArray,
       businessArray
     }
    }
    removeDuplicates(duplicates,email){
      let removedDuplicate=[];
      for(let item of duplicates){
        let index = removedDuplicate.findIndex(object=>object.email === item.email)
        if(index <=-1 ){
          removedDuplicate.push(item)
        }
      }
      removedDuplicate = removedDuplicate.filter(obj =>obj.email !==email)
      return removedDuplicate
    }
}
module.exports={
  linkEmail:new Email()
}