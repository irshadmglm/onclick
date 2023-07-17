var db=require('../config/connection')
var collection=require('../config/collections')
const { ObjectId } = require('mongodb')
const { response } = require('../app')
var objectId=require('mongodb').ObjectID
module.exports={
    addProduct:(products,callback)=>{
       
        db.get().collection('products').insertOne(products).then((data)=>{
            
            callback(data.insertedId)
            console.log(data);
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:new ObjectId(prodId)}).then((response)=>{
               // console.log(response);
                resolve(response)
            })
        })
    },
    getProductDetails:(proId)=>{
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:new ObjectId(proId)}).then((products)=>{
                    resolve(products)
                })
            })
    },
    updateProduct:(proId,proDetials)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:new ObjectId(proId)},{
            $set:{
                Name:proDetials.Name,
                category:proDetials.Category,
                Price:proDetials.Price,
                Description:proDetials.Description
            }
        }).then((response)=>{
            resolve()
        })
    })
    }
}