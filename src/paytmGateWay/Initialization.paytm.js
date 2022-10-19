const { paytmEnv } = require("../environment/config.env");
const checksum_lib = require('paytmchecksum');


const paytmInitialization = async (amount, orderId, customerId, phone, email, callback) => {
    try {

        var paytmParams = {
            "MID": `${paytmEnv.MID}`,
            "WEBSITE": `${paytmEnv.WEBSITE}`,
            "INDUSTRY_TYPE_ID": `${paytmEnv.INDUSTRY_TYPE_ID}`,
            "CHANNEL_ID": `${paytmEnv.CHANNEL_ID}`,
            "ORDER_ID": `${orderId}`,
            "CUST_ID": `${customerId}`,
            "MOBILE_NO": `${phone}`,
            "EMAIL": `${email}`,
            "TXN_AMOUNT": `${amount}`,
            "CALLBACK_URL": `${callback}`
        };

        let checksum = await checksum_lib.generateSignature(paytmParams, paytmEnv.KEY)
        paytmParams.CHECKSUMHASH = checksum
        /* for Staging */
        var URL = paytmEnv.URL;
        // console.log(paytmParams)
        return {
            URL, BODY: paytmParams
        }

    } catch (e) {
        console.log(e.message)
        throw e
    }
}

module.exports = paytmInitialization