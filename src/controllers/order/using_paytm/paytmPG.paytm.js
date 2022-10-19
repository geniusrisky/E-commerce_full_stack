/**
 * Whenever the user trying to checkout.
 * This API first execute.
 * For generating token.
 * Store temporary order ID For 15 minute. */


const { unSuccess, success } = require("../../../utility/response");
const productModel = require("../../../models/product.model");
const transactionModel = require("../../../models/transactions.model");
const cartModel = require('../../../models/cart.Model');
const paytmInitialization = require('../../../paytmGateWay/Initialization.paytm')
const { default: mongoose } = require("mongoose");
const radis = require('../../../configs/radis.config');
const { emptyString } = require("../../../utility/validations");



const createPayment = async (req, res) => {
    try {
        const frontendCallBack = req.body.callback
        if (emptyString(frontendCallBack)) return unSuccess(res, 400, true, 'callback is required!')

        let date = new Date()
        let data = req.user

        /**
         * Castanet to check the cottage exist or not.RF exist then it must be.Have some item.
        */

        let cartData = await cartModel.findOne({ userId: data._id }).populate("items.product", { 'price': 1, 'size_and_inventory': 1 })
        if (!cartData) return unSuccess(res, 404, true, 'cart not found')

        // if cart is empty
        if (cartData.items.length <= 0) return unSuccess(res, 404, true, 'Your cart is empty!')

        // create bolk for updating leter
        /**
         * then created a bulk BulkUpdateObj data type is object - use to store the query which i need to use for bulk updating product
         * in product module.
        */
        let BulkUpdateObj = {}
        const ORDER_ID = `ODR-GO-${new Date().getTime()}`

        let items = [], total_mrp = 0, total = 0, delivery = 0;
        for (let each of cartData.items) {

            /** first check the quantity of this item (STOCK avalable OR Not) */
            let productID = each.product._id.toString()
            if (each.product.size_and_inventory[each.size] < each.quantity) {
                return unSuccess(res, 404, true, 'Some of the items you trying to order are out of stock!')
            }

            total_mrp += each.product.price.mrp * each.quantity
            total += each.product.price.total * each.quantity

            // Who's items in item array for future update
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
                // set new data inside $inc
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
        let subTotal = total + delivery
        let callback = `${req.protocol}://${req.headers.host}/public/paytm/callback`


        //Obj for order update
        let ORDER_OBJECT = {
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
                by: 'PAYTM',
                status: 'UNPAID',
                paymentId: '',
                txnId: null,
                date: null,
                method: null
            },
            address: data.address
        }

        // bulk updateobj conv to BulkUpdateArr
        const bulkUpdateArr = []
        for (let key in BulkUpdateObj) {
            bulkUpdateArr.push(BulkUpdateObj[key])
        }

        const PAYTM = await paytmInitialization(subTotal, ORDER_ID, data._id, data._phone, data._email, callback)
        if (!PAYTM) return unSuccess(res, 500, true, PAYTM.message)

        // Update the product Quantity
        await productModel.bulkWrite(bulkUpdateArr)

        // overalObject here it stores all
        const OBJECT = {
            items: cartData.items,
            orderObj: ORDER_OBJECT,
            paytm: PAYTM,
            callback: frontendCallBack,
            user: data
        }

        // store obj in cache
        await radis.set(ORDER_ID, JSON.stringify(OBJECT))

        /**
         * here is Call back function
         * it call after 15 min to update product and payment status
        */
        setTimeout(() => {
            PAYMENT_CALLBACK(ORDER_ID, true)
        }, 900000); //900000 | 15 min

        return success(res, 200, true, 'Checksum created', PAYTM)

    }
    catch (e) {
        console.log(e)
        return unSuccess(res, 500, true, e.message)
    }

}
module.exports = { createPayment }






















/**
 * 
 * 
 * CALL BACK IS HERE
 * 
 * 
*/

const PAYMENT_CALLBACK = async (ORDER_ID, DEBUG = false) => {
    try {
        if (DEBUG) console.log('➡️', ' Call Back is Start')

        // need to check cache is exist or not
        let order_Cache = await radis.get(ORDER_ID)
        let DATA = null;
        if (!order_Cache) {
            if (DEBUG) console.log('➡️', ' radis order data empty STATUS UPDATED ALREADY')
            return 'Payment may already updated'
        }

        // if (DEBUG) console.log('➡️ RawData', order_Cache)
        DATA = JSON.parse(order_Cache)

        // remove the key from radis
        await radis.del(ORDER_ID)

        // bult query creating here
        //because we remove some items so if payment not heled then reverse the item quantity
        let BulkUpdateObj = {}
        for (let each of DATA.items) {
            let productID = each.product._id.toString()

            // push for bulk update for products
            let $inc = {}
            if (BulkUpdateObj[productID]) {
                // set already existed data inside $inc
                $inc = BulkUpdateObj[productID]['updateOne']['update']['$inc'];
                // update current data quantity with key
                $inc['size_and_inventory.' + each.size] = + each.quantity
            } else {
                // set new data inside $inc
                $inc['size_and_inventory.' + each.size] = + each.quantity
            }

            BulkUpdateObj[productID] = {
                updateOne: {
                    "filter": { "_id": mongoose.Types.ObjectId(productID) },
                    "update": { $inc }
                }
            }
        }



        // bulk updateobj conv to BulkUpdateArr
        const bulkUpdateArr = []
        for (let key in BulkUpdateObj) {
            bulkUpdateArr.push(BulkUpdateObj[key])
        }

        // Update the product Quantity
        await productModel.bulkWrite(bulkUpdateArr)
        if (DEBUG) console.log('➡️', ' bulk products item restoreed')

        if (DEBUG) console.log('✳️ Callback complete for - ', ORDER_ID)
        // end here
    } catch (e) {
        if (DEBUG) console.log('❌ ERROR - ', e.message)
    }
}