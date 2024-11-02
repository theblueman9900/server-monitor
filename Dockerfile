# Use Node.js base image
FROM node:18
# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port 4000
EXPOSE 4000

# Start the Node.js application
CMD ["npm", "start"]
