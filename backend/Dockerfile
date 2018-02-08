FROM node:9

MAINTAINER Jack Jefferies

# Install the npm packages which change infrequently
WORKDIR /boilerplate/backend
COPY ./package.json ./
RUN npm install supervisor -g
RUN npm install

EXPOSE 8080
CMD ["./entrypoint.sh"]
