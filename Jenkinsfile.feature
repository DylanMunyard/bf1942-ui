pipeline {
  agent {
    kubernetes {
      yamlFile 'deploy/pod.yaml'
    }
  }
  
  environment {
    IMAGE_TAG = "feature"
    FULL_IMAGE_NAME = "container-registry-service.container-registry:5000/bfstats-ui:${IMAGE_TAG}"
  }
  
  stages {
    stage('Validate Parameters') {
      steps {
        script {
          echo "Deploying branch: ${env.BRANCH_NAME ?: env.GIT_BRANCH}"
          echo "Image will be tagged as: ${IMAGE_TAG}"
        }
      }
    }
    
    stage('Docker Build Feature Branch') {
      steps {
        container('dind') {
          sh """
            docker build -f Dockerfile . -t ${FULL_IMAGE_NAME}
            docker push ${FULL_IMAGE_NAME}
          """
        }
      }
    }
    
    stage('Deploy Feature Branch') {
      steps {
        withCredentials([string(credentialsId: 'OPENAI_API_KEY', variable: 'OPENAI_API_KEY')]) {
          container('kubectl') {
            withKubeConfig([namespace: "bfstats-ui"]) {
              sh """
                # Apply the deployment
                kubectl apply -f deploy/app/feature-branch-deployment.yaml
                kubectl rollout restart deployment/bfstats-ui-feature
              """
            }
          }
        }
      }
    }
    
    stage('Deployment Summary') {
      steps {
        script {
          echo """
          ============================================
          Feature Branch Deployment Summary
          ============================================
          Branch: ${env.BRANCH_NAME ?: env.GIT_BRANCH}
          Image: ${FULL_IMAGE_NAME}
          
          Access your feature branch at:
          https://staging.1942.home.net
          
          To clean up this deployment, run:
          kubectl delete deployment,service,ingressroute -l branch=feature
          ============================================
          """
        }
      }
    }
  }
  
  post {
    always {
      // Clean up workspace
      cleanWs()
    }
    failure {
      script {
        echo "Feature branch deployment failed. Check the logs above for details."
      }
    }
  }
}