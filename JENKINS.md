# Jenkins E2E Test Pipeline

This document explains how to set up and run the Playwright E2E tests in Jenkins.

## Files

- `Jenkinsfile.e2e` - The pipeline definition for E2E tests
- `Dockerfile.e2e` - Docker image with all Playwright dependencies

## Prerequisites

### Jenkins Setup

1. **Required Plugins**
   - Kubernetes plugin (for pod-based agents)
   - HTML Publisher plugin (for test reports)
   - Optional: Slack plugin (for notifications)

2. **Kubernetes Pod Configuration**
   - The pipeline runs on the same Kubernetes pod as the main Jenkinsfile
   - Uses the `dind` (Docker-in-Docker) container from `deploy/pod.yaml`
   - Configured to run on the same node (`kubernetes.io/hostname=bethany`)
   - No additional setup needed if your main pipeline is already working

3. **Resource Requirements**
   - Sufficient disk space in pod for Docker images (~2GB)
   - Memory: 4GB+ recommended for running tests with multiple browser instances
   - IPC host mode enabled in pod for Chromium memory management

### Repository Access

Jenkins needs access to this repository with the Dockerfile.e2e file.

## Creating the Jenkins Job

The pipeline is pre-configured to run on your existing Kubernetes pod setup. No additional agent configuration needed!

### Option 1: Using Pipeline from SCM (Recommended)

1. Create a new **Pipeline** job in Jenkins
2. Configure **Pipeline** section:
   - Definition: `Pipeline script from SCM`
   - SCM: `Git`
   - Repository URL: Your repo URL
   - Script path: `Jenkinsfile.e2e`
3. Click **Save**

The job will automatically use your Kubernetes pod with Docker-in-Docker.

### Option 2: Pipeline Script

1. Create a new **Pipeline** job in Jenkins
2. Configure **Pipeline** section:
   - Definition: `Pipeline script`
   - Paste the contents of `Jenkinsfile.e2e`
3. Click **Save**

### Agent Configuration

The pipeline is configured to use:
```groovy
agent {
  kubernetes {
    cloud 'Local k8s'
    yamlFile 'deploy/pod.yaml'
    nodeSelector 'kubernetes.io/hostname=bethany'
  }
}
```

This matches your main Jenkinsfile configuration, ensuring tests run on the same Kubernetes pod with Docker-in-Docker support.

## Running the Job

### From Jenkins UI

1. Click **Build with Parameters**
2. Select test environment:
   - **local** - Tests against local dev server (requires running dev server)
   - **staging** - Tests against https://staging.bfstats.io
   - **production** - Tests against https://bfstats.io
3. Check **Publish Report** to generate HTML artifacts
4. Click **Build**

### Via Jenkins API

```bash
# Build with default parameters
curl -X POST http://your-jenkins/job/bfstats-e2e/build

# Build with specific parameters
curl -X POST http://your-jenkins/job/bfstats-e2e/buildWithParameters \
  -d "TEST_ENVIRONMENT=production" \
  -d "PUBLISH_REPORT=true"
```

### Via Jenkins CLI

```bash
java -jar jenkins-cli.jar -s http://your-jenkins \
  build bfstats-e2e \
  -p TEST_ENVIRONMENT=production \
  -p PUBLISH_REPORT=true
```

## Test Results

### Artifacts Captured on Failure

When tests fail, Playwright automatically captures:

- **Screenshots** - Visual snapshot of the page when the assertion failed
- **Videos** - Full screen recording of the test execution
- **Traces** - Detailed execution trace with timing and DOM snapshots
- **Console logs** - Browser console messages
- **Error details** - Full assertion failure messages

All of these are embedded in the Playwright HTML report.

### Viewing Results in Jenkins

1. **Quick Status in Console**
   - Jenkins console log shows a summary:
     - ✅ All tests passed
     - ❌ Some tests failed with artifact counts

2. **Full Report**
   - Click on the build
   - Click **"Playwright E2E Report (environment)"** link on the left sidebar
   - Browse the interactive report:
     - Click on a failed test to see screenshots
     - Watch videos of the failure
     - View trace recordings for debugging
     - See detailed error messages

3. **Download Artifacts**
   - Click **Build Artifacts** → `playwright-report.tar.gz`
   - Extract: `tar -xzf playwright-report.tar.gz`
   - Open `index.html` in any browser

### Test Result Interpretation

**✅ All tests passed:**
- Green build
- Simple checkmarks in console
- No artifacts captured (only on failure)

**❌ Some tests failed:**
- Red build
- Console log shows:
  ```
  ================================
  📊 TEST ARTIFACTS CAPTURED:
  ================================
  Screenshots: Saved on test failure
  Videos: Saved on test failure
  Traces: Saved for debugging

  ✓ All artifacts are included in the Playwright HTML report
  ✓ Click 'Playwright E2E Report' to view detailed results
  ✓ Failed tests will show screenshots, videos, and error messages
  ```
- Click **"Playwright E2E Report"** link to see:
  - Which tests failed and why
  - Screenshots at point of failure
  - Full video of each failed test
  - Step-by-step execution logs
  - Error messages and stack traces

## Configuration

### Test Environments

Edit `Jenkinsfile.e2e` to add more environments:

```groovy
def getApiBaseUrl(String environment) {
  def urls = [
    'local': 'http://localhost:5173',
    'staging': 'https://staging.bfstats.io',
    'production': 'https://bfstats.io',
    'custom': 'https://my-custom-url.com'  // Add your environment here
  ]
  return urls[environment] ?: 'http://localhost:5173'
}
```

### Build Parameters

Modify the `parameters` section in `Jenkinsfile.e2e`:

```groovy
parameters {
  choice(
    name: 'TEST_ENVIRONMENT',
    choices: ['local', 'staging', 'production', 'custom'],  // Add your environment
    description: 'Which environment to test against'
  )
  booleanParam(
    name: 'PUBLISH_REPORT',
    defaultValue: true,
    description: 'Publish Playwright HTML report as artifact'
  )
  // Add more parameters as needed
}
```

### Timeout

Adjust test timeout if tests are taking longer than 30 minutes:

```groovy
options {
  timeout(time: 60, unit: 'MINUTES')  // Increase to 60 minutes
}
```

## Notifications

### Slack Integration

Uncomment the Slack notifications in the `post` section:

```groovy
post {
  failure {
    slackSend(
      color: 'danger',
      message: "E2E tests failed for ${params.TEST_ENVIRONMENT}",
      channel: '#deployments'
    )
  }
  success {
    slackSend(
      color: 'good',
      message: "E2E tests passed for ${params.TEST_ENVIRONMENT}",
      channel: '#deployments'
    )
  }
}
```

### Email Notifications

Add to the `post` section:

```groovy
post {
  failure {
    emailext(
      subject: "E2E Tests Failed - ${params.TEST_ENVIRONMENT}",
      body: "Check Jenkins for details: ${env.BUILD_URL}",
      to: 'team@example.com',
      attachmentsPattern: 'playwright-report.tar.gz'
    )
  }
}
```

## Troubleshooting

### Docker Image Build Fails

- **Cause**: Docker not available on Jenkins agent
- **Fix**: Install Docker on the Jenkins agent or use a Docker agent

### Tests Timeout

- **Cause**: Tests taking longer than configured timeout
- **Fix**: Increase timeout in `options` section or optimize test performance

### Report Not Published

- **Cause**: HTML Publisher plugin not installed
- **Fix**: Install `HTML Publisher` plugin in Jenkins

### Out of Memory

- **Cause**: Chromium running out of memory
- **Fix**: Ensure `--ipc=host` flag is present in docker run command

### Cannot Access Staging/Production

- **Cause**: Network connectivity issues or endpoints not accessible from Jenkins node
- **Fix**: Test network connectivity from Jenkins agent to target endpoints

## Performance Optimization

### Parallel Test Execution

By default, Playwright runs all tests in parallel. To adjust:

```groovy
environment {
  PLAYWRIGHT_WORKERS = '4'  // Reduce from default to use fewer resources
}
```

Then pass to Docker:

```groovy
sh '''
  docker run \
    --rm \
    --ipc=host \
    -e API_BASE_URL=${apiBaseUrl} \
    -e PLAYWRIGHT_WORKERS=${PLAYWRIGHT_WORKERS} \
    -v ${REPORT_DIR}:/app/playwright-report \
    ${DOCKER_IMAGE}
'''
```

### Resource Limits

Add resource limits to Docker:

```groovy
sh '''
  docker run \
    --rm \
    --ipc=host \
    --memory=4g \
    --cpus=2 \
    -e API_BASE_URL=${apiBaseUrl} \
    -v ${REPORT_DIR}:/app/playwright-report \
    ${DOCKER_IMAGE}
'''
```

## CI/CD Integration

### Trigger on Code Changes

1. Go to job configuration
2. Under **Build Triggers**, select **GitHub hook trigger for GITScm polling**
3. Add webhook in GitHub repository settings

### Run as Part of Main Pipeline

In your main `Jenkinsfile`:

```groovy
stage('E2E Tests') {
  steps {
    build job: 'bfstats-e2e', parameters: [
      string(name: 'TEST_ENVIRONMENT', value: 'staging'),
      booleanParam(name: 'PUBLISH_REPORT', value: true)
    ]
  }
}
```

## Additional Resources

- [Playwright Docs](https://playwright.dev)
- [Playwright Docker](https://playwright.dev/docs/docker)
- [Jenkins Declarative Pipeline](https://jenkins.io/doc/book/pipeline/syntax/)
