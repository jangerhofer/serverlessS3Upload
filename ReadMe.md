# Serverless Direct S3 File Upload

This example uses the [Serverless](https://serverless.com/) framework to show how sites can enable visitors to upload files directly to [S3](https://aws.amazon.com/s3/), rather than through a webserver.

## Why use the direct upload pattern?
File uploads are a common website feature however it is not immediately apparent how to build them when using the [Serverless stack](https://angerhofer.co/posts/tags/serverless).  In a traditional model, a web server receives the upload from the client/browser and sends it along to storage (whatever form that may take -- e.g. saved on disk, saved _into_ a database, uploaded to S3, etc.).

This is a relatively time-intensive task for the web server, so S3 introduces an alternative: temporary access privileges.  This alternate pattern has two steps.  First, the [Lambda](https://aws.amazon.com/lambda/) function asks S3 through our IAM credentials for a public link that will let the browser upload the file directly to an S3 bucket.  It returns this link to the browser, which subsequently `PUT`s the file to the link and completes the upload.

This model takes a fair bit of load off our Lambda functions without sacrificing the security of the upload, saving otherwise significant costs.

## Why S3?
There are a plethora of good reasons to use S3 to store your application's file uploads and you can find a much more exhaustive rundown with a quick Google search than I could hope to describe here.  In short, S3 takes all the fretting out of storing, serving up, and backing up you application's files.

## Public Link Mechanism
[Line 23 in `handler.js`](https://github.com/jangerhofer/serverlessS3Upload/blob/master/handler.js#L23): `var uploadURL = s3.getSignedUrl('putObject', s3Params);`

[This method](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getSignedUrl-property) asks S3 to generate a single-use link that will allow a browser that is NOT authenticated with AWS to upload a specific file (as specified by the `POST` request outlined below) to the application's S3 bucket.  That way, the file being uploaded never touches the Lambda server and instead goes directly from the browser into storage.

## Usage
_Assuming AWS credentials and Serverless are already configured properly._
- `npm install` the two dependencies.
- Replace the `[bucketName]` placeholder in both `handler.js` and `serverless.yml` with the desired bucket in which uploads will be stored.
- `serverless deploy` the service to AWS.
- `POST` to the API Gateway endpoint to generate a single-use upload link. _N.b. If either of these parameters does not match the file which is uploaded in the next step, S3 will throw an error and refuse the upload._
  - `POST` should have two `x-www-form-urlencoded` paramters:
    - `name`: Filename to be uploaded.
    - `type`: [MIME Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) of file.
- Create a `PUT` request via your interface of choice (e.g. AJAX call, [Postman](https://www.getpostman.com/) request, or curl).  The URL will be the result from the previous `POST`.  Attach the file Blob/binary to the request and specify the proper headers for the `Content-Type`.
  - e.g. in Curl:
  ```
  curl -v -H 'Content-Type: image/png' -T ./testFile.png "https://[bucketName].s3.amazonaws.com/testFile.png?long_query_string..."
  ```

  Et voila!  Your bucket should now have the new file.
