# Stage 1: Build the application
FROM node:18 AS build

WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Run prisma generate to create the client
RUN npx prisma generate

# Build the TypeScript project
RUN npm run build

# Stage 2: Run the application
FROM node:18

WORKDIR /usr/src/app

# Copy the built files from the build stage
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY package*.json ./
COPY prisma ./prisma

# Install only production dependencies
RUN npm install --only=production

# Generate Prisma client again in the final stage
RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/index.js"]