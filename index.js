let aws = require("aws-sdk")

module.exports = function({ S3_CONN_CONFIG, BUCKET_NAME, S3_ENDPOINT }) {
	let S3Instance = new aws.S3({
		...(S3_ENDPOINT && { endpoint: new aws.Endpoint(S3_ENDPOINT) }),
		...S3_CONN_CONFIG,
	})

	return {
		uploadFileData: paramArgs => {
			return new Promise((resolve, reject) => {
				let params = {
					Bucket: BUCKET_NAME,
					...paramArgs,
				}
				S3Instance.upload(params, function(err, data) {
					if (err) {
						reject(err)
					} else {
						resolve(data)
					}
				})
			})
		},

		getURLForUpload: paramArgs => {
			return new Promise((resolve, reject) => {
				try {
					let params = {
						Bucket: BUCKET_NAME,
						...paramArgs,
						// Conditions: [
						// 	[
						// 		"content-length-range",
						// 		1,
						// 		UPLOAD_MAX_FILE_SIZE,
						// 	],
						// ],
						// Fields: {
						// 	key: uploadPath,
						// },
						// Expires: Number(expiry),
					}
					S3Instance.createPresignedPost(
						params,
						(err, preSignedRequest) => {
							if (err) {
								console.error("File upload error: ", err)
								reject(err)
							} else {
								resolve(preSignedRequest)
							}
						}
					)
				} catch (e) {
					reject(e)
				}
			})
		},
		getURLForDownload: paramArgs => {
			return new Promise((resolve, reject) => {
				try {
					var params = {
						Bucket: BUCKET_NAME,
						...paramArgs,
						// Key: filePath,
						// Expires: expiry,
					}
					S3Instance.getSignedUrl("getObject", params, function(
						err,
						url
					) {
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
		},
	}
}

// module
// 	.exports({
// 		S3_CONN_CONFIG: {
// 			apiVersion: "2006-03-01",
// 			region: "us-west-2",
// 			signatureVersion: "v4",
// 			accessKeyId: process.env.S3_ACCESS_KEY,
// 			secretAccessKey: process.env.S3_SECRET_KEY,
// 		},
// 		BUCKET_NAME: "test-bucket-orderstack",
// 		UPLOAD_MAX_FILE_SIZE: 5048576,
// 	})
// 	.getURLForDownload({Key: "test.txt", Expires: 60})
// 	.then(data => {
// 		//to print form data fields.
// 		// Object.keys(data.fields).forEach(k => {
// 		//     console.log(k + ":" + data.fields[k])
// 		// })
// 		console.log(data)
// 	})
// 	.catch(e => console.error(e))
