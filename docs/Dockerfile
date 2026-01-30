# Use nginx to serve static files
FROM nginx:alpine

# Copy static files to nginx
COPY . /usr/share/nginx/html

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 (Cloud Run requirement)
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
