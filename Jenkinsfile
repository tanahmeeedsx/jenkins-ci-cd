pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    environment {
        BACKEND_IMAGE = 'noteshub-backend'
        FRONTEND_IMAGE = 'noteshub-frontend'
        APP_SERVER_USER = 'ubuntu'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend Tests') {
            steps {
                dir('app/backend') {
                    sh '''
                        npm ci
                        npm test
                    '''
                }
            }
        }

        stage('Frontend Build') {
            steps {
                dir('app/frontend') {
                    sh '''
                        npm ci
                        npm run build
                    '''
                }
            }
        }

        stage('Docker Build and Push') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKERHUB_USER',
                        passwordVariable: 'DOCKERHUB_TOKEN'
                    )
                ]) {
                    sh '''
                        set -eu
                        trap 'docker logout >/dev/null 2>&1 || true' EXIT

                        echo "$DOCKERHUB_TOKEN"  | docker login \
                            -u "$DOCKERHUB_USER" --password-stdin

                        docker build \
                            -t "$DOCKERHUB_USER/$BACKEND_IMAGE:$BUILD_NUMBER" \
                            app/backend

                        docker build \
                            -t "$DOCKERHUB_USER/$FRONTEND_IMAGE:$BUILD_NUMBER" \
                            app/frontend

                        docker push "$DOCKERHUB_USER/$BACKEND_IMAGE:$BUILD_NUMBER"
                        docker push "$DOCKERHUB_USER/$FRONTEND_IMAGE:$BUILD_NUMBER"

                    '''
                }
            }
        }

        stage('Deploy to App EC2') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKERHUB_USER',
                        passwordVariable: 'DOCKERHUB_TOKEN'
                    ),
                    sshUserPrivateKey(
                        credentialsId: 'app-server-ssh',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    ),
                    string(
                        credentialsId: 'app-server-host',
                        variable: 'APP_SERVER_HOST'
                    )
                ]) {
                    sh '''
                        set -eu

                        chmod 600 "$SSH_KEY"

                        SSH="ssh -i $SSH_KEY -o StrictHostKeyChecking=accept-new"

                        $SSH "$SSH_USER@$APP_SERVER_HOST" \
                            'mkdir -p ~/noteshub'

                        scp -i "$SSH_KEY" \
                            -o StrictHostKeyChecking=accept-new \
                            deployment/docker-compose.prod.yml \
                            "$SSH_USER@$APP_SERVER_HOST:~/noteshub/docker-compose.yml"

                        scp -i "$SSH_KEY" \
                            -o StrictHostKeyChecking=accept-new \
                            deployment/deploy.sh \
                            "$SSH_USER@$APP_SERVER_HOST:~/noteshub/deploy.sh"

                        printf '%s' "$DOCKERHUB_TOKEN" | \
                            $SSH "$SSH_USER@$APP_SERVER_HOST" \
                            'docker login -u "'"$DOCKERHUB_USER"'" --password-stdin'

                        $SSH "$SSH_USER@$APP_SERVER_HOST" \
                            "cd ~/noteshub && \
                            grep -v -E '^(DOCKERHUB_USER|IMAGE_TAG)=' .env > .env.tmp && \
                            printf '\\nDOCKERHUB_USER=%s\\nIMAGE_TAG=%s\\n' \
                            '$DOCKERHUB_USER' '$BUILD_NUMBER' >> .env.tmp && \
                            mv .env.tmp .env && \
                            chmod 600 .env && \
                            chmod +x deploy.sh && \
                            ./deploy.sh"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'NotesHub CI/CD pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Check the stage logs.'
        }
        always {
            sh 'docker image prune -f || true'
        }
    }
}
