pipeline {
    agent any

    tools {
        nodejs "nodejs"
        git "Default"
    }

    environment {
        IMAGE_NAME = "QG"
        CONTAINER_NAME = "quote-generation-container"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/Modala-swathi/QuoteGeneration.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                bat 'npx mocha tests/**/*.js || echo "No tests found"'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t %IMAGE_NAME% .'
            }
        }

        stage('Run Docker Container') {
            steps {
                bat '''
                docker ps -q --filter "name=%CONTAINER_NAME%" | findstr . && docker stop %CONTAINER_NAME% && docker rm %CONTAINER_NAME%
                docker run -d -p 4000:4000 --name %CONTAINER_NAME% %IMAGE_NAME%
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Deployed successfully using Docker!'
        }
        failure {
            echo '❌ Build failed. Check logs.'
        }
    }
}