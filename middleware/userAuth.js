const User = require('../model/user_model')

const isUser = (req,res,next)=>{
if(req.session.user){
    next()
}else{
    res.redirect('/userLogin')
}
}

const isLoggedUser = (req,res,next)=>{
    if(req.session.isLoggedUser){
        res.redirect('/')
    }else{
        next();
    }
}

const isActive = async(req,res,next)=>{
    try {
        if(req.session.user && req.session.isLoggedUser){
            const user = await User.findOne({email:req.session.user,isBlocked:false})
        if(user){
            next()
        }else{
            req.session.user = null
            req.session.isLoggedUser = null 
            next()
        }
        }else{
            next()
        }
        
        
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    isUser,
    isLoggedUser,
    isActive
}