# Use Node.js 18 alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm config set registry https://registry.npmmirror.com/
# Remove proxy if exists
RUN npm config delete proxy
RUN npm config delete https-proxy
# Install all dependencies including devDependencies
RUN npm install

# Copy source code
COPY . .

# Copy docker config to root for build process (as required by webpack config)
COPY config.docker.json /config.json

# Build the application
# Use npx to run build command using local node_modules binaries
RUN npx cross-env NODE_ENV=production webpack --config config/webpack.config.prod.js

# Remove dev dependencies to keep image small
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
