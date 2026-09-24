# Stage 1: Build the Angular application
FROM node:22-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install Angular dependencies
RUN npm ci

# Copy the Angular project
COPY . .

# Build Angular for production
RUN npm run build


# Stage 2: Serve the Angular application
FROM nginx:alpine

# Copy the Angular production files to Nginx
COPY --from=build /app/dist/student-entry/browser /usr/share/nginx/html

# Nginx listens on port 80
EXPOSE 80
