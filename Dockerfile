FROM node:20

# install python + ffmpeg
RUN apt-get update && apt-get install -y \
python3 \
python3-pip \
ffmpeg \
curl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["node","index.js"]
