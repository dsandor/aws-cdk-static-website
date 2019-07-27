# aws-cdk-static-website
This module will simplify the creation of a static website in AWS. The class will create a CloudFront CDN Distribution that points to an S3 bucket with the appropriate access rights for CloudFront to read assets in the S3 bucket.

## install

```
yarn add aws-cdk-static-website
```

## usage

Create a `deploy.ts` file like the following:

```
#!/usr/bin/env node
import cdk = require('@aws-cdk/core');
import { StaticWebsiteStack, IStaticWebsiteProps } from 'aws-cdk-static-website';

export class MyWebStack extends StaticWebsiteStack {
  constructor(scope: cdk.App, id: string ) {
    const props: IStaticWebsiteProps = {
      websiteDistPath: './dist',
      deploymentVersion: '1.0.0',
      resourcePrefix: 'my-web-stack-1234',
      indexDocument: 'index.html',
    };

    super(scope, id, props);
  }
}

const app = new cdk.App();
new MyWebStack(app, 'MyWebStack');
```

Create a `cdk.json` file in the same directory.

```
{
  "app": "npx ts-node deploy.ts"
}
```

Run CDK CLI to deploy the stack.

```
cdk deploy
```

Check out the example repo here for a working example. [https://github.com/dsandor/static-website-test](https://github.com/dsandor/static-website-test)

## Options 
|property|description|
|---|---|
|websiteDistPath|The HTML files to be deployed. e.g. `./dist`|
| deploymentVersion|A version number for your deployment.|
| resourcePrefix|Used to group resources with a prefix. The S3 bucket is prefixed with this value.|
| indexDocument|index document for your website. default: `index.html`|
| certificateArn|the ARN for the SSL certificate for your website. (optional)|
| domainNames|an array of strings representing your website domain name (must match the certificate) e.g. ['mydomain.com', 'www.mydomain.com']|

Please note that if you wish to use your own domain names and not just the Cloud Front Distribution URL you will also need a certificate. It is very simple to create a certificate in AWS console and it is free (assuming you are supporting modern browsers only). Once you have the ARN for your certificate use the `certificateArn` property. You will also need to provide the domain names to the `domainNames` property. The domain names MUST MATCH the domain names you put on your certificate.

## Versioned Deployments

When your website code is deployed it is placed in a version folder in the S3 bucket based on the `deploymentVersion` property. This allows you to bump your version each deployment and rollback to a previous version is as simple as changing the originPath in your CloudFront Distribution config.

## Deploy many times

You can continuously deploy using this code. The AWS infrastructure will be updated if you make changes otherwise it will remain unchanged.  The only thing that needs to change is the code in `./dist` is uploaded and the `Origin Path` in your CloudFront Distribution is changed to point to the new version folder in the S3 Bucket.
