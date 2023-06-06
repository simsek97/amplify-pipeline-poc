#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';

import { CdkStack } from '../lib/cdk-stack';

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;

if (!account || !region) {
  throw new Error('Missing CDK_DEFAULT_ACCOUNT or CDK_DEFAULT_REGION');
}

const app = new App();

new CdkStack(app, 'CdkStack', {
  env: { account: account, region: region }
});
