pipeline {
  agent none
  stages {
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