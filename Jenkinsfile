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
    stage('Docker build back end') {
      steps {
        container('dind') {
            sh '''
                docker build -f backend/Dockerfile ./backend -t container-registry-service.container-registry:5000/bf42-servers-backend:latest
                docker push container-registry-service.container-registry:5000/bf42-servers-backend:latest
            '''
        }
      }
    }
    stage('Deploy') {
      steps {
        container('kubectl') {
            withKubeConfig([namespace: "bf42-servers"]) {
              sh 'kubectl rollout restart deployment/bf42-servers'
              sh 'kubectl rollout restart deployment/bf42-servers-backend'
            }
          }
        }
    }
  }
}