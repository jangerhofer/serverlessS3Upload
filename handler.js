'use strict';

var AWS = require('aws-sdk');
var queryString = require('query-string');

module.exports.requestUploadURL = (event, context, callback) => {

  // Create new S3 instance to handle our request for a new upload URL.
  // Using signatureVersion v4 allows authenticating inbound API requests to AWS services.
  const s3 = new AWS.S3({
    signatureVersion: 'v4'
  });

  // Parse out the parameters of the file the client would like to upload.
  var params = queryString.parse(event.body)

  // Assemble a dictionary of parameters to hand to S3: the S3 bucket name, the file name, the file type, and permissions.  Other paramters like expiration can be specified here.  See the documentation for this method for more details.
  var s3Params = {
    Bucket: '[bucketName]',
    Key:  params.name,
    ContentType: params.type,
    ACL: 'public-read',
  };

  // Ask S3 for a temporary URL that the client can use.
  var uploadURL = s3.getSignedUrl('putObject', s3Params);

  // Return success message to the client, with the upload URL in the payload.
  callback(null, {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ uploadURL: uploadURL }),
  })
}
