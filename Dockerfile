# Use an official Node.js runtime as base image
FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all project files
COPY . .

# Expose the app port
EXPOSE 3000

# Command to run the app
CMD ["npm", "start"]
