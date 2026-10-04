# 🎯 분산과 운영 — 서버가 여러 대가 될 때

> **목적**: 서버 한 대로 안 되는 지점을 알고, 그 위의 도구들을 고른다.
> 분산 시스템 이론에서 시작해 캐싱·Redis, 메시징·Kafka, 그리고 관측과 장애 대응까지.
>
> **선행**: 데이터베이스 과목(일관성·복제), 스프링 과목(MVC·Security), 데이터 접근 과목.
> 단일 호스트의 고통을 겪지 않으면 여기의 도구들이 **해결책이 아니라 복잡도로만** 보인다.
>
> **원본에서 뺀 것**: Docker 와 Kubernetes 는 **인프라 트랙의 Docker 과목**으로 옮겼다.
> 거기서 13 PART 로 따로 다룬다. Kubernetes 는 인프라 트랙의 다음 과목이다.

---

## 🧭 전체 지도 (한눈에)

```
  [1] 분산 시스템의 이론        ← CAP · 일관성 모델 · 분산 트랜잭션
   ↓
  [2] 캐싱과 Redis              ← DB 부하를 줄이는 첫 수단
   ↓
  [3] 메시징과 Kafka            ← 동기 호출 체인을 끊는다
   ↓
  [4] 관측과 12-Factor          ← 안 보이면 고칠 수 없다
   ↓
  [5] 배포와 장애 대응          ← CI/CD · Postmortem
```

순서의 이유: **[1] 을 맨 앞에** 둔다.
캐시의 정합성 문제도 Kafka 의 at-least-once 도 **결국 일관성 선택**이고,
그 어휘를 먼저 갖춰야 각 도구가 무엇을 포기하는지 보인다.

### 기술 진화의 척추

| 영역 | 로우레벨(고통) | 중간 | 하이레벨(해결) |
|---|---|---|---|
| 일관성 | ACID 강한 일관성 | — | BASE 최종 일관성 |
| 분산 트랜잭션 | 2PC(블로킹·SPOF) | — | Saga + Outbox(최종 일관성) |
| DB 부하 | 매 요청 DB 직격 | 로컬 캐시 | 분산 캐시(Redis) + 캐싱 패턴 |
| 서비스 간 호출 | 동기 호출 체인(강결합·전파) | 비동기 + 큐 | 이벤트 스트리밍(Kafka) |
| 시스템 구조 | Monolith(전체 배포) | Modular Monolith | MSA(Bounded Context) |
| 설정 관리 | 코드에 하드코딩 | 프로파일별 파일 | 환경변수(12-Factor) |
| 운영 가시성 | 사후 로그 grep | Monitoring(지표) | Observability(3 Pillars) |
| 배포 | 수동 배포 | 스크립트 | CI/CD 파이프라인 |

---

# 📚 PART 1 — 분산 시스템의 이론

> **목표**: 여러 시스템이 협력할 때의 어휘를 먼저 갖춘다. CAP 과 일관성 모델, 그리고 분산 트랜잭션.

## 1.1 일관성과 합의, 분산 트랜잭션의 진화

- **일관성 5단계**(강→약): Strong → Linearizable → Sequential → Causal → Eventual. 강한 일관성은 모든 노드 동의가 필요해 응답이 느리고, 최종 일관성은 빠르지만 일시적 불일치 허용. 결제·잔액은 Strong, 알림·통계는 Eventual이 적합.
- **합의 알고리즘**: 여러 노드가 한 값에 동의하는 문제(리더 선출·분산 락·설정 동기화의 기반). **Paxos**(난해) → **Raft**(이해 쉽게 재설계: Leader Election + Log Replication, 과반수 commit)가 현대 표준. 데이터베이스 과목 Quorum의 이론적 뿌리. 실사용: etcd, Consul, Kafka KRaft.
- **로우레벨의 불편함 — 2PC**: Coordinator가 Prepare→Commit 2단계로 여러 DB를 ACID로 묶지만, **동기 블로킹·Coordinator SPOF·성능 저하·타임아웃 모호성** 때문에 실용성이 낮다.
- **해결 — Saga**: 여러 로컬 트랜잭션을 연결하고 실패 시 **보상 트랜잭션**으로 되돌림(최종 일관성, 비동기 가능). 구현은 Orchestration(중앙 조율, 명확하나 SPOF) vs Choreography(이벤트 반응, 분산적이나 추적 어려움) — 18.7에서 심화.


## 1.2 일관성 모델 — ACID 의 반대편

- **BASE**(ACID 의 반대 철학): Basically Available · Soft state · **Eventually consistent**. SNS·로그·검색에 적합.
- **CAP**: Consistency · Availability · Partition tolerance 중 **2개만** 고를 수 있다. 현실의 분산 시스템은 **P 가 필수**이므로 실제 선택은 **CP(MongoDB) vs AP(Cassandra / DynamoDB)** 다. 단일 RDBMS 는 CA.
- **PACELC**: CAP 을 확장한 것. 장애 시(PA / PC)에 더해 **정상 시(EL / EC — 지연 vs 일관성)**까지 본다. MySQL = EC, 캐시 = EL.
- ACID 자체는 데이터베이스 과목 PART 3.1 에서 다룬다. 여기서는 **그 반대편 선택지**를 본다.

**자기 점검**
- CAP 에서 P 가 사실상 필수인 이유는? 그래서 실제 선택은 무엇과 무엇 사이인가?
- PACELC 가 CAP 에 더한 질문은 무엇인가?

# 📚 PART 2 — 캐싱과 Redis

> **목표**: DB 부하를 줄이는 첫 수단. 그리고 캐시가 만드는 정합성 문제.

## 2.1 캐싱 전략과 함정

- 캐시는 Read-heavy·low-write·약간의 staleness 허용 데이터에 적합. 계층: Browser/CDN/Reverse Proxy/Local(Caffeine)/Distributed(Redis)/DB Buffer Pool.
- **4대 패턴**: **Cache-Aside**(가장 흔함, 읽기 시 miss면 DB→캐시 적재, 쓰기 시 캐시 무효화) / **Write-Through**(캐시+DB 동시, 강한 일관성·쓰기 느림) / **Write-Behind**(캐시 먼저, 비동기 DB 반영, 빠르나 손실 위험 — 로그·카운터) / **Read-Through**(캐시가 직접 DB 로드 — Spring Cache 방식).
- **3대 함정**: **Stampede**(인기 키 만료 순간 동시 miss → Mutex/조기 갱신/TTL Jitter), **Penetration**(없는 키 반복 조회 → Negative Caching/Bloom Filter/입력 검증), **Avalanche**(대량 키 동시 만료 → TTL Jitter/다중 계층/Circuit Breaker).


## 2.2 Redis 본격 (★ 자료구조 도구로 보기)

| 자료구조 | 용도 | 대표 명령 |
|---|---|---|
| String | 캐시·카운터·Rate Limit | SET/GET/INCR |
| List | 큐·최근 활동 | LPUSH/RPOP/LRANGE |
| Set | 중복 제거·교집합 | SADD/SINTER |
| Hash | 객체(부분 업데이트) | HSET/HGET/HINCRBY |
| Sorted Set | 랭킹·시계열(score=ts)·우선순위 | ZADD/ZREVRANGE/ZRANK |

- **Pub/Sub**: Fire-and-Forget(미보존, 구독자 없으면 소실). **Stream**(5.0+): 메시지 영속화+Consumer Group(Kafka-like, 더 가벼움).
- **영속성**: **RDB**(스냅샷, 빠른 복구·손실 가능) vs **AOF**(쓰기 명령 로그, 손실 최소·복구 느림, fsync `everysec` 권장). 일반 운영은 **RDB+AOF 병행**.
- **분산 락**: `SET key val NX EX 30`(없을 때만, 자동 만료). 해제는 "내 락이면 DEL"을 Lua로 원자 처리. 단일 Redis 장애 대비 **Redlock**(여러 인스턴스 과반수 SET). Java는 **Redisson** `RLock`. GC pause로 락 만료 중 타 노드 획득 위험이 가장 큼 — 단일 DB면 `@Transactional`+행 락으로 충분한 경우 많음.


## 2.3 Spring과 Redis 통합

- `@EnableCaching` + `spring.cache.type=redis`. `@Cacheable`/`@CacheEvict`/`@CachePut`은 **AOP로 동작** → **자기 호출 시 안 됨**(데이터 접근 PART 2.3 함정 동일), `@CacheEvict`의 트랜잭션 커밋 전 실행(`beforeInvocation`) 일관성 주의.
- 복잡한 자료구조(ZSet 랭킹)·Pub/Sub·분산 락은 **RedisTemplate** 직접 사용. 직렬화는 `StringRedisSerializer`(key) + `GenericJackson2JsonRedisSerializer`(value). 클라이언트는 비동기·스레드 안전한 **Lettuce**가 기본.


# 📚 PART 3 — 메시징과 Kafka

> **목표**: 동기 호출 체인을 끊는다. 큐와 스트리밍의 차이, 그리고 전달 보장.

## 3.1 메시지 큐와 비동기 통신

- **로우레벨의 불편함 — 동기 호출 체인**: 응답시간이 합산되고, 하위 서비스 다운/지연이 상위까지 전파되며, 호출자가 수신자를 알아야 하는 강결합.
- **해결 — 메시지 큐**: 발행 후 즉시 응답, 소비자 다운 시 큐에 적재, 느슨한 결합, N 소비자 Fan-out. 대가는 즉시 결과 불가(Eventual)·분산 추적 필요.
- 3개념 구분: **Queue**(한 소비자, Point-to-Point) / **Broker Pub/Sub**(여러 소비자) / **Event Streaming**(영속·Replay — Kafka).

| | RabbitMQ | Redis | Kafka |
|---|---|---|---|
| 용도 | 일반 메시징 | 간단·캐시 | 대규모 스트리밍 |
| 영속성 | 옵션 | 옵션(Stream) | 기본 |
| Replay | X | Stream만 | ✅ |

- **전달 보장**: At-most-once / **At-least-once(가장 흔함, 중복 가능→멱등성 필요)** / Exactly-once(어려움). 표준은 **At-least-once + 소비자 멱등성**(처리 이력 키 확인). HTTP 멱등성(스프링 PART 3.7)과 같은 원리.


## 3.2 Kafka 아키텍처 (★ 면접 단골)

- **Topic**(논리 분류) → **Partition**(물리 분할, 병렬 단위, 파티션 내부만 순서 보장) → **Offset**(파티션 내 순번, 소비 위치 추적). **Partition Key**(`hash(key)%n`)로 같은 키는 같은 파티션 → 순서 보장. 글로벌 순서가 필요하면 파티션 1개(처리량 제한).
- **Producer acks**: 0(손실 가능) / 1(Leader 확인, 기본) / all(ISR 전부, 안전·느림).
- **Consumer Group**: 한 파티션은 그룹 내 한 소비자만(병렬), 다른 그룹은 같은 메시지 독립 수신(Fan-out). 소비자 추가/제거 시 **Rebalancing**(잠시 중단) — 너무 잦으면 처리량 저하. 파티션 4개에 소비자 6개면 2개는 유휴.
- **Offset 커밋**: Auto(처리 전 커밋→손실 위험) vs **Manual**(poll→process→commitSync, At-least-once).
- **Broker/Replication**: 파티션을 여러 브로커에 복제(Leader-Follower, ISR). 메타데이터 관리가 ZooKeeper → **KRaft**(Kafka 내장 Raft, 단순화)로 이동.


## 3.3 Spring Kafka & MSA

- **Producer**: `KafkaTemplate.send(topic, key, value)`(비동기, `CompletableFuture`). **Consumer**: `@KafkaListener(topics, groupId)`. Manual commit은 `Acknowledgment.acknowledge()`. 직렬화는 JSON(간단) 또는 Avro/Protobuf+Schema Registry(대규모). 에러는 재시도(`DefaultErrorHandler`+`FixedBackOff`)→**DLT**(Dead Letter Topic), 그리고 멱등 처리.
- **Monolith vs MSA**: Monolith는 단순·트랜잭션·디버깅 쉬움(부분 확장·독립 배포 어려움), MSA는 독립 배포·부분 스케일·장애 격리(분산 복잡도·운영 부담·분산 트랜잭션). MSA 신호: 큰 팀·부분만 트래픽 폭증·기술 다양성·배포 빈도 차이·장애 격리 필수. **Modular Monolith**(명확한 모듈 경계)가 현실적 중간 단계.
- **DDD Bounded Context** = 좋은 MSA 분리 단위(같은 단어가 컨텍스트마다 다른 의미 → 별도 모델). 처음엔 같은 DB, 나중에 분리.
- **MSA 핵심 패턴**: **API Gateway**(단일 진입점: 라우팅·인증·Rate Limit — Spring Cloud Gateway, 너무 많은 로직 넣으면 새 Monolith) / **Service Discovery**(Eureka; K8s에선 Service+DNS가 대체) / **Circuit Breaker**(Resilience4j: CLOSED→OPEN→HALF-OPEN, Cascading Failure 방지, Bulkhead로 스레드풀 격리 — 자바 PART 7 연결) / **Distributed Tracing**(Trace/Span, Trace ID 헤더 전파 — OpenTelemetry 표준).
- **분산 트랜잭션 패턴**: **Saga Orchestration vs Choreography**(5개 이하면 Choreography, 복잡하면 Orchestration; Choreography는 이벤트 순환 주의) / **Outbox**(DB 저장과 이벤트 발행을 한 트랜잭션으로 — 이중 쓰기 문제 해결, Outbox 테이블에 INSERT 후 폴러/CDC가 발행) / **CQRS·Event Sourcing**(읽기/쓰기 모델 분리, 상태 대신 이벤트 시퀀스 저장 — 강력하나 복잡, "Just Enough Architecture"가 정답인 경우 많음).

---


# 📚 PART 4 — 관측과 12-Factor

> **목표**: 안 보이면 고칠 수 없다. 설정을 밖으로 빼고 세 종류의 관측 데이터를 모은다.

## 4.1 12-Factor App

12원칙 중 자주 위반: **Config**(환경변수/Secret 분리, 하드코딩 금지), **Processes/Stateless**(Pod 재시작 OK, Session은 외부 Redis — 스프링 PART 6), **Logs**(파일 X, **stdout** → 플랫폼이 수집), **Disposability**(Graceful Shutdown: `server.shutdown=graceful` — SIGTERM 시 진행 요청 완료 후 종료), Dev/Prod Parity.


## 4.2 Observability — 3 Pillars

- **Monitoring**(알려진 문제, 사전 정의 지표) ⊂ **Observability**(알려지지 않은 문제까지 관찰 가능). **3 Pillars**: Logs(무슨 일?), Metrics(얼마나?), Traces(어떻게 흘렀나? — 분산과 운영 과목 분산 추적).
- **Logs**: 평문 대신 **구조화(JSON)** → 필드 검색·자동 알림. **MDC**로 `trace_id` 전 로그 전파. ELK(Elasticsearch/Logstash/Kibana) 또는 Grafana Loki.
- **Metrics(Prometheus Pull + Micrometer)**: `/actuator/prometheus` 노출. 타입 4종: Counter(누적)·Gauge(현재값)·Histogram(분포)·Summary(Percentile). Grafana 시각화. **SLI**(지표)/**SLO**(목표)/**SLA**(계약).
- **Traces(OpenTelemetry)**: Logs/Metrics/Traces 통합 표준. Micrometer Tracing+OTLP, 샘플링(운영 10%). 3 Pillars 연결: Log의 trace_id → Trace → 해당 시점 Metric.


# 📚 PART 5 — 배포와 장애 대응

> **목표**: 파이프라인으로 배포하고, 장애를 기록해 같은 장애를 두 번 겪지 않는다.

## 5.1 CI/CD

- CI(자주 통합: 빌드+테스트) / CD(Delivery=배포 가능 상태까지, Deployment=운영까지). 파이프라인: Build→Static Analysis→Unit→Integration(Testcontainers)→Image Build→Push→Deploy Dev→E2E→Staging→Manual Approval→Prod→Smoke.
- **GitHub Actions**: Workflow/Job(`needs` 의존)/Step/Action. Gradle·Docker 레이어 캐싱으로 50% 단축, Secret은 Repository Secrets. main 브랜치만 배포(안정성).
- **배포 전략**: **Rolling**(1개씩 교체, 단순·자원 효율, 롤백 느림) / **Blue-Green**(즉시 롤백, 자원 2배) / **Canary**(점진 트래픽 5→50→100%, 위험한 변경). 빠른 롤백 필요→Blue-Green, 위험 변경→Canary.


## 5.2 장애 대응과 Postmortem

- 대응 5단계: 감지 → 분류 → **완화(우선!)** → 복구 → 분석. 핵심 원칙: **근본 원인 수정 전 영향 완화 우선**(예: 디버깅보다 롤백 먼저). 지표 MTTR/MTTF/MTBF. 알림은 Info/Warning/Critical, Alert Fatigue 주의.
- **Blameless Postmortem**: 사람이 아닌 시스템·프로세스를 분석. 템플릿: 요약·Timeline·Root Cause(단일 원인 X, 요인 결합)·잘된 점·잘못된 점·**Action Items(담당·기한)**. 모든 P1/P2 장애에 작성·공유.

---


---

## 🎓 졸업 점검

1. CAP 에서 P 가 사실상 필수인 이유는? 그래서 실제 선택은 무엇과 무엇 사이인가?
2. 2PC 가 블로킹이고 SPOF 인 이유는? Saga 가 그 대가로 포기하는 것은?
3. Cache-Aside 와 Write-Through 의 차이와 각자의 정합성 위험은?
4. 캐시 스탬피드(Thundering Herd)와 Cache Penetration 을 각각 어떻게 막는가?
5. Redis 가 단일 스레드인데 빠른 이유는? 그 전제가 깨지는 명령은?
6. 메시지 큐와 이벤트 스트리밍의 차이는? Kafka 의 파티션이 보장하는 순서의 범위는?
7. at-least-once 에서 멱등성이 필요한 이유는? Outbox 패턴이 푸는 문제는?
8. Observability 3 Pillars 가 각각 답하는 질문은?
9. 12-Factor 에서 설정을 환경변수로 두는 이유는?
10. Postmortem 을 blameless 로 쓰는 이유는?

---

## ✅ 진도 체크리스트

```
[ ] 1  분산 시스템의 이론
[ ] 2  캐싱과 Redis
[ ] 3  메시징과 Kafka
[ ] 4  관측과 12-Factor
[ ] 5  배포와 장애 대응
```

**실무 연결**: 분산 시스템의 고통은 한 대로는 재현되지 않는다.
Docker Compose 로 앱을 두 벌 띄우고 그 앞에 프록시를 두면
세션 불일치와 캐시 정합성 문제를 직접 겪을 수 있다.
Kafka 는 파티션을 2개로 두고 순서가 어떻게 깨지는지 확인할 것.

**다음 단계 후보**: Kubernetes(인프라 트랙), 시스템 디자인,
코딩 테스트 알고리즘, 클라우드 네이티브 패턴.
