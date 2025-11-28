FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Expose port
ENV PORT=5000
EXPOSE ${PORT}

CMD ["node", "server.js"]