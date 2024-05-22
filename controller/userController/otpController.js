const OTP = require('../../model/otpModel')
const User = require('../../model/user_model')
const otpGenerator = require('otp-generator')
const emailController = require('../userController/emailController')
const Wallet = require('../../model/walletModel')
const Wishlist = require('../../model/wishListModel')

const otpSignupPage = (req,res)=>{
    try {
        res.render('otp')
    } catch (error) {
        console.error(error)
    }
}
const otpSignup = async(req,res)=>{
    try {
        const userOtp = req.query.otp
        let userDetails = req.session.userDetails;
        const email = userDetails.email
        let response =await OTP.find({ email: email }).sort({ createdAt: -1 }).limit(1)
        let otp = response[0]?.otp;
        if(userOtp !== otp){
            res.status(200).json({ message: 'failed' });
            // res.render('otp',{signupAlert:'Invalid OTP'})
        }else{
            //create new user
            const user = new User({
                username: userDetails.username,
                email: userDetails.email,
                password: userDetails.password,
                phone: userDetails.phone
            })
            await user.save();
            const newUser = await User.findOne({email:userDetails.email})
            const wallet = new Wallet({
                userId:newUser._id,
                balance:0
            })
            await wallet.save()
            const wishList = new Wishlist({
                userId:newUser._id,
                items:[]
            })
            await wishList.save()
            req.session.user = userDetails.email;
            req.session.userId = newUser._id;
            req.session.isLoggedUser = true;
            res.status(200).json({ message: 'success' });
            
        }
    } catch (error) {
        console.error(error)
    }
}

const resendOtp = async (req, res) => {
    try {
        const email = req.session.userDetails.email
        // Generate new OTP
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        // Save new OTP to the database
        await OTP.findOneAndUpdate({ email }, { otp }, { upsert: true });

        // Send OTP via email
        mailSender = emailController.mailSender
        await mailSender(email, 'Verification Email', `<h3>Confirm your OTP</h3><h5>Here is your new OTP: <b>${otp}</b></h5>`);

        // Rendering OTP page with email
        return res.render('otp', { emailAlert:email });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

module.exports= {
    otpSignupPage,
    otpSignup,
    resendOtp
    
}