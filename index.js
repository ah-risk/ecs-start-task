const core = require('@actions/core');
const aws = require('aws-sdk');

async function run() {
  try {
    const ecs = new aws.ECS({
      customUserAgent: 'ecs-start-task-for-github-actions'
    });

    // Get inputs
    const taskDefinitionArn = core.getInput('task-definition', { required: true });
    const subnet = core.getInput("subnet", { required: true });
    const securityGroup = core.getInput("security-group", { required: false });
    //const service = core.getInput('service', { required: false });
    const cluster = core.getInput('cluster', { required: false });

    // Try to start the task
    core.debug('Starting the task');
    let startResponse;
    try {
      const awsvpcConfiguration = {
        subnets: [
          subnet
        ]
      };
      if (securityGroup) {
        awsvpcConfiguration["securityGroups"] = [securityGroup];
      }
      startResponse = await ecs.runTask({
        taskDefinition: taskDefinitionArn,
        cluster: (cluster ? cluster : "default"),
        count: 1,
        launchType: "FARGATE",
        networkConfiguration: {
          awsvpcConfiguration: awsvpcConfiguration
        }
      }).promise();
    } catch (error) {
      core.setFailed("Failed to start task definition in ECS: " + error.message);
      core.debug("Task definition: " + taskDefinitionArn);
      throw(error);
    }
    console.log(startResponse);
  }
  catch (error) {
    core.setFailed(error.message);
    core.debug(error.stack);
  }
}

module.exports = run;

/* istanbul ignore next */
if (require.main === module) {
    run();
}
