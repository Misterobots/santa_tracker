FROM nginx:alpine

# Install Python 3 and supervisord
RUN apk add --no-cache python3 py3-pip supervisor

# Copy static assets
COPY web /usr/share/nginx/html

# Copy Python server to correct location
COPY web/server.py /app/server.py

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy supervisord config
COPY supervisord.conf /etc/supervisord.conf

# Expose port 80
EXPOSE 80

# Run supervisord to manage both nginx and python server
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
