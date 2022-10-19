const commentModel = require('../../models/comment.model')
const { emptyObject, emptyString, emptyNumber, invalidObjectId, isValidRequestBody } = require("../../utility/validations");
const { unSuccess, success } = require("../../utility/response");
const productModel = require('./../../models/product.model');
const { isLogined } = require('../../utility/isLogined');
const orderModel = require('../../models/order.model')





const create = async (req, res) => {
    try {
        let data = req.body
        let Id = req.tokenData.userId
        data.userId = Id
        let { userId, productId, message, rating } = data

        if (invalidObjectId(userId)) return unSuccess(res, 400, true, 'enter valid userId!')
        if (emptyString(userId)) return unSuccess(res, 400, true, 'userId is required!')
        if (invalidObjectId(productId)) return unSuccess(res, 400, true, 'enter valid productId!')
        if (emptyNumber(rating)) return unSuccess(res, 400, true, 'rating is required!')
        if (![1, 2, 3, 4, 5].includes(rating)) return unSuccess(res, 400, true, 'rating is 1 to 5 numbers only !')
        if (emptyString(message)) return unSuccess(res, 400, true, 'comment is required!')
        // if (!message.match(/^[a-zA-Z0-9\s]+$/)) return unSuccess(res, 400, true, 'comment is not valid!')

        // Check eligibility.
        const eligible = await checkAccessToGiveFeedBack(userId, productId)
        if (!eligible) return unSuccess(res, 400, true, 'You are not eligible to give feedback on this product!')
        // product verify
        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) return unSuccess(res, 404, true, 'product not found enter valid product Id!')

        let comment = await commentModel.findOne({ productId: productId, userId: userId, isDeleted: false })
        if (comment) {
            // if the comment already exist then update here....
            comment.message = message
            comment.rating = rating
            await comment.save()
            return success(res, 201, true, "comment updated", comment)
        }

        //create comment 
        let result = await commentModel.create(data)
        return success(res, 201, true, "comment created", result)

    } catch (e) {
        console.log(e)
        return unSuccess(res, 500, true, e.message)
    }
}


const eligible = async (req, res) => {
    try {
        let data = req.body
        let Id = req.tokenData.userId
        data.userId = Id
        let { userId, productId } = data

        if (invalidObjectId(userId)) return unSuccess(res, 400, true, 'enter valid userId!')
        if (emptyString(userId)) return unSuccess(res, 400, true, 'userId is required!')
        if (invalidObjectId(productId)) return unSuccess(res, 400, true, 'enter valid productId!')

        // Check eligibility.
        const eligible = await checkAccessToGiveFeedBack(userId, productId)
        if (!eligible) return unSuccess(res, 400, true, 'You are not eligible to give feedback on this product!')

        // check if comment already exist
        const comment = await commentModel.findOne({ productId: productId, userId: userId, isDeleted: false })
        return success(res, 200, true, "You are eligible", { comment: comment })

    } catch (e) {
        console.log(e)
        return unSuccess(res, 500, true, e.message)
    }
}

// update comment API
const view = async (req, res) => {
    try {
        let data = req.query
        let productId = req.params.productId
        let token = req.headers['x-auth-key'];

        let page = 1
        let row = 20
        let queryObj = { isDeleted: false, productId: productId }
        let sortObj = { createdAt: -1 }

        let isLogin = false;
        let mycomments = {}


        if (!emptyString(data.page) && Number(data.page) >= 1) page = data.page
        const login = await isLogined(token)
        // console.log(login)
        if (login) {
            isLogin = true
            queryObj.userId = login._id
            mycomments = await commentModel.findOne(queryObj).select({ isDeleted: 0, deletedAt: 0, __v: 0, updatedAt: 0 })
            queryObj.userId = { $ne: login._id }
        }

        // call DB here
        const comments = await commentModel.find(queryObj).populate({ path: 'userId', select: ['firstName', 'lastName'] }).sort(sortObj)
            .select({ isDeleted: 0, deletedAt: 0, __v: 0, updatedAt: 0 })
            .skip((page - 1) * row)
            .limit(row)


        const totalProducts = await commentModel.count(queryObj)
        const totalPages = Math.ceil(totalProducts / row)

        const result = { totalProducts, totalPages, page, comments, mycomments }
        return success(res, 200, isLogin, "comment update", result)

    } catch (e) {
        console.log(e)
        return unSuccess(res, 500, true, e.message)
    }
}

// update comment API
const update = async (req, res) => {
    try {
        let data = req.body
        let Id = req.tokenData.userId
        data.userId = Id
        let { userId, message, rating, productId } = data
        if (invalidObjectId(userId)) return unSuccess(res, 400, true, 'enter valid userId!')
        if (invalidObjectId(productId)) return unSuccess(res, 400, true, 'enter valid productId!')
        if (emptyString(userId)) return unSuccess(res, 400, true, 'userId is required!')
        if (rating < 1 || rating > 5) return unSuccess(res, 400, true, 'rating is 1 to 5 only !')
        if (message) {
            if (emptyString(message)) return unSuccess(res, 400, true, 'message cannot be empty!')
            if (!message.match(/^[a-zA-Z0-9\s]+$/)) return unSuccess(res, 400, true, 'comment is not valid !')
        }
        //db calls
        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) return unSuccess(res, 404, true, 'product not found')
        // comment verify
        let obj = {}

        if (rating) {
            obj.rating = rating;
        }
        if (message) {
            obj.message = message;
        }

        let comment = await commentModel.findOneAndUpdate(
            { userId: userId, isDeleted: false, productId: productId }, obj, { new: true })
        if (!comment) return unSuccess(res, 404, true, 'comment not found')
        return success(res, 200, true, "comment update", comment)

    } catch (e) {
        return unSuccess(res, 500, true, e.message)

    }
}

// delete comment 

const deletecomment = async (req, res) => {
    try {
        let data = req.body
        let userId = req.tokenData.userId

        let { commentId } = data
        if (invalidObjectId(commentId)) return unSuccess(res, 400, true, 'enter valid commentId!')

        // db calls 
        let comment = await commentModel.findOne({ userId: userId, _id: commentId, isDeleted: false })
        if (!comment) return unSuccess(res, 404, true, 'comment not found')

        comment.isDeleted = true
        comment.deletedAt = new Date()

        await comment.save();
        return success(res, 200, true, "comment deleted")
    } catch (e) {
        return unSuccess(res, 500, true, e.message)
    }
}


const checkAccessToGiveFeedBack = async (userId, productId) => {
    try {
        const inOrder = await orderModel.findOne({ userId: userId, 'items.product': productId })
        if (inOrder) return true
        return false
    } catch (e) {
        return false
    }
}

module.exports = {
    eligible,
    create,
    view,
    update,
    deletecomment
}