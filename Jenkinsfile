pipeline {
  agent none
  parameters {
    string(name: 'AKS_RESOURCE_GROUP', defaultValue: 'bfstats-io', description: 'Azure resource group containing the AKS cluster')
    string(name: 'AKS_CLUSTER_NAME', defaultValue: 'bfstats-aks', description: 'AKS cluster name')
  }
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
                  withCredentials([
                    usernamePassword(credentialsId: 'jenkins-bf1942-stats-dockerhub-pat', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD'),
                    string(credentialsId: 'bfstats-appi-connection-string', variable: 'APPINSIGHTS_CONNECTION_STRING')
                  ]) {
                    sh '''
                      # Login to Docker Hub
                      echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

                      # Setup Docker buildx for cross-platform builds with DinD optimizations
                      docker buildx create --name multiarch-builder-ui --driver docker-container --use || true
                      docker buildx use multiarch-builder-ui

                      # Build and push ARM64 image for UI with DinD optimizations
                      # Pass Application Insights connection string as build arg
                      DOCKER_BUILDKIT=1 docker buildx build -f Dockerfile . \
                        --platform linux/arm64 \
                        --build-arg BUILDKIT_PROGRESS=plain \
                        --build-arg VITE_APPLICATIONINSIGHTS_CONNECTION_STRING="${APPINSIGHTS_CONNECTION_STRING}" \
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
                  cloud 'Local k8s'
                  yamlFile 'deploy/pod.yaml'
                  nodeSelector 'kubernetes.io/hostname=bethany'
                }
              }
              steps {
                container('deploy-aks') {
                  withCredentials([
                    string(credentialsId: 'bf42-stats-aks-sp-client-id', variable: 'AZURE_CLIENT_ID'),
                    string(credentialsId: 'bf42-stats-aks-sp-client-secret', variable: 'AZURE_CLIENT_SECRET'),
                    string(credentialsId: 'bf42-stats-aks-sp-tenant-id', variable: 'AZURE_TENANT_ID')
                  ]) {
                    sh '''
                      set -euo pipefail
                      export KUBECONFIG=$(mktemp)
                      trap 'rm -f "$KUBECONFIG"' EXIT
                      az login --service-principal -u "$AZURE_CLIENT_ID" -p "$AZURE_CLIENT_SECRET" --tenant "$AZURE_TENANT_ID"
                      az aks get-credentials --resource-group "''' + params.AKS_RESOURCE_GROUP + '''" --name "''' + params.AKS_CLUSTER_NAME + '''" --file "$KUBECONFIG"
                      kubelogin convert-kubeconfig -l azurecli
                      kubectl -n bfstats-ui rollout restart deployment/bfstats-ui
                    '''
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