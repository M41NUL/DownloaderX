FROM node:20

# Install python + ffmpeg (yt-dlp এর জন্য দরকার)
RUN apt-get update && apt-get install -y \
python3 \
python3-pip \
ffmpeg \
curl \
&& ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app

# Install node packages
COPY package*.json ./
RUN npm install

# Copy project
COPY . .

# Start bot
CMD ["node", "index.js"]
