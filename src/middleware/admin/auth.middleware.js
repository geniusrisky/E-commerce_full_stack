const adminModel = require("../../models/admin.model");
const jwt = require('jsonwebtoken')
const { unSuccess } = require("../../utility/response");
const { invalidObjectId } = require("../../utility/validations");
const { secretkey } = require("../../environment/config.env");

const authentication = async (req, res, next) => {
    try {
        const token = req.headers['x-auth-key']
        jwt.verify(token, secretkey, function (err, decode) {
            if (err) {
                return unSuccess(res, 401, false, err.message)
            } else {
                // console.log(decode)
                req.tokenData = decode;
                next()
            }
        })
    } catch (_) {
        return unSuccess(res, 500, false, _.message)
    }
}

const authrization = async (req, res, next) => {
    try {
        const decode = req.tokenData
        if (invalidObjectId(decode.adminId)) return unSuccess(res, 400, false, "invalid Object Id")
        const admin = await adminModel.findOne({ _id: decode.adminId, isDeleted: false });
        if (!admin) return unSuccess(res, 404, false, "admin info unavalable!")
        req.admin = admin
        next()
    } catch (_) {
        return unSuccess(res, 500, false, _.message)
    }
}



module.exports = { authentication, authrization }