## Amazon ECS "Start Task" Action for GitHub Actions

Starts an Amazon ECS task definition.

Modified from https://github.com/aws-actions/amazon-ecs-deploy-task-definition.

**Table of Contents**

<!-- toc -->

- [Amazon ECS "Start Task" Action for GitHub Actions](#amazon-ecs-start-task-action-for-github-actions)
- [Usage](#usage)

<!-- tocstop -->

## Usage

```yaml
    - name: Start Amazon ECS task
      uses: ah-risk/ecs-start-task@v1
      with:
        task-definition: arn-of-task-definition
        service: my-service
        cluster: my-cluster
```

See [action.yml](action.yml) for the full documentation for this action's inputs and outputs.

```yaml
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-2

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1

    - name: Build, tag, and push image to Amazon ECR
      id: build-image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: my-ecr-repo
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        echo "::set-output name=image::$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG"

    - name: Fill in the new image ID in the Amazon ECS task definition
      id: task-def
      uses: aws-actions/amazon-ecs-render-task-definition@v1
      with:
        task-definition: task-definition.json
        container-name: my-container
        image: ${{ steps.build-image.outputs.image }}

    - name: Deploy Amazon ECS task definition
      id: task-deploy
      uses: aws-actions/amazon-ecs-deploy-task-definition@v1
      with:
        task-definition: ${{ steps.task-def.outputs.task-definition }}
        service: my-service
        cluster: my-cluster
        wait-for-service-stability: true
   
   - name: Start Amazon ECS task
      uses: ah-risk/ecs-start-task@v1
      with:
        task-definition: ${{ steps.task-deploy.outputs.task-definition-arn }}
        service: my-service
        cluster: my-cluster
```
