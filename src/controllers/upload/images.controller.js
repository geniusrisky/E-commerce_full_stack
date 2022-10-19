const { unSuccess, success } = require("../../utility/response")
const aws = require('./../../configs/aws.config')

// ⬇️ VERIFY EMAIL -------------------------------------------
const uploadImage = async (req, res) => {
    try {
        // get file 
        const files = req.files;
        if (files.length == 0) return unSuccess(res, 400, true, 'Please select some image')

        if (!["image/jpeg", "image/png"].includes(files[0].mimetype)) return unSuccess(res, 400, true, 'Only accept jpeg and png files.')
        let url = await aws.uploadFile(files[0])
        return success(res, 201, true, 'Upload Image Successfully!', { imgUrl: url })

    } catch (e) {
        return unSuccess(res, 500, true, e.message)
    }
}



module.exports = { uploadImage }