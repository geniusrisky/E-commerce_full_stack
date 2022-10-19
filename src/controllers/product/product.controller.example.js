const { unSuccess, success } = require("../../utility/response");
const productModel = require("../../models/product.model");
const { emptyArray } = require("../../utility/validations");

// ⬇️ create product ---------------------------------------

const create = async (req, res) => {
    try {
        // get body data
        const data = req.body;

        if (!data || emptyArray(data)) return unSuccess(res, 400, true, 'Post body is required!')

        const productCreate = await productModel.insertMany(data)

        return success(res, 201, true, "Product created successfully!", productCreate)
    } catch (_) { return unSuccess(res, 500, true, _.message) }
}


module.exports = create