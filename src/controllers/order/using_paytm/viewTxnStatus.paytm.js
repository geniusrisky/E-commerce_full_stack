const { unSuccess, success } = require("../../../utility/response");
const transactionModel = require("../../../models/transactions.model");
const radis = require('../../../configs/radis.config');
const { emptyString } = require("../../../utility/validations");



const viewStatus = async (req, res) => {
    try {
        const txnId = req.body.txnId
        if (emptyString(txnId)) return unSuccess(res, 400, true, 'callback is required!')

        let user = req.user

        const txnData = await transactionModel.findOne({ userId: user._id, txn_id: txnId })
        if (!txnData) return unSuccess(res, 404, true, 'Transaction data not found!')

        return success(res, 200, true, 'status show', txnData)

    }
    catch (e) {
        console.log(e)
        return unSuccess(res, 500, true, e.message)
    }

}
module.exports = { viewStatus }