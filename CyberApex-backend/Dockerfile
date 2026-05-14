FROM node:20-alpine

# Install necessary libraries for Prisma
RUN apk add --no-cache libc6-compat openssl1.1-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 5000

# Run the application
CMD ["npm", "start"]
