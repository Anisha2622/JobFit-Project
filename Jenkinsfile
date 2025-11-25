pipeline {
    agent {
        kubernetes {
            label 'my-jenkins-jenkins-agent'   // change if your label is different
            defaultContainer 'jnlp'
        }
    }

    environment {
        DOCKERHUB_REPO_CLIENT = 'anisha2604/jobfit-client'
        DOCKERHUB_REPO_SERVER = 'anisha2604/jobfit-server'
        DOCKERHUB_CREDENTIALS_ID = 'docker-hub-credentials'  // Jenkins credentials ID (no token in file!)
        K8S_MANIFESTS_DIR = 'k8s'
    }

    options {
        skipDefaultCheckout(true)
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Images') {
            steps {
                container('dind') {
                    echo '🏗️ Building Client Image...'
                    sh """
                      docker build \
                        -t ${DOCKERHUB_REPO_CLIENT}:latest \
                        ./client
                    """

                    echo '🏗️ Building Server Image...'
                    sh """
                      docker build \
                        -t ${DOCKERHUB_REPO_SERVER}:latest \
                        ./server
                    """
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                container('dind') {
                    withCredentials([usernamePassword(
                        credentialsId: DOCKERHUB_CREDENTIALS_ID,
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        sh '''
                          echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                          docker push '"${DOCKERHUB_REPO_CLIENT}"':latest
                          docker push '"${DOCKERHUB_REPO_SERVER}"':latest
                        '''
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            when {
                expression { fileExists(env.K8S_MANIFESTS_DIR) }
            }
            steps {
                container('dind') {
                    echo "🚀 Deploying manifests from ${K8S_MANIFESTS_DIR} ..."
                    sh """
                      kubectl apply -f ${K8S_MANIFESTS_DIR}
                    """
                }
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline succeeded!'
        }
        failure {
            echo '❌ Pipeline failed. Please check the logs.'
        }
        always {
            echo "🏁 Pipeline finished (build #${env.BUILD_NUMBER})"
        }
    }
}
