## Whiskey Review Search

## 로컬 실행 방법

이 프로젝트는 Docker Compose로 MariaDB, Spring Boot 백엔드, 크롤러, Selenium, Next.js 프론트엔드를 실행합니다.

로컬 개발에서는 Nginx를 따로 띄우지 않습니다. 프론트 개발 서버는 기본적으로 호스트의 `4000`번 포트에서 실행하고, `NEXT_PUBLIC_API_BASE_URL`을 통해 백엔드 `8081`번 포트로 직접 API를 호출합니다. 포트는 `FRONTEND_PORT` 환경 변수로 변경할 수 있습니다.

### 필요 프로그램

- Docker Desktop
- Java 17 또는 Java 17을 받을 수 있는 Gradle toolchain 환경
- `backend/review-api/gradlew.bat`을 실행할 수 있는 셸

### 필요한 로컬 파일

루트 경로에 `.env.local`을 만듭니다. `docker compose`는 이 파일을 자동으로 읽지 않으므로 실행할 때 항상 `--env-file .env.local`을 붙입니다.

```env
MARIADB_ROOT_PASSWORD=
MARIADB_USER=
MARIADB_DATABASE=
MARIADB_PASSWORD=

NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081
FRONTEND_PORT=4000

GMAIL_EMAIL=
GMAIL_PW=
```

크롤러의 상세 글 수집 범위와 요청 속도는 환경변수로 조절할 수 있습니다. 기본값은 최근 30일, 실행당 상세 글 200건이며 목록 요청은 1~2초, 상세 요청은 0.8~1.5초, 갤러리 작업 사이는 3~7초의 무작위 간격을 사용합니다.

```env
# 비워두면 CRAWL_DETAIL_LOOKBACK_DAYS를 사용합니다.
CRAWL_DETAIL_SINCE=
CRAWL_DETAIL_LOOKBACK_DAYS=30
CRAWL_MAX_DETAIL_REQUESTS=200
CRAWL_LIST_DELAY_MIN=1
CRAWL_LIST_DELAY_MAX=2
CRAWL_DETAIL_DELAY_MIN=0.8
CRAWL_DETAIL_DELAY_MAX=1.5
CRAWL_JOB_DELAY_MIN=3
CRAWL_JOB_DELAY_MAX=7
CRAWL_LOG_DIR=/app/logs
```

위스키 계열 리뷰는 `liquor_review` 테이블에 통합 저장합니다. 기존 DB에 처음 적용할 때는 아래 마이그레이션을 한 번 실행합니다. 이 작업은 기존 `whiskey_review`와 `other_review`를 삭제하지 않습니다.

```powershell
docker cp .\mariadb\migrations\20260817_create_liquor_review.sql mariadb:/tmp/20260817_create_liquor_review.sql
docker exec mariadb mariadb -u <사용자> -p <DB명> -e "source /tmp/20260817_create_liquor_review.sql;"
```

`liquor_review`에는 위스키, 주라섬, 캠벨타운, 아일라, 옥수수물 갤러리의 리뷰 말머리가 들어갑니다. 기타리뷰, 증류소투어, 브랜디, 맥주, 칵테일, 럼, 세계주류는 `other_review`에 유지됩니다.

`backend/review-api/src/main/resources/secret.properties` 파일도 필요합니다. 이 파일은 Git에 올라가지 않으며, 백엔드 JAR를 빌드하기 전에 있어야 합니다.

```properties
spring.datasource.url=jdbc:mariadb://mariadb:3306/${MARIADB_DATABASE}
spring.datasource.username=${MARIADB_USER}
spring.datasource.password=${MARIADB_PASSWORD}
spring.datasource.driver-class-name=org.mariadb.jdbc.Driver
```

백엔드를 Docker가 아니라 호스트에서 직접 실행한다면 `spring.datasource.url`의 호스트를 `mariadb:3306` 대신 `localhost:3307`로 바꿉니다.

### 최초 1회 준비

`docker-compose.yml`에서 사용하는 외부 Docker 네트워크를 만듭니다.

```bash
docker network create proxy-network
```

백엔드 Docker 이미지를 만들기 전에 Spring Boot JAR를 먼저 빌드합니다. 백엔드 Dockerfile은 `build/libs`에 이미 생성된 JAR를 복사하는 구조입니다.

```bash
cd backend/review-api
./gradlew.bat build -x test
cd ../..
```

### 로컬 실행

로컬 개발 스택을 실행합니다.

```bash
docker compose --env-file .env.local --profile test up --build -d
```

확인할 주소는 다음과 같습니다.

- 프론트엔드: `http://localhost:4000` (`FRONTEND_PORT`를 지정했다면 해당 포트)
- 백엔드 API: `http://localhost:8081/api/review/whiskey?page=0&size=1`
- MariaDB: `localhost:3307`

컨테이너 상태와 로그를 확인합니다.

```bash
docker compose --env-file .env.local --profile test ps
docker compose --env-file .env.local --profile test logs --tail=120 frontend_dev backend_dev mariadb
```

로컬 스택을 중지합니다.

```bash
docker compose --env-file .env.local --profile test down
```

### 참고

- 프론트엔드는 Yarn을 사용합니다. Dockerfile과 개발 컨테이너가 `yarn install --frozen-lockfile`을 사용하므로, 패키지 매니저를 의도적으로 바꾸는 경우가 아니라면 `npm install`은 피합니다.
- `frontend_dev`는 의존성을 호스트의 `frontend/node_modules`가 아니라 Docker named volume인 `whiskey_frontend_node_modules`에 설치합니다.
- `secret.properties`를 바꿨다면 백엔드 JAR를 다시 빌드한 뒤 백엔드 컨테이너를 다시 빌드/재생성해야 합니다.
- 운영 프론트엔드는 기존처럼 상대경로 `/api/...` 호출을 유지할 수 있습니다. 로컬 개발에서는 `NEXT_PUBLIC_API_BASE_URL=http://localhost:8081`을 사용하므로 로컬 Nginx가 필요 없습니다.
- 백엔드 루트 주소인 `http://localhost:8081`은 `404`가 정상입니다. API 확인은 `/api/review/whiskey` 또는 `/api/review/other`로 합니다.
위스키 리뷰 검색/작성기 

https://whrv.sytes.net

## 검색 방법

### 1. AND/OR 검색
- **AND 검색**: 입력한 모든 검색어가 제목에 포함된 결과를 표시 
- **OR 검색**: 입력한 검색어 중 하나라도 제목에 포함되어 있다면 결과로 표시

### 2. Age 필터링
- Age 필터는 AND/OR 검색 결과에서 추가로 필터링을 진행 
- 숫자 또는 문자 입력 가능. 빈칸으로 둘 경우 필터링 없이 결과를 표시

---

## 사용 예시

1. **AND 검색 예시**  
   검색어: `드로낙`, `21`  
   - 결과: 제목에 `드로낙`과 `21`이 모두 포함된 결과를 표시합니다.

2. **OR 검색 예시**  
   검색어: `드로낙`, `21`  
   - 결과: 제목에 `드로낙`이 포함된 결과와 `21`이 포함된 결과를 모두 표시합니다.

3. **OR 검색 + Age 필터 예시**  
   검색어: `드로낙`, `21`  
   Age: `18`  
   - 결과:  
     - 제목에 `드로낙`이 포함된 결과  
     - 제목에 `21`이 포함된 결과  
     - 추가로 제목에 `18`이 포함된 결과를 표시합니다.

![image](https://github.com/user-attachments/assets/c7692218-fde5-48cd-a9ac-e5cb24730827)

---

## 기타 리뷰 검색 기능

다음 게시판의 리뷰 탭 글을 검색 가능
- 위스키 갤러리 (기타리뷰탭)
- 크맥 갤러리 / 브랜디 갤러리 (리뷰탭)
- 칵테일 갤러리 / 세계주류 갤러리 (리뷰탭 추가: 24.02.07 업데이트)

---

## 리뷰 작성 기능

모바일에서는 우측 상단의 리뷰 작성하기 버튼을 눌러 리뷰 작성 가능
- 표에서 노트를 선택해 추가하고 강도를 조절
- 표에 존재하지 않는 노트는 'Add Element'에 입력한 뒤 버튼을 눌러 추가
- comment 칸에 추가 설명 입력
- nose,palate,finish 작성 완료 후 결과 페이지에서 이미지 저장 가능

![그림1](https://github.com/user-attachments/assets/70d8f838-ad79-41c9-9b71-73766ba02af0)

