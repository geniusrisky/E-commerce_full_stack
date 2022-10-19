const { emptyString } = require("./validations")
const jwt = require('jsonwebtoken')
const { secretkey } = require("../environment/config.env")
const userModel = require("../models/user.model")

const isLogined = async (token) => {
    try {
        let decodeData = {}
        if (emptyString(token)) return false
        await jwt.verify(token, secretkey, function (err, decode) {
            if (err) {
                return false
            }
            decodeData = decode
        })
        const user = await userModel.findOne({ _id: decodeData.userId, isDeleted: false });
        if (!user) return false
        return user
    } catch (_) {
        console.log(_)
        return false
    }
}


module.exports = { isLogined }