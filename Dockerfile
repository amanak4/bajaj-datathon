# Use Node.js official image
FROM node:22-slim

# Install Poppler utilities (required for pdf-poppler)
RUN apt-get update && apt-get install -y \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files from backend
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy backend application code
COPY backend/ .

# Expose port
EXPOSE 10000

# Start the application
CMD ["npm", "start"]

