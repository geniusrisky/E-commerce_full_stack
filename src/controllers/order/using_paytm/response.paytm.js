/**
 * After payment complete or failed.This API executive and update the order items and all details.
*/


const { unSuccess, success } = require("../../../utility/response");
const productModel = require("../../../models/product.model");
const transactionModel = require("../../../models/transactions.model");
const cartModel = require('../../../models/cart.Model');
const { default: mongoose } = require("mongoose");
const radis = require('../../../configs/radis.config');
const { emptyObject } = require("../../../utility/validations");
const { paytmEnv } = require("../../../environment/config.env");
const checksum_lib = require('paytmchecksum');
const orderModel = require("../../../models/order.model");
const { orderplacedmail } = require("../../../smtp_templates/orderplaced.smtp")
const { transactionstatus } = require("../../../smtp_templates/transactionstatus.smtp")


const callbackPayment = async (req, res) => {
    try {
        const body = req.body
        if (emptyObject(body)) return unSuccess(res, 400, true, 'callback is required!')

        const cache_order = await radis.get(`${body.ORDERID}`)
        if (!cache_order) return unSuccess(res, 500, true, 'cache data not found!')

        // str conv to obj
        const DATA = JSON.parse(cache_order)

        // delete radis data cause it does'n need any more
        await radis.del(`${body.ORDERID}`)
        let fields = { ...body }

        let paytmChecksum = fields.CHECKSUMHASH
        delete fields.CHECKSUMHASH;

        var isVerifySignature = checksum_lib.verifySignature(fields, paytmEnv.KEY, paytmChecksum);
        if (!isVerifySignature) return unSuccess(res, 400, true, 'Checksum data mismatch!')



        /**
         * after updating order 
         * update payment info
        */

        const payObj = {
            userId: DATA.orderObj.userId,
            txn_id: fields.TXNID,
            amount: fields.TXNAMOUNT,
            status: fields.STATUS,
            resp_msg: fields.RESPMSG,
            log: fields
        }

        // console.log(payObj)
        const createPayment = await transactionModel.create(payObj)

        // send transaction alert in mail SMTP HERE - 
        transactionstatus(DATA.user.firstName, DATA.user.email, `${DATA.callback}/payment/${fields.TXNID}`, fields.TXNAMOUNT, fields.STATUS, fields.RESPMSG)



        if (fields.STATUS == 'TXN_SUCCESS') {

            /** 
             * create order here -----------------------------
            */
            let orderObj = DATA.orderObj
            orderObj.payment.status = 'PAID'
            orderObj.payment.paymentId = fields.ORDERID
            orderObj.payment.txnId = fields.TXNID
            orderObj.payment.date = fields.TXNDATE
            orderObj.payment.method = fields.PAYMENTMODE

            const orderCreate = await orderModel.create(orderObj)

            // console.log(orderObj.userId)
            // remove items from cart
            await cartModel.findOneAndUpdate({ userId: orderObj.userId }, { $set: { items: [] } })

            // order placed email here
            orderplacedmail(DATA.user.firstName, DATA.user.email, fields.TXNAMOUNT, `${DATA.callback}/my/orders/${orderCreate._id}`)

            // now all set redirect to page
            return res.redirect(301, `${DATA.callback}/payment/${fields.TXNID}`)

        } else {

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

            // redirect to cart 
            // because transaction is failed
            return res.redirect(301, `${DATA.callback}/cart`)
        }
    }
    catch (e) {
        console.log(e)
        return unSuccess(res, 500, true, e.message)
    }

}
module.exports = { callbackPayment }









