pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
metadata:
  labels:
    jenkins/label: "2401157-jobfit-agent"
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
          value: "2401157-jobfit-agent"
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
        // --- YOUR PROJECT CONFIGURATION ---
        NAMESPACE = '2401157'
        APP_NAME  = 'jobfit'
        
        // Nexus Registry Details
        REGISTRY     = 'nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085'
        IMAGE_TAG    = 'latest'
        
        // Image paths for YOUR project (2401157)
        CLIENT_IMAGE = "${REGISTRY}/2401157/${APP_NAME}-client"
        SERVER_IMAGE = "${REGISTRY}/2401157/${APP_NAME}-server"

        // Nexus Credentials (Hardcoded)
        NEXUS_USER = 'admin'
        NEXUS_PASS = 'Changeme@2025'

        // SonarQube Configuration (Your Project Key)
        SONAR_PROJECT_KEY   = '2401157-jobfit'
        // FIX: Using internal K8s URL on Port 80
        SONAR_HOST_URL      = 'http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000'
        // Your Token
        SONAR_PROJECT_TOKEN = 'sqp_ebccbe7e93e8db6ee0b16e52ceeec7bcd63479fa'

        // --- NEW ENVIRONMENT VARIABLES (From your snippet) ---
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY    = "pk_test_dml0YWwtbXVkZmlzaC02LmNsZXJrLmFjY291bnRzLmRldiQ"
        NEXT_PUBLIC_CLERK_FRONTEND_API       = "vital-mudfish-6.clerk.accounts.dev"
        NEXT_PUBLIC_CONVEX_URL               = "https://flippant-goshawk-377.convex.cloud"
        NEXT_PUBLIC_STREAM_API_KEY           = "muytsbs2rpay"
        NEXT_PUBLIC_DISABLE_CONVEX_PRERENDER = "true"
    }

    stages {

        stage('Install + Build Frontend') {
            steps {
                container('node') {
                    dir('client') {
                        sh '''
                        echo "📦 Installing Client Dependencies..."
              
                        echo "🏗️ Building Frontend..."
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
                        // --- FIX FOR 429 RATE LIMIT ---
                        echo "🔧 Switching to AWS Mirror to bypass Docker Hub limits..."
                        sh "sed -i 's|FROM node|FROM public.ecr.aws/docker/library/node|g' ./client/Dockerfile"
                        sh "sed -i 's|FROM node|FROM public.ecr.aws/docker/library/node|g' ./server/Dockerfile"
                        sh "sed -i 's|FROM nginx|FROM public.ecr.aws/docker/library/nginx|g' ./client/Dockerfile"
                        
                        // Safety cleanup for old prefixes
                        sh "sed -i 's|FROM ${REGISTRY}/node|FROM public.ecr.aws/docker/library/node|g' ./server/Dockerfile"
                        sh "sed -i 's|FROM ${REGISTRY}/node|FROM public.ecr.aws/docker/library/node|g' ./client/Dockerfile"
                        sh "sed -i 's|FROM ${REGISTRY}/nginx|FROM public.ecr.aws/docker/library/nginx|g' ./client/Dockerfile"

                        sh """
                        # Wait for Docker Daemon
                        while ! docker info > /dev/null 2>&1; do echo "Waiting for Docker..."; sleep 3; done
                        
                        echo "🐳 Building Client Image (with Build Args)..."
                        # Passing the new variables as build arguments
                        docker build \\
                            --build-arg NEXT_PUBLIC_CONVEX_URL="${NEXT_PUBLIC_CONVEX_URL}" \\
                            --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}" \\
                            --build-arg NEXT_PUBLIC_CLERK_FRONTEND_API="${NEXT_PUBLIC_CLERK_FRONTEND_API}" \\
                            --build-arg NEXT_PUBLIC_STREAM_API_KEY="${NEXT_PUBLIC_STREAM_API_KEY}" \\
                            --build-arg NEXT_PUBLIC_DISABLE_CONVEX_PRERENDER="${NEXT_PUBLIC_DISABLE_CONVEX_PRERENDER}" \\
                            -t ${CLIENT_IMAGE}:${IMAGE_TAG} ./client

                        echo "🐳 Building Server Image..."
                        docker build -t ${SERVER_IMAGE}:${IMAGE_TAG} ./server
                        """
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    // Re-enabled SonarQube with correct internal URL
                    sh """
                    sonar-scanner \
                      -Dsonar.projectKey=2401157-jobfit \
                      -Dsonar.sources=. \
                      -Dsonar.host.url=http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000 \
                      -Dsonar.login=sqp_ebccbe7e93e8db6ee0b16e52ceeec7bcd63479fa
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
                    
                    echo "🔄 Forcing Rollout Restart..."
                    kubectl rollout restart deployment/client-deployment -n ${NAMESPACE}
                    kubectl rollout restart deployment/server-deployment -n ${NAMESPACE}
                    
                    echo "✅ Checking rollout status..."
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