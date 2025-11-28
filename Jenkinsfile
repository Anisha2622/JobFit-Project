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

    - name: docker
      image: docker:latest
      tty: true
      command: ["cat"]
      volumeMounts:
        - name: docker-sock
          mountPath: /var/run/docker.sock
        - name: workspace-volume
          mountPath: /home/jenkins/agent

    - name: sonar
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
      volumeMounts:
        - name: kubeconfig-secret
          mountPath: /kube/config
          subPath: kubeconfig
        - name: workspace-volume
          mountPath: /home/jenkins/agent

    - name: jnlp
      image: jenkins/inbound-agent:latest
      volumeMounts:
        - name: workspace-volume
          mountPath: /home/jenkins/agent
'''
        }
    }

    environment {
        NAMESPACE = "2401157"

        REGISTRY = "nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"

        // Final image tags for Kubernetes
        CLIENT_IMAGE = "${REGISTRY}/${NAMESPACE}/jobfit-client:v1"
        SERVER_IMAGE = "${REGISTRY}/${NAMESPACE}/jobfit-server:v1"

        // ---------- SONARQUBE KEYS ----------
        SONAR_HOST_URL = "http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000"
        SONAR_PROJECT_KEY = "2401157-jobfit"
        SONAR_TOKEN = "sqp_ebccbe7e93e8db6ee0b16e52ceeec7bcd63479fa"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git url: 'https://github.com/Anisha2622/JobFit-Project.git', branch: 'main'
            }
        }

        stage('Build Frontend') {
            steps {
                container('node') {
                    dir('client') {
                        sh """
                        npm install
                        npm run build
                        """
                    }
                }
            }
        }

        stage('Build Backend') {
            steps {
                container('node') {
                    dir('server') {
                        sh "npm install"
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('sonar') {
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

        stage('Build Docker Images') {
            steps {
                container('docker') {
                    sh """
                    docker build -t ${CLIENT_IMAGE} ./client
                    docker build -t ${SERVER_IMAGE} ./server
                    """
                }
            }
        }

        stage('Push Images to Nexus') {
            steps {
                container('docker') {
                    withCredentials([usernamePassword(
                        credentialsId: 'nexus-cred',
                        usernameVariable: 'USER',
                        passwordVariable: 'PASS'
                    )]) {
                        sh """
                        echo "$PASS" | docker login ${REGISTRY} -u "$USER" --password-stdin
                        docker push ${CLIENT_IMAGE}
                        docker push ${SERVER_IMAGE}
                        """
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    sh """
                    kubectl apply -f k8s-deployment.yaml -n ${NAMESPACE}

                    kubectl rollout status deployment/server-deployment -n ${NAMESPACE} --timeout=60s
                    kubectl rollout status deployment/client-deployment -n ${NAMESPACE} --timeout=60s
                    """
                }
            }
        }
    }
}
