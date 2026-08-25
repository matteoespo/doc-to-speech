FROM node:25-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite with host exposed
CMD ["npm", "run", "dev", "--", "--host"]
