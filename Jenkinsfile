pipeline {
    agent any

    environment {
        // Your Docker Hub details
        DOCKERHUB_USERNAME = 'anisha2604'
        IMAGE_CLIENT = 'anisha2604/jobfit-client'
        IMAGE_SERVER = 'anisha2604/jobfit-server'
        
        // Credential ID created in Jenkins
        DOCKER_CREDS_ID = 'dockerhub-credentials'
        
        // Your K8s details
        K8S_NAMESPACE = '2401157'
    }

    stages {
        stage('Checkout') {
            steps {
                // This step happens automatically if you use "Pipeline from SCM"
                checkout scm
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    echo '🏗️ Building Client Image...'
                    // Build Client from ./client folder
                    sh "docker build -t ${IMAGE_CLIENT}:latest ./client"

                    echo '🏗️ Building Server Image...'
                    // Build Server from ./server folder
                    sh "docker build -t ${IMAGE_SERVER}:latest ./server"
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
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

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    echo '☸️ Applying Kubernetes Manifests...'
                    // Apply your deployment file
                    sh "kubectl apply -f k8s-deployment.yaml"
                    
                    // Apply the service file we created separately
                    sh "kubectl apply -f client-service.yaml"
                    
                    echo '🔄 Rolling out updates...'
                    // Since we use 'latest' tag, we must force a restart to pull new code
                    sh "kubectl rollout restart deployment/server-deployment -n ${K8S_NAMESPACE}"
                    sh "kubectl rollout restart deployment/client-deployment -n ${K8S_NAMESPACE}"
                }
            }
        }
    }
    
    post {
        success {
            echo '✅ Pipeline executed successfully! App is updated.'
        }
        failure {
            echo '❌ Pipeline failed. Please check the logs.'
        }
    }
}