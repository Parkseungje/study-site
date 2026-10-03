---
title: 컨테이너와 격리
summary: 이미지를 띄운 프로세스. 가상머신이 아니라 커널을 공유하는 격리된 프로세스다
versionNote: Docker 28 기준
ord: 2
minutes: { intro: 5, standard: 18, deep: 30 }
edges:
  - { to: docker-image, type: prerequisite }
  - { to: docker-compose, type: deepens }
sources:
  - { label: Docker 공식 문서 - What is a container, url: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/ }
  - { label: Linux man - namespaces(7), url: https://man7.org/linux/man-pages/man7/namespaces.7.html }
---

# intro

컨테이너는 **이미지를 띄운 프로세스**다. 가상머신이 아니다.

```bash file=terminal
docker run -d --name db mysql:8
docker exec db ps aux
```

컨테이너 안에서 `ps` 를 보면 프로세스가 한두 개뿐이다. 호스트에서 `ps` 를 보면
그 프로세스가 **호스트 프로세스 목록에 그대로 보인다.** PID 만 다를 뿐이다.

가상머신은 OS 를 통째로 하나 더 띄운다. 컨테이너는 **호스트 커널을 그대로 쓰면서**
자기만의 파일 시스템과 네트워크를 가진 것처럼 보이게 한다. 그래서 몇 초 만에 뜬다.

# standard

## 이미지와 무엇이 다른가

| 구분 | 이미지 | 컨테이너 |
| --- | --- | --- |
| 상태 | 읽기 전용, 안 변함 | 쓰기 층이 있고 변한다 |
| 비유 | 클래스 | 인스턴스 |
| 개수 | 하나 | 같은 이미지로 여럿 |

[[docker-image]] 하나로 컨테이너를 열 개 띄울 수 있다. 각자 자기 쓰기 층을 갖는다.
컨테이너를 지우면 그 쓰기 층도 같이 사라진다. **이미지는 그대로 남는다.**

## 데이터는 어디에 두는가

컨테이너가 사라지면 쓰기 층도 사라지므로, 남아야 하는 데이터는 밖에 둬야 한다.

| 방식 | 쓰는 곳 | 성격 |
| --- | --- | --- |
| volume | DB 데이터 | Docker 가 관리. 호스트 경로를 몰라도 된다 |
| bind mount | 개발 중 소스 | 호스트의 특정 경로를 그대로 연결 |
| tmpfs | 비밀값, 임시 파일 | 메모리에만. 컨테이너가 죽으면 사라진다 |

이 프로젝트의 `docker-compose.yml` 이 둘을 다 쓴다.

```yaml file=docker-compose.yml highlight=3,5
    volumes:
      # DB 데이터. 컨테이너를 지워도 남는다
      - mysql-data:/var/lib/mysql
      # 초기화 스크립트. 내 레포의 파일을 그대로 보여준다
      - ./docker/init:/docker-entrypoint-initdb.d:ro
```

`docker compose down` 은 컨테이너만 지운다. 볼륨까지 지우려면 `-v` 를 붙여야 한다.
이걸 모르고 `down -v` 를 치면 DB 가 통째로 날아간다.

## 네트워크

컨테이너는 각자 네트워크를 갖는다. Compose 로 띄우면 **서비스 이름이 호스트명**이 된다.

```
app 컨테이너 ──► db:3306        (컨테이너끼리, 서비스 이름으로)
브라우저    ──► localhost:3307  (호스트에서, 공개된 포트로)
```

`ports: "3307:3306"` 은 **호스트 3307 을 컨테이너 3306 에 연결**한다는 뜻이다.
왼쪽이 호스트, 오른쪽이 컨테이너다. 순서를 뒤집으면 엉뚱한 포트가 열린다.

컨테이너끼리 통신할 때는 이 공개 포트를 쓰지 않는다. 같은 네트워크 안에서는
`db:3306` 으로 바로 닿는다.

## 자주 쓰는 명령

```bash file=terminal
docker ps                    # 떠 있는 것
docker ps -a                 # 멈춘 것까지
docker logs -f db            # 로그 따라가기
docker exec -it db bash      # 안으로 들어가기
docker stats                 # CPU·메모리 실시간
docker system df             # 디스크를 뭐가 먹고 있나
```

`docker system prune` 은 안 쓰는 이미지·컨테이너·네트워크를 지운다.
`-a` 를 붙이면 안 쓰는 이미지를 전부 지우므로 다음 빌드가 느려진다.

# deep

## 격리를 만드는 두 가지

컨테이너는 Docker 가 발명한 것이 아니라 **리눅스 커널 기능 두 개를 조합한 것**이다.

| 기능 | 하는 일 |
| --- | --- |
| namespace | 보이는 것을 나눈다 (격리) |
| cgroup | 쓸 수 있는 양을 나눈다 (제한) |

namespace 는 종류가 여러 개고, 컨테이너는 보통 이것들을 전부 새로 만든다.

| namespace | 나누는 것 |
| --- | --- |
| `pid` | 프로세스 목록. 컨테이너 안에서는 자기 프로세스가 PID 1 |
| `mnt` | 마운트된 파일 시스템 |
| `net` | 네트워크 인터페이스, 포트, 라우팅 테이블 |
| `uts` | 호스트명 |
| `ipc` | 공유 메모리, 세마포어 |
| `user` | UID·GID 매핑 |

**커널은 공유된다.** 그래서 리눅스 컨테이너를 Windows 에서 돌리려면 그 안에 리눅스 VM 이
하나 돌아야 한다. Docker Desktop 이 하는 일이 그것이다.

## PID 1 의 함정

컨테이너 안의 메인 프로세스는 PID 1 이 된다. 리눅스에서 PID 1 은 **특별 취급**을 받는다.

- 기본 시그널 핸들러가 없다. `SIGTERM` 을 직접 처리하지 않으면 **무시된다**
- 고아 프로세스를 거둬야 할 책임이 있다

그래서 `docker stop` 이 10초를 기다렸다가 `SIGKILL` 로 강제 종료하는 일이 흔하다.
종료가 느리다면 애플리케이션이 `SIGTERM` 을 안 받고 있을 가능성이 크다.

```dockerfile file=Dockerfile bad label="셸이 PID 1 이 된다"
CMD npm start
```

```dockerfile file=Dockerfile good label="프로세스가 PID 1"
CMD ["npm", "start"]
```

왼쪽은 `/bin/sh -c "npm start"` 로 실행된다. 셸이 PID 1 이고 `npm` 은 자식이라
시그널이 전달되지 않는다. **대괄호 형태(exec form)** 를 쓰는 이유다.

## cgroup: 한도를 거는 쪽

namespace 가 "안 보이게" 한다면 cgroup 은 "못 쓰게" 한다.

```bash file=terminal
docker run -m 512m --cpus 1.5 myapp
```

메모리 한도를 넘기면 커널의 OOM killer 가 **그 프로세스를 죽인다.**
컨테이너가 이유 없이 사라졌다면 여기를 먼저 본다.

```bash file=terminal
docker inspect db --format '{{.State.OOMKilled}}'
```

JVM 은 예전에 cgroup 한도를 못 읽고 호스트 전체 메모리를 기준으로 힙을 잡아
반드시 OOM 으로 죽는 문제가 있었다. Java 10 부터 컨테이너 한도를 인식한다.
그 전 버전을 쓴다면 `-Xmx` 를 직접 줘야 한다.

## 왜 루트로 돌리면 안 되는가

컨테이너 안의 루트는 기본적으로 **호스트의 루트와 같은 UID 0** 이다.
user namespace 를 따로 켜지 않는 한 그렇다.

bind mount 된 디렉터리에 컨테이너가 파일을 쓰면 호스트에 루트 소유 파일이 생긴다.
컨테이너 탈출 취약점이 터지면 그대로 호스트 권한이 된다.

```dockerfile file=Dockerfile
RUN addgroup -S app && adduser -S app -G app
USER app
```

이 두 줄이면 대부분 해결된다. 개인 학습용 로컬 환경에서는 덜 중요하지만,
습관을 들여두면 나중에 운영에 올릴 때 고칠 일이 없다.
