var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const { ObjectId } = require('mongodb')
const { response } = require('../app')

// const { response } = require('../app')
var objectId=require('mongodb').ObjectID
module.exports={
    dosignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
         
            userData.Password=await bcrypt.hash(userData.Password,10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
              
 db.get().collection(collection.USER_COLLECTION).findOne({_id:new ObjectId(data.insertedId)}).then((user)=>{
  if(user.Name && user.Email ){
    if( user.Password){
      console.log(user);
      resolve(user)
    }
    }
   
               
              })
              
             
                
                
            })
            
        })
   
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user= await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(user){
                bcrypt.compare(userData.Password,user.Password).then((stat)=>{
                    if(stat){
                        console.log('login success');
                        response.user=user
                        response.stat=true
                        resolve(response)
                    }else{
                        console.log('login filed');
                        resolve({stat:false})
                    }
                })
               
            }else{
                console.log('login error');
                resolve({stat:false})
            }
        })
    },
    addToCart:(proId,userId)=>{
        let proObj={
            item: new ObjectId(proId),
            quantity:1
        }
       return new Promise(async(resolve,reject)=>{
        let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:new ObjectId(userId)})
        if(userCart){
            let proExist=userCart.products.findIndex(product=>product.item== proId)
           
            if(proExist!= -1){
db.get().collection(collection.CART_COLLECTION).updateOne({user:new ObjectId(userId),'products.item':new ObjectId(proId)},
                {
                    $inc:{'products.$.quantity':1}
                }
        ).then(()=>{
            resolve()
        })
            }else{
            db.get().collection(collection.CART_COLLECTION).updateOne({user:new ObjectId(userId)},
            {
                $push:{products:proObj}
            }
            ).then((response)=>{
                resolve()
            })
         }
        }else{
            let cartObj={
                user:new ObjectId(userId),
                products:[proObj]
            }
            db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
            })
        }
       })
        
    },
    getCartProduct:(userId)=>{
        return new Promise(async(resolve,reject)=>{
                let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match:{user:new ObjectId(userId)}
                    }, 
                    {
                        $unwind:'$products'
                    },
                    {
                        $project:{
                            item:'$products.item',
                            quantity:'$products.quantity'
                        }
                    },
                    {
                            $lookup:{
                                from:collection.PRODUCT_COLLECTION,
                                localField:'item',
                                foreignField:'_id',
                                as:'product'
                            }
                    },
                    {
                        $project:{
                            item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                        }
                    }
                  
                ]).toArray()
               
               
                resolve(cartItems)
                
        })
    },  
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
                let count=0
                let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:new ObjectId(userId)})
                if(cart){
                    count=cart.products.length
                }
                resolve(count)
        })
    },
    changeProductQuantity:(details)=>{
       details.count=parseInt(details.count)
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:new ObjectId(details.cart),'products.item':new ObjectId(details.product)},
                {
                    $inc:{'products.$.quantity':details.count}
                }
        ).then(()=>{
            resolve()
        })
        })
    },
    addDetails:(details)=>{
      let currentTime= new Date()
      let hours=currentTime.getHours()
      let minutes=currentTime.getMinutes()
      let timeString= hours+':'+minutes 
      details.time =timeString
      details.Date =currentTime
       
       return new Promise((resolve,reject)=>{
        db.get().collection(collection.DETAILS_COLLECTION).insertOne(details).then((data)=>{
         
        console.log(data);
        resolve(data.insertedId)
        })
       })
    },
    getDetails:(senderId) => {
        return new Promise(async (resolve, reject) => {
          let details = await db.get().collection(collection.DETAILS_COLLECTION).find().sort({date:-1}).toArray();
      
          if (Array.isArray(details)) {
             details.sender = details.filter(detail => detail.userId === senderId);
      
            if (details.sender.length > 0) {
                details.sender.forEach(detail => {
                detail.send = true;
              });
              
            } 
          } 
          resolve(details);
        });
      },
      getDetailById:(id)=>{
       
        return new Promise(async (resolve, reject) => {
          let details = await db.get().collection(collection.DETAILS_COLLECTION).findOne({_id:new ObjectId(id)})
          details.send = true;
        
          resolve(details);
        });
      },
      getLatestDetails:(timestamp,senderId)=>{
       
        return new Promise(async (resolve, reject) => {
          let details = await db.get().collection(collection.DETAILS_COLLECTION).find({Date:{$gt:timestamp}});

         
            return{
              ...details,
              send:details.userId === senderId,
              
            },
         
          
          
        
          resolve(details);
        });
      },

    addToPrivate:(dataId,userId)=>{

       
        let dataObj={
            item:new ObjectId(dataId),
          //  quantity:1
        }
       return new Promise(async(resolve,reject)=>{
        let privateSpace=await db.get().collection(collection.PRIVATE_COLLECTION).findOne({user:new ObjectId(userId)})
        if(privateSpace){
            
            db.get().collection(collection.PRIVATE_COLLECTION).updateOne({user:new ObjectId(userId)},
            {
                $push:{details:dataObj}
            }
            ).then((id)=>{
                resolve(id)
            })
         
        }else{
            let privateObj={
                user:new ObjectId(userId),
                details:[dataObj]
            }
            db.get().collection(collection.PRIVATE_COLLECTION).insertOne(privateObj).then(()=>{
                    resolve()
            })
        }
       })
        
    },
    
  /*  getprivate:(userId)=>{
        
        return new Promise(async(resolve,reject)=>{
           
           
         await db.get().collection(collection.PRIVATE_COLLECTION).aggregate([
            {
                $match:{user:new ObjectId(userId)}
            },
            {$unwind: "$details"},
            {$project: {_id:0,item:"$details.item"}}
        ]).toArray().then((data)=>{
            resolve(data)
            console.log(data);
        })
       
     
            
        })

    },*/
    getPrivate:(userId)=>{

  
        return new Promise(async(resolve,reject)=>{
                let pridata=await db.get().collection(collection.PRIVATE_COLLECTION).aggregate([
                    {
                        $match:{user:new ObjectId(userId)}
                    }, 
   
                    {
                            $lookup:{
                                from:collection.DETAILS_COLLECTION,
                                localField:'details.item',
                                foreignField:'_id',
                                as:'details'
                            }
                    },
                    {
                        $unwind:'$details'
                    },
                    {
                        $project:{
                            item:'$details.item',
                            details:1
                        }
                    }
                  
                ]).toArray()
               
                console.log(pridata);
                resolve(pridata)
              
                
        })
    },
    deletePridata:(dataId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.DETAILS_COLLECTION).deleteOne({_id:new ObjectId(dataId)}).then((response)=>{
               // console.log(response);
                resolve(response)
            })
        })
      },
      addPricpace:(details,callback)=>{
        let currentTime= new Date()
      let hours=currentTime.getHours()
      let minutes=currentTime.getMinutes()
      let timeString= hours+':'+minutes 
      details.time =timeString
      details.Time=currentTime
         db.get().collection(collection.PRISPACE_COLLECTION).insertOne(details).then((data)=>{
             callback(data.insertedId)
         })
     },
     getPrichatById:(id,receivrId)=>{
      return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRISPACE_COLLECTION).findOne({_id:new ObjectId(id)}).then((detail)=>{
          detail.sender=detail.receiverId === receivrId,
          resolve(detail)
        })
      })
     },

     privateChat: (senderId, receiverId, dataId) => {
        let dataObj = {
          item: new ObjectId(dataId),
        };
      
        return new Promise(async (resolve, reject) => {
          let privateChat = await db
            .get()
            .collection(collection.PRIVATE_CHAT)
            .findOne({
              participants: {
                $all: [new ObjectId(senderId), new ObjectId(receiverId)],
              },
            });
      
          if (privateChat) {
            db.get()
              .collection(collection.PRIVATE_CHAT)
              .updateOne(
                {
                  participants: {
                    $all: [new ObjectId(senderId), new ObjectId(receiverId)],
                  },
                },
                {
                  $push: { details: dataObj },
                }
              )
              .then((id) => {
                resolve(id);
              });
          } else {
            let privateObj = {
              participants: [new ObjectId(senderId), new ObjectId(receiverId)],
              details: [dataObj],
            };
            db.get()
              .collection(collection.PRIVATE_CHAT)
              .insertOne(privateObj)
              .then(() => {
                resolve();
              });
          }
        });
      },
      getpriChat: (senderId, receivrId) => {
        return new Promise(async (resolve, reject) => {
          let detailsChat = await db
            .get()
            .collection(collection.PRIVATE_CHAT)
            .aggregate([
              {
                $match: {
                  participants: {
                    $all: [new ObjectId(senderId), new ObjectId(receivrId)],
                  },
                },
              },
              {
                $lookup: {
                  from: collection.PRISPACE_COLLECTION,
                  localField: 'details.item',
                  foreignField: '_id',
                  as: 'details',
                },
              },
              {
                $unwind: '$details',
              },
              {
                $project: {
                  item: '$details.item',
                  details: 1,
                },
              },
            ])
            .toArray();
      
           detailsChat= detailsChat.map(chat =>{
            return{
              ...chat,
              sender:chat.details.receiverId === receivrId,
              
            }
           }) 
      console.log(detailsChat);
          resolve(detailsChat);
        });
      },
      getChatlist: (senderId) => {
        return new Promise(async (resolve, reject) => {
          let participantIds = await db
            .get()
            .collection(collection.PRIVATE_CHAT)
            .aggregate([
              {
                $match: {
                  participants: {
                    $all: [new ObjectId(senderId)],
                  },
                },
              },
              {
                $unwind: "$participants",
              },
              {
                $project: {
                  _id: 0,
                  participantId: "$participants",
                },
              },
              {
                $sort: {
                  participantId: -1,
                },
              },
            ])
            .toArray();
      
          
      
          resolve(participantIds);
        });
      },
      
      getUserName: (userId) => {
        console.log(userId);
        return new Promise((resolve,reject)=>{
          db.get().collection(collection.USER_COLLECTION).findOne({_id:new ObjectId(userId)}).then((userData)=>{
            console.log('daataa'+userData.Name);
            resolve(userData.Name)
            
          })
        })
      },
      getEachChat: (senderId, participantIds) => {
        return new Promise(async (resolve, reject) => {
          try {
            const updatedParticipantIds = await Promise.all(
              participantIds.map(async (id) => {
                const detailsChat = await db
                  .get()
                  .collection(collection.PRIVATE_CHAT)
                  .aggregate([
                    {
                      $match: {
                        participants: {
                          $all: [
                            new ObjectId(id.participantId),
                            new ObjectId(senderId),
                          ],
                        },
                      },
                    },
                    {
                      $lookup: {
                        from: collection.PRISPACE_COLLECTION,
                        localField: 'details.item',
                        foreignField: '_id',
                        as: 'details',
                      },
                    },
                    {
                      $unwind: '$details',
                    },
                    {
                      $project: {
                        item: '$details.item',
                        details: 1,
                      },
                    },
                    {
                      $sort: {
                        'details.timestamp': 1, // Sort by timestamp in descending order
                      },
                    },
                    {
                      $group: {
                        _id: '$item',
                        details: { $last: '$details' }, // Retrieve only the first (latest) document
                      },
                    },
                  ])
                  .toArray();
      
                
      
                return {
                  ...id,
                  details: detailsChat,
                };
              })
            );
      
            resolve(updatedParticipantIds);
          } catch (error) {
            reject(error);
          }
        });
      },
      userNames: (participantIds,senderId) => {
        let userIds =participantIds.map(obj =>obj.participantId.toString())
         
 
         return new Promise(async (resolve, reject) => {
           try {
             const updatedUserIds = await Promise.all(userIds.map(async (id) => {
               const userData = await db.get().collection(collection.USER_COLLECTION).findOne({ _id:new ObjectId (id) });
               
               return {
                 ...id,
                 userData: userData,
               receiver: id !== senderId,
               };
             }));
       
             
             resolve(updatedUserIds);
           } catch (error) {
             reject(error);
           }
         });
       },
        addMessagesToUsers:(messages, users) => {
        const ids = users.map(obj => obj._id.toString());
        
        for (const message of messages) {
          const { receiverId, senderId, ...details } = message;
          const foundIds = ids.filter(id => id === receiverId || id === senderId);
        
          for (const id of foundIds) {
            const user = users.find(user => user._id.toString() === id);
            if (user) {
              const userWithoutMessages = { ...user };
              delete userWithoutMessages.messages;
              Object.assign(userWithoutMessages, details);
              Object.assign(userWithoutMessages,{_id:user._id})
              Object.assign(user, userWithoutMessages);
            }
          }
        }
        
        return users;
      },
      
      
}