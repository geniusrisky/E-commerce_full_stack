const radis = require("../../configs/radis.config")
const exploreModel = require("../../models/explore.model")
const { unSuccess, success } = require("../../utility/response")
const { emptyObject, emptyString, emptyArray } = require("../../utility/validations")

const exploreList = async (req, res) => {

    try {

        // Here I trying to use Redis.Because every time any user opens up this page, always slow.So.
        const oldExplore = await radis.get('explore')
        if (oldExplore) {
            return success(res, 200, true, 'Explore list!', JSON.parse(oldExplore))
        }

        const explore = await exploreModel.find({ isDeleted: false }).sort({ createdAt: 1 }).limit(100)
        // set data in radis here...
        await radis.setEx('explore', 7200, JSON.stringify(explore)) //7200 2 hr
        return success(res, 200, true, 'Explore list!', explore)

    } catch (e) {
        console.log(e)
        return unSuccess(res, 500, true, e.message)
    }
}

module.exports = exploreList