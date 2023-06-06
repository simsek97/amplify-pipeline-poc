import { Stack, StackProps } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { AppCodePipeline } from './pipeline';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const account = process.env.CDK_DEFAULT_ACCOUNT;
    const region = process.env.CDK_DEFAULT_REGION;

    if (!account || !region) {
      throw new Error('Missing CDK_DEFAULT_ACCOUNT or CDK_DEFAULT_REGION');
    }

    // Create a lambda function
    const pipelineLambda = new Function(this, 'PipelineLambda', {
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromAsset('resources'),
      handler: 'pipeline.handler'
    });

    // Create a API Gateway REST API
    const apiGateway = new RestApi(this, 'ApiGateway', {
      restApiName: 'API Gateway'
    });

    // Add integration for the lambda function
    const lambdaIntegration = new LambdaIntegration(pipelineLambda);

    // Add GET method for root
    apiGateway.root.addMethod('GET', lambdaIntegration);

    // Create Pipeline for Dev Environment
    const devPipeline = new AppCodePipeline(this, 'DevPipeline', {
      pipelineName: 'AmplifyDevPipeline',
      pipelineAccount: account,
      pipelineRegion: region,
      sourceRepositoryName: 'amplify-pipeline-poc',
      sourceBranchName: 'main',
      sourceRepositoryOwner: 'simsek97',
      oauthTokenSecretName: 'secretGithubOauth',
      buildSpecFile: 'buildspecs/devBuild.yaml',
      environment: 'dev'
    });

    // Create Pipeline for Prod Environment
    // const prodPipeline = new AppCodePipeline(this, 'ProdPipeline', {
    //   pipelineName: 'AmplifyProdPipeline',
    //   pipelineAccount: account,
    //   pipelineRegion: region,
    //   sourceRepositoryName: 'amplify-pipeline-poc',
    //   sourceBranchName: 'main',
    //   sourceRepositoryOwner: 'simsek97',
    //   oauthTokenSecretName: 'secretGithubOauth',
    //   buildSpecFile: 'buildspecs/prodBuild.yaml',
    //   environment: 'prod'
    // });
  }
}
