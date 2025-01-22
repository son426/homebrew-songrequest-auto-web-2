// build-env.js
const fs = require("fs");

const env = process.argv[2]; // dev, staging, release 중 하나를 받습니다
const envContent = `REACT_APP_ENV=${env}`;

// .env 파일에 현재 환경을 기록
fs.writeFileSync(".env", envContent);

console.log(`Environment set to: ${env}`);
