# Start with Node.js 18 using Alpine Linux for a smaller image size
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first to leverage Docker's caching
# This means if your dependencies don't change, Docker won't reinstall them
COPY package*.json ./
RUN npm install

# Copy the rest of your application code
COPY . .

# Generate the Prisma client
RUN npx prisma generate

# Copy and make the initialization script executable
COPY init-db.sh /docker-entrypoint-initdb.d/
RUN chmod +x /docker-entrypoint-initdb.d/init-db.sh

# Command to run when the container starts
CMD ["npm", "run", "start:dev"]