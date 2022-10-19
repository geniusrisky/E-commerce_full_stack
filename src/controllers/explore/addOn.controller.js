const exploreModel = require("../../models/explore.model")
const { unSuccess, success } = require("../../utility/response")
const { emptyObject, emptyString, emptyArray } = require("../../utility/validations")

const addExplore = async (req, res) => {

    try {
        // get data from frontend
        const data = req.body
        // get user admin
        const admin = req.admin

        if (emptyObject(data)) return unSuccess(res, 400, true, 'Post body required!')

        // dstructure here
        let { contentType, content } = data

        if (emptyString(contentType)) return unSuccess(res, 400, true, 'contentType is required!')
        if (!["slider", "banner", "horizontal_scroll", "grid"].includes(contentType)) return unSuccess(res, 400, true, 'contentType is accept only slider, banner, horizontal_scroll, grid!')
        if (emptyArray(content)) return unSuccess(res, 400, true, 'contentType is required!')


        // dbcall for save explore
        const obj = {
            aid: admin._id,
            content,
            contentType
        }
        const explore = await exploreModel.create(obj)
        return success(res, 201, true, 'Explore add successfully!', explore)

    } catch (e) {
        console.log(e)
        return unSuccess(res,500,true,e.message)
    }
}

module.exports = addExplore