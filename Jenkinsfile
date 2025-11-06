pipeline {
  agent none
  stages {
    stage('E2E Tests') {
      agent {
        kubernetes {
          yaml """
apiVersion: v1
kind: Pod
metadata:
  labels:
    jenkins: agent
spec:
  nodeSelector:
    kubernetes.io/arch: amd64
  containers:
  - name: playwright
    image: mcr.microsoft.com/playwright:v1.56.1-jammy
    command:
    - cat
    tty: true
    resources:
      requests:
        memory: "2Gi"
        cpu: "1"
      limits:
        memory: "4Gi"
        cpu: "2"
"""
        }
      }
      environment {
        CI = 'true'
        HOME = "${WORKSPACE}"
      }
      stages {
        stage('Install Dependencies') {
          steps {
            container('playwright') {
              sh 'npm ci'
            }
          }
        }
        stage('Run Playwright Tests') {
          steps {
            container('playwright') {
              sh 'npm run test:e2e'
            }
          }
        }
      }
      post {
        always {
          container('playwright') {
            archiveArtifacts artifacts: 'playwright-report/**/*', allowEmptyArchive: true, fingerprint: true
            publishHTML(target: [
              allowMissing: true,
              alwaysLinkToLastBuild: true,
              keepAll: true,
              reportDir: 'playwright-report',
              reportFiles: 'index.html',
              reportName: 'Playwright Test Report'
            ])
            archiveArtifacts artifacts: 'test-results/**/*.{png,webm}', allowEmptyArchive: true
          }
        }
        success {
          echo 'E2E tests passed! ✅'
        }
        failure {
          echo 'E2E tests failed ❌ Check the Playwright Test Report for details.'
        }
      }
    }
    stage('Build and Deploy') {
      parallel {
        stage('UI Pipeline') {
          stages {
            stage('Build UI Docker Image') {
              agent {
                kubernetes {
                  cloud 'Local k8s'
                  yamlFile 'deploy/pod.yaml'
                  nodeSelector 'kubernetes.io/hostname=bethany'
                }
              }
              steps {
                container('dind') {
                  withCredentials([usernamePassword(credentialsId: 'jenkins-bf1942-stats-dockerhub-pat', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                    sh '''
                      # Login to Docker Hub
                      echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

                      # Setup Docker buildx for cross-platform builds with DinD optimizations
                      docker buildx create --name multiarch-builder-ui --driver docker-container --use || true
                      docker buildx use multiarch-builder-ui

                      # Build and push ARM64 image for UI with DinD optimizations
                      DOCKER_BUILDKIT=1 docker buildx build -f Dockerfile . \
                        --platform linux/arm64 \
                        --build-arg BUILDKIT_PROGRESS=plain \
                        --load \
                        -t dylanmunyard/bfstats-ui:latest

                      # Push the built image
                      docker push dylanmunyard/bfstats-ui:latest
                    '''
                  }
                }
              }
            }
            stage('Deploy UI') {
              agent {
                kubernetes {
                  cloud 'AKS'
                  yamlFile 'deploy/pod.yaml'
                }
              }
              steps {
                container('kubectl') {
                  withKubeConfig([namespace: "bfstats-ui"]) {
                    withCredentials([string(credentialsId: 'OPENAI_API_KEY', variable: 'OPENAI_API_KEY')]) {
                      sh 'kubectl rollout restart deployment/bfstats-ui'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}