# build stage
FROM nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085/node:18-alpine as build
WORKDIR /usr/src/app
ENV PATH /usr/src/app/node_modules/.bin:$PATH
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# production stage
FROM nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085/nginx:stable-alpine
COPY --from=build /usr/src/app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
