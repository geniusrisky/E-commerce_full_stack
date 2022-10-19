/**
 * Get all orders using user ID.
 * Which is not deleted.And with pagination.
 * Maximum list 20.
 * you have token and or page, row def 20
 * frontend nrrds 
 * data{
 *  list, total orders, total page, currentpage
 * }
 * */
const { unSuccess, success } = require("../../utility/response");
const orderModel = require("../../models/order.model");


const orderList = async (req, res) => {
    try {
        const query = req.query
        let user = req.user
        let page = query.page || 1
        let row = query.row || 20
        let orders = await orderModel.find({ userId: user._id, isDeleted: false }).select({ items: 0, payment: 0, price: 0, statusHistory: 0, userId: 0, __v: 0, updatedAt: 0 }).sort({ createdAt: -1 }).skip((page - 1) * row).limit(row)
        let totalOrders = await orderModel.find({ userId: user._id, isDeleted: false }).count()
        const data = {
            list: orders,
            totalOrders,
            totalPage: Math.ceil(totalOrders / row),
            currentPage: page
        }
        return success(res, 200, true, 'Order list', data)
    }
    catch (e) {
        console.log(e)
        return unSuccess(res, 500, true, e.message)
    }
}




/**
 * You receive order id from path params
 * populate all items return
 * the end
 */
const orderData = async (req, res) => {
    try {
        let orderId = req.params.orderId
        let user = req.user
        let orderData = await orderModel.findOne({ _id: orderId, userId: user._id, isDeleted: false }).populate("items.product", { 'isDeleted': 1, 'brandName': 1, 'images': 1, 'title': 1, '_id': 1 })
        if (!orderData) return unSuccess(res, 404, true, "Order details not found")
        return success(res, 200, true, 'Order', orderData)
    }
    catch (e) {
        console.log(e)
        return unSuccess(res, 500, true, e.message)
    }
}

module.exports = { orderList, orderData }