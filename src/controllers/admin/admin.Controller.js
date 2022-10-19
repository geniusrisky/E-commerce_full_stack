const adminModel = require('../../models/admin.model')
const jwt = require('jsonwebtoken')
const { emptyObject, emptyString, emptyNumber, invalidEmail, invalidPassword, invalidPincode, invalidPhone, invalidObjectId } = require("../../utility/validations");
const { unSuccess, success } = require("../../utility/response");
const { secretkey } = require("../../environment/config.env");

// admin Create api🔊
const create = async (req, res) => {
    try {
        let data = req.body
        let { name, email, password, phone, role } = data
        if (emptyObject(data)) return unSuccess(res, 400, false, ' data cannot be empty!')
        if (emptyString(name)) return unSuccess(res, 400, false, 'Name is required!')
        if (emptyString(email)) return unSuccess(res, 400, false, 'Email address is required!')
        if (emptyString(phone)) return unSuccess(res, 400, false, 'Phone number is required!')
        if (emptyString(password)) return unSuccess(res, 400, false, 'Password is required!')
        if (role) {
            if (!["order", "cart", "comment", "wishList", "user", "product"].includes(role)) return unSuccess(res, 400, false, 'role can only be "order","cart","comment","wishList","user","product"')
        }
        if (invalidEmail(email)) return unSuccess(res, 400, false, 'Invalid email address!')
        if (invalidPhone(phone)) return unSuccess(res, 400, false, 'Invalid phone number!')
        if (invalidPassword(password)) return unSuccess(res, 400, false, 'Invalid password (please note that password only accept a-z,A-Z,0-1 and !@#$%^&*)!')


        let admin = await adminModel.find({ $or: [{ phone: phone }, { email: email }], isDeleted: false })
        for (let each of admin) {
            if (each.email == email) return unSuccess(res, 400, false, 'Email address is already exist!')
            if (each.phone == phone) return unSuccess(res, 400, false, 'Phone number is already exist!')
        }
        let result = await adminModel.create(data)
        return success(res, 201, false, "admin create success", result)
    } catch (e) {
        return unSuccess(res, 500, false, e.message)
    }
}


// admin login api
const login = async (req, res) => {
    try {
        let data = req.body
        if (emptyObject(data)) return unSuccess(res, 400, false, ' data cannot be empty!')
        let { email, password } = data

        if (emptyString(email)) return unSuccess(res, 400, false, 'Email address is required!')
        if (emptyString(password)) return unSuccess(res, 400, false, 'Password is required!')

        //db calls for checking admin
        let admin = await adminModel.findOne({ email, isDeleted: false })
        if (!admin) return unSuccess(res, 404, false, 'admin email does\'t exist!')
        //db call to veify admin 
        let verify = await adminModel.findOne({ password: password })
        if (!verify) return unSuccess(res, 401, false, 'Wrong email address or password!')
        const token = jwt.sign({
            adminId: admin._id
        }, secretkey, {
            expiresIn: '24h'
        });
        return success(res, 200, true, "Successfully Logged-In!", { token })

    }
    catch (e) {
        return unSuccess(res, 500, false, e.message)
    }
}
module.exports = {
    create,
    login
}