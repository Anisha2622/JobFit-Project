# client/Dockerfile
# build stage
FROM node:18-alpine as build
WORKDIR /usr/src/app
ENV PATH /usr/src/app/node_modules/.bin:$PATH

COPY package*.json ./
RUN npm ci

COPY . .
# If you use Vite, build command is usually `npm run build`
RUN npm run build

# production stage: serve with nginx
FROM nginx:stable-alpine
# COPY --from=build /usr/src/app/dist /usr/share/nginx/html
COPY --from=build /usr/src/app/build /usr/share/nginx/html


# optional: copy custom nginx config if you need SPA fallback to index.html
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
