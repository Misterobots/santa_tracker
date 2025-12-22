FROM nginx:alpine

# Copy static assets
COPY web /usr/share/nginx/html

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy entrypoint script
COPY entrypoint.sh /docker-entrypoint.d/99-video-count.sh
RUN chmod +x /docker-entrypoint.d/99-video-count.sh

# Expose port 80
EXPOSE 80

# Use default entrypoint which runs scripts in /docker-entrypoint.d/ and then starts nginx
