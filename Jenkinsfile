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
    # MOUNT DOCKER SOCKET TO BUILD IMAGES DIRECTLY ON HOST
    - name: docker-sock
      hostPath:
        path: /var/run/docker.sock
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
    # REPLACED DIND WITH DOCKER CLIENT MOUNTED TO HOST
    - name: docker
      image: docker:latest
      command: ["cat"]
      tty: true
      volumeMounts:
        - name: workspace-volume
          mountPath: /home/jenkins/agent
        - name: docker-sock
          mountPath: /var/run/docker.sock
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
        NAMESPACE = '2401157'
        APP_NAME  = 'jobfit'
        // Using LOCAL tag so K8s can find it without pulling
        IMAGE_TAG = 'local' 
        CLIENT_IMAGE = "jobfit-client"
        SERVER_IMAGE = "jobfit-server"

        // SonarQube Configuration
        SONAR_PROJECT_KEY   = '2401157-jobfit'
        SONAR_HOST_URL      = 'http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000'
        SONAR_PROJECT_TOKEN = 'sqp_ebccbe7e93e8db6ee0b16e52ceeec7bcd63479fa'

        // Frontend Env Vars
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
                        npm install
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

        stage('Build Docker Images (Local)') {
            steps {
                container('docker') {
                    script {
                        echo "🔧 Switching to AWS Mirror..."
                        sh "sed -i 's|FROM node|FROM public.ecr.aws/docker/library/node|g' ./client/Dockerfile"
                        sh "sed -i 's|FROM node|FROM public.ecr.aws/docker/library/node|g' ./server/Dockerfile"
                        sh "sed -i 's|FROM nginx|FROM public.ecr.aws/docker/library/nginx|g' ./client/Dockerfile"

                        sh """
                        echo "🐳 Building Client Image (Local)..."
                        docker build \\
                            --build-arg NEXT_PUBLIC_CONVEX_URL="${NEXT_PUBLIC_CONVEX_URL}" \\
                            --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}" \\
                            --build-arg NEXT_PUBLIC_CLERK_FRONTEND_API="${NEXT_PUBLIC_CLERK_FRONTEND_API}" \\
                            --build-arg NEXT_PUBLIC_STREAM_API_KEY="${NEXT_PUBLIC_STREAM_API_KEY}" \\
                            --build-arg NEXT_PUBLIC_DISABLE_CONVEX_PRERENDER="${NEXT_PUBLIC_DISABLE_CONVEX_PRERENDER}" \\
                            -t ${CLIENT_IMAGE}:${IMAGE_TAG} ./client

                        echo "🐳 Building Server Image (Local)..."
                        docker build -t ${SERVER_IMAGE}:${IMAGE_TAG} ./server
                        """
                    }
                }
            }
        }

        // SonarQube (Optional - Uncomment if needed)
        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
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

        // SKIPPED NEXUS LOGIN & PUSH (Using Local Images)

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    sh """
                    echo "📦 Applying Kubernetes manifests..."
                    kubectl apply -f k8s-deployment.yaml -n ${NAMESPACE}
                    kubectl apply -f client-service.yaml -n ${NAMESPACE}

                    echo "🔧 Forcing ImagePullPolicy to Never (Required for Local Images)..."
                    # Patch deployment to ensure it uses local images and does not try to pull from internet
                    kubectl patch deployment client-deployment -n ${NAMESPACE} -p '{"spec":{"template":{"spec":{"containers":[{"name":"client","imagePullPolicy":"Never"}]}}}}'
                    kubectl patch deployment server-deployment -n ${NAMESPACE} -p '{"spec":{"template":{"spec":{"containers":[{"name":"server","imagePullPolicy":"Never"}]}}}}'

                    echo "🔁 Updating images in deployments..."
                    kubectl set image deployment/client-deployment client=${CLIENT_IMAGE}:${IMAGE_TAG} -n ${NAMESPACE}
                    kubectl set image deployment/server-deployment server=${SERVER_IMAGE}:${IMAGE_TAG} -n ${NAMESPACE}
                    
                    echo "🔄 Restarting pods to pick up new local image..."
                    kubectl rollout restart deployment/client-deployment -n ${NAMESPACE}
                    kubectl rollout restart deployment/server-deployment -n ${NAMESPACE}
                    
                    echo "✅ Checking rollout status..."
                    kubectl rollout status deployment/server-deployment -n ${NAMESPACE} || true
                    """
                }
            }
        }
    }
}