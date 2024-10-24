
FROM node:22

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm install

COPY . .

EXPOSE 3330

CMD ["npm", "start"]
