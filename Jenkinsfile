pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
metadata:
  labels:
    jenkins/label: "2401157-jobfit-anisha-1-mggxr"
spec:
  restartPolicy: Never
  nodeSelector:
    kubernetes.io/os: "linux"
  volumes:
    - name: workspace-volume
      emptyDir: {}
    - name: kubeconfig-secret
      secret:
        secretName: kubeconfig-secret
  containers:
    - name: node
      image: node:18
      tty: true
      command: ["cat"]
      volumeMounts:
        - name: workspace-volume
          mountPath: /home/jenkins/agent
    - name: sonar-scanner
      image: sonarsource/sonar-scanner-cli
      tty: true
      command: ["cat"]
      volumeMounts:
        - name: workspace-volume
          mountPath: /home/jenkins/agent
    - name: kubectl
      image: bitnami/kubectl:latest
      tty: true
      command: ["cat"]
      env:
        - name: KUBECONFIG
          value: /kube/config
      securityContext:
        runAsUser: 0
      volumeMounts:
        - name: kubeconfig-secret
          mountPath: /kube/config
          subPath: kubeconfig
        - name: workspace-volume
          mountPath: /home/jenkins/agent
    - name: dind
      image: docker:dind
      args: ["--storage-driver=overlay2", "--insecure-registry=nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"]
      securityContext:
        privileged: true
      volumeMounts:
        - name: workspace-volume
          mountPath: /home/jenkins/agent
    - name: jnlp
      image: jenkins/inbound-agent:3345.v03dee9b_f88fc-1
      env:
        - name: JENKINS_AGENT_NAME
          value: "2401157-jobfit-anisha-1-mggxr-tcg6j-kntxd"
        - name: JENKINS_AGENT_WORKDIR
          value: "/home/jenkins/agent"
      resources:
        requests:
          cpu: "100m"
          memory: "256Mi"
      volumeMounts:
        - name: workspace-volume
          mountPath: /home/jenkins/agent
'''
        }
    }

    environment {
        // --- CONFIGURATION ---
        NAMESPACE = '2401157'
        
        // Nexus Registry Details
        REGISTRY     = 'nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085'
        APP_NAME     = 'jobfit'
        IMAGE_TAG    = 'latest'
        // Image paths matching Nexus structure
        CLIENT_IMAGE = "${REGISTRY}/2401157/${APP_NAME}-client"
        SERVER_IMAGE = "${REGISTRY}/2401157/${APP_NAME}-server"

        // Nexus Credentials (Hardcoded)
        NEXUS_USER = 'admin'
        NEXUS_PASS = 'Changeme@2025'

        // SonarQube Configuration
        SONAR_PROJECT_KEY   = '2401157-jobfit'
        SONAR_HOST_URL      = 'http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000'
        SONAR_PROJECT_TOKEN = 'sqp_ebccbe7e93e8db6ee0b16e52ceeec7bcd63479fa'
    }

    stages {

        stage('Install + Build Frontend') {
            steps {
                container('node') {
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
                    script {
                        // --- FIX FOR BASE IMAGE PULLS ---
                        // We force the Dockerfiles to pull 'node' and 'nginx' from AWS Public Registry (no rate limit, public access)
                        // instead of Nexus (empty) or Docker Hub (rate limited).
                        
                        echo "🔧 Switching base images to AWS Public Registry..."
                        // Replaces 'FROM node...' with 'FROM public.ecr.aws/docker/library/node...'
                        sh "sed -i 's|FROM node|FROM public.ecr.aws/docker/library/node|g' ./client/Dockerfile"
                        sh "sed -i 's|FROM node|FROM public.ecr.aws/docker/library/node|g' ./server/Dockerfile"
                        
                        // Replaces 'FROM nginx...' with 'FROM public.ecr.aws/docker/library/nginx...'
                        sh "sed -i 's|FROM nginx|FROM public.ecr.aws/docker/library/nginx|g' ./client/Dockerfile"
                        
                        // Fix for accidental 'FROM nexus...' in CLIENT Dockerfile
                        sh "sed -i 's|FROM ${REGISTRY}/node|FROM public.ecr.aws/docker/library/node|g' ./client/Dockerfile"
                        sh "sed -i 's|FROM ${REGISTRY}/nginx|FROM public.ecr.aws/docker/library/nginx|g' ./client/Dockerfile"

                        // **NEW FIX:** Fix for 'FROM nexus...' in SERVER Dockerfile (This was missing!)
                        sh "sed -i 's|FROM ${REGISTRY}/node|FROM public.ecr.aws/docker/library/node|g' ./server/Dockerfile"

                        sh '''
                        # Wait for Docker Daemon
                        while ! docker info > /dev/null 2>&1; do echo "Waiting for Docker..."; sleep 3; done
                        
                        echo "🐳 Building Client Image..."
                        docker build -t ${CLIENT_IMAGE}:${IMAGE_TAG} ./client

                        echo "🐳 Building Server Image..."
                        docker build -t ${SERVER_IMAGE}:${IMAGE_TAG} ./server
                        '''
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    sh """
                    sonar-scanner \
                      -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                      -Dsonar.sources=. \
                      -Dsonar.host.url=${SONAR_HOST_URL} \
                      -Dsonar.login=${SONAR_PROJECT_TOKEN}
                    """
                }
            }
        }

        stage('Login to Nexus Registry') {
            steps {
                container('dind') {
                    sh """
                    echo "🔐 Logging into Nexus Docker Registry..."
                    echo "$NEXUS_PASS" | docker login ${REGISTRY} -u "$NEXUS_USER" --password-stdin
                    """
                }
            }
        }

        stage('Push to Nexus') {
            steps {
                container('dind') {
                    sh '''
                    echo "🚀 Pushing images to Nexus..."
                    docker push ${CLIENT_IMAGE}:${IMAGE_TAG}
                    docker push ${SERVER_IMAGE}:${IMAGE_TAG}
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    sh """
                    echo "📦 Applying Kubernetes manifests..."
                    kubectl apply -f k8s-deployment.yaml -n ${NAMESPACE}
                    kubectl apply -f client-service.yaml -n ${NAMESPACE}

                    echo "🔁 Updating images in deployments..."
                    kubectl set image deployment/client-deployment client=${CLIENT_IMAGE}:${IMAGE_TAG} -n ${NAMESPACE}
                    kubectl set image deployment/server-deployment server=${SERVER_IMAGE}:${IMAGE_TAG} -n ${NAMESPACE}
                    
                    echo "✅ checking rollout status..."
                    kubectl rollout status deployment/server-deployment -n ${NAMESPACE}
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline completed successfully!"
        }
        failure {
            echo "❌ Pipeline failed. Check logs for details."
        }
    }
}