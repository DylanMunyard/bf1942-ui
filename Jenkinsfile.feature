pipeline {
  agent {
    kubernetes {
      yamlFile 'deploy/pod.yaml'
    }
  }
  
  parameters {
    booleanParam(name: 'CLEANUP_EXISTING', defaultValue: true, description: 'Clean up existing feature deployment before deploying')
  }
  
  environment {
    IMAGE_TAG = "feature"
    FULL_IMAGE_NAME = "container-registry-service.container-registry:5000/bf42-servers:${IMAGE_TAG}"
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
    
    stage('Cleanup Existing Feature Deployment') {
      when {
        expression { params.CLEANUP_EXISTING }
      }
      steps {
        container('kubectl') {
          withKubeConfig([namespace: "bf42-servers"]) {
            script {
              // Clean up any existing feature branch deployment
              sh '''
                # Delete existing feature deployments (ignore errors if they don't exist)
                kubectl delete deployment,service,ingressroute -l deployment-type=feature-branch --ignore-not-found=true
                
                # Wait for cleanup to complete
                kubectl wait --for=delete deployment -l deployment-type=feature-branch --timeout=60s || true
              '''
            }
          }
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
            withKubeConfig([namespace: "bf42-servers"]) {
              sh """
                # Apply the deployment
                kubectl apply -f deploy/app/feature-branch-deployment.yaml
                
                # Wait for the deployment to be ready
                kubectl wait --for=condition=available --timeout=300s deployment/bf42-servers-feature
                
                # Show deployment status
                kubectl get deployment,service,ingressroute -l branch=feature
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