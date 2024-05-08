
const isLoggedAdmin = (req,res,next)=>{
    if(!req.session.isLoggedAdmin){
        res.redirect('/adminLogin')
    }else{
        next();
    }
}

const isLogoutAdmin = (req,res,next)=>{
    if(req.session.isLoggedAdmin){
        res.redirect('/adminHome')
    }else{
        next();
    }
}

module.exports={isLoggedAdmin,isLogoutAdmin}