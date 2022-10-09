# **Wave NestJS Server** · [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/d0orHyeok/wave-client-production/blob/master/LICENSE) <img src="https://img.shields.io/badge/TypeScript-3178C6?flat&logo=TypeScript&logoColor=white"> <img src="https://img.shields.io/badge/NestJS-E0234E?flat&logo=NestJS&logoColor=white"> <img src="https://img.shields.io/badge/Firebase-FFCA28?flat&logo=Firebase&logoColor=white">

[Wave](https://wave-d0orhyeok.netlify.app/) 음악공유 스트리밍 사이트의 백엔드서버입니다.

- NestJS, TypeScript사용한 프로젝트입니다.
- **Server status**

  ![Heroku](https://heroku-badge.herokuapp.com/?app=wave-nestjs)

## **Installation**

프로젝트 클론 후 패키지 설치를 진행하고 환경변수를 등록하고 실행하세요.

### Clone Project

```sh
git clone [REPO_URL] [DIR]
```

### Install development dependencies:

```sh
npm install
# or
yarn add
```

### Environment Variables

```sh
# .env.production
# .env.development
CLIENT_URL=[YOUR_CLIENT_URL]
SERVER_URL=[YOUR_SERVER_URL]
SERVER_PORT=[PORT]

JWT_SECRET=[SECRET]
JWT_ACCESS_TOKEN_SECRET=[SECRET]
JWT_REFRESH_TOKEN_SECRET=[SECRET]
JWT_ACCESS_TOKEN_EXPIRATION_TIME=[SECOND]
JWT_REFRESH_TOKEN_EXPIRATION_TIME=[SECOND]

DB_HOST=[POSTGRESQL_HOST]
DB_PORT=[POSTGRESQL_PORT]
DB_PASSWORD=[POSTGRESQL_PASSWORD]
DB_USERNAME=[POSTGRESQL_USER]
DB_NAME=[POSTGRESQL_DATABASE_NAME]
DB_SYNC=true

FIREBASE_PROJECT_ID=[YOUR_FIREBASE_PROJECT_ID]
FIREBASE_PRIVATE_KEY=[YOUR_FIREBASE_PRIVATE_KEY]
FIREBASE_CLIENT_EMAIL=[YOUR_FIREBASE_CLIENT_EMAIL]
FIREBASE_STORAGE_BASE_URL=[YOUR_FIREBASE_STORAGE_BASE_URL]
# Exampe FIREBASE_STORAGE_BASE_URL
# https://firebasestorage.googleapis.com/v0/b/[your_storage_url]/o/
```

## **Documentation**

[API 사용문서](https://wave-nestjs.herokuapp.com/api)

## **Author**

- [d0orHyeok](https://github.com/d0orHyeok) - JangHyeok Kim
- Email
  - d0oR.hyeok@gmail.com
  - d0or_hyeok@naver.com

## **License**

[MIT licensed](LICENSE).
