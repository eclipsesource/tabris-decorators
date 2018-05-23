node {

  /* Requires the Docker Pipeline plugin to be installed */
  docker.image('node:8-alpine').inside {

    def scmInfo

    stage('Checkout') {
      scmInfo = checkout scm
    }

    stage('SCM info') {
      echo "${scmInfo}"
    }

    stage('Build Environment') {
      sh 'npm -v'
      sh 'node --version'
    }

    stage('Install ts-node') {
      sh 'npm i ts-node -g'
    }

    stage('Build') {
      sh 'npm i && npm test && npm run build'
    }

  }

}