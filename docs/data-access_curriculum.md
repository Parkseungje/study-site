# 🎯 데이터 접근 — JDBC 에서 JPA 까지

> **목적**: 자바가 DB 와 대화하는 방법의 **진화**를 따라간다.
> 소켓으로 DB 프로토콜을 직접 다루던 시절에서 JDBC 표준, JdbcTemplate,
> 트랜잭션 추상화, 그리고 JPA 의 영속성 컨텍스트까지.
>
> **선행**: 데이터베이스 과목(특히 트랜잭션·인덱스)과 스프링 과목(특히 AOP).
> `@Transactional` 은 AOP 프록시이고, N+1 의 해결은 실행 계획의 문제다.
> 두 과목을 안 보고 오면 "되는데 왜 되는지 모르는" 상태가 된다.
>
> **원본에서 고친 것**: PART 11 과 PART 14 가 ORM 패러다임·JPA 입문·엔티티 매핑을
> **두 번 설명하고 있었다.** 합쳐서 한 번만 다룬다.

---

## 🧭 전체 지도 (한눈에)

```
  [1] JDBC 에서 JdbcTemplate 까지   ← 표준화 · 커넥션 풀 · 반복 제거
   ↓
  [2] 트랜잭션 추상화와 전파         ← 수동 commit → @Transactional → 전파
   ↓
  [3] JPA 기초                      ← 왜 ORM 인가 · 엔티티 매핑
   ↓
  [4] 영속성 컨텍스트                ← JPA 의 심장. 변경 감지와 1차 캐시
   ↓
  [5] 연관관계와 N+1                 ← 객체 그래프의 대가
```

순서의 이유: **[4] 를 [5] 보다 앞에** 둔다.
N+1 이 왜 LAZY 로도 안 풀리는지는 **영속성 컨텍스트가 무엇을 캐싱하는지**를
알아야 설명된다. 그리고 [2] 를 [3] 보다 앞에 둔 것은
JPA 의 모든 쓰기가 트랜잭션 안에서만 의미가 있기 때문이다.

### 기술 진화의 척추

| 영역 | 로우레벨(고통) | 중간 | 하이레벨(해결) |
|---|---|---|---|
| DB 통신 | 소켓으로 DB 프로토콜 직접 | JDBC 표준 | JdbcTemplate → JPA |
| 커넥션 | 매 요청 새 연결 | — | Connection Pool / DataSource |
| 반복 코드 | try-catch-finally 삼중첩 | 템플릿 메서드 | JdbcTemplate(템플릿 콜백) |
| 트랜잭션 | Connection 수동 commit/rollback | PlatformTransactionManager | `@Transactional`(AOP) |
| 트랜잭션 중첩 | Connection 을 손으로 묶기 | 논리/물리 트랜잭션 분리 | 전파 옵션 |
| 영속성 관리 | DAO 가 SQL·매핑 수동 | SQL Mapper(MyBatis) | JPA 영속성 컨텍스트(변경 감지) |
| 연관 조회 | N+1 쿼리 폭발 | fetch join | `@BatchSize` / EntityGraph |

---

# 📚 PART 1 — JDBC 에서 JdbcTemplate 까지

> **목표**: 소켓 직접 통신에서 표준 API 로, 그리고 반복 코드를 템플릿 콜백으로 지우는 과정.

## 1.1 JDBC 표준화 (로우레벨 소켓 → 표준 API)

- **JDBC 없던 시절의 고통**: 각 DB마다 고유 API. DB를 바꾸면 모든 코드 재작성. 심하면 **소켓으로 DB 바이너리 프로토콜을 직접** 통신.
  ```java
  Socket socket = new Socket("localhost", 3306);  // MySQL 프로토콜 직접...
  ```
- **JDBC = 자바의 DB 접근 표준 API**: 연결·SQL 실행·결과 처리 방식 통일. DB 교체 시 **URL과 드라이버만 변경**. (전략 패턴/인터페이스 사상)
- **JDBC가 해결 못 하는 것**: SQL **문법 차이**(LIMIT vs ROWNUM, AUTO_INCREMENT vs SEQUENCE)는 그대로. → 상위 프레임워크(JdbcTemplate, JPA, MyBatis)가 등장하는 동기.


## 1.2 Connection Pool (매 요청 연결의 비효율 → 풀)

- **로우레벨의 비효율**: DB 연결 1회 = TCP 3-way handshake + 인증 + 세션 생성(수~수백 ms). 매 요청마다 하면 연결 설정이 쿼리보다 더 길 수 있음.
- **Connection Pool**("Connection의 수영장"): 시작 시 N개 미리 생성 → 요청 시 빌림 → 사용 후 반환 → **재사용**. 대표: **HikariCP**(Spring Boot 기본), DBCP2, Tomcat JDBC Pool.
- **DB 세션 매핑**: 풀의 Connection N개 = **DB 세션 N개**. 한 Connection에서 동시 두 트랜잭션 불가.
- **DB Lock**: 트랜잭션 진행 중 다른 세션의 수정을 막음. 공유 락(S, 읽기) / 배타 락(X, 쓰기). (자바 synchronized와 닮은꼴, DB에서도 데드락 발생)


## 1.3 DataSource 추상화

- **로우레벨의 불편함**: 커넥션 획득 방법(`DriverManager` vs HikariCP vs DBCP2)마다 **사용법이 달라** 변경 시 애플리케이션 코드가 다 바뀜.
- **해결**: `javax.sql.DataSource` 표준 인터페이스(핵심 메서드 `getConnection()` 하나). 구현체: `HikariDataSource`, `BasicDataSource`, `DriverManagerDataSource`.
  ```java
  @Autowired private DataSource dataSource;  // 인터페이스 의존
  Connection c = dataSource.getConnection(); // 어떤 구현체든 OK
  ```
- HikariCP → DBCP2 변경 시 **설정만**, 코드 그대로. (= **DIP**의 구현, 스프링 PART 2 ConnectionMaker와 같은 사상)
- **DriverManagerDataSource**: DriverManager를 DataSource로 감싼 어댑터. 테스트·학습용(풀 없어서 프로덕션 금지).


## 1.4 JdbcTemplate (반복 제거)

- **로우레벨의 고통**: 매 쿼리마다 try/catch/finally + Connection·Statement·ResultSet close 반복. 자원 해제 코드가 본 로직보다 길고, close 누락 시 누수.
- **JdbcTemplate** = 스프링 PART 2의 **템플릿 메소드 + 전략 패턴**의 실제 구현. Connection 획득/반환·PreparedStatement·ResultSet·예외 처리를 **숨김**. 개발자는 SQL·파라미터·결과 매핑만.

```java
@Autowired private JdbcTemplate jdbcTemplate;
List<Customer> list = jdbcTemplate.query(sql, new Object[]{age},
    new BeanPropertyRowMapper<>(Customer.class));
```

- **핵심 메서드**: `update`(INSERT/UPDATE/DELETE, 영향 행 수), `queryForObject`(단일 행), `query`(여러 행), `execute`(DDL).
  - `queryForObject` 0건 → `EmptyResultDataAccessException`, 2건+ → `IncorrectResultSizeDataAccessException`.
- **RowMapper**: ResultSet 한 행 → 객체. **함수형 인터페이스라 람다로**(자바 PART 5). `BeanPropertyRowMapper`는 컬럼명↔필드명(snake↔camel) 자동 매핑.
- **구조적 의미**: 관심사 분리 + 템플릿 메소드 + 전략 패턴 + OCP + DI + 람다의 집약체. → "좋은 라이브러리는 좋은 OOP 원칙의 집약체".

---


# 📚 PART 2 — 트랜잭션 추상화와 전파

> **목표**: 수동 commit 에서 @Transactional 까지. 그리고 프록시이기 때문에 생기는 함정들.

## 2.1 트랜잭션 추상화의 진화 (수동 → PlatformTransactionManager → @Transactional)

**① 수동 트랜잭션의 한계 (로우레벨)**
- 원자성 보장하려면 출금·입금이 **같은 Connection**이어야 함 → Connection을 비즈니스 로직에 **파라미터로 전달** → 추상화 깨짐.
- **3가지 함정**: 트랜잭션 누수(setAutoCommit/commit/rollback 반복), 예외 누수(SQLException 전파), JDBC 반복.

```java
conn.setAutoCommit(false);
try { ...; conn.commit(); }
catch (Exception e) { conn.rollback(); throw e; }
finally { conn.close(); }
```

**② PlatformTransactionManager (인터페이스 추상화)** — 데이터 접근 PART 1 DataSource와 같은 사상
```java
public interface PlatformTransactionManager {
    TransactionStatus getTransaction(TransactionDefinition def);
    void commit(TransactionStatus status);
    void rollback(TransactionStatus status);
}
```
- 구현체: **DataSourceTransactionManager**(JDBC/JdbcTemplate/MyBatis), **JpaTransactionManager**(JPA), HibernateTransactionManager. Spring Boot가 의존성 따라 자동 구성.
- Connection 매개변수가 사라짐. 단 try/catch/commit/rollback 보일러플레이트는 남음.

**③ @Transactional (선언적 트랜잭션, AOP)**
- **프록시 패턴**: 원본 객체의 대리자(Proxy)가 호출 전후에 트랜잭션 시작/커밋·롤백을 끼워 넣음. `@Transactional` 빈은 실제로 **프록시 객체**가 등록됨.
```java
@Transactional
public void transfer(Long fromId, Long toId, int amount) {
    accountDao.withdraw(fromId, amount);
    accountDao.deposit(toId, amount);
}   // 시작·커밋·롤백·Connection 관리 자동
```
- **5가지 함정**:
  1. **private 메서드 ❌** — 프록시가 못 가로챔
  2. **Self-invocation** — `this.inner()`는 프록시를 거치지 않아 트랜잭션 안 걸림
  3. **기본 롤백은 RuntimeException만** — 체크 예외는 `@Transactional(rollbackFor = Exception.class)`
  4. **전파 옵션**: `REQUIRED`(기본, 있으면 참여), `REQUIRES_NEW`(항상 새), `NESTED`(중첩/Savepoint)
  5. **`readOnly = true`** — 읽기 전용, 영속성 컨텍스트 최적화 → 성능 ↑
- **집약**: 스프링 PART 2 OOP 원칙(템플릿 메소드/전략/OCP/DI) + 데이터 접근 PART 1 PlatformTransactionManager + 프록시(AOP) → **어노테이션 한 줄**. → 이 "프록시"의 정체가 **스프링 PART 4~5**다.

---


## 2.2 선언적 vs 프로그래밍 + 프록시 도입 전후

- **선언적**(`@Transactional`): 어노테이션 한 줄, 간편하나 함정 많음. **프로그래밍**(`TransactionTemplate`): 세밀 제어, 단 비즈니스 로직과 기술 코드 강결합. → **선언적이 거의 표준**.
- **프록시 도입 전**: 서비스 안에 `getTransaction/commit/rollback` try-catch가 비즈니스 로직과 뒤섞임(데이터 접근 PART 2.1의 수동 코드). **프록시 도입 후**: 트랜잭션 프록시가 그 책임을 모두 가져가고 서비스엔 **순수 비즈니스 로직만** 남음. 이게 가능한 건 스프링 PART 4~5의 빈 후처리기 + AnnotationAwareAspectJAutoProxyCreator 덕분.


## 2.3 Internal call 함정 (★★★ 면접 단골)

- **시나리오**: `@Transactional` 없는 `external()`이 같은 클래스의 `@Transactional internal()`을 `this.internal()`로 호출 → `this`는 프록시가 아닌 **target** → **@Transactional 무시**.
- **본질**: "프록시는 외부 호출은 가로채지만 **내부 호출(this)은 가로채지 못한다**."
- **해결**: `@Transactional` 메서드를 **별도 빈으로 분리**(다른 클래스 호출은 프록시를 거침). SRP 관점에서도 더 나음. (AspectJ 컴파일 방식이면 이 문제 없음.)


## 2.4 @PostConstruct + @Transactional 함정 (internal call의 짝)

- **@PostConstruct**: DI 완료 직후 실행(캐시 초기 로딩 등). 생성자에선 의존성이 미완이라 못 함.
- **함정**: `@PostConstruct` + `@Transactional` → **트랜잭션 적용 안 됨**. @PostConstruct는 빈 후처리기(자동 프록시 생성)가 동작하기 **이전**에 실행 → 그 시점엔 **프록시가 아직 없음**.
- **해결**: `@EventListener(ApplicationReadyEvent.class)` + `@Transactional` → 컨테이너 완성 후(모든 빈 프록시 교체 완료) 실행되어 정상 동작. (대안: `ApplicationRunner`, 별도 트랜잭션 빈 분리.)

| 함정 | internal call (13.3) | @PostConstruct (13.4) |
|---|---|---|
| 본질 | 프록시를 거치지 않는 호출 | 프록시가 아직 안 만들어짐 |
| 시점 | 런타임 this 호출 | 빈 초기화 시점 |
| 해결 | 클래스 분리 | ApplicationReadyEvent |

→ **두 함정은 "프록시 없음"이라는 한 본질의 두 얼굴**. 함께 외운다.


## 2.5 트랜잭션 전파 (Propagation)

- **전파** = "이미 진행 중인 트랜잭션이 있을 때 새 요청을 어떻게?"
- **REQUIRED(기본)**: 있으면 참여, 없으면 새로 시작. 외부+내부가 **하나의 물리 트랜잭션**으로 묶임. 내부의 commit/rollback은 **논리적**, 실제 물리 commit/rollback은 **외부에서만**.
- **내부 롤백의 함정**: 내부가 rollback하면 트랜잭션 동기화 매니저에 `rollbackOnly=true` 표시 → 외부가 commit 시도하면 rollbackOnly 발견 → 롤백 실행 + **`UnexpectedRollbackException`**. ("논리 하나라도 롤백되면 물리는 롤백.")
- **REQUIRES_NEW**: 항상 새 물리 트랜잭션, 외부와 완전 분리(내부 롤백이 외부에 영향 X). **⚠️ 주의**: 동시에 2개 커넥션 사용 → 커넥션 풀 고갈 위험.
- 전파 7옵션: REQUIRED / REQUIRES_NEW / SUPPORT / NOT_SUPPORT / MANDATORY / NEVER / NESTED(Savepoint). 실무는 **REQUIRED·REQUIRES_NEW** 중심.


# 📚 PART 3 — JPA 기초

> **목표**: 왜 ORM 인가에 답하고 엔티티 매핑을 손에 익힌다. 원본의 PART 11·14 중복을 합친 단원.

## 3.1 SQL Mapper 의 한계 → ORM (객체-관계 미스매치)

- **로우레벨의 불편함**: 객체(OOP)와 관계형 DB는 다른 패러다임이다. 이 차이를 메우는 코드를 **매번 손으로 쓰는 것**이 고통.
- **iBatis → MyBatis**: SQL 을 XML/어노테이션으로 분리 + 결과 매핑 자동화. 위치는 JdbcTemplate 과 동일한 **SQL Mapper**.
- **SQL Mapper 의 한계**: 자원 관리·결과 매핑은 자동이지만 **SQL 은 여전히 직접 작성**, 객체 그래프 탐색은 수동.

**패러다임 불일치의 다섯 축**

| 측면 | 객체 | 관계형 DB |
|---|---|---|
| 모델링 | 상태+행동 | 행과 열 |
| 상속 | 있음 | 없음(SINGLE_TABLE / JOINED / TABLE_PER_CLASS 로 표현) |
| 연관 | 참조(`order.member`) | 외래 키 |
| 식별 | `==` | PK |
| 타입 | 자바 타입 | SQL 타입 |

- **ORM 의 시각**: "객체를 다루세요, SQL 은 제가 만들겠습니다." 위 다섯 축의 불일치를 ORM 이 자동 번역한다.

| | SQL Mapper(MyBatis / JdbcTemplate) | ORM(JPA / Hibernate) |
|---|---|---|
| 매핑 | SQL ↔ 객체 | 객체 ↔ 테이블 |
| SQL | 개발자 | JPA 자동 생성 |
| 객체 그래프 | 수동 | 자동(Lazy Loading) |
| 복잡 통계 | 자유 | 어려움(JPQL / 네이티브 필요) |
| 학습곡선 | 낮음 | 높음 |

- **ORM 이 SQL 을 완전 대체하진 않는다.** 복잡 쿼리는 여전히 SQL 이다. 단점: 학습곡선, N+1, 튜닝 어려움.

**자기 점검**
- 패러다임 불일치 다섯 축 중 "상속" 을 RDB 가 어떻게 표현하는가?
- SQL Mapper 가 자동화한 것과 끝까지 수동으로 남긴 것은 각각 무엇인가?

## 3.2 JPA = 표준 명세, Hibernate = 구현체

- **JPA(Java Persistence API)** 는 **인터페이스 명세**(`EntityManager` 등)일 뿐 직접 동작하지 않는다. 구현체는 **Hibernate**(~95%), EclipseLink 등. `spring-boot-starter-data-jpa` 가 Hibernate 를 자동 설정한다.
- **계층**: `App → JPA(jakarta.persistence) → Hibernate → JDBC → DB`.
  JPA 도 내부적으로 **JDBC·DataSource·HikariCP 를 그대로 사용**한다. 즉 PART 1 에서 배운 것이 사라지는 것이 아니라 아래에 깔린다.
- **어노테이션 매핑**으로 선언하면 **SQL 을 JPA 가 대신 작성**한다.
- **생태계**
  - **Spring Data JPA**: `Repository` 인터페이스만 만들면 `findByName` 같은 **메서드 이름으로 쿼리 자동 생성**. JPA 위의 추상화.
  - **Querydsl**: 타입 안전 동적 쿼리. 컴파일 시점에 오류를 잡는다.
  - 실무 표준 조합: **Spring Data JPA + Querydsl**.

**자기 점검**
- JPA 가 JDBC 를 대체하는가? (정확히)
- Spring Data JPA 와 JPA 와 Hibernate 의 계층 관계를 한 줄로?

## 3.3 엔티티 매핑

- **@Entity 조건**: ① **기본 생성자 필수**(리플렉션으로 생성) ② `@Id` 식별자 ③ `final` 클래스/필드 금지(프록시가 CGLIB 상속 — 스프링 PART 4.6) ④ enum / interface / inner 클래스 불가.
- **@Id**: PK 매핑. 반드시 1개 또는 복합 키.
- **@GeneratedValue**: PK 생성 전략

| 전략 | 동작 | 적합 DB |
|---|---|---|
| IDENTITY | auto_increment | MySQL, PostgreSQL |
| SEQUENCE | 시퀀스 객체 | Oracle, PostgreSQL |
| TABLE | 키 생성 테이블 | 모든 DB(느림) |
| AUTO | 자동 선택 | 기본값 |

- **IDENTITY 는 INSERT 후에야 ID 를 안다** → 배치 INSERT 불가. SEQUENCE 는 미리 받아둬 빠르다. (영속성 컨텍스트의 쓰기 지연과 직결 — PART 4.2)
- **@Table / @Column**: 클래스명·필드명 자동 매핑. `name / length / nullable / unique / columnDefinition`. Spring Boot 는 camelCase ↔ snake_case **자동 변환**(SpringPhysicalNamingStrategy)이라 `@Column(name="item_name")` 을 생략할 수 있다.
- **임베디드 타입(`@Embeddable` / `@Embedded`)**: 여러 필드를 한 값 객체로 묶는다(주소·금액·연락처). **불변 권장** — 가변이면 공유 시 부작용. 같은 타입을 여러 번 쓰면 `@AttributeOverrides`. (일종의 반정규화 — 데이터베이스 PART 1.2 와 연결)
- **`ddl-auto`**: `create / create-drop / update` 는 **데이터 손실 위험이라 운영 금지**. `validate`, `none` 이 안전. 운영은 **none + Flyway/Liquibase**.

**자기 점검**
- `@Entity` 에 기본 생성자가 필수인 이유는? `final` 이 금지된 이유는?
- IDENTITY 전략이 배치 INSERT 를 막는 이유는?

## 3.4 EntityManagerFactory(싱글톤) vs EntityManager(트랜잭션)

- **EMF**: 생성 비용 큼 → **앱 전역 1개(싱글톤)**, Spring Boot 자동 등록.
- **EM**: 영속성 컨텍스트 관리, **트랜잭션 단위**로 생성·소멸. `@Transactional`이 자동 생성·종료. **스레드 안전 X**(트랜잭션마다 별도 인스턴스 → 동시성 회피). 핵심 메서드: `persist/find/getReference/remove/merge/detach`.


# 📚 PART 4 — 영속성 컨텍스트

> **목표**: JPA 의 심장. 왜 save 를 안 불러도 UPDATE 가 나가는지, 1차 캐시가 무엇을 바꾸는지.

## 4.1 영속성 컨텍스트와 엔티티 생명주기

- **영속성 컨텍스트**: EM 내부의 메모리 공간(엔티티 보관·관리). "JPA의 모든 신기한 동작은 여기서 일어난다."
- **4상태**: **비영속(Transient)**(new, 컨텍스트 X) → `persist/find` → **영속(Managed)** → `detach/clear/close` → **준영속(Detached)**; `remove` → **삭제(Removed)**. `merge`로 준영속 → 영속.
- `detach`(컨텍스트만 분리, DB 그대로) ≠ `remove`(커밋 시 DB 삭제).


## 4.2 영속성 컨텍스트의 4대 장점 (★ 정점)

1. **1차 캐시**: 같은 트랜잭션 내 `find` 재조회 시 SQL 없이 캐시 반환. 트랜잭션 단위.
2. **동일성 보장**: 같은 ID 조회 시 `==` true(1차 캐시에서 같은 인스턴스). (다른 트랜잭션이면 false → equals/hashCode는 ID 기반으로)
3. **쓰기 지연(Write-Behind)**: `persist` 시 즉시 INSERT 안 하고 SQL 저장소에 모음 → **커밋 시 한꺼번에** 전송(배치 최적화, `hibernate.jdbc.batch_size`). 단 **IDENTITY 전략은 쓰기 지연 불가**(INSERT 후에야 ID).
4. **변경 감지(Dirty Checking)** ⭐⭐⭐: 영속 엔티티의 setter만 호출해도 커밋 시 **스냅샷과 비교** → 차이 있으면 UPDATE 자동 생성. `update()` 호출 불필요. **준영속은 변경 감지 X**.
- **플러시(Flush)**: 변경을 DB에 반영하는 시점 — ① `em.flush()` ② 커밋 직전 ③ **JPQL 실행 직전**(메모리 변경을 먼저 반영해 일관된 결과). 플러시 ≠ 커밋(플러시 후에도 롤백 가능).
- **2차 캐시**(보너스): 앱 전역 공유 캐시(별도 설정, Ehcache/Redis). 동시성 위해 **복사본** 반환. 마스터 데이터에 적합.


# 📚 PART 5 — 연관관계와 N+1

> **목표**: 객체 그래프를 자동으로 따라가는 대가. 그리고 그 대가를 줄이는 도구들.

## 5.1 연관관계 4가지

- **N:1(`@ManyToOne`)**이 가장 많이 사용. **FK는 항상 N쪽**. 1:1은 자주 조회되는 쪽에 FK.
- **양방향 = 단방향 2개**(객체는 양쪽 참조, DB는 FK 1개) → **연관관계의 주인** 개념 필요.
- **N:M(`@ManyToMany`)은 직접 사용 금지**: 자동 조인 테이블에 부가 정보(수량·일시) 못 넣음 → **중간 엔티티**(예: `MemberProduct`→`Order`)로 1:N + N:1로 풀고 도메인 의미를 부여.


## 5.2 mappedBy와 연관관계의 주인

- 양방향에서 한쪽만 **주인**(FK 관리), 다른 쪽은 `mappedBy`(읽기 전용). 규칙: **N쪽(@ManyToOne)이 주인**, 1쪽이 `mappedBy="주인_엔티티의_필드명"`.
- 주인이 아닌 쪽에서 변경하면 DB 반영 안 됨(디버깅 난점). → **연관관계 편의 메서드**로 양쪽 동시 세팅(1차 캐시 일관성).
- 모범: N쪽 주인 + `fetch=LAZY` + 컬렉션 필드 초기화 + 편의 메서드 + `@ToString`에서 컬렉션 제외(무한 루프 방지).


## 5.3 프록시와 지연/즉시 로딩

- `em.find()`(실제 엔티티, 즉시 SELECT) vs `em.getReference()`(프록시, 필드 접근 시 SELECT). 프록시는 CGLIB로 원본 상속 → 비교는 `instanceof`(== 비교는 false). EM 닫힌 후 프록시 접근 시 `LazyInitializationException`.
- **기본 fetch 전략(외울 것)** ⭐: `@ManyToOne`·`@OneToOne` = **EAGER(위험!)**, `@OneToMany`·`@ManyToMany` = LAZY.
- **실무 결론**: **모든 연관관계를 `fetch=LAZY`로 명시**. EAGER 필요 시 fetch join(아래).


## 5.4 N+1 문제와 해결 (★ 정점)

- **N+1**: 쿼리 1번 후 그 결과만큼 N번 추가 쿼리. **EAGER에서도, LAZY에서도** 발생(LAZY는 getter 호출 시점에 터짐). 단순히 LAZY로 바꾼다고 해결 안 됨 — **JPQL/getter 패턴 자체**가 원인.
- **fetch join이 해결**: 일반 JOIN은 대상만 SELECT(연관은 영속성 컨텍스트에 안 들어와 N+1 여전), **`JOIN FETCH`**는 연관까지 함께 SELECT → 한 방.
- **⚠️ OneToMany + 페이징 + fetch join 함정**: `LIMIT`이 JOIN으로 뻥튀기된 행 수에 적용 → 의도한 부모 개수가 안 나오고, Hibernate가 **전체를 메모리로 로드해 페이징**(OOM 경고). → ManyToOne 페이징은 정상.
- **@BatchSize 해결** ⭐: LAZY 유지 + `IN` 쿼리로 묶어 조회 → N+1 및 OneToMany 페이징 함정 동시 해결. 전역 `default_batch_fetch_size: 100`. (fetch join과 함께 쓰면 BatchSize 무시됨)

| 도구 | 적합 |
|---|---|
| fetch join | ManyToOne 단건, 페이징 없는 컬렉션 |
| @BatchSize | OneToMany + 페이징, 일반 LAZY 최적화 |
| EntityGraph | 동적 fetch 전략 |


## 5.5 CASCADE · orphanRemoval · JPQL · QueryDSL

- **CASCADE**: 부모 작업을 자식에 전파(`ALL/PERSIST/REMOVE/...`). 단일 소유 부모-자식(주문-주문항목)에만. **orphanRemoval**: 컬렉션에서 빠진 자식을 DB 삭제. CASCADE.REMOVE(부모 자체 삭제 트리거) vs orphanRemoval(자식 컬렉션 제거 트리거). 둘 다면 완전한 부모-자식 관리.
- **JPQL**: 테이블이 아닌 **엔티티 대상** 객체지향 쿼리. 복잡 통계는 네이티브 쿼리.
- **QueryDSL**(실무 표준): JPQL을 **자바 코드**로 → **타입 안전(컴파일 시점 오류)**, 자동완성, **동적 쿼리** 강력. 실무 조합 = **Spring Data JPA(단순 CRUD) + QueryDSL(복잡·동적)**.

---


---

## 🎓 졸업 점검

1. Connection Pool 이 필요한 이유를 TCP 관점에서?
2. JdbcTemplate 에 적용된 디자인 패턴 두 가지는?
3. `@Transactional` 이 동작하기 위한 조건과 self-invocation 문제는?
4. `@PostConstruct` 와 `@Transactional` 을 같이 쓰면 왜 트랜잭션이 안 걸리는가?
5. 트랜잭션 전파 `REQUIRES_NEW` 와 `NESTED` 의 차이는?
6. JPA 가 JDBC 를 대체하는가? (정확히)
7. `@Entity` 에 기본 생성자가 필수이고 `final` 이 금지된 이유는?
8. 영속성 컨텍스트의 4대 장점을 각각 한 문장씩?
9. `mappedBy` 가 가리키는 것은 무엇인가? 연관관계의 주인을 FK 쪽에 두는 이유는?
10. N+1 이 LAZY 로 바꿔도 안 풀리는 이유는? `fetch join` 이 일반 JOIN 과 다른 점은?

---

## ✅ 진도 체크리스트

```
[ ] 1  JDBC 에서 JdbcTemplate 까지
[ ] 2  트랜잭션 추상화와 전파
[ ] 3  JPA 기초
[ ] 4  영속성 컨텍스트
[ ] 5  연관관계와 N+1
```

**실무 연결**: 영속성 컨텍스트와 N+1 은 이론만 읽으면 체화되지 않는다.
`show-sql`, `format_sql`, `org.hibernate.SQL: DEBUG` 를 켜고
**쿼리가 실제로 몇 번 나가는지** 눈으로 확인할 것.
`@Transactional` 의 프록시는 `getClass()` 를 찍어 확인한다.
