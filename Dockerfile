FROM node:12.16.1-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Install ffmpeg
RUN wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz \
    && xz -d ffmpeg-release-amd64-static.tar.xz \
    && tar -xvf ffmpeg-release-amd64-static.tar \
    && rm -rf ffmpeg-release-amd64-static.tar

# Bundle app source
COPY . .

RUN sed -i.bak '32 s|E:\\\\programs\\\\ffmpeg-20190629-89b9690-win64-static\\\\bin\\\\ffmpeg.exe|/usr/src/app/ffmpeg-4.2.2-amd64-static/ffmpeg|' app.vp9.js

EXPOSE 1935 8000

CMD [ "node", "app.vp9.js" ]
