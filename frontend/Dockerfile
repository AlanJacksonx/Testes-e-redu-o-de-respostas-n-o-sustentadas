FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install -g npm@latest && npm cache clean --force && npm install --legacy-peer-deps
COPY . .
EXPOSE 4200
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--poll", "1000"]
