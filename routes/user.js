const { response } = require('express');
var express = require('express');
var router = express.Router();
const fs= require('fs')
const path=require('path')
const productHelpers = require('../helpers/product-helpers');
const userHelpers=require('../helpers/user-helpers')
const verifyLogin=(req,res,next)=>{
  if(req.session.user.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}
/* GET home page. */
router.get('/',async function(req, res, next) {
 let user =req.session.user
 
 /* let cartCount=null
 if(req.session.user){
    cartCount =await userHelpers.getCartCount(req.session.user._id)
 }
  productHelpers.getAllProducts().then((products)=>{
    
    res.render('user/view-detials',{details,user:req.session.user})
   })*/
  if(user){
   userHelpers.getDetails(user._id).then((details)=>{
    
   console.log(details);
    res.render('user/view-detials',{details,user})
   })
  }else{
    res.render('user/login')
  }
});


router.get('/login',(req,res)=> {
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render('user/login',{"loginErr":req.session.userLoginErr})
    req.session.userLoginErr=false

  }
 
})
router.get('/signup',(req,res)=>{
  res.render('user/signup')
})
router.post('/signup',(req,res)=>{
  userHelpers.dosignup(req.body).then((response)=>{
  
    req.session.user=response
    req.session.user.loggedIn=true
    if(response){
      res.redirect('/')
    }
    
  


    if(req.files?.image){
        let image=req.files.image
    
    image.mv('./public/product-images/'+response._id+'.jpg',(err)=>{
      if(!err){
       console.log('image upploded');
      }else{
        console.log(err);
      }
    })
    }
  
  })
 
})
router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.stat){
     req.session.user=response.user
      req.session.user.loggedIn=true
      res.redirect('/')
    }else{
      req.session.userLoginErr="invalid username or password"
      res.redirect('/login')
    }
  })
})
router.get('/logout',(req,res)=>{
  req.session.user=null
  res.redirect('/')
})
router.get('/cart',verifyLogin,async(req,res)=>{
  let products=await userHelpers.getCartProduct(req.session.user._id)
  console.log(products);
  res.render('user/cart',{products,user:req.session.user})
})
router.get('/add-to-cart/:id',(req,res)=>{
  console.log("api call");
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
   // res.redirect('/')
    
  })
})
router.post('/add-details',verifyLogin, async (req, res) => {
  req.body.date = new Date();
  if (req.files?.image) {
    req.body.image = true;
  }
  if (req.body.image || req.body.Text) {
    req.body.userId = req.session.user._id;
    try {
      const id = await userHelpers.addDetails(req.body);

      if (req.files?.image) {
        let image = req.files.image;
        await userHelpers.addToPrivate(id, req.session.user._id);

        image.mv('./public/product-images/' + id + '.jpg', (err) => {
          if (!err) {
            console.log('Image moved');

            // Retrieve the newly added detail
            userHelpers.getDetailById(id).then((newDetail) => {
              console.log(newDetail);
              // Emit the new detail to all connected clients
              req.app.io.emit('chatMessage', newDetail);
            });
          } else {
            console.error('Error moving image:', err);
            res.status(500).send('Error moving image'); // Send error response
          }
        });
      } else {
        // Retrieve the newly added detail
        userHelpers.getDetailById(id).then((newDetail) => {
          console.log(newDetail);
          // Emit the new detail to all connected clients
          req.app.io.emit('chatMessage', newDetail);
        });
      }

      res.send(); // Send an empty response (optional)
    } catch (error) {
      console.error('Error adding details:', error);
      res.status(500).send('Error adding details'); // Send error response
    }
  }
});

router.get('/view-details',verifyLogin, (req, res) => {
  userHelpers.getDetails().then((details) =>{
   
    
    res.render('user/view-detials', { details, user: req.session.user});
  });
});
router.get('/add-private',verifyLogin,function(req,res){
  res.render('user/add-private',{user:req.session.user})
})



router.get('/view-private',verifyLogin,async(req,res)=>{

  
  
 await userHelpers.getPrivate(req.session.user._id).then((private)=>{
   if(private){
   
   
    res.render('user/view-private',{private,user:req.session.user})
   }else{
    console.log('private is empty');

   }
   })
})
router.get('/delete-data/:id',verifyLogin,(req,res)=>{
  let dataId=req.params.id
  //console.log(proId);
  userHelpers.deletePridata(dataId).then((response)=>{
   // res.json(response)
    res.redirect('/')
  })
  
  })
  
  router.get('/private-chat/:userid',verifyLogin,async(req,res)=>{
   
    let userId=req.params.userid
    console.log(userId);

    let userName=await userHelpers.getUserName(userId)
    userHelpers.getpriChat(req.session.user._id,userId).then((detailsChat)=>{
      res.render('user/private-chat',{userId:userId,userName,detailsChat,user:req.session.user})
      
    })
    
    
  })
  
 
router.post('/private-chat/:userid',verifyLogin, async (req, res) => {
  let userId = req.params.userid;
  req.body.senderId = req.session.user._id;
  req.body.senderName = req.session.user.Name;
  
  if (req.files?.image) {
    req.body.image = true;
  }

  if (req.body.image || req.body.Text) {
    await userHelpers.addPricpace(req.body, (id) => {
      userHelpers.privateChat(req.session.user._id, userId, id).then(() => { });

      userHelpers.getPrichatById(id, userId).then((message) => {
      
       // res.json({ sender: true, details: message})
        req.app.io.to(`${req.session.user._id}_${userId}`).emit('primessage', { sender: true, details: message });
        req.app.io.to(`${userId}_${req.session.user._id}`).emit('primessage', { sender: false, details: message });

        req.app.io.to(`${req.session.user._id}_${userId}`).emit('joinPrivateChat',{
          senderId:req.session.user._id,
          receiverId:userId,
        });

        req.app.io.to(`${userId}_${req.session.user._id}`).emit('joinPrivateChat',{
          senderId:req.session.user._id,
          receiverId:userId,
        });
      });
      

      if (req.files?.image) {
        let image = req.files.image;
        image.mv('./public/product-images/' + id + '.jpg', (err) => {
          if (!err) {
            console.log('moved');
          } else {
            console.log(err);
          }
        });
      }
    });
  }
  
  res.send('Message sent successfully'); // Respond to the client after message processing
});
   router.get('/chat-list',verifyLogin, async (req,res)=>{
   
      let participantIds = await userHelpers.getChatlist(req.session.user._id);
      
      let users=await userHelpers.userNames(participantIds,req.session.user._id)
      let data=await userHelpers.getEachChat(req.session.user._id,participantIds)
      
       let chatData=await data.flatMap((participant)=>participant.details.map((obj)=>obj.details))

    // let chatData=data.map(obj=>obj.details)
     //  console.log(chatData);

       let userData=await users.filter(obj=>obj.receiver===true).map(obj=>obj.userData)
       
       
       await userHelpers.addMessagesToUsers(chatData,userData)
       console.log(userData);
        res.render('user/chat-list',{ user: req.session.user,userData});
      
      
    
  });



module.exports = router;
