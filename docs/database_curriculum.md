# 🎯 데이터베이스 — 모델링에서 운영까지

> **목적**: DB 를 "쿼리를 날리는 곳"이 아니라 **동작 원리를 아는 시스템**으로 본다.
> 모델링과 정규화에서 시작해 인덱스·실행 계획, 트랜잭션·락, SQL 고급, 확장·고가용성까지.
>
> **왜 스프링보다 먼저인가**: JPA 의 N+1 을 `fetch join` 으로 푸는 이유가 **실행 계획**이고,
> `@Transactional` 의 격리 수준이 **락**이다. DB 를 모르고 ORM 을 배우면
> "되는데 왜 되는지 모르는" 상태가 된다. 그래서 이 과목이 데이터 접근보다 앞이다.
>
> **선행**: 없다. 자바와 독립적으로 읽을 수 있다.
> **다음**: 데이터 접근 과목(JDBC → JPA).

---

## 🧭 전체 지도 (한눈에)

```
  [1] DB 기초와 모델링        ← 용어 · 정규화 · JOIN
   ↓
  [2] 인덱스와 실행 계획       ← 왜 느린가를 설명할 수 있게
   ↓
  [3] 트랜잭션과 동시성        ← ACID · 격리 수준 · 락
   ↓
  [4] 데이터 타입과 SQL 고급    ← 타입 · DDL · VIEW · PROCEDURE
   ↓
  [5] 확장과 고가용성          ← NoSQL · 복제 · 샤딩
```

순서의 이유: **[2] 를 [3] 보다 앞에** 둔다.
격리 수준이 왜 성능을 깎는지는 **락이 인덱스 위에 걸린다**는 사실로 설명되기 때문이다.
그리고 [5] 를 맨 뒤에 둔 것은 단일 서버의 한계를 먼저 겪어야
복제와 샤딩이 무엇을 포기하고 무엇을 얻는지 보이기 때문이다.

### 기술 진화의 척추

| 영역 | 로우레벨(고통) | 중간 | 하이레벨(해결) |
|---|---|---|---|
| 중복 데이터 | 한 테이블에 다 넣기(이상 현상) | 정규화 | 반정규화로 되돌리기(의도적) |
| 데이터 검색 | Full Scan O(n) | 정렬 + 이진 탐색 | B-tree 인덱스 O(logN) |
| 쿼리 튜닝 | 추측으로 고치기 | 슬로우 쿼리 로그 | EXPLAIN + Covering Index |
| 동시 수정 | 덮어쓰기 유실 | 락 수동 관리 | 격리 수준 + MVCC |
| 쓰기 신뢰성 | 중간에 끊기면 깨짐 | 수동 commit/rollback | ACID + WAL |
| 입력 신뢰 | 문자열 연결 쿼리 | 입력 검증 | PreparedStatement(바인딩) |
| DB 확장 | 단일 서버(Scale-Up 한계) | Replication(읽기 분산) | Cluster / Sharding(Scale-Out) |
| 일관성 모델 | ACID 강한 일관성 | — | BASE 최종 일관성(NoSQL) |

---

# 📚 PART 1 — DB 기초와 모델링

> **목표**: 용어와 모델링에서 시작해 정규화의 이유와 JOIN 의 본질까지. 이 과목의 바닥이다.

## 1.1 DB 용어와 모델링

- **엔티티(개념, 클래스)** vs **릴레이션(물리, 테이블)**. `@Entity`가 이 둘을 잇는 다리(데이터 접근 PART 3.3).
- **어트리뷰트**(열), **차수(Degree)**(열 수, 불변) vs **카디널리티**(행 수, 가변), **도메인**(값의 집합), **튜플**(행).
- **스키마 3계층**: 개념적(ERD) → 논리적(SQL DDL) → 물리적(인덱스·파티션). MySQL은 DB=스키마, PostgreSQL/Oracle은 1 DB → N 스키마.


## 1.2 정규화와 이상 현상 (★ 면접 단골)

- **정규화** = 종속 관계 분석 → 여러 릴레이션으로 분해(중복 제거·이상 현상 방지). 단계: 1NF → 2NF → 3NF → BCNF. 실무는 보통 **3NF/BCNF까지**.
  - **1NF**: 모든 컬럼이 **원자값**(콤마로 여러 값 X).
  - **2NF**: 1NF + **부분 함수 종속 제거**(복합 키의 일부에만 의존하는 속성 분리). 단일 키는 자동 2NF.
  - **3NF**: 2NF + **이행 함수 종속 제거**(A→B→C).
  - **BCNF**: 3NF + **모든 결정자가 후보 키**.
- **3가지 이상 현상**(근본 원인 = 서로 다른 의미가 한 테이블에): **삽입**(불필요 데이터 강제), **갱신**(여러 레코드 수정, 일부 누락 시 불일치), **삭제**(의도치 않은 데이터까지 삭제). → 정규화가 해결.
- **반정규화**: 성능 위해 의도적 중복 허용(읽기 多·통계 마트). **정규화 후 반정규화** 원칙. (임베디드 타입이 일종의 반정규화)


## 1.3 SQL JOIN (관계형 DB의 본질)

- **왜 JOIN인가**: 관계형 DB는 **정규화**로 중복 제거 → 정보가 여러 테이블에 분산 → 합치려면 JOIN.

| JOIN | 의미 |
|---|---|
| INNER | 양쪽 공통 행만(교집합) |
| LEFT | 왼쪽 전부 + 매칭(없으면 NULL) |
| RIGHT | 오른쪽 전부 + 매칭 |
| FULL OUTER | 양쪽 전부(합집합), MySQL은 미지원 → LEFT UNION RIGHT |

- 실무: **LEFT JOIN이 가장 빈번**, INNER는 집계, RIGHT는 거의 안 씀. "부서 없는 직원" = LEFT JOIN + WHERE NULL.
- ON 조건 ≠ WHERE 조건(OUTER JOIN에서 다름).


# 📚 PART 2 — 인덱스와 실행 계획

> **목표**: 왜 느린가를 추측이 아니라 실행 계획으로 설명한다. 옵티마이저가 무엇을 보는지 안다.

## 2.1 옵티마이저 (DB의 두뇌)

- **옵티마이저**: SQL의 최저 비용 실행 계획 생성. **RBO(규칙 기반)** → **CBO(비용 기반, 통계 활용, 현대 표준)**.
- **6단계**: Parser → Query Transformer(서브쿼리→JOIN) → Estimator(통계로 비용 계산) → Plan Generator → Row-Source Generator → SQL Engine.
- **통계 정보**가 핵심 입력 — 오래되면 잘못된 선택(좋은 인덱스 두고 Full Scan). 대량 변경 후 `ANALYZE TABLE`.
- **옵티마이저 힌트**(`/*+ INDEX(t idx) */` 등)·모드(FIRST_ROWS/ALL_ROWS). 남용 주의.


## 2.2 인덱스 (★ 정점)

- **logN의 위력**: N=100만일 때 O(N)=100만, O(logN)≈20 → **5만 배**. 큰 N일수록 인덱스 효과 폭발.
- **인덱스 = 정렬된 별도 자료구조 + 포인터**. Full Scan O(n) → **B-tree** O(logN). WHERE 검색·정렬/그룹핑 가속. PK는 자동 인덱스.
- **B-tree 동작**: 인덱스 테이블에서 이진 탐색으로 값 찾고 포인터로 원본 행 접근.
- **멀티컬럼 인덱스 (a, b) — 왼쪽 컬럼 우선** ⭐: a로 먼저 정렬 후 a 내에서 b 정렬. `WHERE a=7 AND b=95`✅, `WHERE a>5`✅, `WHERE b=95`❌(a로 분산 → Full Scan과 다름없음). 카디널리티 낮은 컬럼(상태값)은 인덱스 효과 적음.


## 2.3 EXPLAIN · 인덱스 힌트 · Covering Index

- **EXPLAIN**: 실행 계획 확인. `type`(접근 방식, 좋은 순 `const > eq_ref > ref > range > index > ALL`, **ALL=Full Scan 위험**), `key`(실제 사용 인덱스), `Extra`(`Using index`=Covering, `Using filesort`/`Using temporary`=성능 ↓).
- **인덱스 힌트**: `USE INDEX`(유도) / `FORCE INDEX`(강제) / `IGNORE INDEX`(무시). 우선순위: **ANALYZE → EXPLAIN → 인덱스 추가 → 힌트(마지막)**.
- **Covering Index**: 쿼리에 필요한 모든 컬럼이 인덱스에 포함 → **테이블 접근 불필요**(`Extra: Using index`). `SELECT *`는 이를 깸.
- **인덱스의 비용**: WRITE마다 모든 인덱스 갱신(인덱스 N개=N번 갱신), 추가 저장 공간, 정렬 비용 → **필요한 만큼만**. 중복 인덱스 회피((a,b) 있으면 (a) 불필요). **Full Scan이 나은 경우**: 데이터 적음, 조회 비율 큼(~30%+), 카디널리티 낮음. 대용량 인덱스 추가는 새벽 + 온라인 DDL(`ALGORITHM=INPLACE`).

---


# 📚 PART 3 — 트랜잭션과 동시성

> **목표**: ACID 의 네 글자를 각각 설명하고, 격리 수준이 무엇을 포기해 무엇을 얻는지 락으로 설명한다.

## 3.1 트랜잭션과 ACID

- **트랜잭션**: 한 단위로 취급되는 작업 묶음(계좌 이체 = 출금 + 입금). 끝은 **Commit**(영구 적용) 또는 **Rollback**(취소).
- **A**tomicity(원자성): 모두 성공 or 모두 실패. (자바 Atomic은 변수 하나, DB Atomicity는 **여러 작업 묶음**)
- **C**onsistency(일관성): 완료 후 제약조건(NOT NULL/UNIQUE/FK/비즈니스 규칙)이 항상 지켜짐.
- **I**solation(격리성): 각 트랜잭션은 독립 실행. 격리 수준: READ UNCOMMITTED → READ COMMITTED → REPEATABLE READ → SERIALIZABLE(높을수록 안전·느림). Dirty Read 등.
- **D**urability(지속성): Commit된 데이터는 영구 보존(WAL, fsync). 시스템 다운에도 생존.
- **Commit 이전 격리**: 세션1이 변경(commit X)해도 세션2는 변경 전 데이터를 봄. commit해야 세션2도 확인. (비유: 각자 노트북 → 클라우드 저장)


## 3.2 트랜잭션 격리 수준

> **트레이드오프**: 격리 ↑ → 정합성 ↑·동시성 ↓. 적절한 수준 = 정합성과 성능의 균형점.

- **3가지 충돌**:
  - **Dirty Read**: 커밋 안 된 데이터를 읽음(읽은 뒤 상대가 롤백하면 환상의 값).
  - **Non-repeatable Read**: 같은 트랜잭션에서 같은 행을 두 번 읽었는데 값이 다름(상대가 **수정/삭제** 후 커밋).
  - **Phantom Read**: 같은 조건 재조회 시 **행 수가 다름**(상대가 **삽입/삭제**).
- **4가지 격리 수준 매트릭스** ⭐ (✅=방어):

| 수준 | Dirty | Non-repeatable | Phantom | 기본 채택 |
|---|:--:|:--:|:--:|---|
| READ UNCOMMITTED | ❌ | ❌ | ❌ | (표준 인정 X) |
| READ COMMITTED | ✅ | ❌ | ❌ | Oracle, PostgreSQL |
| **REPEATABLE READ** | ✅ | ✅ | ❌ | **MySQL InnoDB** (Gap Lock으로 일부 Phantom 방지) |
| SERIALIZABLE | ✅ | ✅ | ✅ | (동시성 최저) |

- Spring 지정: `@Transactional(isolation = Isolation.REPEATABLE_READ)`.

---


## 3.3 락 — 공유 락과 배타 락

- **공유 락(S, 읽기)**: S 끼리는 호환, X 와 충돌.
- **배타 락(X, 쓰기)**: 모두와 충돌.
- **격리 수준과 직결**된다. 격리 수준이 올라갈수록 락을 더 오래 더 넓게 잡는다(PART 3.2).
- JPA 에서는 `@Lock(PESSIMISTIC_READ / PESSIMISTIC_WRITE)` 로 명시한다(데이터 접근 PART 5 와 연결).
- **비관적 락 vs 낙관적 락**
  - **비관적**: 미리 락을 잡는다. 충돌이 잦을 때. DB 락에 의존.
  - **낙관적**: 버전 컬럼으로 충돌을 **나중에 감지**한다. 충돌이 드물 때. `@Version`.

**자기 점검**
- 공유 락 둘은 호환인데 공유 락과 배타 락은 충돌하는 이유는?
- 비관적 락과 낙관적 락을 고르는 기준은 무엇인가?

# 📚 PART 4 — 데이터 타입과 SQL 고급

> **목표**: 타입 선택이 성능과 정합성에 미치는 영향, DDL 의 되돌릴 수 없음, 그리고 SQL 의 고급 도구들.

## 4.1 데이터 타입과 인코딩

- **CHAR(고정, 공백 채움, 빠름)** vs **VARCHAR(가변, 공간 효율)**: 길이 일정한 코드(국가·통화·성별)는 CHAR, 이름·이메일은 VARCHAR.
- **BLOB(이진, 이미지/파일)** vs **TEXT(문자, 긴 글)**: **이미지는 DB가 아닌 S3 등에 저장하고 URL만** 보관.
- **Collation**: 문자열 비교/정렬 규칙. `utf8_general_ci`(대소문자 무시, 기본) vs `utf8_bin`(구분). 대소문자 구분은 `COLLATE utf8_bin` 또는 `BINARY`. 시스템 코드·ID는 구분, 일반 검색은 무시.


## 4.2 DELETE / TRUNCATE / DROP + ROLLBACK 메커니즘

| | DELETE | TRUNCATE | DROP |
|---|---|---|---|
| 분류 | DML | DDL | DDL |
| 대상 | 특정 행(WHERE) | 모든 행 | 테이블 자체 |
| 속도 | 느림 | 빠름 | 즉시 |
| **ROLLBACK** | **가능** ✅ | 불가 ❌ | 불가 ❌ |
| AUTO_INCREMENT | 유지 | 초기화 | (사라짐) |
| 트리거 | ✅ | ❌ | ❌ |

- **ROLLBACK이 가능한 이유 = UNDO LOG**(변경 전 상태 저장). DELETE는 행마다 UNDO LOG 작성 → 느리지만 롤백 가능. **TRUNCATE/DROP은 DDL이라 자동 커밋** → UNDO LOG 없음 → 롤백 불가.
- **InnoDB 두 로그**: **UNDO LOG**(롤백·MVCC, Before) vs **REDO LOG**(Crash Recovery·Durability, After). MVCC가 데이터베이스 PART 3.2 격리 수준의 기반.


## 4.3 SQL 고급 기능 (Trigger · JOIN · VIEW · PROCEDURE)

- **Trigger**: INSERT/UPDATE/DELETE 시 자동 실행(BEFORE/AFTER, OLD/NEW). 감사 로그·자동 계산. **단점**: 숨겨진 동작·디버깅/테스트 어려움 → **간단한 감사 외엔 지양, Spring AOP(스프링 PART 4~5)가 더 나은 대안**.
- **JOIN**: INNER(교집합) / LEFT·RIGHT OUTER(한쪽 전부 + 매칭, 없으면 NULL) / FULL OUTER(합집합, MySQL은 UNION 우회). "주문 안 한 사용자" = `LEFT JOIN ... WHERE B IS NULL`. (데이터베이스 PART 1.3, JPQL JOIN과 연결)
- **VIEW**: 데이터 미저장 가상 테이블(쿼리 결과 정의). 복잡 쿼리 단순화·보안(민감 컬럼 제외)·권한 분리. 단 매번 원본 쿼리 실행·인덱스 X(Materialized View 제외).
- **PROCEDURE**: 매개변수 받는 저장 작업(`CALL`). **현대는 사용 감소** — 테스트·버전 관리·포팅·CI/CD 어려움. **비즈니스 로직은 애플리케이션(Spring 서비스)에**, DB는 데이터 저장에 집중. 단 대량 ETL·관리 작업엔 적합.

| | Trigger | VIEW | PROCEDURE |
|---|---|---|---|
| 호출 | 자동(이벤트) | SELECT | CALL(수동) |
| 매개변수 | OLD/NEW | X | ✅ |
| 용도 | 자동 부수 작업 | 가상 테이블 | 명시적 작업 단위 |

---


## 4.4 SQL Injection

- **원리**: 문자열 결합 쿼리에 `' OR '1'='1` 같은 SQL 주입 → 쿼리 조작(데이터 탈취·삭제·권한 우회).
- **방어 — Prepared Statement(`?` 바인딩)** ⭐: 쿼리 미리 컴파일 → 입력은 **데이터로만** 처리(SQL 키워드 X). **JPA는 파라미터 바인딩으로 자동 적용**. 다층 방어: Prepared Statement + 입력 검증 + 에러 숨김 + 최소 권한 + WAF. (단 동적 테이블/컬럼명은 여전히 위험)


# 📚 PART 5 — 확장과 고가용성

> **목표**: 단일 서버의 한계를 넘는 방법들. 각자 무엇을 포기하고 무엇을 얻는지로 고른다.

## 5.1 RDBMS vs NoSQL

- **RDBMS**: 테이블 + 관계, 5제약(PK/FK/UNIQUE/NOT NULL/CHECK), SQL, ACID. **Scale-Up(수직)** 선호(ACID·JOIN 유지가 분산에서 어려움).
- **로우레벨의 한계 → NoSQL**: 스키마 변경 비용, JOIN 복잡, 단일 서버 한계, ACID 성능 비용. **NoSQL = Not Only SQL**: 유연한 스키마, **Scale-Out(수평)**, JOIN 회피, **BASE 모델**.

| 유형 | 대표 | 사례 |
|---|---|---|
| Key-Value | **Redis**, DynamoDB | 캐시·세션 |
| Document | **MongoDB** | 가변 구조 |
| Column-Family | Cassandra, HBase | 대량 시계열 |
| Graph | Neo4j | 관계 분석 |

- **Replication**: Master(쓰기) + Slave(읽기) → 읽기 분산. **Redis**: 메모리 기반 Key-Value, 캐싱·세션·분산 락·랭킹. 마스터 데이터 캐싱에 적합.


## 5.2 DB Clustering (고가용성)

- **로우레벨의 위험**: 단일 서버 다운 = 서비스 전체 중단. **Clustering** = 여러 서버가 하나의 논리적 DB(Scale-Out의 한 형태).
- **Active-Active**(모두 활성, 즉시 Failover·부하 분산, 복잡·고비용) vs **Active-Standby**(Active만 운영, Failover 시간 동안 중단, 저비용).
- **Quorum(과반수 룰)** ⭐: 과반(>50%) 노드 생존 시에만 정상 운영 → **Split Brain 방지**. **최소 3노드 권장**(1개 다운해도 2개로 과반). 2노드는 1노드와 다를 바 없음. **홀수 노드** 권장(3/5/7). MongoDB·ZooKeeper·etcd 모두 동일 원리.


## 5.3 Replication vs Cluster + PXC + 백업

- **Replication**: Master(쓰기) → Slave(읽기) 단방향 복제. 읽기 부하 분산·백업 격리. 비동기 기본 → **복제 지연**(갓 INSERT한 걸 Slave에서 못 볼 수 있음 → 일관성 중요 조회는 Master). Slave가 Failover 시 Master 되므로 성능 차 크면 위험.

| | Replication | Clustering |
|---|---|---|
| Write | Master만 | 모든 노드 |
| 일관성 | 비동기(지연) | 동기/즉시 |
| Failover | 수동/반자동 | 자동 |
| 목적 | 읽기 성능·백업 | 고가용성·즉시 Failover |

- **PXC(Percona XtraDB Cluster)**: MySQL 호환 **Active-Active**(Galera 기반 동기 복제). 모든 노드 R/W, 자동 활용.
- **백업**: **XtraBackup**(Hot Backup, 무중단, 대용량 운영) vs **mysqldump**(논리 SQL 추출, 작은 DB·마이그레이션).


## 5.4 Sharding vs Partitioning

- **Sharding**: 여러 DB 서버로 데이터 분할(샤드 키: Range/Hash/Geographic). **어려움**: 크로스-샤드 JOIN·트랜잭션, 재샤딩 비용, 핫스팟. NoSQL과 궁합 좋음.
- **Partitioning**: **단일 DB 내 한 테이블**을 물리 조각으로(DBMS 자동 라우팅). Range/List/Hash/Key. **Partition Pruning**(조건 일치 파티션만 스캔), 오래된 파티션 `DROP PARTITION` 즉시 삭제.

| | Partitioning | Sharding |
|---|---|---|
| 단위 | 단일 DB 내 테이블 | 여러 DB 서버 |
| 트랜잭션 | 정상 | 분산 어려움 |
| 복잡도 | 낮음 | 높음 |

- **원칙**: **Partitioning 우선, Sharding은 마지막 카드**(보통 Scale-Up + Replica로 충분).


---

## 🎓 졸업 점검

1. 정규화가 푸는 세 가지 이상 현상은? 반정규화는 왜 되돌리는가?
2. B-tree 인덱스가 O(logN) 인 이유와, 인덱스가 **느려지는** 경우는?
3. Covering Index 가 왜 빠른가? `EXPLAIN` 에서 무엇을 보고 판단하는가?
4. ACID 네 가지를 한 문장씩?
5. 격리 수준 네 단계가 각각 허용하는 이상 현상은? MVCC 가 바꾸는 것은?
6. 공유 락과 배타 락의 호환 규칙은? 낙관적 락을 고르는 기준은?
7. Replication 과 Cluster 와 Sharding 이 각각 푸는 문제는?
8. CAP 에서 단일 RDBMS 가 CA 인 이유는?

---

## ✅ 진도 체크리스트

```
[ ] 1  DB 기초와 모델링
[ ] 2  인덱스와 실행 계획
[ ] 3  트랜잭션과 동시성
[ ] 4  데이터 타입과 SQL 고급
[ ] 5  확장과 고가용성
```

**실무 연결**: 인덱스와 실행 계획은 읽기만 하면 체화되지 않는다.
같은 테이블에 인덱스를 걸기 전후로 `EXPLAIN` 을 떠보고,
복합 인덱스의 컬럼 순서를 바꿔가며 어느 쪽이 쓰이는지 직접 확인할 것.
