import { SecretValue } from 'aws-cdk-lib';
import { BuildSpec, Cache, ComputeType, LinuxBuildImage, LocalCacheMode, PipelineProject } from 'aws-cdk-lib/aws-codebuild';
import { Artifact, IAction, Pipeline, StageProps } from 'aws-cdk-lib/aws-codepipeline';
import { CodeBuildAction, GitHubSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { Construct } from 'constructs';

export interface ICodePipelineForCDK {
  readonly pipelineName: string;
  readonly pipelineAccount: string;
  readonly pipelineRegion: string;
  readonly sourceRepositoryName: string;
  readonly sourceBranchName: string;
  readonly sourceRepositoryOwner: string;
  readonly oauthTokenSecretName: string;
  readonly buildSpecFile: string;
  readonly environment: string;
}

export class AppCodePipeline extends Construct {
  constructor(scope: Construct, id: string, props: ICodePipelineForCDK) {
    super(scope, id);

    const sourceArtifact: Artifact = new Artifact('SourceOutput');
    const buildArtifact: Artifact = new Artifact('BuildOutput');

    /**
     * Source Stage starts here
     */
    const githubSourceAction = new GitHubSourceAction({
      actionName: 'SourceAction',
      owner: props.sourceRepositoryOwner,
      runOrder: 1,
      output: sourceArtifact,
      branch: props.sourceBranchName || 'main',
      repo: props.sourceRepositoryName,
      oauthToken: SecretValue.secretsManager(props.oauthTokenSecretName)
    });

    // Source Stage
    const sourceStage: StageProps = {
      stageName: 'Source',
      actions: [githubSourceAction]
    };

    /**
     * Build Stage starts here
     **/
    const buildProject: PipelineProject = new PipelineProject(this, `CDK-BuildProject-${props.environment}`, {
      description: `CDK Stage Deploy Build Project for pipeline ${props.pipelineName}`,
      cache: Cache.local(LocalCacheMode.DOCKER_LAYER),
      environment: {
        computeType: ComputeType.MEDIUM,
        privileged: true,
        buildImage: LinuxBuildImage.STANDARD_5_0
      },
      environmentVariables: {
        ENVIRONMENT: { value: props.environment },
        AWS_ACCOUNT: { value: props.pipelineAccount },
        AWS_REGION: { value: props.pipelineRegion }
      },
      buildSpec: BuildSpec.fromSourceFilename(props.buildSpecFile)
    });

    const buildAction: IAction = new CodeBuildAction({
      actionName: 'BuildBackend',
      runOrder: 6,
      input: sourceArtifact,
      outputs: [buildArtifact],
      project: buildProject
    });

    const buildStage: StageProps = {
      stageName: 'Build',
      actions: [buildAction]
    };

    // Create Pipeline using stages
    const pipeline = new Pipeline(this, `Amplify-Pipeline-${props.environment}`, {
      pipelineName: props.pipelineName,
      stages: [sourceStage, buildStage]
    });
  }
}
