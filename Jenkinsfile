pipeline {
  agent {
    kubernetes {
      yamlFile 'deploy/pod.yaml'
    }
  }
  stages {
    stage('Docker build front end') {
      steps {
        container('dind') {
            sh '''
                docker build -f Dockerfile . -t container-registry-service.container-registry:5000/bf42-servers:latest
                docker push container-registry-service.container-registry:5000/bf42-servers:latest
            '''
        }
      }
    }
    stage('Deploy front end') {
      steps {
        withCredentials([string(credentialsId: 'OPENAI_API_KEY', variable: 'OPENAI_API_KEY')]) {
            container('kubectl') {
                withKubeConfig([namespace: "bf42-servers"]) {
                  sh 'kubectl rollout restart deployment/bf42-servers'
                }
              }
            }
        }
    }
    stage('Docker build AI back end') {
      steps {
        container('dind') {
            sh '''
                docker build -f ai-backend/Dockerfile ./ai-backend -t container-registry-service.container-registry:5000/bf42-servers-ai-backend:latest
                docker push container-registry-service.container-registry:5000/bf42-servers-ai-backend:latest
            '''
        }
      }
    }
    stage('Deploy') {
      steps {
        withCredentials([string(credentialsId: 'OPENAI_API_KEY', variable: 'OPENAI_API_KEY')]) {
            container('kubectl') {
                withKubeConfig([namespace: "bf42-servers"]) {
                  sh 'kubectl delete secret openai-api-key'
                  sh 'kubectl create secret generic openai-api-key --from-literal=openai-key="$OPENAI_API_KEY"'
                  sh 'kubectl rollout restart deployment/bf42-servers-ai-backend'
                }
              }
            }
        }
    }
  }
}