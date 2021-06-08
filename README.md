# Notebook app API
Simple API created in order to learn Nest.js. The project uses a JWT-based authorization system and AWS S3 service to store shared files.

## Installation

```bash
$ git clone https://github.com/JakubesP/upload-app-api
$ cd upload-app-api
$ npm i
```
## Config files
**db.config.env**
```
POSTGRES_DB=uploader_app
POSTGRES_USER=dbuser
POSTGRES_PASSWORD=secret
```
**.env.stage.dev**
```
DB_HOST=localhost
DB_PORT=5433 # port inside docker-compose.yml
DB_USERNAME=dbuser
DB_PASSWORD=secret
DB_DATABASE=uploader_app
JWT_SECRET = secret

AWS_ID=your_aws_id
AWS_SECRET=your_aws_secret
AWS_BUCKET_NAME=your_aws_bucket_name
```
## Running the app

```bash
$ npm run up
$ npm run start:dev
```

## Unit tests

```bash
$ npm run test
```