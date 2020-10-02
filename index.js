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
    const containerCommands = core.getInput("container-commands", { required: false });
    const waitForTask = core.getInput("wait-for-task", { required: false });

    // Try to start the task
    core.debug('Starting the task');
    const awsvpcConfiguration = {
      subnets: [
        subnet
      ],
      assignPublicIp: "ENABLED"
    };
    if (securityGroup) {
      awsvpcConfiguration["securityGroups"] = [securityGroup];
    }
    const parsedCommands = containerCommands ? JSON.parse(containerCommands) : {};
    let containerOverrides = [];
    for (const k in parsedCommands) {
      containerOverrides.push({
        name: k,
        command: parsedCommands[k]
      });
    }
    const overrides = containerOverrides.length > 0 ? { containerOverrides: containerOverrides } : {};
    const params = {
      taskDefinition: taskDefinitionArn,
      cluster: (cluster ? cluster : "default"),
      count: 1,
      launchType: "FARGATE",
      networkConfiguration: {
        awsvpcConfiguration: awsvpcConfiguration
      },
      startedBy: "GitHub-Action",
      overrides: overrides
    };
    let startResponse;
    try {
      core.debug(params);
      startResponse = await ecs.runTask(params).promise();
    } catch (error) {
      core.setFailed("Failed to start task definition in ECS: " + error.message);
      core.debug("Task definition: " + taskDefinitionArn);
      throw(error);
    }
    core.setOutput(startResponse.tasks[0].taskArn);
    core.debug(startResponse);

    if (waitForTask) {
      let stopResponse;
      const tasks = [startResponse.tasks[0].taskArn];
      try {
        core.debug("Describing tasks: " + tasks);
        console.log(await ecs.describeTasks({ cluster: startResponse.clusterArn, tasks }).promise());
        stopResponse = await ecs.waitFor("tasksStopped", { cluster: startResponse.clusterArn, tasks }).promise();
        if (stopResponse.tasks.length <= 0) core.setFailed("No stopped tasks");
        const containers = stopResponse.tasks[0].containers;
        if (containers.length <= 0) core.setFailed("No stopped containers");
        if (containers.some(c => c.exitCode !== 0)) {
          core.setFailed("Some containers finished with error exit codes.");
        }
      } catch (error) {
        core.setFailed("Failed to wait for task stopping: " + error.message);
        core.debug("Stop response: " + stopResponse);
        throw(error);
      }
    }
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
