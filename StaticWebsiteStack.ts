import cdk = require('@aws-cdk/core');
import {
  CloudFrontWebDistribution,
  CloudFrontWebDistributionProps,
  OriginAccessIdentity,
} from '@aws-cdk/aws-cloudfront'
import { Bucket } from '@aws-cdk/aws-s3';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import * as iam from '@aws-cdk/aws-iam';


export class StaticWebsiteStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, staticWebsiteConfig: IStaticWebsiteProps) {
    super(scope, id, undefined);

    const resourcePrefix = staticWebsiteConfig.resourcePrefix;
    const deploymentVersion = staticWebsiteConfig.deploymentVersion;
    const originPath = deploymentVersion.replace(/\./g, '_');

    const sourceBucket = new Bucket(this, `S3BucketForWebsite`, {
      websiteIndexDocument: staticWebsiteConfig.indexDocument || 'index.html',
      bucketName: `${resourcePrefix}-website`,
    });

    new BucketDeployment(this, 'DeployWebsite', {
      sources: [Source.asset(staticWebsiteConfig.websiteDistPath)],
      destinationBucket: sourceBucket,
      destinationKeyPrefix: originPath,
    });

    const cloudFrontOia = new OriginAccessIdentity(this, 'OIA', {
      comment: `${resourcePrefix}_oia`,
    });
    // See AWS-CDK Issue: https://github.com/aws/aws-cdk/issues/941

    let cloudFrontDistProps: CloudFrontWebDistributionProps;

    if (staticWebsiteConfig.certificateArn) {
      cloudFrontDistProps = {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: sourceBucket,
              originAccessIdentity: cloudFrontOia,
            },
            behaviors: [{ isDefaultBehavior: true }],
            originPath: `/${originPath}`,
          },
        ],
        aliasConfiguration: {
          acmCertRef: staticWebsiteConfig.certificateArn,
          names: staticWebsiteConfig.domainNames || [],
        },
      };
    } else {
      cloudFrontDistProps = {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: sourceBucket,
              originAccessIdentity: cloudFrontOia,
            },
            behaviors: [{ isDefaultBehavior: true }],
            originPath: `/${originPath}`,
          },
        ],
      };
    }

    new CloudFrontWebDistribution(this, `${resourcePrefix}-cloudfront`, cloudFrontDistProps);

    const policyStatement = new iam.PolicyStatement();
    policyStatement.addActions('s3:GetBucket*');
    policyStatement.addActions('s3:GetObject*');
    policyStatement.addActions('s3:List*');
    policyStatement.addResources(sourceBucket.bucketArn);
    policyStatement.addResources(`${sourceBucket.bucketArn}/*`);
  
    cloudFrontOia.grantPrincipal.addToPolicy(policyStatement);
    //policyStatement.addCanonicalUserPrincipal(cloudFrontOia.grantPrincipal.addToPolicy());

    sourceBucket.addToResourcePolicy(policyStatement);
  }
}

export interface IStaticWebsiteProps {
  websiteDistPath: string;
  deploymentVersion: string
  certificateArn?: string;
  domainNames?: Array<string>;
  resourcePrefix: string;
  indexDocument?: string;
}