pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: docker
    image: docker:24-dind
    securityContext:
      privileged: true
    tty: true
    env:
      - name: DOCKER_TLS_CERTDIR
        value: ""
  - name: kubectl
    image: bitnami/kubectl:latest
    command:
    - cat
    tty: true
'''
        }
    }

    environment {
        DOCKERHUB_USERNAME = 'anisha2604'
        IMAGE_CLIENT = 'anisha2604/jobfit-client'
        IMAGE_SERVER = 'anisha2604/jobfit-server'
        DOCKER_CREDS_ID = 'dockerhub-credentials'
        K8S_NAMESPACE = '2401157'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Images') {
            steps {
                container('docker') {
                    script {
                        // Wait for Docker Daemon to start (prevents "Cannot connect" error)
                        sh 'while ! docker info > /dev/null 2>&1; do echo "Waiting for Docker..."; sleep 3; done'
                        
                        echo '🏗️ Building Client Image...'
                        sh "docker build -t ${IMAGE_CLIENT}:latest ./client"

                        echo '🏗️ Building Server Image...'
                        sh "docker build -t ${IMAGE_SERVER}:latest ./server"
                    }
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                container('docker') {
                    script {
                        echo '☁️ Logging into Docker Hub...'
                        withCredentials([usernamePassword(credentialsId: DOCKER_CREDS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                            sh "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"
                            
                            echo '🚀 Pushing Client Image...'
                            sh "docker push ${IMAGE_CLIENT}:latest"
                            
                            echo '🚀 Pushing Server Image...'
                            sh "docker push ${IMAGE_SERVER}:latest"
                        }
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    script {
                        echo '☸️ Applying Kubernetes Manifests...'
                        sh "kubectl apply -f k8s-deployment.yaml"
                        
                        // Ensure client-service.yaml is also in your Git repo!
                        sh "kubectl apply -f client-service.yaml"
                        
                        echo '🔄 Rolling out updates...'
                        sh "kubectl rollout restart deployment/server-deployment -n ${K8S_NAMESPACE}"
                        sh "kubectl rollout restart deployment/client-deployment -n ${K8S_NAMESPACE}"
                    }
                }
            }
        }
    }
}