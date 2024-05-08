const User = require('../../model/user_model')

const adminUserPage =async (req,res)=>{
    try {
        let users = await User.find({})
        res.render('admin/adminUserPage',{title:'UserPage',users:users})
    } catch (error) {
        console.error(error)
    }
}

const toggle = async (req,res)=>{
    try {
        let userId = req.query.userId;
        const userData = await User.findOne({_id:userId})
        userData.isBlocked = !userData.isBlocked
        await userData.save()
    } catch (error) {
        console.error(error);
    }
}


module.exports = {
    adminUserPage,
    toggle,
}