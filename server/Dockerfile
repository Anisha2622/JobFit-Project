FROM nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085/node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
