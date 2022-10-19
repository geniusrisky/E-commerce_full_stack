const { unSuccess, success } = require("../../../utility/response");
const productModel = require("../../../models/product.model");
const cartModel = require('../../../models/cart.Model');
const orderModel = require("../../../models/order.model");
const { default: mongoose } = require("mongoose");
const { orderplacedmail } = require("../../../smtp_templates/orderplaced.smtp")
const { emptyString } = require("../../../utility/validations");



const orderCod = async (req, res) => {
    try {
        const frontendCallBack = req.body.callback
        if (emptyString(frontendCallBack)) return unSuccess(res, 400, true, 'callback is required!')

        let date = new Date()
        let data = req.user
        let cartData = await cartModel.findOne({ userId: data._id }).populate("items.product", { 'price': 1, 'size_and_inventory': 1 })
        if (!cartData)
            return unSuccess(res, 404, true, 'cart not found')
        // console.log(cartData)

        // creating items for order API
        let items = []
        // create bolk for updating leter
        let BulkUpdateObj = {}

        let total_mrp = 0, total = 0, delivery = 0;
        for (let each of cartData.items) {
            let productID = each.product._id.toString()
            if (each.product.size_and_inventory[each.size] < each.quantity) {
                return unSuccess(res, 404, true, 'Some of the ttems you trying to order are out of stock!')
            }

            total_mrp += each.product.price.mrp * each.quantity
            total += each.product.price.total * each.quantity
            // console.log(total_mrp + "   " + total)
            items.push({
                product: productID,
                price: each.product.price,
                quantity: each.quantity,
                size: each.size
            })

            // push for bulk update for products
            let $inc = {}
            if (BulkUpdateObj[productID]) {
                // set already existed data inside $inc
                $inc = BulkUpdateObj[productID]['updateOne']['update']['$inc'];
                // update current data quantity with key
                $inc['size_and_inventory.' + each.size] = - each.quantity
            } else {
                $inc['size_and_inventory.' + each.size] = - each.quantity
            }

            BulkUpdateObj[productID] = {
                updateOne: {
                    "filter": { "_id": mongoose.Types.ObjectId(productID) },
                    "update": { $inc }
                }
            }

        }


        let total_discount = total_mrp - total
        if (total < 500) {
            delivery = 49
        }
        //⏬this obj will be used to create order document
        let obj = {
            userId: data._id,
            status: 'PENDING',
            statusHistory: [{
                title: "Order Placed",
                date: date
            }, {
                title: "Not yet dispatched, Request Received by seller",
                date: date
            }],
            items: items,
            price: { total_mrp, total_discount, delivery, total },
            payment: {
                by: 'COD',
                status: 'UNPAID'
            },
            address: data.address
        }


        // bulk updateobj conv to BulkUpdateArr
        const bulkUpdateArr = []
        for (let key in BulkUpdateObj) {
            bulkUpdateArr.push(BulkUpdateObj[key])
        }


        //Document creatation in db 
        const orderCreated = await orderModel.create(obj)

        // make the cart empty
        cartData.items = []
        await cartData.save();

        // Update the product Quantity
        await productModel.bulkWrite(bulkUpdateArr)

        // order placed email send from here
        orderplacedmail(data.firstName,data.email,obj.price.total,`${frontendCallBack}/my/orders/${orderCreated._id}`)

        return success(res, 201, true, 'Your order placed successfully!', { orderId: orderCreated._id })

    }
    catch (e) {
        console.log(e)
        return unSuccess(res, 500, true, e.message)
    }

}
module.exports = { orderCod }