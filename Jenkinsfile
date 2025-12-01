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
    # MOUNT DOCKER SOCKET (Critical for Local Builds)
    - name: docker-sock
      hostPath:
        path: /var/run/docker.sock
  containers:
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
        
        // Simple Local Image Names
        CLIENT_IMAGE = "jobfit-client:local"
        SERVER_IMAGE = "jobfit-server:local"

        // Frontend Variables
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY    = "pk_test_dml0YWwtbXVkZmlzaC02LmNsZXJrLmFjY291bnRzLmRldiQ"
        NEXT_PUBLIC_CLERK_FRONTEND_API       = "vital-mudfish-6.clerk.accounts.dev"
        NEXT_PUBLIC_CONVEX_URL               = "https://flippant-goshawk-377.convex.cloud"
        NEXT_PUBLIC_STREAM_API_KEY           = "muytsbs2rpay"
        NEXT_PUBLIC_DISABLE_CONVEX_PRERENDER = "true"
    }

    stages {
        stage('Build Docker Images (Local)') {
            steps {
                container('docker') {
                    script {
                        echo "🔧 Switching to AWS Mirror to prevent Rate Limiting..."
                        // Fix Dockerfiles to use AWS Mirror
                        sh "sed -i 's|FROM node|FROM public.ecr.aws/docker/library/node|g' ./client/Dockerfile"
                        sh "sed -i 's|FROM node|FROM public.ecr.aws/docker/library/node|g' ./server/Dockerfile"
                        sh "sed -i 's|FROM nginx|FROM public.ecr.aws/docker/library/nginx|g' ./client/Dockerfile"

                        sh """
                        echo "🐳 Building Client Image..."
                        docker build \\
                            --build-arg NEXT_PUBLIC_CONVEX_URL="${NEXT_PUBLIC_CONVEX_URL}" \\
                            --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}" \\
                            --build-arg NEXT_PUBLIC_CLERK_FRONTEND_API="${NEXT_PUBLIC_CLERK_FRONTEND_API}" \\
                            --build-arg NEXT_PUBLIC_STREAM_API_KEY="${NEXT_PUBLIC_STREAM_API_KEY}" \\
                            --build-arg NEXT_PUBLIC_DISABLE_CONVEX_PRERENDER="${NEXT_PUBLIC_DISABLE_CONVEX_PRERENDER}" \\
                            -t ${CLIENT_IMAGE} ./client

                        echo "🐳 Building Server Image..."
                        docker build -t ${SERVER_IMAGE} ./server
                        """
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    sh """
                    echo "🧹 Cleaning up old deployments..."
                    kubectl delete deployment client-deployment server-deployment -n ${NAMESPACE} --ignore-not-found=true

                    echo "🔧 Updating YAML to use Local Images..."
                    # 1. Update Image Names
                    sed -i "s|image: .*jobfit-client.*|image: ${CLIENT_IMAGE}|g" k8s-deployment.yaml
                    sed -i "s|image: .*jobfit-server.*|image: ${SERVER_IMAGE}|g" k8s-deployment.yaml
                    
                    # 2. Force ImagePullPolicy to Never (Crucial!)
                    sed -i "s|image: ${CLIENT_IMAGE}|image: ${CLIENT_IMAGE}\\n        imagePullPolicy: Never|g" k8s-deployment.yaml
                    sed -i "s|image: ${SERVER_IMAGE}|image: ${SERVER_IMAGE}\\n        imagePullPolicy: Never|g" k8s-deployment.yaml
                    
                    echo "📦 Applying Kubernetes manifests..."
                    kubectl apply -f k8s-deployment.yaml -n ${NAMESPACE}
                    kubectl apply -f client-service.yaml -n ${NAMESPACE}

                    echo "✅ Checking rollout status..."
                    if ! kubectl rollout status deployment/server-deployment -n ${NAMESPACE} --timeout=2m; then
                        echo "❌ Deployment Failed! Printing Logs for debugging:"
                        kubectl logs deployment/server-deployment -n ${NAMESPACE} --all-containers=true --tail=50
                        echo "⚠️ Pipeline marking as failure."
                        exit 1
                    fi
                    """
                }
            }
        }
    }
}