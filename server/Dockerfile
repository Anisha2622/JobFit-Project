# server/Dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies (use package-lock for stable installs)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Expose port (change if your server uses a different port)
ENV PORT=5000
EXPOSE ${PORT}

# If you need any env defaults, set here (but prefer docker-compose/env files)
# CMD to start your server; change to "npm run start" if that's your script
CMD ["node", "server.js"]
