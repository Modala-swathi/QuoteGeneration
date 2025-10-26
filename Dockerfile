# Use official Node.js runtime as base image
FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all project files
COPY . .

# Expose the app port
EXPOSE 4000

# Set environment variable for Node to listen on all interfaces
ENV HOST=0.0.0.0
ENV PORT=4000

# Start the app
CMD ["npm", "start"]
