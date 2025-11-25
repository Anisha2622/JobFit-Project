pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: node
    image: node:18
    command: ['cat']
    tty: true

  - name: sonar-scanner
    image: sonarsource/sonar-scanner-cli
    command: ['cat']
    tty: true

  - name: kubectl
    image: bitnami/kubectl:latest
    command: ['cat']
    tty: true
    securityContext:
      runAsUser: 0
    env:
    - name: KUBECONFIG
      value: /kube/config
    volumeMounts:
    - name: kubeconfig-secret
      mountPath: /kube/config
      subPath: kubeconfig

  - name: dind
    image: docker:dind
    args: ["--storage-driver=overlay2", "--insecure-registry=nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"]
    securityContext:
      privileged: true
    env:
    - name: DOCKER_TLS_CERTDIR
      value: ""
  volumes:
  - name: kubeconfig-secret
    secret:
      secretName: kubeconfig-secret
'''
        }
    }

    environment {
        // Your specific Namespace and Nexus details
        NAMESPACE = '2401157'
        NEXUS_REGISTRY = 'nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085'
        NEXUS_REPO = '2401157' 
        // Credentials for Nexus (Matches the example you gave)
        NEXUS_USER = 'admin'
        NEXUS_PASS = 'Changeme@2025'
    }

    stages {

        stage('Install + Build Frontend') {
            steps {
                container('node') {
                    // Go into client folder and install
                    dir('client') {
                        sh '''
                            echo "📦 Installing Client Dependencies..."
                            npm install
                            echo "🏗️ Building React App..."
                            npm run build
                        '''
                    }
                }
            }
        }

        stage('Install Backend') {
            steps {
                container('node') {
                    // Go into server folder and install (good for Sonar checks)
                    dir('server') {
                        sh '''
                            echo "📦 Installing Server Dependencies..."
                            npm install
                        '''
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                container('dind') {
                    sh '''
                        sleep 10
                        
                        echo "🐳 Building Client Image..."
                        docker build -t jobfit-client:latest ./client

                        echo "🐳 Building Server Image..."
                        docker build -t jobfit-server:latest ./server
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    // Scans the root folder (Client + Server)
                    sh """
                        sonar-scanner \
                            -Dsonar.projectKey=${NAMESPACE}-jobfit \
                            -Dsonar.sources=. \
                            -Dsonar.host.url=http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000 \
                            -Dsonar.login=sqp_fec0d2cd0d6849ed77e9d26ed8ae79e2a03b2844
                    """
                }
            }
        }

        stage('Login to Nexus Registry') {
            steps {
                container('dind') {
                    sh """
                        docker login ${NEXUS_REGISTRY} -u ${NEXUS_USER} -p ${NEXUS_PASS}
                    """
                }
            }
        }

        stage('Push to Nexus') {
            steps {
                container('dind') {
                    sh """
                        # --- CLIENT ---
                        docker tag jobfit-client:latest ${NEXUS_REGISTRY}/${NEXUS_REPO}/jobfit-client:v1
                        docker push ${NEXUS_REGISTRY}/${NEXUS_REPO}/jobfit-client:v1

                        # --- SERVER ---
                        docker tag jobfit-server:latest ${NEXUS_REGISTRY}/${NEXUS_REPO}/jobfit-server:v1
                        docker push ${NEXUS_REGISTRY}/${NEXUS_REPO}/jobfit-server:v1
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    // Ensure you have updated k8s-deployment.yaml to match the Nexus Image URLs!
                    sh """
                        echo "☸️ Deploying to Namespace: ${NAMESPACE}"
                        
                        kubectl apply -f k8s-deployment.yaml -n ${NAMESPACE}
                        kubectl apply -f client-service.yaml -n ${NAMESPACE}
                        
                        kubectl get all -n ${NAMESPACE}
                        
                        # Restart to pull new images
                        kubectl rollout restart deployment/server-deployment -n ${NAMESPACE}
                        kubectl rollout restart deployment/client-deployment -n ${NAMESPACE}
                        
                        kubectl rollout status deployment/server-deployment -n ${NAMESPACE}
                    """
                }
            }
        }
    }
}