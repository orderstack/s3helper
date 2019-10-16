let aws = require('aws-sdk')
const dotenv = require('dotenv')
dotenv.config()

module.exports = function ({S3_CONN_CONFIG, BUCKET_NAME, S3_ENDPOINT, UPLOAD_MAX_FILE_SIZE}) {
    let S3Instance = new aws.S3({
        ...S3_ENDPOINT && {endpoint: new aws.Endpoint(S3_ENDPOINT)},
        ...S3_CONN_CONFIG
    })

    return {
        uploadFileData: (fileData, uploadPath) => {
            return new Promise((resolve, reject) => {
                let params = {
                    Bucket: BUCKET_NAME,
                    Key: uploadPath,
                    Body: fileData
                }
                S3Instance.upload(params,
                    function (err, data) {
                        if (err) {
                            reject(err)
                        } else {
                            resolve(data)
                        }
                    }
                )
            })
        },

        getURLForUpload: (uploadPath, expiry) => {
            return new Promise((resolve, reject) => {
                try {
                    S3Instance.createPresignedPost({
                        Bucket: BUCKET_NAME,
                        Conditions: [
                            ["content-length-range", 1, UPLOAD_MAX_FILE_SIZE]
                        ],
                        Fields: {
                            key: uploadPath,
                        },
                        Expires: Number(expiry)
                    }, (err, preSignedRequest) => {
                        if (err) {
                            console.error('File upload error: ', err);
                            reject(err);
                        } else {
                            resolve(preSignedRequest);
                        }
                    });
                } catch (e) {
                    reject(e)
                }
            })
        },
        getURLForDownload: (filePath, expiry) => {
            return new Promise((resolve, reject) => {
                try {
                    var params = {
                        Bucket: BUCKET_NAME,
                        Key: filePath,
                        Expires: expiry
                    };
                    S3Instance.getSignedUrl('getObject', params, function (err, url) {
                        if (err) {
                            reject(err)
                        } else {
                            resolve(url)
                        }
                    })
                } catch (e) {
                    reject(e)
                }
            })
        }
    }
}

if (!module.parent) {
    module.exports({
        S3_CONN_CONFIG: {
            apiVersion: '2006-03-01',
            region: "us-west-2",
            signatureVersion: 'v4',
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_KEY
        },
        BUCKET_NAME: "test-bucket-orderstack",
        UPLOAD_MAX_FILE_SIZE: 5048576
    }).getURLForDownload(
        "test.txt", 60
    ).then((data) => {
        //to print form data fields.
        // Object.keys(data.fields).forEach(k => {
        //     console.log(k + ":" + data.fields[k])
        // })
        console.log(data)
    }).catch(e => console.error(e))
}
