# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy rest of the code
COPY . .

# Expose port (Render uses 10000 typically)
EXPOSE 10000

# Start the app
CMD ["npm", "start"]