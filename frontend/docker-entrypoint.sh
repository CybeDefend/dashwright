#!/bin/sh
# Replace environment variables in JavaScript files

# Replace VITE_API_URL placeholder with actual value
if [ ! -z "$VITE_API_URL" ]; then
  echo "Configuring API URL: $VITE_API_URL"
  find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|http://localhost:3000|$VITE_API_URL|g" {} +
  find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|http://localhost:3006|$VITE_API_URL|g" {} +
fi

# Replace VITE_WS_URL placeholder with actual value
if [ ! -z "$VITE_WS_URL" ]; then
  echo "Configuring WebSocket URL: $VITE_WS_URL"
  find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|ws://localhost:3000|$VITE_WS_URL|g" {} +
  find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|ws://localhost:3006|$VITE_WS_URL|g" {} +
fi

echo "Starting nginx..."
exec nginx -g 'daemon off;'
