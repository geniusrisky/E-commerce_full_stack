const wishModel = require('../../models/wishlist.Model')
const productModel = require('./../../models/product.model')
const { unSuccess, success } = require("../../utility/response");
const { emptyObject, invalidObjectId, emptyString } = require('../../utility/validations');


const createList = async (req, res) => {
    try {
        let data = req.body
        if (emptyObject(data)) return unSuccess(res, 400, true, 'Body is required!!')
        let userId = req.tokenData.userId
        let { productId } = data
        if (emptyString(productId)) return unSuccess(res, 400, true, 'ProductId required!')
        if (invalidObjectId(productId)) return unSuccess(res, 400, true, 'enter valid productId!')
        let list = await wishModel.findOne({ userId: userId })
        if (list) {
            let items = list.items

            // if item list exid
            if (items.length >= 20) return unSuccess(res, 400, true, 'You can only add 20 items to your wishlist!')

            for (let each of items) {
                if (productId === each.product.toString()) {
                    return unSuccess(res, 200, true, 'Product already exist in your wishlist!')
                }
            }

            items.push({ product: productId })
            await list.save();
            return success(res, 201, true, "This product added to your wishlist", { totalWishlist: list.items.length })
        }
        // here is it need a age case for line no 15?
    }
    catch (e) {
        console.log(e)
        return unSuccess(res, 500, true, e.message)
    }
}

//=================get wishList=====================
const viewList = async (req, res) => {
    try {
        let userId = req.tokenData.userId
        let list = await wishModel.findOne({ userId: userId }).populate({ path: 'items.product', select: ['_id', 'title', 'size_and_inventory', 'shortDescription', 'price', 'images', 'category', 'brandName'] }).select({ "items._id": 0 })
        return success(res, 200, true, "wishlist", list)
    }
    catch (e) {
        console.log(e)
        return unSuccess(res, 500, true, e.message)
    }
}
//================remove wishList item===================
const removeItem = async (req, res) => {
    try {
        let data = req.body
        if (emptyObject(data)) return unSuccess(res, 400, true, 'Body is required!!')
        let userId = req.tokenData.userId
        let { productId } = data
        if (emptyString(productId)) return unSuccess(res, 400, true, 'ProductId required!')
        if (invalidObjectId(productId)) return unSuccess(res, 400, true, 'enter valid productId!')
        let list = await wishModel.findOne({ userId: userId }).populate({ path: 'items.product', select: ['_id', 'title', 'size_and_inventory', 'shortDescription', 'price', 'images', 'category', 'brandName'] }).select({ "items._id": 0 })
        let items = list.items
        items.forEach((e, i) => {
            if (productId == e.product._id.toString()) {
                items.splice(i, 1)
            }
        })
        await list.save()
        return success(res, 200, true, "Item removed from wishlist!", list)
    }
    catch (e) {

    }
}
module.exports = { createList, viewList, removeItem }