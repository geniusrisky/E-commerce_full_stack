const aws = require('aws-sdk');
const { awsConnect } = require('../environment/config.env');


aws.config.update(awsConnect)


let uploadFile = async (file, debug = false) => {
    return new Promise(function (resolve, reject) {
        // this function will upload file to aws and return the link
        let s3 = new aws.S3({
            apiVersion: '2006-03-01'
        });
        // we will be using the s3 service of aws

        var uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket",
            Key: "group39/userProfile/file_" + new Date().getTime() + file.originalname,
            Body: file.buffer
        }

        s3.upload(uploadParams, function (err, data) {
            if (err) {
                if (debug) console.log(data)
                return reject(err)
            }

            if (debug) console.log("file uploaded succesfully, Path:", data.Location)
            return resolve(data.Location)
        })

    })
}

module.exports = {
    uploadFile
}