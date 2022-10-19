const { unSuccess, success } = require("../../utility/response");
const usersModel = require('../../models/user.model')
const { emptyObject, emptyString, emptyNumber, invalidEmail, invalidPassword, invalidPincode, invalidPhone, invalidObjectId, invalidURL } = require("../../utility/validations");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const short = require('short-uuid');
const client = require("../../configs/radis.config");
const sendMail = require("../../configs/smtp.config");
const { secretkey } = require("../../environment/config.env");
const userModel = require("../../models/user.model");
const cartModel = require("../../models/cart.Model");
const wishList = require("../../models/wishlist.Model");
const { emailverify } = require("../../smtp_templates/emailverify.smtp");
const { resetpasswordrequest } = require("../../smtp_templates/resetpassword.smtp");


const saltRounds = 10;


// ⬇️ REGISTER -------------------------------------------
const create = async (req, res) => {
    try {
        // get data
        const data = req.body;

        if (emptyObject(data)) return unSuccess(res, 400, false, 'Post body is required!')

        let { firstName, lastName, email, phone, password, address, gender } = data

        // basic validation
        if (emptyString(firstName)) return unSuccess(res, 400, false, 'FirstName is required!')
        if (emptyString(lastName)) return unSuccess(res, 400, false, 'LastName is required!')
        if (emptyString(email)) return unSuccess(res, 400, false, 'Email address is required!')
        if (emptyString(phone)) return unSuccess(res, 400, false, 'Phone number is required!')
        if (emptyString(password)) return unSuccess(res, 400, false, 'Password is required!')
        if (emptyString(gender)) return unSuccess(res, 400, false, 'Select gender!')
        if (!["male", "female", "others"].includes(gender)) return unSuccess(res, 400, false, 'Select gender only accept \'male\' or \'frmalr\'!')

        // regex validation
        if (invalidEmail(email))
            return unSuccess(res, 400, false, 'Invalid email address!')
        if (invalidPhone(phone))
            return unSuccess(res, 400, false, 'Invalid phone number!')
        if (invalidPassword(password))
            return unSuccess(res, 400, false, 'Invalid password (please note that password only accept a-z,A-Z,0-1 and !@#$%^&*)!')

        // basic validation of address
        if (emptyObject(address)) return unSuccess(res, 400, false, 'Address body is required!')

        // destructure address
        let { billing, shipping } = address

        // validation of - billing address
        if (emptyObject(billing)) return unSuccess(res, 400, false, 'Billing address is required!')
        if (emptyString(billing.address)) return unSuccess(res, 400, false, 'In billing, address is required!')
        if (emptyString(billing.city)) return unSuccess(res, 400, false, 'In billing, city is required!')
        if (emptyString(billing.state)) return unSuccess(res, 400, false, 'In billing, state is required!')
        if (emptyNumber(billing.pincode)) return unSuccess(res, 400, false, 'In billing, pincode is required!')
        if (invalidPincode(billing.pincode)) return unSuccess(res, 400, false, 'In billing, pincode is invalid!')

        // validation of - shipping address
        if (emptyObject(shipping)) return unSuccess(res, 400, false, 'Shipping address is required!')
        if (emptyString(shipping.address)) return unSuccess(res, 400, false, 'In shipping, address is required!')
        if (emptyString(shipping.city)) return unSuccess(res, 400, false, 'In shipping, city is required!')
        if (emptyString(shipping.state)) return unSuccess(res, 400, false, 'In shipping, state is required!')
        if (emptyNumber(shipping.pincode)) return unSuccess(res, 400, false, 'In shipping, pincode is required!')
        if (invalidPincode(shipping.pincode)) return unSuccess(res, 400, false, 'In shipping, pincode is invalid!')

        // db call for validation
        // it check both email and phone number are exist or not
        let users = await usersModel.find({ $or: [{ phone: phone }, { email: email }] })
        for (let each of users) {
            if (each.email == email) return unSuccess(res, 400, false, 'Email address is already exist!')
            if (each.phone == phone) return unSuccess(res, 400, false, 'Phone number is already exist!')
        }

        // password hashing
        const encryptedPassword = await bcrypt.hash(password, saltRounds)

        const object = { firstName, lastName, email, phone, password: encryptedPassword, address, gender }
        let create = await usersModel.create(object)


        // create empty cart 
        await cartModel.create({ userId: String(create._id) })
        await wishList.create({ userId: String(create._id) })

        res.status(201).send({ status: true, login: false, message: 'Account create successfully', create })
    } catch (e) {
        console.log('⚠️', e.message)
        return unSuccess(res, 500, false, e.message)
    }
}


// ⬇️ LOGIN -------------------------------------------
const login = async (req, res) => {
    try {
        // get data
        const data = req.body;

        if (emptyObject(data)) return unSuccess(res, 400, false, 'Post body is required!')

        let { email, password } = data

        // basic validation
        if (emptyString(email)) return unSuccess(res, 400, false, 'Email address is required!')
        if (emptyString(password)) return unSuccess(res, 400, false, 'Password is required!')

        // regex validation
        if (invalidEmail(email)) return unSuccess(res, 400, false, 'Invalid email address!')
        if (invalidPassword(password)) return unSuccess(res, 400, false, 'Invalid password (please note that password only accept a-z,A-Z,0-1 and !@#$%^&*)!')

        // db call for validation
        // it check both email and phone number are exist or not
        let user = await usersModel.findOne({ email, isDeleted: false })
        if (!user) return unSuccess(res, 404, false, 'User\'s email does\'t exist!')

        // password compaired 
        const verify = await bcrypt.compare(password, user.password).catch(_ => {
            console.log(_.message)
            return false
        });
        if (!verify) return unSuccess(res, 401, false, 'Wrong email address or password!')

        // check email verified or not?
        if (!user.emailVerified) {

            // generate key for vfy and store it in redis
            let emailVfyId = 'vfy-' + short.generate() + '-' + new Date().getTime();
            await client.setEx(emailVfyId, 600, user._id.toString());  // 600 sec or 10 min

            // generate url for verify email http://localhost:3000/public/verify/vfy-sdfg-ds34
            let vfyUrl = `${req.protocol}://${req.headers.host}/public/verify/${emailVfyId}`
            emailverify(user.firstName, user.email, vfyUrl)
            return unSuccess(res, 403, false, "Email not verified, We send you an email to verify your account!")
        }


        // generate token here
        const token = jwt.sign({
            userId: user._id
        }, secretkey, {
            expiresIn: '24h'
        });

        return success(res, 200, true, "Successfully Logged-In!", { token })

    } catch (e) {
        return unSuccess(res, 500, false, e.message)
    }
}



// ⬇️ VERIFY EMAIL -------------------------------------------
const verifyEmail = async (req, res) => {
    try {
        // get data params 
        const key = req.params.key;

        const template = `
            <!DOCTYPE html>
            <html style="height:100%">
            <head>
                <title>🔒 Verification!</title>
                <style>
                *{
                    font-family: Arial, Helvetica, sans-serif;
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                </style>
            </head>
            <body style=" height: 100%; display: flex; justify-content: center; align-items: center;">
                <h1 class="title">{{message}}</h1>
            </body>
            </html>
        `;

        // check key using radis
        const value = await client.get(key)
        if (!value) return res.send(template.replace('{{message}}', "☹️ Invalid Link / Time Out!"))

        // if value avalable
        if (invalidObjectId(value)) return res.send(template.replace('{{message}}', "☹️ Bad Key!"))

        //update user document
        await userModel.findByIdAndUpdate(value, { emailVerified: true })

        // delete key from radis
        await client.del(key)
        return res.send(template.replace('{{message}}', "🎉 Email address Verified!"))

    } catch (e) {
        return unSuccess(res, 500, false, e.message)
    }
}



// ⬇️ get profile -------------------------------------------
const getUser = async (req, res) => {
    try {
        // get data params 
        const user = req.user;

        const Obj = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            emailVerified: user.emailVerified,
            phone: user.phone,
            gender: user.gender,
            cart: 0,
            wishList: 0,
            isDeleted: user.isDeleted,
            deletedAt: user.deletedAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }


        // get user cart Item count
        const cart = await cartModel.findOne({ userId: user._id }).catch(e => null)
        if (cart) {
            // console.log(cart)
            Obj.cart = cart.items.length
        }

        return success(res, 200, true, 'Profile found', Obj)

    } catch (e) {
        return unSuccess(res, 500, true, e.message)
    }
}



// ⬇️ get address -------------------------------------------
const address = async (req, res) => {
    try {
        // get data params 
        const user = req.user;

        return success(res, 200, true, 'Profile found', user.address)

    } catch (e) {
        return unSuccess(res, 500, true, e.message)
    }
}



// ⬇️ get profile -------------------------------------------
const updateUser = async (req, res) => {
    try {
        // get data medelware 
        const user = req.user;
        const tokenData = req.tokenData;

        // get data frob body
        const data = req.body;

        if (emptyObject(data)) return unSuccess(res, 400, true, 'Body must be required')
        // destructure data

        let { firstName, lastName, email, phone, password, gender } = data

        // basic validation
        if (!emptyString(firstName)) user.firstName = firstName
        if (!emptyString(lastName)) user.lastName = lastName
        if (!emptyString(email)) {
            if (invalidEmail(email)) return unSuccess(res, 400, true, 'Invalid email address!')
            user.email = email
        }
        if (!emptyString(phone)) {
            if (invalidPhone(phone)) return unSuccess(res, 400, true, 'Invalid phone number!')
            user.phone = phone
        }
        if (!emptyString(gender)) {
            if (!["male", "female", "others"].includes(gender)) return unSuccess(res, 400, true, 'Select gender only accept \'male\' or \'frmalr\'!')
            user.gender = gender
        }

        // db call for validation
        // it check both email and phone number are exist or not
        let userCheck = await usersModel.find({ _id: { $ne: tokenData.userId }, $or: [{ phone: phone }, { email: email }] })
        for (let each of userCheck) {
            if (each.email == email) return unSuccess(res, 400, true, 'Email address is already exist!')
            if (each.phone == phone) return unSuccess(res, 400, true, 'Phone number is already exist!')
        }

        await user.save();

        const Obj = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            emailVerified: user.emailVerified,
            phone: user.phone,
            gender: user.gender,
            isDeleted: user.isDeleted,
            deletedAt: user.deletedAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }

        return success(res, 200, true, 'Profile updated', Obj)

    } catch (e) {
        return unSuccess(res, 500, true, e.message)
    }
}



// ⬇️ get address -------------------------------------------
const updateAddress = async (req, res) => {
    try {
        // get data
        const data = req.body;
        if (emptyObject(data)) return unSuccess(res, 400, false, 'Body is required!')

        // destructure address
        let { type, address, city, state, pincode } = data

        if (emptyString(type)) return unSuccess(res, 400, false, 'Type is required!')
        if (!["billing", "shipping"].includes(type)) return unSuccess(res, 400, false, 'Type is accept only billing, shipping!')

        // get data params 
        const user = req.user;
        const ADS = user.address[type]

        // validation of - billing address
        if (!emptyString(address)) ADS.address = address
        if (!emptyString(city)) ADS.city = city
        if (!emptyString(state)) ADS.state = state
        if (!emptyNumber(pincode)) {
            if (invalidPincode(pincode)) return unSuccess(res, 400, false, 'In billing, pincode is invalid!')
            ADS.pincode = pincode
        }

        await user.save();
        return success(res, 200, true, 'Address updated', ADS)

    } catch (e) {
        return unSuccess(res, 500, true, e.message)
    }
}

//🔐change password
const changepassword = async (req, res) => {
    try {
        let data = req.body
        //let userId = req.tokenData.userId
        let userdata = req.user
        let { oldPassword, newPassword } = data
        if (!oldPassword) return unSuccess(res, 400, true, 'Enter your old Paswword')
        if (!newPassword) return unSuccess(res, 400, true, 'Enter your new Paswword')
        if (invalidPassword(newPassword))
            return unSuccess(res, 400, true, 'Invalid password (please note that password only accept a-z,A-Z,0-1 and !@#$%^&*)!')

        // password compaired 
        const verify = await bcrypt.compare(oldPassword, userdata.password).catch(_ => {
            console.log(_.message)
            return false
        });
        if (!verify) return unSuccess(res, 401, true, 'Wrong password!')

        // password hashing
        const encryptedPassword = await bcrypt.hash(newPassword, saltRounds)

        //password updating
        //let update = await userModel.findOneAndUpdate({ userId }, { $set: { password: encryptedPassword } })
        userdata.password = encryptedPassword
        await userdata.save();
        return success(res, 200, true, 'Password updated', {})
    }
    catch (e) {
        console.log(e)
        return unSuccess(res, 500, true, e.message)
    }
}


const forgetPassword = async (req, res) => {
    try {

        const data = req.body
        if (emptyObject(data)) return unSuccess(res, 400, false, 'POST body is required!')
        const { email, callback } = data
        if (emptyString(email)) return unSuccess(res, 400, false, 'email is required!')
        if (emptyString(callback)) return unSuccess(res, 400, false, 'callback is required!')
        // if (invalidURL(callback)) return unSuccess(res, 400, false, 'callback must be an url!')

        // DB call for checking email exist or not
        const user = await userModel.findOne({ email: email, isDeleted: false })
        if (!user) return unSuccess(res, 400, false, 'User not found!')

        // generate key for vfy and store it in redis
        let resetUID = 'forget-' + short.generate() + '-' + new Date().getTime();
        await client.setEx(resetUID, 600, user._id.toString());  // 600 sec or 10 min
        // console.log(resetUID)

        // generate url for verify email http://localhost:3000/public/verify/vfy-sdfg-ds34
        let vfyUrl = `${callback}?i=${resetUID}`
        // send email here for reset request
        await resetpasswordrequest(user.firstName, user.email, vfyUrl)
        return success(res, 200, false, 'Reset request send to your email address!', {})

    } catch (e) {
        console.log(e)
        return unSuccess(res, 500, false, e.message)
    }
}



const resetPassword = async (req, res) => {
    try {
        //from frnt end milega key passwrd and pswrd again
        let data = req.body
        let { key, password1, password2 } = data

        const value = await client.get(key)
        if (!value) return unSuccess(res, 400, false, "Invalid Key")
        if (!password1 || !password2)
            return unSuccess(res, 400, false, "Password is required!")
        if (password1 !== password2)
            return unSuccess(res, 400, false, "Passwords do not match!")
        if (invalidPassword(password2))
            return unSuccess(res, 400, false, 'Invalid password (please note that password only accept a-z,A-Z,0-1 and !@#$%^&*)!')

        //hasing password    
        const encryptedPassword = await bcrypt.hash(password2, saltRounds)

        let userdata = await userModel.findOneAndUpdate({ _id: value, isDeleted: false }, { $set: { password: encryptedPassword } })
        if (!userdata) return unSuccess(res, 404, false, "User not found or their has been some mistake try again later")

        // remove redis key and data cause no need it in future
        await client.del(key)

        return success(res, 200, false, 'Password updated', {})

    } catch (e) {
        console.log(e)
        return unSuccess(res, 500, false, e.message)
    }
}




module.exports = { create, login, verifyEmail, getUser, address, updateUser, updateAddress, changepassword, forgetPassword, resetPassword }