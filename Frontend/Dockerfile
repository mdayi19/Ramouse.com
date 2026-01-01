# Build Stage
FROM node:18 as build

WORKDIR /app

# Copy all source files first
COPY . .

# Remove any existing node_modules that might have Windows permissions
RUN rm -rf node_modules

# Fresh install with proper Linux permissions
RUN npm install

# Accept build arguments
ARG VITE_API_URL
ARG VITE_REVERB_APP_KEY
ARG VITE_REVERB_HOST
ARG VITE_REVERB_PORT
ARG VITE_REVERB_SCHEME
ARG VITE_VAPID_PUBLIC_KEY

# Set environment variables
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY
ENV VITE_REVERB_HOST=$VITE_REVERB_HOST
ENV VITE_REVERB_PORT=$VITE_REVERB_PORT
ENV VITE_REVERB_SCHEME=$VITE_REVERB_SCHEME
ENV VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY

# Build using node_modules/.bin directly
RUN ./node_modules/.bin/tsc && ./node_modules/.bin/vite build

# Production Stage
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Configure nginx for SPA routing
RUN echo 'server { listen 80; server_name localhost; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
