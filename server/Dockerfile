# Use Node.js 20 alpine image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm config set registry https://registry.npmmirror.com/
# Remove proxy if exists
RUN npm config delete proxy
RUN npm config delete https-proxy
# Clear any environment proxy variables
ENV http_proxy=""
ENV https_proxy=""
ENV HTTP_PROXY=""
ENV HTTPS_PROXY=""

# Copy source code
COPY . .

# Copy docker config to root for build process (as required by webpack config)
COPY config.docker.json /config.json

# Install dependencies after copying source code (to ensure fresh install)
RUN npm install

# Build the application
RUN NODE_ENV=production ./node_modules/.bin/webpack --config config/webpack.config.prod.js

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]