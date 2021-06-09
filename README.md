# Uploader app API
Simple API created in order to learn Nest.js. The project uses a JWT-based authorization system and AWS S3 service to store shared files.

## Installation

```bash
$ git clone https://github.com/JakubesP/uploader-app-api
$ cd uploader-app-api
$ npm i
```
## Config files
**db.config.env**
```sh
POSTGRES_DB=uploader_app
POSTGRES_USER=dbuser
POSTGRES_PASSWORD=secret
```
**.env.stage.dev**
```sh
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

You need the following S3 bucket permissions:

```
"Action": [
    "s3:PutObject",
    "s3:GetObject",
    "s3:DeleteObject",
    "s3:ListBucket"
],
"Resource": [
    "arn:aws:s3:::[bucket_name]/*",
    "arn:aws:s3:::[bucket_name]"
]
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

## API endpoints

Endpoint  | Description
------------- | -------------
`POST /auth/signup`  | Create new user
`POST /auth/signin`  | Login to user
`GET /auth/me`  | Return current user
`DELETE /auth/me`  | Delete current user
`POST /uploads`  | Upload new file
`GET /uploads`  | Return list of uploads (available filters: search, take, skip)
`GET /uploads/{UUID}`  | Return upload
`DELETE /uploads/{UUID}`  | Delete uploaded file
`GET /uploads/file/{KEY}`  | Return uploaded file


