# 🎯 자바 → 스프링 → 웹개발 통합 마스터 커리큘럼 (v3: 1~20주차 통합)

> **목적**: F-lab 1~14주차 자료에서 의도적으로 반복(개론 → 내부 → 전체지도)되던 주제들을
> **중복 제거 + 의존성 순서 재배열**하여, 웹개발 초보가 **앞에서부터 한 줄로** 따라갈 수 있는 단일 학습 경로로 통합한 문서.
>
> **핵심 서사**: 기술 진화 단원은 모두 **"로우레벨의 불편함 → 그래서 하이레벨 기술이 등장"** 구조로 서술한다.
> 즉 *왜 이게 생겼는지*를 먼저 고통으로 느낀 뒤, 그 고통을 없애는 도구로 다음 단계를 만난다.
>
> **확장 메모**: 이후 추가될 주차는 PART 22 이후로 이어 붙인다. 현재 v3는 자바 언어 → 동시성 → 스프링(IoC/DI·AOP) → DB 접근 → JPA 심화 → DB 이론·운영 → Spring MVC → 분산 시스템·캐싱·메시징·MSA → Spring Security → 테스트 → HTTP·네트워크·DevOps·Observability까지 커버한다.

---

## 🧭 전체 지도 (한눈에)

```
[자바 언어]
  PART 1  객체지향(OOP) 기초
     ↓
  PART 2  JVM 메모리 모델과 실행 원리
     ↓
  PART 3  GC (가비지 컬렉션)
     ↓
  PART 4  문자열과 컬렉션
     ↓
  PART 5  제네릭 · 비교 · 함수형
     ↓
  PART 6  I/O와 직렬화

[동시성]
  PART 7  멀티스레딩과 동시성

[스프링 진입]
  PART 8  객체 설계의 진화 → IoC/DI
     ↓
  PART 9  테스트와 웹 인프라
     ↓
  PART 10 DB 접근의 진화 (JDBC → JdbcTemplate)
     ↓
  PART 11 ORM/JPA와 트랜잭션 추상화

[스프링 심화]
  PART 12 프록시의 진화와 Spring AOP
     ↓
  PART 13 트랜잭션 심화 (전파 · 격리 · 라이프사이클 함정)
     ↓
  PART 14 JPA 심화 (영속성 컨텍스트 · 연관관계 · N+1)

[데이터베이스]
  PART 15 데이터베이스 펀더멘털 (모델링 · 정규화 · 인덱스 · 분산이론)
     ↓
  PART 16 데이터베이스 운영 (타입 · HA · 확장 · SQL 고급)

[웹 계층]
  PART 17 Spring MVC 내부와 REST API

[시스템 확장]
  PART 18 분산 시스템 · 캐싱(Redis) · 메시징(Kafka) · MSA

[보안 · 검증 · 운영]
  PART 19 Spring Security (인증 · 인가 · JWT · OAuth2)
     ↓
  PART 20 테스트 심화 (Mockito · Testcontainers · TDD)
     ↓
  PART 21 HTTP · 네트워크 · DevOps · Observability
```

### 기술 진화의 척추 (이 커리큘럼을 관통하는 "고통 → 해결" 라인)

| 영역 | 로우레벨(고통) | 중간 | 하이레벨(해결) |
|---|---|---|---|
| 메모리 전달 | C 포인터 직접 조작 | — | 자바 값 복사(참조값 복사) |
| 메모리 회수 | 참조 카운팅(순환 참조 누수) | Mark-Sweep/Compact | Generational → G1 → ZGC |
| 문자열 합치기 | `String +` (객체 폭증) | — | StringBuilder |
| 데이터 검색 | 순차 탐색 O(n) | 정렬+이진탐색 | 해시 O(1) |
| I/O | 1바이트 Stream, Blocking | NIO Channel+Buffer | Non-blocking + Selector |
| 스레드 | `new Thread()` 직접 생성 | Runnable 분리 | Executor 풀 → CompletableFuture |
| 동기화 | synchronized(블로킹) | volatile(가시성만) | Atomic/CAS(논블로킹) |
| 객체 생성·연결 | DAO가 모든 책임 떠안음 | 상속·디자인패턴 | 인터페이스+DI → Spring IoC |
| DB 통신 | 소켓으로 DB 프로토콜 직접 | JDBC 표준 | JdbcTemplate → JPA |
| 커넥션 | 매 요청 새 연결 | — | Connection Pool / DataSource |
| 트랜잭션 | Connection 수동 commit/rollback | PlatformTransactionManager | @Transactional(AOP) |
| 부가 관심사(로깅·트랜잭션) | 메서드마다 try-catch 반복 | 템플릿 메서드 → 전략 → 템플릿 콜백 | AOP `@Around` |
| 프록시 생성 | 수동 프록시 클래스 100개 | Reflection → JDK 동적 프록시 / CGLIB | ProxyFactory → @Aspect |
| 트랜잭션 중첩 | Connection 수동으로 묶기 | 논리/물리 트랜잭션 분리 | @Transactional 전파 옵션 |
| 영속성 관리 | DAO가 SQL·매핑 수동 | SQL Mapper(MyBatis) | JPA 영속성 컨텍스트(변경 감지) |
| 연관 조회 | N+1 쿼리 폭발 | fetch join | @BatchSize / EntityGraph |
| 데이터 검색(DB) | Full Scan O(n) | 정렬 + 이진 탐색 | B-tree 인덱스 O(logN) |
| DB 확장 | 단일 서버(Scale-Up 한계) | Replication(읽기 분산) | Cluster / Sharding(Scale-Out) |
| 일관성 모델 | ACID 강한 일관성 | — | BASE 최종 일관성(NoSQL) |
| 요청 라우팅 | URL마다 Servlet 폭증 | Front Controller | DispatcherServlet(+HandlerMapping/Adapter) |
| 횡단 관심사(웹) | 모든 Servlet에 공통 코드 중복 | Filter / Interceptor | AOP(메서드 단위) |
| DB 부하 | 매 요청 DB 직격 | 로컬 캐시 | 분산 캐시(Redis) + 캐싱 패턴 |
| 서비스 간 호출 | 동기 호출 체인(강결합·전파) | 비동기 + 큐 | 이벤트 스트리밍(Kafka) |
| 분산 트랜잭션 | 2PC(블로킹·SPOF) | — | Saga + Outbox(최종 일관성) |
| 시스템 구조 | Monolith(전체 배포) | Modular Monolith | MSA(Bounded Context) |
| 인증 상태 | 서버 Session(Stateful) | Session in Redis | JWT(Stateless) + OAuth2 |
| 테스트 환경 | 수동/전체 컨텍스트(느림) | H2 + 슬라이스 | Testcontainers(운영 동일) |
| HTTP 전송 | HTTP/1.1(HOL·헤더 중복) | HTTP/2(멀티플렉싱) | HTTP/3(QUIC) |
| 배포·확장 | 수동 배포·단일 서버 | Docker·Compose | Kubernetes(HPA·무중단) |
| 운영 가시성 | 사후 로그 grep | Monitoring(지표) | Observability(3 Pillars) |

---

# 📚 PART 1 — 객체지향(OOP) 기초

> **목표**: "왜 자바는 객체지향인가"에 직접 답하고, 상속·다형성·추상화·SOLID까지 OOP의 뼈대를 손에 익힌다.

## 1.1 절차지향 → 객체지향 (왜 OOP가 등장했나)

**로우레벨의 불편함**: 절차지향(C)에서는 **데이터(구조체)와 그 데이터를 다루는 함수가 분리**되어 있다. 데이터가 어디서 어떻게 바뀌는지 추적이 어렵고, 현실의 "자동차는 속도를 가지며 가속한다" 같은 모델이 코드에서 흩어진다.

**해결**: 객체지향은 **상태(필드) + 행동(메서드)을 하나의 객체로 묶는다**. 현실을 그대로 모델링할 수 있고, 데이터 변경 경로가 객체 안으로 캡슐화된다.

- C 구조체로 OOP를 흉내낼 수는 있으나, 캡슐화·상속·다형성을 언어 차원에서 강제하지 못한다.

**자기 점검**
- C 구조체로 OOP를 흉내낼 수 있지만 자바와의 결정적 차이는?

## 1.2 클래스와 객체

- 클래스 = 청사진(붕어빵 틀), 객체(인스턴스) = 찍어낸 실물(붕어빵)
- 클래스가 가져야 할 두 가지: **상태(필드)** + **행동(메서드)**

**자기 점검**
- 상태 없이 행동만 있는 클래스는 의미가 있을까?

## 1.3 메서드의 구조 + 가변인자

- 시그니처: `[접근제어자] [반환타입] 메서드명(매개변수)`, 반환은 `return`
- **가변인자(Varargs)** `타입... 변수명`: 개수가 가변일 때, 내부에서는 배열로 다룬다. 반드시 매개변수 목록의 **마지막**에 위치.

**자기 점검**
- `void log(String... args)` 와 `void log(String[] args)`의 차이는?

## 1.4 상속과 생성자 체이닝

- `extends`로 부모의 필드/메서드 상속
- 자식 생성자는 가장 먼저 부모 생성자(`super()`)를 호출
- **함정**: 부모에 매개변수 있는 생성자만 있으면 자식은 명시적으로 `super(...)`를 호출해야 한다.
- 자바가 **다중 상속을 금지**하는 이유 → 다이아몬드 문제(아래 인터페이스에서 보완)

## 1.5 다형성 + instanceof + 형변환

- 부모 타입 변수가 자식 객체를 가리킬 수 있고, 호출 시 **실제 객체의 메서드**가 실행됨(동적 바인딩)
- `Animal a = new Dog(); a.eat();` → 실행되는 건 `Dog.eat()`
- **컴파일 타임 타입 ≠ 런타임 타입**
- `instanceof`로 실제 타입 확인 후 캐스팅 (Java 16+ 패턴 매칭: `if (a instanceof Dog d) { d.bark(); }`)

**자기 점검**
- 캐스팅 전에 `instanceof` 검사가 왜 필요한가?

## 1.6 추상화의 두 도구 — 추상클래스 vs 인터페이스

**추상클래스**
- 추상 메서드 1개라도 있으면 `abstract`, 단 **구현된 메서드도 포함 가능**
- **단일 상속만**, 생성자 가질 수 있음(직접 인스턴스화는 불가)
- 의도: "is-a" 강한 관계

**인터페이스**
- **다중 구현 가능**, 생성자 없음
- 필드는 자동으로 `public static final` 상수
- 의도: "can-do" 능력

**Java 8 default & static 메서드** (진화의 한 장면)
- **로우레벨의 불편함**: 기존 인터페이스에 메서드를 새로 추가하면 **모든 구현체가 깨진다**.
- **해결**: `default` 메서드로 인터페이스에 구현을 담아 하위 호환을 유지. → 추상클래스와 경계가 흐려짐.

**선택 가이드**
- 공통 상태 + 공통 구현이 있는 계층 → 추상클래스
- 여러 능력의 조합 → 인터페이스
- **둘 다 가능하면 인터페이스 우선** (Spring/JPA 모두 인터페이스 우선)

| 항목 | 추상클래스 | 인터페이스 |
|---|---|---|
| 다중 상속 | ❌ | ✅ |
| 구현 메서드 | ✅ | Java 8+ default만 |
| 필드 | 자유 | public static final |
| 생성자 | ✅ | ❌ |

## 1.7 Nested / Inner / Anonymous 클래스

- Nested(클래스 안 클래스), Inner(이름 있는 내부 클래스), Anonymous(즉석 정의, 이름 없음)
- 익명 클래스는 **람다의 전신** (PART 5에서 연결)

## 1.8 SOLID 5원칙

> OOP 문법은 알지만 "잘 짠 코드"를 모르는 단계에서, 변경에 강한 코드의 5계명.

- **SRP (단일 책임)**: 클래스의 변경 이유는 하나. `User` / `UserRepository` / `EmailService`로 분리.
- **OCP (개방-폐쇄)**: 확장에 열림, 수정에 닫힘. `if-else` 타입 분기 → 인터페이스 다형성. (전략 패턴의 뿌리)
- **LSP (리스코프 치환)**: 자식은 부모를 완벽히 대체. `Penguin extends Bird`에서 `fly()`를 막으면 위반.
- **ISP (인터페이스 분리)**: 안 쓰는 인터페이스에 의존하지 말 것. `Worker{work,eat}` → `Workable`/`Eatable` 분리.
- **DIP (의존 역전)**: 추상화에 의존, 구체에 의존 말 것. **Spring DI와 정확히 같은 원리** (PART 8에서 만남).

**자기 점검**
- LSP가 깨지면 왜 다형성도 깨지는가?
- DIP와 DI(Dependency Injection)의 관계는?

---

# 📚 PART 2 — JVM 메모리 모델과 실행 원리

> **목표**: "이 변수는 메모리 어디에 저장될까?"에 즉답하고, 메서드 호출 한 줄이 JVM 안에서 어떻게 실행되는지 바이트코드까지 추적한다.

## 2.1 자바 변수 3종류와 저장 위치

| 변수 종류 | 저장 영역 | 생성/소멸 |
|---|---|---|
| 지역 변수 (Local) | **Stack** | 메서드 호출 / 종료 |
| 인스턴스 변수 (Instance) | **Heap** (객체와 함께) | `new` / GC 회수 |
| 클래스 변수 (static) | **Method Area** | 클래스 로딩 / JVM 종료 |

- 메서드 매개변수 = 지역 변수에 속함
- 클래스 변수가 모든 객체에 공유되는 이유 = Method Area에 단 1개 존재하기 때문

## 2.2 JVM 런타임 데이터 영역

- **Method Area**: 클래스 정보, static 변수, Constant Pool
- **Heap**: 모든 객체(`new`로 만든 것) — GC 대상
- **Stack** (스레드별): 메서드 호출 프레임, 지역변수
- **PC Register**, **Native Method Stack**

**Method Area의 3개 존 (심화)**
```
Method Area
├─ Class Metadata Zone : 클래스명, 부모, 메서드 시그니처, 필드 선언 정보 ("무엇이 있는가")
├─ Static Zone         : static 메서드/필드의 실제 바이트코드
└─ Non-Static Zone     : 인스턴스 메서드의 실제 바이트코드
```
- `main()`이 Static Zone에 있어야 객체 없이 실행 가능
- Static Zone 메서드가 Non-Static Zone 메서드를 **직접** 호출 못 하는 이유 → 인스턴스 메서드는 객체(Heap)를 통해야만 접근

## 2.3 Stack Area의 동작

- **LIFO**, 메서드 호출마다 **스택 프레임** 생성(지역변수·매개변수)
- **PC**가 현재 명령을 가리킴, 메서드 종료 시 프레임 제거
- 재귀가 너무 깊으면 → `StackOverflowError`
- Stack은 **스레드별로 따로** (→ 동시성에서 지역변수가 스레드 안전한 이유, PART 7)

## 2.4 Pass by Value — C 포인터부터 (★ 면접 단골)

> **로우레벨부터**: C는 `*`로 메모리 주소를 직접 다룬다. `int *p = &a;`에서 `&a`는 a의 주소, `*p`는 역참조한 실제 값. 포인터를 잘못 다루면 메모리 사고가 난다.

**Pass by value vs Pass by reference**
- Pass by value: 값을 복사 → 호출된 메서드 내 변경이 원본에 영향 없음
- Pass by reference (C++): 변수 자체의 별칭 전달 → 변경이 원본 반영

**자바는 Pass by value만 존재.**
- 원시 타입: 값 자체 복사
- 객체 타입: **Heap 주소값**이 복사 (포인터 비슷하지만 직접 조작 불가)

```java
static void modify(MyObject obj) {
    obj.value = 20;          // ✅ 같은 객체 필드 변경 → 호출자에 반영
    obj = new MyObject(30);  // ❌ 지역변수 obj가 새 객체 가리킴 → 호출자 무관
}
```

**자기 점검**
- "주소값이 복사된다"와 "Pass by reference"의 차이는?
- `arg2 = arg1`(메서드 안)이 호출자에 영향 못 주는 이유를 스택 프레임으로 설명하라.

## 2.5 메서드 실행 메커니즘

메서드 호출의 **2단계**:
1. **Class Metadata Zone**에서 시그니처 확인 ("무엇을 호출")
2. **Static/Non-Static Zone**에서 실제 바이트코드 찾아 실행 ("실제 코드 어디")

→ "무엇을" 과 "어디에" 가 분리되어 있어 다형성/오버라이딩이 가능.

**호출 경로**
- static ↔ static: Static Zone 내부 직접 접근
- static → 인스턴스: 객체를 만들어 Heap 통해 접근
- 인스턴스끼리: 같은 객체 내 자유 호출

## 2.6 `new` 연산자가 실제로 하는 일

1. Class Metadata Zone에서 클래스 정보 찾기
2. Heap에 객체 메모리 확보
3. 멤버변수 초기화
4. 생성자 호출

- `new` 없이 객체 만드는 법: **Reflection, clone, 역직렬화** (PART 5, 6과 연결)

## 2.7 바이트코드와 상수 풀 (★ JVM 이해의 정점)

**바이트코드**: `.java → javac → .class`. JVM이 이해하는 어셈블리 비슷한 명령어, 플랫폼 독립적("Write Once, Run Anywhere"). 확인: `javap -c MyClass`

**상수 풀(Constant Pool)**: 컴파일 시점에 클래스 파일 내부에 생성. 문자열 상수·클래스/필드/메서드 참조 저장. 바이트코드의 `#숫자` = **상수 풀 인덱스**.

**심볼 참조(Symbolic Reference)**
- **로우레벨의 한계**: 컴파일 시점엔 클래스/메서드/필드의 실제 메모리 주소를 모른다.
- **해결**: 이름(심볼)으로 참조해두고, 런타임에 실제 위치로 해석(resolve).

```
4: new #7   // class org/example/CalHap  (#7 = 상수 풀 7번 = 클래스 심볼)
7: dup       // 스택의 객체 참조 복제 (생성자 호출 후에도 참조 필요)
10: invokespecial #9   // 생성자 호출
```
- `invokestatic`(static), `invokespecial`(생성자/private), `invokevirtual`(인스턴스 다형성) 구분

**실습**: `javap -c`(바이트코드), `javap -v`(상수 풀까지)

---

# 📚 PART 3 — GC (가비지 컬렉션)

> **목표**: 객체가 어디에 저장되는지 본 다음, 그것을 자동으로 회수하는 GC의 원리·알고리즘·종류 진화를 이해하고 운영 환경에서 선택·튜닝할 수 있게 된다.

## 3.1 GC 기본 + 약한 세대 가설 + 참조 카운팅의 한계

- **Garbage** = 더 이상 참조되지 않는 객체. **GC** = Heap에서 자동 수거.
- **약한 세대 가설**: 대부분 객체는 금방 죽고, 오래된 객체가 젊은 객체를 참조하는 경우는 드물다. → 세대별 메모리 설계의 근거.
- **STW(Stop The World)**: GC 동안 모든 애플리케이션 스레드 정지. ("GC 튜닝"은 보통 이 시간을 줄이는 것)

**참조 카운팅의 치명적 한계 (왜 JVM은 안 쓰나)**
- 참조 카운팅: 객체마다 카운터, 0이면 회수. 장점은 즉시 회수.
- **치명적 단점**: 순환 참조(`Root → A ⇄ B`)에서 Root가 끊겨도 A↔B 카운터가 0이 안 됨 → **메모리 누수**. + 카운터 갱신 비용.
- **그래서 JVM은 Reachability Analysis(루트에서 도달 가능성 추적)** 를 쓴다.

## 3.2 Heap의 세대 구조

- **Young Generation**: Eden, Survivor 0(From), Survivor 1(To)
- **Old Generation**: 장수 객체
- 객체의 일생: Eden 생성 → Minor GC 생존 시 Survivor → From↔To 스위칭 N회 생존 → Old로 **Promotion** → Old 가득 차면 **Full GC + STW**
- Survivor가 둘인 이유: 한쪽을 비우며 복사(Copy)해 단편화를 막기 위함.

## 3.3 GC 알고리즘 4가지

| 알고리즘 | 핵심 | 단점 |
|---|---|---|
| Reference Counting | 카운트 0이면 회수 | 순환 참조 누수 |
| Mark-and-Sweep | Root 추적 마킹 후 비마킹 제거 | Compaction 없어 단편화 |
| Mark-and-Compact | Sweep 후 살아남은 객체 모음 | Compact 오버헤드 |
| Generational (실제) | Young/Old 분리 관리 | 구조 복잡 |

## 3.4 GC 종류의 진화 (Serial → ... → ZGC)

> **진화 서사**: 메모리가 커지고 코어가 늘면서, GC도 "한 스레드로 다 멈추고 청소"에서 "정지시간을 예측·통제"하는 방향으로 발전.

| GC | 등장 | 특징 | 적합 |
|---|---|---|---|
| Serial GC | 초기 | 싱글 스레드 | CPU 1개, 작은 메모리 |
| Parallel GC | Java 7~8 default | 멀티 스레드 GC | 처리량 우선 |
| CMS | (Java 9 deprecated) | STW 최소화 | 응답성 |
| **G1 GC** | Java 9+ default | Region 단위 | 대부분의 서버 |
| **Z GC** | Java 11+ | STW 10ms 이하 | 초저지연 |

**내 GC 확인**: `java -XX:+PrintCommandLineFlags -version`

## 3.5 G1 GC 심화 (★ 면접·실무 직결)

- **등장 배경**: 멀티프로세서 + 멀티 기가바이트 힙. 기존 GC는 Young/Old를 통째로 회수 → 큰 힙에서 STW 폭발.
- **목표**: **정지시간 예측 모델(Pause Prediction Model)** — "M밀리초 안에 끝낼게"(기본 200ms).
- **리전(Region) 모델**: 힙을 **동일 크기 리전**으로 분할(1~32MB), 각 리전을 Eden/Survivor/Old로 **동적** 할당.
  ```
  기존: [ Eden | Survivor | Old ]   ← 크기·위치 고정
  G1  : [E][ ][S][O][ ][O][E]...    ← 같은 크기, 역할 동적
  ```
- **거대 리전(Humongous)**: 리전 절반보다 큰 객체는 연속 거대 리전에 저장, 주로 Old 취급.
- **Garbage First**: 쓰레기가 가장 많은 리전부터, 정지시간 한도 내에서 회수 효과 큰 곳 우선 → 이름의 유래.

**실습**: `java -XX:+UseG1GC`, `java -XX:+PrintGCDetails`

---

# 📚 PART 4 — 문자열과 컬렉션

> **목표**: 데이터를 보관·조작하는 자료구조를 용도에 맞게 선택한다. 전체 지도를 잡고, 핵심 구현체는 내부 구조까지 코드로 검증한다.

## 4.1 String과 Constant Pool

- 리터럴 `"hello"`는 **String Constant Pool**에 저장, 같은 값 리터럴은 **재사용**(`a == b`가 true)
- `new String("hello")`는 강제로 Heap에 새 객체
- String은 **불변(immutable)** — 캐싱·보안·스레드 안전의 이점

**자기 점검**
- `String a="abc"; String b=new String("abc");`일 때 `a.equals(b)`와 `a==b`의 결과는?

## 4.2 StringBuilder vs StringBuffer

- **로우레벨의 불편함**: `String + String`을 반복하면 불변이라 매번 새 객체 생성 → 루프에서 객체 폭증.
- **해결**: 가변 문자열(내부 char 배열). `append()`가 새 객체를 안 만듦.
- **StringBuilder**(단일 스레드, 빠름) vs **StringBuffer**(synchronized, 멀티 스레드, 느림)

## 4.3 컬렉션 전체 지도

- **배열의 한계**: 크기 고정, 중간 삽입/삭제 메서드 없음 → **컬렉션** = 자료구조 + 알고리즘의 클래스화
- `Collection` 인터페이스를 List/Set/Queue가 상속, **Map은 별도**(key-value)

```
Collection ─┬─ List ──┬─ ArrayList
            │         ├─ LinkedList
            │         └─ Vector
            ├─ Set ──┬─ HashSet
            │        ├─ TreeSet
            │        └─ LinkedHashSet
            └─ Queue ─┬─ LinkedList
                      ├─ ArrayDeque
                      └─ PriorityQueue
Map (Collection X) ─┬─ HashMap
                    ├─ LinkedHashMap
                    ├─ TreeMap
                    ├─ HashTable
                    └─ ConcurrentHashMap
```

## 4.4 List 3형제 + 내부 구조

| 구현체 | 내부 | Thread Safe | 비고 |
|---|---|---|---|
| ArrayList | 배열(1.5배 확장) | ❌ | 가장 많이 씀 |
| LinkedList | 이중 연결 리스트 | ❌ | Queue도 구현 |
| Vector | 배열(=ArrayList) | ✅(synchronized) | 느려서 거의 안 씀 |

- **ArrayList 확장 정책**: 기본 크기 10, 부족 시 **1.5배 새 배열 생성 → 복사**. 초기 크기 지정(`new ArrayList<>(1000)`)이 효율적인 이유.
- **삽입/삭제 효율의 진짜 이유**: 둘 다 결국 O(n)일 수 있지만 **비용의 종류가 다름**.

| 작업 | ArrayList | LinkedList |
|---|---|---|
| 위치 찾기 | O(1) 인덱스 접근 | O(n) 순차 탐색 |
| 실제 삽입/삭제 | O(n) 메모리 복사 | O(1) 참조 변경 |

→ 데이터가 많을수록 ArrayList의 복사 비용 폭증. "위치를 알 때" LinkedList 삽입은 진짜 O(1).

## 4.5 Set 3형제

| 구현체 | 특징 | 내부 |
|---|---|---|
| HashSet | 순서 X, 중복 X | HashMap 기반 (hashCode+equals로 중복 검사) |
| TreeSet | 자동 정렬, 중복 X | Red-Black Tree (삽입 O(log n)) |
| LinkedHashSet | 삽입 순서 유지 | HashMap + LinkedList |

## 4.6 Queue

- **FIFO**, null 삽입 불가. 사용처: BFS, 버퍼, 메시지 큐(MQ)

| 동작 | 안전(실패 시 false/null) | 강제(실패 시 예외) |
|---|---|---|
| 삽입 | `offer()` | `add()` |
| 조회 | `peek()` | `element()` |
| 제거 | `poll()` | `remove()` |

- LinkedList로도 Queue 구현 가능하나 **ArrayDeque 권장**(더 빠름).

## 4.7 Map 5형제

| 구현체 | 순서 | null | Thread Safe |
|---|---|---|---|
| HashMap | ❌ | 키 1개, 값 다수 | ❌ |
| LinkedHashMap | ✅ 삽입순 | HashMap과 동일 | ❌ |
| TreeMap | ✅ 키 정렬 | 값만 | ❌ |
| HashTable | ❌ | ❌ | ✅ (메서드 동기화) |
| ConcurrentHashMap | ❌ | ❌ | ✅ (락 단위 최적화) |

- TreeMap 정렬: 숫자 → 대문자 → 소문자 → 한글. 내부는 Red-Black Tree, `put/get/remove` 모두 **O(log n)**.
- HashTable은 거의 안 쓰고 **ConcurrentHashMap 권장**(HashTable은 전체 락, ConcurrentHashMap은 락 단위가 작음).

## 4.8 해시(Hash)의 원리 (★ HashMap 면접 단골)

- **로우레벨의 불편함**: 데이터가 많으면 순차 검색 O(n)이 너무 느림.
- **질문**: "수학적으로 위치를 바로 계산할 수 없을까?" → **해시 함수**(key → 정수 인덱스). 좋은 조건: 빠름·균등 분포·결정적.
- **해시 충돌**: 서로 다른 입력이 같은 해시값(비둘기집 원리상 불가피). 잦으면 O(1)이 무너져 최악 O(n).

**충돌 해결 1: 체이닝(자바 HashMap 채택)**
- 같은 인덱스에 연결 리스트로 연결. **Java 8부터 한 버킷 8개 초과 시 트리(Red-Black)로 변환**.

**충돌 해결 2: 오픈 어드레싱**
- 충돌 시 빈 버킷 탐사(선형/이차/이중 해싱). 메모리 효율 ↑, 단 클러스터링·삭제 까다로움.

**LoadFactor 0.75**: 배열의 75%가 차면 2배 확장 + **rehash**. 작으면 메모리 낭비, 크면 충돌 증가.

## 4.9 Iterator

- **로우레벨의 불편함**: Iterator 없던 시절, 컬렉션마다 순회 방식이 달랐다(ArrayList는 인덱스, HashSet은 인덱스 없음...). 내부 구조를 알아야 순회 가능 → 캡슐화 위반·코드 중복.
- **해결(Iterator 패턴)**: 모든 `Collection`이 `iterator()` 제공. `hasNext()`/`next()`/`remove()`로 **내부 구조와 무관하게 동일 코드 순회**.
- `for-each`는 내부적으로 Iterator 사용. 순회 중 컬렉션 수정 시 `ConcurrentModificationException`.

---

# 📚 PART 5 — 제네릭 · 비교 · 함수형

> **목표**: 타입 안전성을 지키는 제네릭, 객체 정렬 기준, 함수를 값으로 다루는 함수형까지 자바의 표현력을 완성한다.

## 5.1 제네릭과 와일드카드 (PECS)

- **불공변성(Invariance)**: 배열은 공변(`String[]`을 `Object[]`로)이지만 **제네릭은 불공변** — `List<String>`은 `List<Object>`가 아니다(타입 안전성 때문).
- **무제한 와일드카드 `List<?>`**: 어떤 타입이든 OK, 꺼낸 원소는 `Object`로만, **add 불가**.
- **상한 `? extends T`** (Producer, 읽기): `Box<? extends Fruit>`는 꺼내기 안전, 넣기 불가.
- **하한 `? super T`** (Consumer, 쓰기): `Box<? super Fruit>`는 넣기 안전, 꺼낼 땐 Object.

**PECS 원칙**: **꺼낸다(Produce) → `extends`, 넣는다(Consume) → `super`**. 양쪽 다면 T 자체.

## 5.2 Comparable & Comparator

- **로우레벨의 불편함**: 객체는 `<`, `>`로 비교 불가(어떤 필드 기준인지 모호).
- **Comparable** (자기 자신): `compareTo(T o)` 하나. 음수/0/양수. 클래스의 **기본 정렬(natural ordering)**. TreeSet/TreeMap/`Collections.sort()`가 자동 사용.
- **Comparator** (외부 주입): `compare(o1, o2)`. **여러 정렬 기준** 가능, 클래스 수정 권한 없어도 가능.

```java
Comparator<Member> byAge = (a, b) -> a.age - b.age;
Comparator<Member> byName = Comparator.comparing(m -> m.name);
list.sort(byAge.reversed());
```

| | Comparable | Comparator |
|---|---|---|
| 위치 | 클래스 내부 | 외부 |
| 메서드 | compareTo | compare |
| 기준 수 | 1개(기본) | 무제한 |

## 5.3 Reflection

- **모든 Object는 metadata를 가진다** (`Object` 상속). 접근: 생성자·필드·메서드·어노테이션, `Class<?>` API.
- **용도**: 런타임 인스턴스 생성, private 접근, 어노테이션 처리.
- **실무 사용처**: **Spring(DI/AOP), JPA(Entity 매핑), Jackson(JSON 직렬화)** — 모두 Reflection 기반.
- **단점**: 성능, 컴파일 타임 안전성 상실, 캡슐화 위반.

```java
Class<?> clazz = Class.forName("org.example.Member");
Object obj = clazz.getDeclaredConstructor().newInstance();
Method m = clazz.getMethod("hap", int.class, int.class);
m.invoke(obj, 1, 2);
```

## 5.4 함수형 인터페이스 + 람다 + 스트림

**함수형 인터페이스**: 추상 메서드가 **정확히 1개**. `@FunctionalInterface`로 강제 검증. 람다로 인스턴스화.

| 인터페이스 | 시그니처 | 용도 |
|---|---|---|
| `Function<T,R>` | `R apply(T)` | 변환 |
| `Predicate<T>` | `boolean test(T)` | 조건 |
| `Consumer<T>` | `void accept(T)` | 소비 |
| `Supplier<T>` | `T get()` | 공급 |

**람다**: 익명 함수의 간결 표현(익명 클래스의 발전형). 외부 지역변수 캡처는 사실상 final.

**스트림** (I/O 스트림과 이름만 같고 완전히 다름)
- 컬렉션·배열에 동일 연산을 선언적으로. **한 번만 사용 가능**.
- **중간 연산**(Stream 반환, 지연 평가): `filter, map, sorted, distinct, limit, skip`
- **최종 연산**(값/void): `forEach, collect, count, reduce, anyMatch`
- 중간 연산만 호출하고 최종 연산이 없으면 아무것도 실행되지 않음(지연 평가).

```java
sList.stream()
    .filter(s -> s.length() > 3)
    .map(String::toUpperCase)
    .sorted()
    .collect(Collectors.toList());

Map<Integer, List<String>> byLen =
    sList.stream().collect(Collectors.groupingBy(String::length));
```

---

# 📚 PART 6 — I/O와 직렬화

> **목표**: 파일·네트워크와 데이터를 주고받는 추상화를, 로우레벨 스트림의 불편함에서 출발해 NIO·직렬화까지 이해한다.

## 6.1 I/O 큰 그림 (IO vs NIO 진화)

- I/O 기준점은 **JVM**: 외부 → JVM = Input, JVM → 외부 = Output. (콘솔 출력=Output, DB 읽기=Input)

| 구분 | IO (1.0~) | NIO (1.4+) | NIO.2 (7+) |
|---|---|---|---|
| 단위 | 스트림(1바이트) | 채널+버퍼(블록) | 채널+버퍼 |
| 방향 | 단방향 | 양방향 | 양방향 |
| Blocking | 항상 | Non-blocking 가능 | Non-blocking 가능 |
| 파일 API | `File` | `FileChannel` | `Files`(static), `Path` |

- **`File` → `Files`/`Path` 진화**: `File.delete()`는 false만 반환(이유 모름). `Files.delete(path)`는 **정확한 예외 throw**, 모든 메서드 static.

## 6.2 Stream vs Channel, Blocking vs Non-blocking

- **로우레벨의 불편함**: 전통 Stream은 1바이트씩·단방향·**Blocking**(`read()`가 데이터 올 때까지 스레드 정지, close()로만 빠져나옴).
- **NIO**: **Channel ↔ Buffer**(항상 버퍼 경유), 양방향, Non-blocking 가능. **Selector**(멀티플렉서)로 한 스레드가 여러 채널 감시.
- **동시 접속 1만 명**: Blocking IO면 스레드 1만 개 필요 → NIO + Selector면 소수 스레드로 처리. (단 CPU 바운드 작업엔 Non-blocking이 오히려 손해)

## 6.3 바이트 스트림 + 한글 문제

- `System.in`(InputStream)은 `read()`로 **1바이트씩**. 영어 1byte는 OK지만 **한글은 2~3byte(UTF-8)라 깨짐**.
- `FileInputStream`: `read()`는 EOF에서 `-1` 반환(그래서 반환 타입이 byte가 아닌 int). 사용 후 **close 필수**.
- `byte[]` 버퍼로 한 번에 여러 바이트(함정: 마지막에 버퍼가 다 안 차면 읽은 수 `n`까지만 처리).
- `FileOutputStream`: `write(int)`, `new FileOutputStream(path, true)`는 이어쓰기.

## 6.4 문자 스트림 (Reader/Writer) — 한글 해결

- **Reader/Writer**는 문자(char) 단위, 인코딩을 해석 → 다국어 OK.
- `FileReader`(직접) vs `InputStreamReader`(보조 스트림, **인코딩 명시 가능**).
- `FileWriter`로 한글 쓰기 가능.

## 6.5 보조 스트림 (Buffered / Data) + try-with-resources

- **try-with-resources** (Java 7+): `try (Resource r = ...)`로 자동 close. 여러 자원은 **선언 역순으로 닫힘**. `AutoCloseable` 구현 필요.
  - **로우레벨의 불편함**: try 안에서 close하면 예외 시 호출 안 됨 → finally 필수였음. try-with-resources가 이를 자동화.
- **BufferedInputStream/OutputStream**: 기본 스트림은 1바이트마다 OS 호출 → 느림. 내부 버퍼(기본 8KB)에 모아 한 번에 처리 → I/O 호출 횟수 ↓, 성능 ↑.
- **DataInputStream/OutputStream**: 기본 타입(`int/double/String`)을 타입별로 저장/읽기(`writeInt`, `readUTF`...). CSV 파싱 불필요.

## 6.6 직렬화 (Serialization)

- 객체를 **바이트 스트림으로 변환** → 파일 저장·네트워크 전송. `Serializable`(마커 인터페이스) 구현.
- `ObjectOutputStream.writeObject()` / `ObjectInputStream.readObject()`
- **`transient`**: 직렬화 제외 필드. **비밀번호·토큰·임시 캐시는 transient 필수**(안 붙이면 바이트 스트림에 평문 노출 위험).
- **`serialVersionUID`**: 버전 식별자. 명시 안 하면 컴파일러가 자동 생성하는데, 클래스 변경 시 UID가 바뀌어 **역직렬화 시 `InvalidClassException`**. → 운영 시스템에서 반드시 명시.
- static 필드는 직렬화 안 됨.

---

# 📚 PART 7 — 멀티스레딩과 동시성

> **목표**: 여러 스레드가 동시에 움직이는 세계의 모든 것. 면접·실무에서 가장 자주 등장. 로우레벨(직접 스레드)에서 고통을 느끼고 하이레벨(Executor·CompletableFuture)로 올라간다.

## 7.1 프로세스와 스레드

- **멀티태스킹**(1코어가 시분할로 번갈아) vs **멀티프로세싱**(여러 코어 동시). 둘은 함께 사용 가능.
- **프로세스**: 실행 중 프로그램, 독립 메모리, 1+ 스레드 포함. **스레드**: 프로세스 안 코드 실행 흐름.
- **메모리**: 코드/데이터/힙은 **공유**, **스택은 스레드별**.
- **컨텍스트 스위칭**: 스레드 전환 시 레지스터 백업/복원 + 캐시 무효화 → **오버헤드**. 스레드가 너무 많으면 CPU가 작업보다 스위칭에 시간 소비.

**멀티스레드 관점 변수 안전성**: "스레드 안전한가?" ≈ "**공유되는가?**"

| 변수 | 위치 | 안전성 |
|---|---|---|
| 지역 변수 | Stack(스레드별) | 안전(공유 X) |
| 인스턴스 변수 | Heap | 공유 → 동기화 필요 |
| static 변수 | Method Area | 공유 → 동기화 필요 |

## 7.2 Sync/Async × Blocking/Non-Blocking 4분면 (★ 면접 단골)

- **Sync/Async (작업 순서 축)**: 이전 작업의 완료를 **확인하는가**.
- **Blocking/Non-Blocking (제어권 축)**: 호출된 함수가 **제어권을 가져갔는가**.

| | Blocking | Non-Blocking |
|---|---|---|
| **Sync** | 전통 IO (가장 단순/비효율) | NIO Polling |
| **Async** | `Future.get()` | **CompletableFuture/Callback (가장 효율적)** |

## 7.3 스레드 만들고 다루기

- **상태**: NEW → (start) RUNNABLE → TERMINATED. 곁가지: BLOCKED(락 대기), WAITING(wait/join), TIMED_WAITING(sleep/wait(ms)).
- **Thread 상속** vs **Runnable 구현**: `start()`는 새 스레드, `run()` 직접 호출은 그냥 메서드 호출.
- **Runnable 권장 이유 3가지**: ① 단일 상속 제약 회피 ② 작업과 스레드 분리 ③ 메모리 효율(여러 스레드가 같은 Runnable 공유). 람다로 Runnable 생성 가능(함수형 인터페이스).
- **데몬 스레드**: 일반 스레드 모두 종료 시 함께 종료. 작업 완료 보장 필요하면 데몬 금지.
- **join()**: 대상 스레드 종료까지 현재 스레드 대기.

## 7.4 동시성 문제 2가지 — 가시성과 원자성

| 문제 | 정의 | 예시 |
|---|---|---|
| **가시성(Visibility)** | 한 스레드 변경이 다른 스레드에 안 보임 | runFlag=false 했는데 무한 루프 |
| **원자성(Atomicity)** | 동시 수정이 서로 덮어씀 | count++가 일부 손실 |

- `count++`는 사실 **읽기 → +1 → 쓰기** 3단계라 원자적이지 않다.

## 7.5 동기화 도구 3종 비교 (synchronized / volatile / Atomic)

> **진화 서사**: 가장 안전하지만 느린 synchronized → 가시성만 싼값에 주는 volatile → 락 없이 원자성을 얻는 Atomic.

**synchronized** (둘 다 해결, 대신 느림)
- 메서드/블록. 모든 객체는 **모니터 락**(intrinsic lock) 1개. 진입 성공=RUNNABLE, 실패=BLOCKED.
- static synchronized의 락 대상은 `Class` 객체. 블록은 범위 최소화 가능.
- **한계 3가지**: 무한 대기(타임아웃 불가), 인터럽트 불가, 공정성 보장 X.

**volatile** (가시성만, 원자성 ❌)
- 각 코어의 캐시 대신 **항상 메인 메모리** 직접 R/W → 가시성 보장. 하지만 `count++`는 여전히 위험.
- 적합: 한 스레드만 쓰고 여러 스레드가 읽는 플래그(`volatile boolean shutdown`).

**Atomic + CAS** (락 없이 원자성, 빠름)
- **CAS(Compare And Swap)**: ① 현재 값 읽기(A) ② 새 값 계산(B) ③ 메모리 값과 A 비교 → 같으면 B로 교체, 다르면(다른 스레드가 수정) **재시도**.
- `AtomicInteger.incrementAndGet()` — 락 없이 원자적.

| 도구 | 가시성 | 원자성 | 방식 | 성능 |
|---|---|---|---|---|
| synchronized | ✅ | ✅ | 락(블로킹) | 가장 느림 |
| volatile | ✅ | ❌ | 메모리 동기화 | 빠름 |
| Atomic | ✅ | ✅ | CAS(논블로킹) | 빠름 |

- CAS 재시도가 무한 반복될 위험(ABA 문제) 주의.

## 7.6 정교한 락 (LockSupport → ReentrantLock → tryLock)

- **LockSupport**(저수준): `park()/parkNanos()/unpark()`. 너무 저수준이라 직접 안 씀, ReentrantLock의 내부 도구.
- **ReentrantLock**(실무 표준): synchronized 효과 + 추가 기능. **`try-finally`로 unlock 필수**(중간 예외 시 unlock 누락하면 데드락).
- **tryLock()으로 데드락 회피**: `tryLock()`(즉시 실패 false), `tryLock(time, unit)`(시간 한정). 락을 못 얻으면 포기·재시도 → 데드락 회피.

## 7.7 스레드 간 협력 (wait/notify, interrupt, yield)

- **생산자-소비자 문제**: 큐가 차면 생산자 대기, 비면 소비자 대기. (MQ, 로깅, 작업 큐)
- **wait()/notify()**: synchronized 안에서만. `wait()`는 **락을 반납하고** WAITING, `notify()`는 깨움. **`if`가 아니라 `while`로 조건 재검사**(Spurious wakeup). `notifyAll()` 권장.
- **인터럽트**: `interrupt()`(신호 발송, 플래그 true), `isInterrupted()`(확인만), `interrupted()`(static, 확인 후 false). blocking 메서드 중 인터럽트 시 `InterruptedException`(플래그 자동 false).
- **yield()**: CPU 양보 힌트, 상태는 RUNNABLE 유지(보장 X).

## 7.8 Executor 프레임워크 (★ 직접 스레드의 한계 → 풀)

> **로우레벨의 불편함**: 스레드 1개 ≈ 1MB + OS 시스템 콜. "1000번 호출에 1000개 생성"은 비현실적. 무한 생성 시 자원 고갈, Runnable은 반환값·체크 예외 불가.

**해결 = 스레드 풀 + 반환 가능한 작업 인터페이스 = Executor.**

- **Executor**(execute만) → **ExecutorService**(submit/shutdown/invokeAll) → **Executors**(팩토리, ISP 적용).
- **풀 종류**: `newFixedThreadPool(n)`(일반 서버), `newCachedThreadPool()`(짧은 작업 다수, **트래픽 폭주 시 위험**), `newSingleThreadExecutor()`(순서 보장), `newScheduledThreadPool(n)`(주기 실행).
- 풀 크기보다 작업이 많으면 **블로킹 큐 대기**.

**Callable과 Future** (Runnable 한계 극복)

| | Runnable | Callable |
|---|---|---|
| 메서드 | `void run()` | `V call() throws Exception` |
| 반환값 | ❌ | ✅ |
| 체크 예외 | ❌ | ✅ |

- `Future`: `submit()` 반환, `get()`으로 결과 회수(블로킹). `cancel(mayInterruptIfRunning)`.
- `invokeAll`(모두 완료 대기) / `invokeAny`(첫 완료 채택).
- **안전 종료**: `shutdown()`(진행/큐 마무리) vs `shutdownNow()`(인터럽트·큐 포기). 운영 종료는 `shutdown()` 후 `awaitTermination`.

## 7.9 고급 비동기 (CompletableFuture & ForkJoinPool)

- **Future의 한계**: 결과 회수가 블로킹, 연결·콜백 불편.
- **CompletableFuture**: `thenApply/thenAccept/thenCombine` **체이닝**, 결과 준비 시 **콜백 자동 실행**(논블로킹).
  ```java
  CompletableFuture.supplyAsync(() -> 5)
      .thenApply(x -> x * 2)
      .thenCombine(other, Integer::sum)
      .thenAccept(System.out::println);
  ```
- **ForkJoinPool + work-stealing**: 큰 작업을 재귀 분할(Fork), 각 스레드 자기 큐, **노는 스레드가 남의 큐에서 작업을 훔침** → CPU 사용률 극대화. `parallelStream()`의 내부 엔진.
- **RecursiveTask\<V\>**(반환O) vs **RecursiveAction**(반환X): `compute()`에서 작으면 직접, 크면 `left.fork()` → `right.compute()` → `left.join()`.

**디버깅 도구**: `jstack <pid>`(스레드 덤프), VisualVM.

---

# 📚 PART 8 — 객체 설계의 진화 → IoC/DI (스프링 진입)

> **목표**: "DAO 코드 한 줄이 어떻게 Spring의 IoC/DI까지 진화하는지" 한 클래스의 리팩토링 여정으로 OOP 원칙과 Spring의 본질을 동시에 익힌다. **여기서부터 PART 1의 SOLID가 실제로 살아 움직인다.**

## 8.1 전통 DAO의 문제 (로우레벨 — 모든 책임을 떠안은 코드)

```java
public void add(User user) throws ... {
    Class.forName("com.mysql.jdbc.Driver");        // ① 드라이버 로딩
    Connection c = DriverManager.getConnection(    // ② 접속 정보
        "jdbc:mysql://localhost/toby", "root", "*****");
    PreparedStatement ps = c.prepareStatement(     // ③ SQL
        "insert into users(id,name,password) values (?,?,?)");
    ps.setString(1, user.getId());                 // ④ 바인딩
    ps.executeUpdate();                            // ⑤ 실행
    ps.close(); c.close();                         // ⑥ 자원 해제
}
```

- 한 메서드에 **연결 정보·드라이버 로딩·SQL·자원 해제·예외 처리**가 혼재.
- DB 종류·접속 정보 바뀌면 **모든 메서드 수정** = 변경 1번 = 수정 N곳 = 유지보수 지옥. (SRP·OCP·DIP 위반)

## 8.2 관심사의 분리

> "관심이 같은 것끼리 모으고, 다른 것은 떨어뜨려라" (= SRP)

- **1단계 — 메서드 추출**: 중복되는 `getConnection()`을 private 메서드로 → 중복 제거, DB 정보 변경 시 한 곳만.
- **2단계 — 추상클래스로 확장**: "고객사마다 다른 DB, 단 UserDao 코드는 공개 안 하고 싶다" → `getConnection()`을 **추상 메서드**로. 변하지 않는 흐름은 부모, 변하는 부분은 자식(`NUserDao`, `DUserDao`).

## 8.3 디자인 패턴의 적용과 한계

- 위 구조는 사실 **2개 패턴**의 동시 적용:
  - **템플릿 메소드 패턴**: 슈퍼클래스에 기본 흐름, 변하는 부분만 서브클래스 구현. (Spring `JdbcTemplate`의 이름 유래)
  - **팩토리 메소드 패턴**: 객체 생성(`getConnection`)을 서브클래스에 위임. (`BeanFactory`의 "Factory")
- **상속 기반 분리의 한계**: 단일 상속 제약, 컴파일 타임 결합, 부모 변경 시 자식 영향. → **상속 대신 인터페이스 + 합성(composition)**.

## 8.4 인터페이스 + 합성 → OCP + 전략 패턴

```java
public interface ConnectionMaker { Connection makeConnection(); }

public class UserDao {
    private ConnectionMaker connectionMaker;   // 인터페이스에만 의존
    public UserDao(ConnectionMaker cm) { this.connectionMaker = cm; }  // 외부 주입
    public void add(User u) { Connection c = connectionMaker.makeConnection(); ... }
}
```

- UserDao는 **새 DB 추가에도 변경 없음**(확장 O, 수정 X) = **OCP 만족**.
- 용어 매핑(**전략 패턴**): Context=UserDao, Strategy=ConnectionMaker, ConcreteStrategy=N/DConnectionMaker. → **전략 패턴은 OCP의 구현 도구**. (PART 1의 DIP가 여기서 실현)

## 8.5 IoC (제어의 역전) + 프레임워크 vs 라이브러리

- **전통**: UserDao가 `new NConnectionMaker()`로 **자기가 결정·생성**.
- **IoC**: "어떤 구현체를 쓸지"의 결정권이 **외부로 넘어감**. 객체가 자신이 쓸 객체를 선택하지 않음.

| | 라이브러리 | 프레임워크 |
|---|---|---|
| 흐름 제어 | 내 코드 | 프레임워크 |
| 호출 방향 | 내 코드 → 라이브러리 | 프레임워크 → 내 코드 |

- **Hollywood Principle**: "Don't call us, we'll call you" → Spring이 프레임워크인 이유.
- **IoC 컨테이너**: 객체 생성·관계 설정·생명주기 관리 = Spring의 **ApplicationContext**.

## 8.6 ApplicationContext + DI + 싱글톤 레지스트리

```java
@Configuration
public class DaoFactory {
    @Bean public UserDao userDao() { return new UserDao(connectionMaker()); }
    @Bean public ConnectionMaker connectionMaker() { return new DConnectionMaker(); }
}
ApplicationContext ctx = new AnnotationConfigApplicationContext(DaoFactory.class);
UserDao dao = ctx.getBean("userDao", UserDao.class);
```

- **빈(Bean)**: Spring이 관리하는 객체. **BeanFactory**(기본) → **ApplicationContext**(확장, i18n·이벤트 등 + 실무 표준).
- **getBean()**: 빈 목록에서 찾고, 없으면 `@Bean` 호출해 생성·의존 주입.
- **싱글톤 레지스트리**: `getBean()`을 100번 호출해도 객체 1개. 모든 빈은 기본 싱글톤. **단 싱글톤 빈은 stateless여야 안전**(인스턴스 변수에 요청별 데이터 보관 ❌ → PART 7 동시성과 직결).
- **DI(의존관계 주입)**: 구체 의존 객체와 클라이언트를 **런타임에 연결**. ① 의존 ② 인터페이스 의존 ③ 외부 주입. 방식: **생성자 주입(권장)**, Setter, 필드. 생성자 주입 권장 이유: final 가능, 순환 참조 감지, 테스트 용이.
- **DI는 IoC의 한 형태**.

---

# 📚 PART 9 — 테스트와 웹 인프라

> **목표**: PART 8에서 만든 IoC/DI 코드를 **테스트로 검증**하고, Spring MVC 학습 전 웹 백엔드 인프라 용어를 정리한다.

## 9.1 JUnit 테스트

- **왜 테스트인가**: `main()` 검증은 매번 사람이 눈으로 판단·반복 → 비효율. **자동화 단위 테스트** = 코드가 코드를 검증. 조건: 자동화·격리·빠름·반복 가능.
- **assertThat + 매처(Hamcrest)**: `assertThat(actual, is(expected))` — 자연어처럼 읽힘. (`nullValue`, `containsString`, `greaterThan` 등)
- **실행 방식**: `@Test` 메서드마다 **새 인스턴스 생성** → 테스트 간 독립성 보장. `@BeforeEach`(각 테스트 전) vs `@BeforeAll`(전체 1회).
- **픽스처(Fixture)**: 테스트에 필요한 공통 준비물. `@BeforeEach`로 매번 새로 생성, 시작 상태 보장(`deleteAll()` 등).
- **통합 테스트 DB 잔여 데이터**: `@Transactional`, `@Sql`로 격리.

## 9.2 웹 인프라 기초

**웹서버 vs WAS**

| | 웹서버 | WAS |
|---|---|---|
| 역할 | 정적 자원(HTML/CSS/이미지) | 동적 자원(서블릿/JSP) |
| 예시 | Apache, Nginx | Tomcat, Jetty, Undertow |

- 실무: `[클라이언트] ↔ [Nginx 정적] ↔ [Tomcat 동적] ↔ [DB]`

**서블릿/JSP**: 서블릿=자바로 HTTP 요청 처리하는 클래스. JSP=HTML 안에 자바, **컴파일 시 서블릿으로 변환**. 진화: 서블릿만(가독성 최악) → JSP만(유지보수 지옥) → **MVC(JSP=View, 서블릿=로직)** → 현대는 Thymeleaf 등.

**SSR vs CSR**

| | SSR | CSR |
|---|---|---|
| 화면 생성 | 서버에서 HTML 완성 | 브라우저(JS) |
| 초기 로딩 | 빠름 | 느림 |
| SEO | 좋음 | 까다로움 |
| 예시 | JSP, Thymeleaf, Next.js | React/Vue SPA |

**JAR vs WAR**

| | JAR | WAR |
|---|---|---|
| 포함 | Class, 라이브러리 | + JSP/Servlet/WEB-INF |
| 실행 | `java -jar`(JRE) | 외부 WAS 필요 |

- **Spring Boot는 JAR 권장**: WAS(Tomcat) 내장 → 배포·실행 간단, DevOps 부담 ↓. (마이크로서비스에서 선호)

---

# 📚 PART 10 — DB 접근의 진화 (JDBC → JdbcTemplate)

> **목표**: "DB 코드 한 줄이 어떻게 JdbcTemplate까지 진화하는지" — DB 접근 자체의 추상화 여정. PART 8의 DAO 진화에 이어지는 두 번째 추상화 스토리.

## 10.1 JDBC 표준화 (로우레벨 소켓 → 표준 API)

- **JDBC 없던 시절의 고통**: 각 DB마다 고유 API. DB를 바꾸면 모든 코드 재작성. 심하면 **소켓으로 DB 바이너리 프로토콜을 직접** 통신.
  ```java
  Socket socket = new Socket("localhost", 3306);  // MySQL 프로토콜 직접...
  ```
- **JDBC = 자바의 DB 접근 표준 API**: 연결·SQL 실행·결과 처리 방식 통일. DB 교체 시 **URL과 드라이버만 변경**. (전략 패턴/인터페이스 사상)
- **JDBC가 해결 못 하는 것**: SQL **문법 차이**(LIMIT vs ROWNUM, AUTO_INCREMENT vs SEQUENCE)는 그대로. → 상위 프레임워크(JdbcTemplate, JPA, MyBatis)가 등장하는 동기.

## 10.2 Connection Pool (매 요청 연결의 비효율 → 풀)

- **로우레벨의 비효율**: DB 연결 1회 = TCP 3-way handshake + 인증 + 세션 생성(수~수백 ms). 매 요청마다 하면 연결 설정이 쿼리보다 더 길 수 있음.
- **Connection Pool**("Connection의 수영장"): 시작 시 N개 미리 생성 → 요청 시 빌림 → 사용 후 반환 → **재사용**. 대표: **HikariCP**(Spring Boot 기본), DBCP2, Tomcat JDBC Pool.
- **DB 세션 매핑**: 풀의 Connection N개 = **DB 세션 N개**. 한 Connection에서 동시 두 트랜잭션 불가.
- **DB Lock**: 트랜잭션 진행 중 다른 세션의 수정을 막음. 공유 락(S, 읽기) / 배타 락(X, 쓰기). (자바 synchronized와 닮은꼴, DB에서도 데드락 발생)

## 10.3 DataSource 추상화

- **로우레벨의 불편함**: 커넥션 획득 방법(`DriverManager` vs HikariCP vs DBCP2)마다 **사용법이 달라** 변경 시 애플리케이션 코드가 다 바뀜.
- **해결**: `javax.sql.DataSource` 표준 인터페이스(핵심 메서드 `getConnection()` 하나). 구현체: `HikariDataSource`, `BasicDataSource`, `DriverManagerDataSource`.
  ```java
  @Autowired private DataSource dataSource;  // 인터페이스 의존
  Connection c = dataSource.getConnection(); // 어떤 구현체든 OK
  ```
- HikariCP → DBCP2 변경 시 **설정만**, 코드 그대로. (= **DIP**의 구현, PART 8 ConnectionMaker와 같은 사상)
- **DriverManagerDataSource**: DriverManager를 DataSource로 감싼 어댑터. 테스트·학습용(풀 없어서 프로덕션 금지).

## 10.4 트랜잭션과 ACID (★ 면접 단골)

- **트랜잭션**: 한 단위로 취급되는 작업 묶음(계좌 이체 = 출금 + 입금). 끝은 **Commit**(영구 적용) 또는 **Rollback**(취소).
- **A**tomicity(원자성): 모두 성공 or 모두 실패. (자바 Atomic은 변수 하나, DB Atomicity는 **여러 작업 묶음**)
- **C**onsistency(일관성): 완료 후 제약조건(NOT NULL/UNIQUE/FK/비즈니스 규칙)이 항상 지켜짐.
- **I**solation(격리성): 각 트랜잭션은 독립 실행. 격리 수준: READ UNCOMMITTED → READ COMMITTED → REPEATABLE READ → SERIALIZABLE(높을수록 안전·느림). Dirty Read 등.
- **D**urability(지속성): Commit된 데이터는 영구 보존(WAL, fsync). 시스템 다운에도 생존.
- **Commit 이전 격리**: 세션1이 변경(commit X)해도 세션2는 변경 전 데이터를 봄. commit해야 세션2도 확인. (비유: 각자 노트북 → 클라우드 저장)

## 10.5 JdbcTemplate (반복 제거)

- **로우레벨의 고통**: 매 쿼리마다 try/catch/finally + Connection·Statement·ResultSet close 반복. 자원 해제 코드가 본 로직보다 길고, close 누락 시 누수.
- **JdbcTemplate** = PART 8의 **템플릿 메소드 + 전략 패턴**의 실제 구현. Connection 획득/반환·PreparedStatement·ResultSet·예외 처리를 **숨김**. 개발자는 SQL·파라미터·결과 매핑만.

```java
@Autowired private JdbcTemplate jdbcTemplate;
List<Customer> list = jdbcTemplate.query(sql, new Object[]{age},
    new BeanPropertyRowMapper<>(Customer.class));
```

- **핵심 메서드**: `update`(INSERT/UPDATE/DELETE, 영향 행 수), `queryForObject`(단일 행), `query`(여러 행), `execute`(DDL).
  - `queryForObject` 0건 → `EmptyResultDataAccessException`, 2건+ → `IncorrectResultSizeDataAccessException`.
- **RowMapper**: ResultSet 한 행 → 객체. **함수형 인터페이스라 람다로**(PART 5). `BeanPropertyRowMapper`는 컬럼명↔필드명(snake↔camel) 자동 매핑.
- **구조적 의미**: 관심사 분리 + 템플릿 메소드 + 전략 패턴 + OCP + DI + 람다의 집약체. → "좋은 라이브러리는 좋은 OOP 원칙의 집약체".

---

# 📚 PART 11 — ORM/JPA와 트랜잭션 추상화

> **목표**: JdbcTemplate(SQL Mapper)보다 한 단계 높은 추상화(ORM). 그리고 트랜잭션을 어노테이션 한 줄로 줄이는 마지막 진화(@Transactional, AOP의 첫 만남).

## 11.1 SQL JOIN (관계형 DB의 본질)

- **왜 JOIN인가**: 관계형 DB는 **정규화**로 중복 제거 → 정보가 여러 테이블에 분산 → 합치려면 JOIN.

| JOIN | 의미 |
|---|---|
| INNER | 양쪽 공통 행만(교집합) |
| LEFT | 왼쪽 전부 + 매칭(없으면 NULL) |
| RIGHT | 오른쪽 전부 + 매칭 |
| FULL OUTER | 양쪽 전부(합집합), MySQL은 미지원 → LEFT UNION RIGHT |

- 실무: **LEFT JOIN이 가장 빈번**, INNER는 집계, RIGHT는 거의 안 씀. "부서 없는 직원" = LEFT JOIN + WHERE NULL.
- ON 조건 ≠ WHERE 조건(OUTER JOIN에서 다름).

## 11.2 ORM 패러다임 (객체-관계 미스매치)

- **로우레벨의 불편함**: 객체(OOP)와 관계형 DB는 다른 패러다임. 이 차이를 메우는 코드를 매번 손으로 쓰는 게 고통.

| 측면 | 객체 | 관계형 DB |
|---|---|---|
| 모델링 | 상태+행동 | 행과 열 |
| 상속 | 있음 | 없음(SINGLE_TABLE/JOINED/TABLE_PER_CLASS로 표현) |
| 연관 | 참조(`order.member`) | 외래 키 |
| 식별 | == | PK |

- **ORM**: 객체는 객체대로, DB는 DB대로 설계하고 **프레임워크가 중간에서 매핑**. (Java: Hibernate, EclipseLink) SQL을 완전 대체하진 않음(복잡 쿼리는 여전히 SQL). 단점: 학습곡선, N+1, 튜닝 어려움.

## 11.3 JPA 입문

- **SQL Mapper(JdbcTemplate/MyBatis)의 한계**: 자원·매핑은 자동화했지만 **SQL은 여전히 직접 작성**, 객체 그래프 수동.
- **JPA(Java Persistence API)** = 자바 ORM 표준 인터페이스. 구현체 **Hibernate**. 어노테이션 매핑, **SQL을 JPA가 대신 작성**.

| | SQL Mapper | JPA |
|---|---|---|
| SQL | 개발자 | 자동 생성 |
| 매핑 | RowMapper 수동 | 어노테이션 선언 |
| 객체 그래프 | 수동 | 자동(Lazy Loading) |
| 학습곡선 | 낮음 | 높음 |

- **동작 위치**: Application → **JPA(Hibernate)** → JDBC → DB. JPA도 내부적으로 JDBC·DataSource·HikariCP를 그대로 사용.
- **생태계**: **Spring Data JPA**(`Repository` 인터페이스만 만들면 `findByName` 같은 메서드 이름으로 쿼리 자동 생성), **Querydsl**(타입 안전 동적 쿼리, 컴파일 시점 오류 검출). 실무 표준 조합: **Spring Data JPA + Querydsl**.

## 11.4 JPA 엔티티 매핑

- **@Entity**: JPA 관리 객체 표시. 조건: 어노테이션, **기본 생성자 필수**(리플렉션 생성), **final 금지**(프록시).
- **@Id**: PK 매핑(반드시 1개 또는 복합 키).
- **@GeneratedValue**: PK 생성 전략

| 전략 | 동작 | 적합 DB |
|---|---|---|
| IDENTITY | auto_increment | MySQL, PostgreSQL |
| SEQUENCE | 시퀀스 객체 | Oracle, PostgreSQL |
| TABLE | 키 생성 테이블 | 모든 DB(느림) |
| AUTO | 자동 선택 | 기본값 |

- IDENTITY는 INSERT 후에야 ID를 앎(배치 INSERT 불가), SEQUENCE는 미리 받아둬 빠름.
- **@Column**: `name/length/nullable/unique/columnDefinition`. Spring Boot는 camelCase ↔ snake_case **자동 변환**(SpringPhysicalNamingStrategy)이라 `@Column(name="item_name")` 생략 가능.

## 11.5 트랜잭션 추상화의 진화 (수동 → PlatformTransactionManager → @Transactional)

**① 수동 트랜잭션의 한계 (로우레벨)**
- 원자성 보장하려면 출금·입금이 **같은 Connection**이어야 함 → Connection을 비즈니스 로직에 **파라미터로 전달** → 추상화 깨짐.
- **3가지 함정**: 트랜잭션 누수(setAutoCommit/commit/rollback 반복), 예외 누수(SQLException 전파), JDBC 반복.

```java
conn.setAutoCommit(false);
try { ...; conn.commit(); }
catch (Exception e) { conn.rollback(); throw e; }
finally { conn.close(); }
```

**② PlatformTransactionManager (인터페이스 추상화)** — PART 10 DataSource와 같은 사상
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
- **집약**: PART 8 OOP 원칙(템플릿 메소드/전략/OCP/DI) + PART 10 PlatformTransactionManager + 프록시(AOP) → **어노테이션 한 줄**. → 이 "프록시"의 정체가 **PART 12**다.

---

# 📚 PART 12 — 프록시의 진화와 Spring AOP

> **목표**: PART 11에서 "@Transactional은 프록시"라고만 했던 그 프록시가 **어떻게 만들어지고 적용되는지**의 모든 메커니즘. 자바·Spring 학습의 하이라이트. 김영한 *스프링 핵심 원리 고급편*의 압축.

## 12.1 AOP의 동기 — 흩어진 관심사 (로그 추적기)

- **핵심 관점**(비즈니스 로직) vs **부가 관점**(로깅·트랜잭션·보안·캐싱)을 나눠 본다. 부가 관점은 여러 클래스에 반복 등장하는 **흩어진 관심사(Cross-cutting Concerns)** — OOP만으로 깔끔히 분리하기 어렵다.
- **로우레벨의 고통**: 로그 추적기(호출 깊이·실행 시간·예외 추적)를 넣으려면 **모든 메서드에 try-catch + 로그 시작/종료 코드**를 박아야 한다. 100개 메서드면 100군데 수정 = "배보다 배꼽".
- 변하지 않는 것(로그 시작/종료·시간 측정) vs 변하는 것(비즈니스 로직)의 분리가 핵심 → 이게 AOP가 풀려는 문제.

## 12.2 ThreadLocal — 싱글톤 환경의 동시성 해결

- **문제**: 로그 추적기는 싱글톤 빈. 여러 요청이 동시에 같은 인스턴스의 상태(트랜잭션 ID·호출 깊이)를 변경 → **서로 섞임**.
- **ThreadLocal**: 각 스레드마다 독립 저장소 제공(synchronized 없이 안전). `set/get`은 그 스레드만 본다. (PART 7 동시성 + PART 8 싱글톤과 직결)
- **⚠️ 치명적 함정 — `remove()` 필수**: 스레드 풀에서 스레드가 **재사용**되므로 값이 남아있으면 다음 요청에 **이전 사용자 데이터 노출**(보안 사고). 반드시 `finally`에서 `remove()`.

## 12.3 디자인 패턴의 진화 — 템플릿 메서드 → 전략 → 템플릿 콜백

> PART 8에서 본 패턴들의 재등장. 여기에 **콜백**이 신규로 더해진다.

- **템플릿 메서드 패턴**: 슈퍼클래스에 변하지 않는 흐름, 변하는 부분만 자식 구현. **한계 = 상속의 강한 결합**(부모에 의존, 작업마다 클래스/익명클래스 필요).
- **전략 패턴**: 상속 대신 **합성(위임)**. Context는 Strategy 인터페이스에만 의존(= DI). 람다로 간결.
- **템플릿 콜백 패턴**(스프링 전용 용어): 전략을 **실행 시점에 파라미터로** 전달. `Context→Template`, `Strategy→Callback`. **콜백** = 인수로 넘겨 나중에 호출되는 실행 코드. → Spring의 `JdbcTemplate`·`RestTemplate`·`TransactionTemplate` 등 **`XxxTemplate` 시리즈**가 모두 이 패턴.
- **공통 한계**: 이 모든 방법은 결국 **원본 코드를 수정해야** 한다. → 프록시 등장.

## 12.4 프록시 개념과 조건

- **프록시(대리인)**: 클라이언트와 실제 객체 사이의 중간 객체. 클라이언트는 프록시를 호출 → 프록시가 부가 기능 후 실제 객체에 위임.
- **조건**: 클라이언트가 서버인지 프록시인지 몰라야 함 → **서버와 프록시가 같은 인터페이스 구현** + **DI로 주입** → 클라이언트 코드 변경 0.
- **기능 2가지**: 접근 제어(권한·캐싱·지연 로딩) / 부가 기능(로그·시간 측정).

## 12.5 프록시 패턴 vs 데코레이터 패턴 (의도로 구분)

- **모양은 같고 의도가 다르다.** 프록시 패턴 = **접근 제어**(캐시·권한·지연 로딩), 데코레이터 패턴 = **기능 추가**(로깅·꾸미기·시간 측정).
- 자바 I/O의 `BufferedReader`/`InputStreamReader`(PART 6)가 데코레이터의 대표 사례.

## 12.6 동적 프록시 — Reflection → JDK 동적 프록시 → CGLIB

> **로우레벨의 고통**: 수동 프록시는 적용 대상 100개면 거의 같은 프록시 클래스 100개. 유지보수 지옥.

- **Reflection**(출발점): `method.invoke(target)`로 어떤 메서드든 동적 호출. 유연하지만 **컴파일 시점 오류 검출 불가** → 프레임워크 개발용.
- **JDK 동적 프록시**(인터페이스 필수): `InvocationHandler` 하나로 프록시 클래스를 **런타임 자동 생성**(`$Proxy1`). 구현체가 100개여도 핸들러 1개.
- **CGLIB**(구체 클래스 가능): **바이트코드 조작**으로 구체 클래스를 **상속**해 프록시 생성(`MethodInterceptor`). 인터페이스 없어도 OK. `final` 클래스/메서드엔 불가(상속 불가). → PART 14 JPA 프록시, 엔티티 final 금지의 이유와 연결.

| | JDK 동적 프록시 | CGLIB |
|---|---|---|
| 전제 | 인터페이스 필요 | 구체 클래스로 OK |
| 방식 | 인터페이스 구현 | 클래스 상속 |
| 핸들러 | `InvocationHandler` | `MethodInterceptor` |

## 12.7 ProxyFactory — JDK/CGLIB 통합 + Advisor (★ 정점)

- **ProxyFactory**: 인터페이스 있으면 JDK, 구체 클래스면 CGLIB **자동 선택**(`proxyTargetClass=true`면 강제 CGLIB). **Spring Boot는 기본 CGLIB**(일관성).
- **Advice 추상화**: JDK(`InvocationHandler`)와 CGLIB(`MethodInterceptor`)를 개념적으로 통합. 개발자는 `org.aopalliance.intercept.MethodInterceptor`의 `invoke(MethodInvocation)`에서 `invocation.proceed()`만 감싸면 됨.
- **3대 개념** ⭐:

| 용어 | 의미 |
|---|---|
| **Pointcut** | "어디에" 적용할지 (필터링) |
| **Advice** | "어떤 로직"(부가 기능) |
| **Advisor** | Pointcut + Advice |

- 실무 표준 Pointcut: **`AspectJExpressionPointcut`**. 예: `execution(* hello.proxy.app..*(..))`.
- **Spring AOP 최적화**: target 1개당 **프록시 1개 + 어드바이저 N개**(여러 AOP 동시 적용해도). 순서는 등록 순서 / `@Order`.

## 12.8 빈 후처리기와 자동 프록시 생성기

- **로우레벨의 고통**: 빈 100개에 일일이 프록시 설정 = 설정 지옥. + `@Service`·`@Repository`로 **컴포넌트 스캔된 실제 객체**는 프록시로 바꿀 방법이 없음.
- **BeanPostProcessor**: 빈을 컨테이너 등록 **직전에 가로채** 객체를 교체/조작 → **프록시로 바꿔치기** 가능.
- **AnnotationAwareAspectJAutoProxyCreator**(`spring-boot-starter-aop`가 자동 등록하는 빈 후처리기): 등록된 모든 `Advisor`를 찾아 각 빈의 Pointcut 매칭 시 **프록시로 교체**. 이름 = Annotation 인식 + AspectJ 표현식 + AutoProxyCreator.

## 12.9 @Aspect와 AOP 용어 7가지

- **@Aspect**: AspectJ 어노테이션을 Spring이 차용. `@Aspect` 클래스 → **Advisor 자동 변환**. 단 **자동 빈 등록은 아님**(`@Component`/`@Bean`/`@Import` 필요).
- `@Around`(어드바이스+포인트컷), `ProceedingJoinPoint.proceed()`로 target 호출.

| 용어 | 의미 |
|---|---|
| 조인 포인트(Join point) | 부가 기능을 적용할 수 있는 **모든 지점** |
| 포인트컷(Pointcut) | 조인 포인트 중 **실제 적용할 곳 선택** |
| 어드바이스(Advice) | 적용할 **부가 기능** |
| 애스펙트(Aspect) | 포인트컷 + 어드바이스의 모듈 |
| 타겟(Target) | 부가 기능이 적용되는 실제 객체 |
| 위빙(Weaving) | 포인트컷으로 어드바이스를 결합(Spring AOP는 빈 후처리 시점) |
| AOP 프록시 | JDK 동적 프록시 또는 CGLIB |

- **AOP는 OOP를 대체하지 않고 보조한다**(횡단 관심사). 남용하면 흐름 추적·디버깅이 어려워짐.

## 12.10 어드바이스 5종 + @Pointcut 분리

- **@Around가 가장 강력**(전후 + 예외 + proceed 호출 여부 제어 + 반환/예외 변환). 나머지는 단순 케이스용: `@Before`, `@AfterReturning`, `@AfterThrowing`, `@After`(finally).
- `@Pointcut`으로 시그니처 분리 → 여러 어드바이스가 재사용(DRY). 별도 `Pointcuts` 클래스로 모으고 `&&`/`||`/`!`로 조합.

## 12.11 AspectJ vs Spring AOP

- **AspectJ**: 자체 컴파일러·문법, 기능 강력. AOP 적용 시점이 **컴파일/클래스 로딩 시점**.
- **Spring AOP**: AspectJ **문법만 차용**, **런타임 프록시 방식**. 별도 컴파일러 불필요. 메서드 조인 포인트만 지원.
- **중요 귀결**: Spring AOP는 항상 프록시를 거쳐야 하므로 **내부 호출(internal call)을 못 가로챈다**(PART 13.3). AspectJ 컴파일 방식은 이 문제가 없다.

---

# 📚 PART 13 — 트랜잭션 심화 (전파 · 격리 · 라이프사이클 함정)

> **목표**: PART 11에서 입문한 @Transactional을, PART 12의 AOP 메커니즘 위에서 끝까지 판다. 면접·실무에서 가장 자주 부딪히는 영역.

## 13.1 @Import — 설정 클래스 결합

- 여러 `@Configuration`을 한 곳에서 결합(`@Import({A.class, B.class})`). `@ComponentScan`(자동)과 달리 **명시적**. 컴포넌트 스캔 대상 밖(외부 라이브러리 `@Configuration`, 테스트 전용 빈) 등록에 사용. `@EnableXxx`도 내부적으로 @Import 활용.

## 13.2 선언적 vs 프로그래밍 + 프록시 도입 전후

- **선언적**(`@Transactional`): 어노테이션 한 줄, 간편하나 함정 많음. **프로그래밍**(`TransactionTemplate`): 세밀 제어, 단 비즈니스 로직과 기술 코드 강결합. → **선언적이 거의 표준**.
- **프록시 도입 전**: 서비스 안에 `getTransaction/commit/rollback` try-catch가 비즈니스 로직과 뒤섞임(PART 11.5의 수동 코드). **프록시 도입 후**: 트랜잭션 프록시가 그 책임을 모두 가져가고 서비스엔 **순수 비즈니스 로직만** 남음. 이게 가능한 건 PART 12의 빈 후처리기 + AnnotationAwareAspectJAutoProxyCreator 덕분.

## 13.3 Internal call 함정 (★★★ 면접 단골)

- **시나리오**: `@Transactional` 없는 `external()`이 같은 클래스의 `@Transactional internal()`을 `this.internal()`로 호출 → `this`는 프록시가 아닌 **target** → **@Transactional 무시**.
- **본질**: "프록시는 외부 호출은 가로채지만 **내부 호출(this)은 가로채지 못한다**."
- **해결**: `@Transactional` 메서드를 **별도 빈으로 분리**(다른 클래스 호출은 프록시를 거침). SRP 관점에서도 더 나음. (AspectJ 컴파일 방식이면 이 문제 없음.)

## 13.4 @PostConstruct + @Transactional 함정 (internal call의 짝)

- **@PostConstruct**: DI 완료 직후 실행(캐시 초기 로딩 등). 생성자에선 의존성이 미완이라 못 함.
- **함정**: `@PostConstruct` + `@Transactional` → **트랜잭션 적용 안 됨**. @PostConstruct는 빈 후처리기(자동 프록시 생성)가 동작하기 **이전**에 실행 → 그 시점엔 **프록시가 아직 없음**.
- **해결**: `@EventListener(ApplicationReadyEvent.class)` + `@Transactional` → 컨테이너 완성 후(모든 빈 프록시 교체 완료) 실행되어 정상 동작. (대안: `ApplicationRunner`, 별도 트랜잭션 빈 분리.)

| 함정 | internal call (13.3) | @PostConstruct (13.4) |
|---|---|---|
| 본질 | 프록시를 거치지 않는 호출 | 프록시가 아직 안 만들어짐 |
| 시점 | 런타임 this 호출 | 빈 초기화 시점 |
| 해결 | 클래스 분리 | ApplicationReadyEvent |

→ **두 함정은 "프록시 없음"이라는 한 본질의 두 얼굴**. 함께 외운다.

## 13.5 트랜잭션 전파 (Propagation)

- **전파** = "이미 진행 중인 트랜잭션이 있을 때 새 요청을 어떻게?"
- **REQUIRED(기본)**: 있으면 참여, 없으면 새로 시작. 외부+내부가 **하나의 물리 트랜잭션**으로 묶임. 내부의 commit/rollback은 **논리적**, 실제 물리 commit/rollback은 **외부에서만**.
- **내부 롤백의 함정**: 내부가 rollback하면 트랜잭션 동기화 매니저에 `rollbackOnly=true` 표시 → 외부가 commit 시도하면 rollbackOnly 발견 → 롤백 실행 + **`UnexpectedRollbackException`**. ("논리 하나라도 롤백되면 물리는 롤백.")
- **REQUIRES_NEW**: 항상 새 물리 트랜잭션, 외부와 완전 분리(내부 롤백이 외부에 영향 X). **⚠️ 주의**: 동시에 2개 커넥션 사용 → 커넥션 풀 고갈 위험.
- 전파 7옵션: REQUIRED / REQUIRES_NEW / SUPPORT / NOT_SUPPORT / MANDATORY / NEVER / NESTED(Savepoint). 실무는 **REQUIRED·REQUIRES_NEW** 중심.

## 13.6 트랜잭션 격리 수준 (PART 10.4 ACID의 'I' 심화)

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

# 📚 PART 14 — JPA 심화 (영속성 컨텍스트 · 연관관계 · N+1)

> **목표**: PART 11에서 입문한 JPA의 **모든 메커니즘**. 영속성 컨텍스트가 왜 강력한지, 연관관계와 N+1을 어떻게 다루는지. **SQL 로그를 켜고 학습해야 체화됨**.

## 14.1 SQL Mapper의 역사 → ORM (왜 JPA인가)

- **iBatis → MyBatis**: SQL을 XML/어노테이션으로 분리 + 결과 매핑 자동화. 위치는 JdbcTemplate과 동일한 **SQL Mapper**.
- **SQL Mapper의 한계(로우레벨)**: 자원 관리·결과 매핑은 자동이지만 **SQL은 여전히 직접 작성**, 객체-관계 매핑은 수동.
- **ORM의 시각**: "객체를 다루세요, SQL은 제가 만들겠습니다." 객체-관계 패러다임 불일치(모델링·상속·연관·식별·타입)를 ORM이 자동 번역.

| | SQL Mapper(MyBatis/JdbcTemplate) | ORM(JPA/Hibernate) |
|---|---|---|
| 매핑 | SQL ↔ 객체 | 객체 ↔ 테이블 |
| SQL | 개발자 | JPA 자동 생성 |
| 복잡 통계 | 자유 | 어려움(JPQL/네이티브 필요) |

## 14.2 JPA = 표준 명세, Hibernate = 구현체

- **JPA**는 인터페이스 명세(`EntityManager` 등)일 뿐, 직접 동작 안 함. 구현체는 **Hibernate**(~95%), EclipseLink 등. `spring-boot-starter-data-jpa`가 Hibernate 자동 설정.
- 계층: `App → JPA(jakarta.persistence) → Hibernate → JDBC → DB`. JPA도 내부적으로 JDBC·DataSource·HikariCP를 그대로 사용.
- **Spring Data JPA**는 그 위 추상화(Repository 인터페이스).

## 14.3 엔티티 매핑 심화

- **@Entity 조건**: ① **기본 생성자 필수**(리플렉션 생성) ② `@Id` 식별자 ③ `final` 클래스/필드 금지(프록시=CGLIB 상속, PART 12.6) ④ enum/interface/inner 불가.
- **@Table / @Column**: 클래스명·필드명 자동 매핑, Spring Boot는 camelCase ↔ snake_case 자동 변환.
- **임베디드 타입(`@Embeddable`/`@Embedded`)**: 여러 필드를 한 값 객체로 묶음(주소·금액·연락처). **불변 권장**(가변이면 공유 시 부작용). 같은 타입 여러 번이면 `@AttributeOverrides`. (일종의 반정규화 — PART 15.2와 연결)
- **`ddl-auto`**: `create/create-drop/update`(데이터 손실 위험, **운영 금지**), `validate`, `none`. 운영은 **none + Flyway/Liquibase**.

## 14.4 EntityManagerFactory(싱글톤) vs EntityManager(트랜잭션)

- **EMF**: 생성 비용 큼 → **앱 전역 1개(싱글톤)**, Spring Boot 자동 등록.
- **EM**: 영속성 컨텍스트 관리, **트랜잭션 단위**로 생성·소멸. `@Transactional`이 자동 생성·종료. **스레드 안전 X**(트랜잭션마다 별도 인스턴스 → 동시성 회피). 핵심 메서드: `persist/find/getReference/remove/merge/detach`.

## 14.5 영속성 컨텍스트와 엔티티 생명주기

- **영속성 컨텍스트**: EM 내부의 메모리 공간(엔티티 보관·관리). "JPA의 모든 신기한 동작은 여기서 일어난다."
- **4상태**: **비영속(Transient)**(new, 컨텍스트 X) → `persist/find` → **영속(Managed)** → `detach/clear/close` → **준영속(Detached)**; `remove` → **삭제(Removed)**. `merge`로 준영속 → 영속.
- `detach`(컨텍스트만 분리, DB 그대로) ≠ `remove`(커밋 시 DB 삭제).

## 14.6 영속성 컨텍스트의 4대 장점 (★ 정점)

1. **1차 캐시**: 같은 트랜잭션 내 `find` 재조회 시 SQL 없이 캐시 반환. 트랜잭션 단위.
2. **동일성 보장**: 같은 ID 조회 시 `==` true(1차 캐시에서 같은 인스턴스). (다른 트랜잭션이면 false → equals/hashCode는 ID 기반으로)
3. **쓰기 지연(Write-Behind)**: `persist` 시 즉시 INSERT 안 하고 SQL 저장소에 모음 → **커밋 시 한꺼번에** 전송(배치 최적화, `hibernate.jdbc.batch_size`). 단 **IDENTITY 전략은 쓰기 지연 불가**(INSERT 후에야 ID).
4. **변경 감지(Dirty Checking)** ⭐⭐⭐: 영속 엔티티의 setter만 호출해도 커밋 시 **스냅샷과 비교** → 차이 있으면 UPDATE 자동 생성. `update()` 호출 불필요. **준영속은 변경 감지 X**.
- **플러시(Flush)**: 변경을 DB에 반영하는 시점 — ① `em.flush()` ② 커밋 직전 ③ **JPQL 실행 직전**(메모리 변경을 먼저 반영해 일관된 결과). 플러시 ≠ 커밋(플러시 후에도 롤백 가능).
- **2차 캐시**(보너스): 앱 전역 공유 캐시(별도 설정, Ehcache/Redis). 동시성 위해 **복사본** 반환. 마스터 데이터에 적합.

## 14.7 연관관계 4가지

- **N:1(`@ManyToOne`)**이 가장 많이 사용. **FK는 항상 N쪽**. 1:1은 자주 조회되는 쪽에 FK.
- **양방향 = 단방향 2개**(객체는 양쪽 참조, DB는 FK 1개) → **연관관계의 주인** 개념 필요.
- **N:M(`@ManyToMany`)은 직접 사용 금지**: 자동 조인 테이블에 부가 정보(수량·일시) 못 넣음 → **중간 엔티티**(예: `MemberProduct`→`Order`)로 1:N + N:1로 풀고 도메인 의미를 부여.

## 14.8 mappedBy와 연관관계의 주인

- 양방향에서 한쪽만 **주인**(FK 관리), 다른 쪽은 `mappedBy`(읽기 전용). 규칙: **N쪽(@ManyToOne)이 주인**, 1쪽이 `mappedBy="주인_엔티티의_필드명"`.
- 주인이 아닌 쪽에서 변경하면 DB 반영 안 됨(디버깅 난점). → **연관관계 편의 메서드**로 양쪽 동시 세팅(1차 캐시 일관성).
- 모범: N쪽 주인 + `fetch=LAZY` + 컬렉션 필드 초기화 + 편의 메서드 + `@ToString`에서 컬렉션 제외(무한 루프 방지).

## 14.9 프록시와 지연/즉시 로딩

- `em.find()`(실제 엔티티, 즉시 SELECT) vs `em.getReference()`(프록시, 필드 접근 시 SELECT). 프록시는 CGLIB로 원본 상속 → 비교는 `instanceof`(== 비교는 false). EM 닫힌 후 프록시 접근 시 `LazyInitializationException`.
- **기본 fetch 전략(외울 것)** ⭐: `@ManyToOne`·`@OneToOne` = **EAGER(위험!)**, `@OneToMany`·`@ManyToMany` = LAZY.
- **실무 결론**: **모든 연관관계를 `fetch=LAZY`로 명시**. EAGER 필요 시 fetch join(아래).

## 14.10 N+1 문제와 해결 (★ 정점)

- **N+1**: 쿼리 1번 후 그 결과만큼 N번 추가 쿼리. **EAGER에서도, LAZY에서도** 발생(LAZY는 getter 호출 시점에 터짐). 단순히 LAZY로 바꾼다고 해결 안 됨 — **JPQL/getter 패턴 자체**가 원인.
- **fetch join이 해결**: 일반 JOIN은 대상만 SELECT(연관은 영속성 컨텍스트에 안 들어와 N+1 여전), **`JOIN FETCH`**는 연관까지 함께 SELECT → 한 방.
- **⚠️ OneToMany + 페이징 + fetch join 함정**: `LIMIT`이 JOIN으로 뻥튀기된 행 수에 적용 → 의도한 부모 개수가 안 나오고, Hibernate가 **전체를 메모리로 로드해 페이징**(OOM 경고). → ManyToOne 페이징은 정상.
- **@BatchSize 해결** ⭐: LAZY 유지 + `IN` 쿼리로 묶어 조회 → N+1 및 OneToMany 페이징 함정 동시 해결. 전역 `default_batch_fetch_size: 100`. (fetch join과 함께 쓰면 BatchSize 무시됨)

| 도구 | 적합 |
|---|---|
| fetch join | ManyToOne 단건, 페이징 없는 컬렉션 |
| @BatchSize | OneToMany + 페이징, 일반 LAZY 최적화 |
| EntityGraph | 동적 fetch 전략 |

## 14.11 CASCADE · orphanRemoval · JPQL · QueryDSL

- **CASCADE**: 부모 작업을 자식에 전파(`ALL/PERSIST/REMOVE/...`). 단일 소유 부모-자식(주문-주문항목)에만. **orphanRemoval**: 컬렉션에서 빠진 자식을 DB 삭제. CASCADE.REMOVE(부모 자체 삭제 트리거) vs orphanRemoval(자식 컬렉션 제거 트리거). 둘 다면 완전한 부모-자식 관리.
- **JPQL**: 테이블이 아닌 **엔티티 대상** 객체지향 쿼리. 복잡 통계는 네이티브 쿼리.
- **QueryDSL**(실무 표준): JPQL을 **자바 코드**로 → **타입 안전(컴파일 시점 오류)**, 자동완성, **동적 쿼리** 강력. 실무 조합 = **Spring Data JPA(단순 CRUD) + QueryDSL(복잡·동적)**.

---

# 📚 PART 15 — 데이터베이스 펀더멘털 (이론)

> **목표**: 그동안 JPA가 추상화해 가려놓았던 **DB 본연의 영역**으로 내려간다. 모델링·정규화·인덱스·옵티마이저·분산이론. 모든 ORM의 기반.

## 15.1 DB 용어와 모델링

- **엔티티(개념, 클래스)** vs **릴레이션(물리, 테이블)**. `@Entity`가 이 둘을 잇는 다리(PART 14.3).
- **어트리뷰트**(열), **차수(Degree)**(열 수, 불변) vs **카디널리티**(행 수, 가변), **도메인**(값의 집합), **튜플**(행).
- **스키마 3계층**: 개념적(ERD) → 논리적(SQL DDL) → 물리적(인덱스·파티션). MySQL은 DB=스키마, PostgreSQL/Oracle은 1 DB → N 스키마.

## 15.2 정규화와 이상 현상 (★ 면접 단골)

- **정규화** = 종속 관계 분석 → 여러 릴레이션으로 분해(중복 제거·이상 현상 방지). 단계: 1NF → 2NF → 3NF → BCNF. 실무는 보통 **3NF/BCNF까지**.
  - **1NF**: 모든 컬럼이 **원자값**(콤마로 여러 값 X).
  - **2NF**: 1NF + **부분 함수 종속 제거**(복합 키의 일부에만 의존하는 속성 분리). 단일 키는 자동 2NF.
  - **3NF**: 2NF + **이행 함수 종속 제거**(A→B→C).
  - **BCNF**: 3NF + **모든 결정자가 후보 키**.
- **3가지 이상 현상**(근본 원인 = 서로 다른 의미가 한 테이블에): **삽입**(불필요 데이터 강제), **갱신**(여러 레코드 수정, 일부 누락 시 불일치), **삭제**(의도치 않은 데이터까지 삭제). → 정규화가 해결.
- **반정규화**: 성능 위해 의도적 중복 허용(읽기 多·통계 마트). **정규화 후 반정규화** 원칙. (임베디드 타입이 일종의 반정규화)

## 15.3 SQL Injection

- **원리**: 문자열 결합 쿼리에 `' OR '1'='1` 같은 SQL 주입 → 쿼리 조작(데이터 탈취·삭제·권한 우회).
- **방어 — Prepared Statement(`?` 바인딩)** ⭐: 쿼리 미리 컴파일 → 입력은 **데이터로만** 처리(SQL 키워드 X). **JPA는 파라미터 바인딩으로 자동 적용**. 다층 방어: Prepared Statement + 입력 검증 + 에러 숨김 + 최소 권한 + WAF. (단 동적 테이블/컬럼명은 여전히 위험)

## 15.4 RDBMS vs NoSQL

- **RDBMS**: 테이블 + 관계, 5제약(PK/FK/UNIQUE/NOT NULL/CHECK), SQL, ACID. **Scale-Up(수직)** 선호(ACID·JOIN 유지가 분산에서 어려움).
- **로우레벨의 한계 → NoSQL**: 스키마 변경 비용, JOIN 복잡, 단일 서버 한계, ACID 성능 비용. **NoSQL = Not Only SQL**: 유연한 스키마, **Scale-Out(수평)**, JOIN 회피, **BASE 모델**.

| 유형 | 대표 | 사례 |
|---|---|---|
| Key-Value | **Redis**, DynamoDB | 캐시·세션 |
| Document | **MongoDB** | 가변 구조 |
| Column-Family | Cassandra, HBase | 대량 시계열 |
| Graph | Neo4j | 관계 분석 |

- **Replication**: Master(쓰기) + Slave(읽기) → 읽기 분산. **Redis**: 메모리 기반 Key-Value, 캐싱·세션·분산 락·랭킹. 마스터 데이터 캐싱에 적합.

## 15.5 분산 시스템 이론 + 락

- **BASE**(ACID의 반대 철학): Basically Available · Soft state · **Eventually consistent**. SNS·로그·검색에 적합.
- **CAP**: Consistency·Availability·Partition tolerance 중 **2개만**. 현실 분산은 **P가 필수** → 실제 선택은 **CP(MongoDB) vs AP(Cassandra/DynamoDB)**. 단일 RDBMS = CA.
- **PACELC**: 장애 시(PA/PC) + **정상 시(EL/EC, 지연 vs 일관성)**까지 확장. MySQL=EC, 캐시=EL.
- **락**: **공유 락(S, 읽기)** — S끼리 호환, X와 충돌 / **배타 락(X, 쓰기)** — 모두와 충돌. JPA `@Lock(PESSIMISTIC_READ/WRITE)`. 격리 수준과 직결. 비관적 락 vs 낙관적 락.

## 15.6 옵티마이저 (DB의 두뇌)

- **옵티마이저**: SQL의 최저 비용 실행 계획 생성. **RBO(규칙 기반)** → **CBO(비용 기반, 통계 활용, 현대 표준)**.
- **6단계**: Parser → Query Transformer(서브쿼리→JOIN) → Estimator(통계로 비용 계산) → Plan Generator → Row-Source Generator → SQL Engine.
- **통계 정보**가 핵심 입력 — 오래되면 잘못된 선택(좋은 인덱스 두고 Full Scan). 대량 변경 후 `ANALYZE TABLE`.
- **옵티마이저 힌트**(`/*+ INDEX(t idx) */` 등)·모드(FIRST_ROWS/ALL_ROWS). 남용 주의.

## 15.7 인덱스 (★ 정점)

- **logN의 위력**: N=100만일 때 O(N)=100만, O(logN)≈20 → **5만 배**. 큰 N일수록 인덱스 효과 폭발.
- **인덱스 = 정렬된 별도 자료구조 + 포인터**. Full Scan O(n) → **B-tree** O(logN). WHERE 검색·정렬/그룹핑 가속. PK는 자동 인덱스.
- **B-tree 동작**: 인덱스 테이블에서 이진 탐색으로 값 찾고 포인터로 원본 행 접근.
- **멀티컬럼 인덱스 (a, b) — 왼쪽 컬럼 우선** ⭐: a로 먼저 정렬 후 a 내에서 b 정렬. `WHERE a=7 AND b=95`✅, `WHERE a>5`✅, `WHERE b=95`❌(a로 분산 → Full Scan과 다름없음). 카디널리티 낮은 컬럼(상태값)은 인덱스 효과 적음.

## 15.8 EXPLAIN · 인덱스 힌트 · Covering Index

- **EXPLAIN**: 실행 계획 확인. `type`(접근 방식, 좋은 순 `const > eq_ref > ref > range > index > ALL`, **ALL=Full Scan 위험**), `key`(실제 사용 인덱스), `Extra`(`Using index`=Covering, `Using filesort`/`Using temporary`=성능 ↓).
- **인덱스 힌트**: `USE INDEX`(유도) / `FORCE INDEX`(강제) / `IGNORE INDEX`(무시). 우선순위: **ANALYZE → EXPLAIN → 인덱스 추가 → 힌트(마지막)**.
- **Covering Index**: 쿼리에 필요한 모든 컬럼이 인덱스에 포함 → **테이블 접근 불필요**(`Extra: Using index`). `SELECT *`는 이를 깸.
- **인덱스의 비용**: WRITE마다 모든 인덱스 갱신(인덱스 N개=N번 갱신), 추가 저장 공간, 정렬 비용 → **필요한 만큼만**. 중복 인덱스 회피((a,b) 있으면 (a) 불필요). **Full Scan이 나은 경우**: 데이터 적음, 조회 비율 큼(~30%+), 카디널리티 낮음. 대용량 인덱스 추가는 새벽 + 온라인 DDL(`ALGORITHM=INPLACE`).

---

# 📚 PART 16 — 데이터베이스 운영 (타입 · HA · 확장 · SQL 고급)

> **목표**: PART 15(이론)에 이어 **운영 측면** — 데이터 타입, 고가용성, 확장, SQL 고급 도구. DB 영역의 이론+운영을 완성한다.

## 16.1 데이터 타입과 인코딩

- **CHAR(고정, 공백 채움, 빠름)** vs **VARCHAR(가변, 공간 효율)**: 길이 일정한 코드(국가·통화·성별)는 CHAR, 이름·이메일은 VARCHAR.
- **BLOB(이진, 이미지/파일)** vs **TEXT(문자, 긴 글)**: **이미지는 DB가 아닌 S3 등에 저장하고 URL만** 보관.
- **Collation**: 문자열 비교/정렬 규칙. `utf8_general_ci`(대소문자 무시, 기본) vs `utf8_bin`(구분). 대소문자 구분은 `COLLATE utf8_bin` 또는 `BINARY`. 시스템 코드·ID는 구분, 일반 검색은 무시.

## 16.2 DB Clustering (고가용성)

- **로우레벨의 위험**: 단일 서버 다운 = 서비스 전체 중단. **Clustering** = 여러 서버가 하나의 논리적 DB(Scale-Out의 한 형태).
- **Active-Active**(모두 활성, 즉시 Failover·부하 분산, 복잡·고비용) vs **Active-Standby**(Active만 운영, Failover 시간 동안 중단, 저비용).
- **Quorum(과반수 룰)** ⭐: 과반(>50%) 노드 생존 시에만 정상 운영 → **Split Brain 방지**. **최소 3노드 권장**(1개 다운해도 2개로 과반). 2노드는 1노드와 다를 바 없음. **홀수 노드** 권장(3/5/7). MongoDB·ZooKeeper·etcd 모두 동일 원리.

## 16.3 Replication vs Cluster + PXC + 백업

- **Replication**: Master(쓰기) → Slave(읽기) 단방향 복제. 읽기 부하 분산·백업 격리. 비동기 기본 → **복제 지연**(갓 INSERT한 걸 Slave에서 못 볼 수 있음 → 일관성 중요 조회는 Master). Slave가 Failover 시 Master 되므로 성능 차 크면 위험.

| | Replication | Clustering |
|---|---|---|
| Write | Master만 | 모든 노드 |
| 일관성 | 비동기(지연) | 동기/즉시 |
| Failover | 수동/반자동 | 자동 |
| 목적 | 읽기 성능·백업 | 고가용성·즉시 Failover |

- **PXC(Percona XtraDB Cluster)**: MySQL 호환 **Active-Active**(Galera 기반 동기 복제). 모든 노드 R/W, 자동 활용.
- **백업**: **XtraBackup**(Hot Backup, 무중단, 대용량 운영) vs **mysqldump**(논리 SQL 추출, 작은 DB·마이그레이션).

## 16.4 Sharding vs Partitioning

- **Sharding**: 여러 DB 서버로 데이터 분할(샤드 키: Range/Hash/Geographic). **어려움**: 크로스-샤드 JOIN·트랜잭션, 재샤딩 비용, 핫스팟. NoSQL과 궁합 좋음.
- **Partitioning**: **단일 DB 내 한 테이블**을 물리 조각으로(DBMS 자동 라우팅). Range/List/Hash/Key. **Partition Pruning**(조건 일치 파티션만 스캔), 오래된 파티션 `DROP PARTITION` 즉시 삭제.

| | Partitioning | Sharding |
|---|---|---|
| 단위 | 단일 DB 내 테이블 | 여러 DB 서버 |
| 트랜잭션 | 정상 | 분산 어려움 |
| 복잡도 | 낮음 | 높음 |

- **원칙**: **Partitioning 우선, Sharding은 마지막 카드**(보통 Scale-Up + Replica로 충분).

## 16.5 DELETE / TRUNCATE / DROP + ROLLBACK 메커니즘

| | DELETE | TRUNCATE | DROP |
|---|---|---|---|
| 분류 | DML | DDL | DDL |
| 대상 | 특정 행(WHERE) | 모든 행 | 테이블 자체 |
| 속도 | 느림 | 빠름 | 즉시 |
| **ROLLBACK** | **가능** ✅ | 불가 ❌ | 불가 ❌ |
| AUTO_INCREMENT | 유지 | 초기화 | (사라짐) |
| 트리거 | ✅ | ❌ | ❌ |

- **ROLLBACK이 가능한 이유 = UNDO LOG**(변경 전 상태 저장). DELETE는 행마다 UNDO LOG 작성 → 느리지만 롤백 가능. **TRUNCATE/DROP은 DDL이라 자동 커밋** → UNDO LOG 없음 → 롤백 불가.
- **InnoDB 두 로그**: **UNDO LOG**(롤백·MVCC, Before) vs **REDO LOG**(Crash Recovery·Durability, After). MVCC가 PART 13.6 격리 수준의 기반.

## 16.6 SQL 고급 기능 (Trigger · JOIN · VIEW · PROCEDURE)

- **Trigger**: INSERT/UPDATE/DELETE 시 자동 실행(BEFORE/AFTER, OLD/NEW). 감사 로그·자동 계산. **단점**: 숨겨진 동작·디버깅/테스트 어려움 → **간단한 감사 외엔 지양, Spring AOP(PART 12)가 더 나은 대안**.
- **JOIN**: INNER(교집합) / LEFT·RIGHT OUTER(한쪽 전부 + 매칭, 없으면 NULL) / FULL OUTER(합집합, MySQL은 UNION 우회). "주문 안 한 사용자" = `LEFT JOIN ... WHERE B IS NULL`. (PART 11.1, JPQL JOIN과 연결)
- **VIEW**: 데이터 미저장 가상 테이블(쿼리 결과 정의). 복잡 쿼리 단순화·보안(민감 컬럼 제외)·권한 분리. 단 매번 원본 쿼리 실행·인덱스 X(Materialized View 제외).
- **PROCEDURE**: 매개변수 받는 저장 작업(`CALL`). **현대는 사용 감소** — 테스트·버전 관리·포팅·CI/CD 어려움. **비즈니스 로직은 애플리케이션(Spring 서비스)에**, DB는 데이터 저장에 집중. 단 대량 ETL·관리 작업엔 적합.

| | Trigger | VIEW | PROCEDURE |
|---|---|---|---|
| 호출 | 자동(이벤트) | SELECT | CALL(수동) |
| 매개변수 | OLD/NEW | X | ✅ |
| 용도 | 자동 부수 작업 | 가상 테이블 | 명시적 작업 단위 |

---

# 📚 PART 17 — Spring MVC 내부와 REST API

> **목표**: PART 9에서 본 Servlet/웹 인프라를 토대로, 매일 쓰지만 내부는 모르는 **DispatcherServlet의 요청 처리 흐름**과 **REST API 설계**를 정복한다. PART 12의 AOP가 Filter·Interceptor와 어떻게 다른지도 여기서 비로소 제자리를 찾는다.

## 17.1 Servlet의 한계 → Front Controller (왜 DispatcherServlet인가)

**로우레벨의 불편함**: 순수 Servlet은 URL마다 클래스를 만든다. URL이 수백 개면 Servlet이 폭증하고, 인증·로깅 같은 공통 처리가 모든 Servlet에 중복되며, URL 라우팅과 JSON 변환을 전부 수동 작성해야 한다.

**해결 — Front Controller 패턴**: 모든 요청을 한 곳에서 받아 적절한 처리기로 위임한다(전화 교환원 비유). 공통 처리를 한곳에 모으고 라우팅을 중앙화한다. Spring MVC의 **DispatcherServlet**이 정확히 이 역할이며, 그 정체는 **`HttpServlet`을 상속한 평범한 Servlet 하나**다. Spring Boot가 `/` 경로에 자동 등록한다.

위치 그림(요청이 흐르는 순서):
```
[Client] → [Servlet Container(Tomcat)] → [Filter Chain] → [DispatcherServlet]
        → [Interceptor Chain] → [Controller] → [Service/Repository(AOP)] → [DB]
```

## 17.2 DispatcherServlet 9단계 처리 흐름 (★★★ 면접 단골)

```
1. DispatcherServlet  HTTP 요청 수신
2. HandlerMapping     어떤 컨트롤러 메서드인지 탐색
3. HandlerAdapter     그 메서드를 통일된 방식으로 호출
4. Interceptor.preHandle   컨트롤러 호출 전
5. Controller         로직 실행 → (ModelAndView 또는 객체) 반환
6. Interceptor.postHandle  컨트롤러 호출 후, View 렌더 전
7. ViewResolver       View 이름 → View 객체 (REST면 HttpMessageConverter가 객체→JSON)
8. View.render()      HTML/JSON 응답 생성
9. Interceptor.afterCompletion  응답 완료 후(예외 포함)
```
모든 단계가 인터페이스로 추상화돼 빈 등록으로 확장 가능하다는 점이 Spring MVC의 핵심 강점이다.

- **HandlerMapping**: URL+HTTP 메서드 → 컨트롤러 메서드 매핑 테이블. 현대 표준은 `RequestMappingHandlerMapping`(`@GetMapping` 등 스캔). 같은 URL 중복 매핑 시 `AmbiguousMappingException`. 매핑 확인은 Actuator `/actuator/mappings`.
- **HandlerAdapter**(Adapter 패턴): 다양한 형태의 핸들러를 한 방식으로 호출. `RequestMappingHandlerAdapter`가 표준. 내부에서 **ArgumentResolver**가 `@PathVariable`/`@RequestParam`/`HttpServletRequest`/`@AuthenticationPrincipal` 등 파라미터를 타입별로 추출 — 커스텀 ArgumentResolver로 확장 가능(예: 인증 사용자 자동 주입).
- **HandlerInterceptor** 3메서드: `preHandle`(false 반환 시 컨트롤러·이후 인터셉터 모두 중단), `postHandle`, `afterCompletion`. 등록은 `WebMvcConfigurer.addInterceptors`로 `addPathPatterns`/`excludePathPatterns`.

## 17.3 요청 데이터 바인딩

| 어노테이션 | 추출 위치 | 용도 |
|---|---|---|
| `@PathVariable` | URL 경로 `/users/{id}` | 리소스 식별자 |
| `@RequestParam` | 쿼리/폼 `?name=` | 검색 조건·필터 |
| `@RequestBody` | HTTP body(JSON) | 복잡한 객체(POST/PUT) |
| `@ModelAttribute` | 쿼리+폼 → 객체 바인딩 | GET 다중 검색 조건 |

- **HttpMessageConverter**: `@RequestBody`/`@ResponseBody`의 실체. `MappingJackson2HttpMessageConverter`가 Jackson `ObjectMapper`로 JSON↔객체 변환. `JavaTimeModule`(LocalDateTime), `Include.NON_NULL` 등 커스터마이즈. **JPA Lazy 프록시를 그대로 직렬화하면 `LazyInitializationException`·무한 루프** → DTO 변환 / `@JsonIgnore` / fetch join으로 해결(PART 14 연결).
- **Content Negotiation**: `Accept` 헤더로 응답 형식 결정. `produces`/`consumes`로 명시 가능.

## 17.4 응답 처리 — ViewResolver vs @RestController, ResponseEntity

- **ViewResolver**는 View 이름→View 객체(전통 SSR: Thymeleaf/JSP). SPA+REST 시대엔 거의 안 쓰고 `@RestController`가 ViewResolver를 건너뛰고 HttpMessageConverter로 직접 JSON 변환.
- `@RestController` = `@Controller` + `@ResponseBody`.
- **ResponseEntity**로 상태 코드·헤더·바디 직접 제어:
```java
return ResponseEntity.status(HttpStatus.CREATED)
    .header("Location", "/users/" + saved.getId()).body(saved); // 201
```
표준 코드: 200/201/204, 400/401/403/404/409, 500. (401=인증 실패, 403=권한 없음 — PART 19와 직결)

## 17.5 Filter vs Interceptor vs AOP (★★★ 면접 단골 — 횡단 관심사 3도구)

세 도구는 "공통 처리를 어디서 거느냐"의 위치가 다르다.

| | Filter | Interceptor | AOP |
|---|---|---|---|
| 위치 | DispatcherServlet **외부** | DispatcherServlet **내부** | **메서드 단위** |
| 표준 | Servlet 표준 | Spring | Spring |
| Spring 빈 접근 | 제한적 | 가능 | 가능 |
| Handler 정보 | X | ✅(HandlerMethod) | ✅ |
| req/res 자체 변경 | ✅(Wrapper) | 어려움 | 인자/반환 |
| 적용 단위 | 전역 | URL 패턴 | 메서드 |
| 대표 활용 | Security·CORS·인코딩 | 인증·로깅·Rate Limit | 트랜잭션·비즈 로깅 |

호출 순서: `Filter → Interceptor.preHandle → AOP before → Controller → AOP after → Interceptor.postHandle → afterCompletion → Filter`.
선택 기준: 모든 요청 인코딩/CORS·Security → **Filter**(가장 외곽 차단), URL 패턴별 인증/로깅 → **Interceptor**, 메서드 단위 트랜잭션/감사 로그 → **AOP**(PART 12). 자기 호출 함정도 AOP에 그대로 적용(PART 13.3).

## 17.6 예외 처리와 Bean Validation

- **HandlerExceptionResolver**가 컨트롤러 예외를 위임받아 처리. 핵심은 `@ExceptionHandler`(`ExceptionHandlerExceptionResolver`).
- **`@RestControllerAdvice`** 로 전역 예외 처리 → 모든 컨트롤러 예외를 한곳에서 표준 응답으로.
```java
@RestControllerAdvice
class GlobalExceptionHandler {
  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex){ ... } // 400
  @ExceptionHandler(EntityNotFoundException.class) ... // 404
  @ExceptionHandler(Exception.class) ... // 500 (운영에선 스택트레이스 숨김)
}
```
- **Bean Validation(@Valid)**: `@NotBlank`/`@Size`/`@Email`/`@Min` 등. 컨트롤러 파라미터에 `@Valid` 없으면 검증 안 됨. 실패 시 `MethodArgumentNotValidException`. 중첩 객체·리스트는 `@Valid` 재귀.
- 표준 에러 응답 5요소: `code`(프로그래밍 식별), `message`(사람용), `timestamp`, `path`, `errors`(필드별). 운영에서 스택트레이스·DB 메시지 노출 금지.

## 17.7 REST API 설계

- RESTful 원칙 6가지(Client-Server, Stateless, Cacheable, Uniform Interface, Layered, Code-on-Demand). URL은 **명사·복수형·계층**(`/users/{id}/orders`), 동사는 HTTP 메서드로.
- 메서드↔성공코드: GET 200, POST **201**, PUT 200/204, PATCH 200/204, DELETE **204**.
- **멱등성**: GET·PUT·DELETE 멱등, POST 비멱등(중복 생성 방지엔 Idempotency Key).
- **페이징**: `Pageable`(page/size/sort 자동 바인딩). **Page**(전체 count 쿼리 추가 — 페이지 번호 UI) vs **Slice**(size+1 조회, count 없음 — 무한 스크롤). 대용량 OFFSET 비용은 Cursor 기반(`afterId`)으로. 페이징+`OneToMany` fetch join은 메모리 페이징 위험 → `@BatchSize`(PART 14).
- **문서화**: SpringDoc OpenAPI(`/swagger-ui.html`). 버저닝은 URL Path(`/api/v1`) 방식이 가장 명확.

---

# 📚 PART 18 — 분산 시스템·캐싱·메시징·MSA

> **목표**: PART 1~17이 "하나의 앱 + 하나의 DB"였다면, 여기서부턴 **여러 시스템이 협력**한다. PART 15~16의 CAP·Replication·Quorum 토대 위에 캐싱(Redis)·메시징(Kafka)·MSA를 올린다.

## 18.1 일관성과 합의, 분산 트랜잭션의 진화

- **일관성 5단계**(강→약): Strong → Linearizable → Sequential → Causal → Eventual. 강한 일관성은 모든 노드 동의가 필요해 응답이 느리고, 최종 일관성은 빠르지만 일시적 불일치 허용. 결제·잔액은 Strong, 알림·통계는 Eventual이 적합.
- **합의 알고리즘**: 여러 노드가 한 값에 동의하는 문제(리더 선출·분산 락·설정 동기화의 기반). **Paxos**(난해) → **Raft**(이해 쉽게 재설계: Leader Election + Log Replication, 과반수 commit)가 현대 표준. PART 16 Quorum의 이론적 뿌리. 실사용: etcd, Consul, Kafka KRaft.
- **로우레벨의 불편함 — 2PC**: Coordinator가 Prepare→Commit 2단계로 여러 DB를 ACID로 묶지만, **동기 블로킹·Coordinator SPOF·성능 저하·타임아웃 모호성** 때문에 실용성이 낮다.
- **해결 — Saga**: 여러 로컬 트랜잭션을 연결하고 실패 시 **보상 트랜잭션**으로 되돌림(최종 일관성, 비동기 가능). 구현은 Orchestration(중앙 조율, 명확하나 SPOF) vs Choreography(이벤트 반응, 분산적이나 추적 어려움) — 18.7에서 심화.

## 18.2 캐싱 전략과 함정

- 캐시는 Read-heavy·low-write·약간의 staleness 허용 데이터에 적합. 계층: Browser/CDN/Reverse Proxy/Local(Caffeine)/Distributed(Redis)/DB Buffer Pool.
- **4대 패턴**: **Cache-Aside**(가장 흔함, 읽기 시 miss면 DB→캐시 적재, 쓰기 시 캐시 무효화) / **Write-Through**(캐시+DB 동시, 강한 일관성·쓰기 느림) / **Write-Behind**(캐시 먼저, 비동기 DB 반영, 빠르나 손실 위험 — 로그·카운터) / **Read-Through**(캐시가 직접 DB 로드 — Spring Cache 방식).
- **3대 함정**: **Stampede**(인기 키 만료 순간 동시 miss → Mutex/조기 갱신/TTL Jitter), **Penetration**(없는 키 반복 조회 → Negative Caching/Bloom Filter/입력 검증), **Avalanche**(대량 키 동시 만료 → TTL Jitter/다중 계층/Circuit Breaker).

## 18.3 Redis 본격 (★ 자료구조 도구로 보기)

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

## 18.4 Spring과 Redis 통합

- `@EnableCaching` + `spring.cache.type=redis`. `@Cacheable`/`@CacheEvict`/`@CachePut`은 **AOP로 동작** → **자기 호출 시 안 됨**(PART 13.3 함정 동일), `@CacheEvict`의 트랜잭션 커밋 전 실행(`beforeInvocation`) 일관성 주의.
- 복잡한 자료구조(ZSet 랭킹)·Pub/Sub·분산 락은 **RedisTemplate** 직접 사용. 직렬화는 `StringRedisSerializer`(key) + `GenericJackson2JsonRedisSerializer`(value). 클라이언트는 비동기·스레드 안전한 **Lettuce**가 기본.

## 18.5 메시지 큐와 비동기 통신

- **로우레벨의 불편함 — 동기 호출 체인**: 응답시간이 합산되고, 하위 서비스 다운/지연이 상위까지 전파되며, 호출자가 수신자를 알아야 하는 강결합.
- **해결 — 메시지 큐**: 발행 후 즉시 응답, 소비자 다운 시 큐에 적재, 느슨한 결합, N 소비자 Fan-out. 대가는 즉시 결과 불가(Eventual)·분산 추적 필요.
- 3개념 구분: **Queue**(한 소비자, Point-to-Point) / **Broker Pub/Sub**(여러 소비자) / **Event Streaming**(영속·Replay — Kafka).

| | RabbitMQ | Redis | Kafka |
|---|---|---|---|
| 용도 | 일반 메시징 | 간단·캐시 | 대규모 스트리밍 |
| 영속성 | 옵션 | 옵션(Stream) | 기본 |
| Replay | X | Stream만 | ✅ |

- **전달 보장**: At-most-once / **At-least-once(가장 흔함, 중복 가능→멱등성 필요)** / Exactly-once(어려움). 표준은 **At-least-once + 소비자 멱등성**(처리 이력 키 확인). HTTP 멱등성(PART 17.7)과 같은 원리.

## 18.6 Kafka 아키텍처 (★ 면접 단골)

- **Topic**(논리 분류) → **Partition**(물리 분할, 병렬 단위, 파티션 내부만 순서 보장) → **Offset**(파티션 내 순번, 소비 위치 추적). **Partition Key**(`hash(key)%n`)로 같은 키는 같은 파티션 → 순서 보장. 글로벌 순서가 필요하면 파티션 1개(처리량 제한).
- **Producer acks**: 0(손실 가능) / 1(Leader 확인, 기본) / all(ISR 전부, 안전·느림).
- **Consumer Group**: 한 파티션은 그룹 내 한 소비자만(병렬), 다른 그룹은 같은 메시지 독립 수신(Fan-out). 소비자 추가/제거 시 **Rebalancing**(잠시 중단) — 너무 잦으면 처리량 저하. 파티션 4개에 소비자 6개면 2개는 유휴.
- **Offset 커밋**: Auto(처리 전 커밋→손실 위험) vs **Manual**(poll→process→commitSync, At-least-once).
- **Broker/Replication**: 파티션을 여러 브로커에 복제(Leader-Follower, ISR). 메타데이터 관리가 ZooKeeper → **KRaft**(Kafka 내장 Raft, 단순화)로 이동.

## 18.7 Spring Kafka & MSA

- **Producer**: `KafkaTemplate.send(topic, key, value)`(비동기, `CompletableFuture`). **Consumer**: `@KafkaListener(topics, groupId)`. Manual commit은 `Acknowledgment.acknowledge()`. 직렬화는 JSON(간단) 또는 Avro/Protobuf+Schema Registry(대규모). 에러는 재시도(`DefaultErrorHandler`+`FixedBackOff`)→**DLT**(Dead Letter Topic), 그리고 멱등 처리.
- **Monolith vs MSA**: Monolith는 단순·트랜잭션·디버깅 쉬움(부분 확장·독립 배포 어려움), MSA는 독립 배포·부분 스케일·장애 격리(분산 복잡도·운영 부담·분산 트랜잭션). MSA 신호: 큰 팀·부분만 트래픽 폭증·기술 다양성·배포 빈도 차이·장애 격리 필수. **Modular Monolith**(명확한 모듈 경계)가 현실적 중간 단계.
- **DDD Bounded Context** = 좋은 MSA 분리 단위(같은 단어가 컨텍스트마다 다른 의미 → 별도 모델). 처음엔 같은 DB, 나중에 분리.
- **MSA 핵심 패턴**: **API Gateway**(단일 진입점: 라우팅·인증·Rate Limit — Spring Cloud Gateway, 너무 많은 로직 넣으면 새 Monolith) / **Service Discovery**(Eureka; K8s에선 Service+DNS가 대체) / **Circuit Breaker**(Resilience4j: CLOSED→OPEN→HALF-OPEN, Cascading Failure 방지, Bulkhead로 스레드풀 격리 — PART 7 연결) / **Distributed Tracing**(Trace/Span, Trace ID 헤더 전파 — OpenTelemetry 표준).
- **분산 트랜잭션 패턴**: **Saga Orchestration vs Choreography**(5개 이하면 Choreography, 복잡하면 Orchestration; Choreography는 이벤트 순환 주의) / **Outbox**(DB 저장과 이벤트 발행을 한 트랜잭션으로 — 이중 쓰기 문제 해결, Outbox 테이블에 INSERT 후 폴러/CDC가 발행) / **CQRS·Event Sourcing**(읽기/쓰기 모델 분리, 상태 대신 이벤트 시퀀스 저장 — 강력하나 복잡, "Just Enough Architecture"가 정답인 경우 많음).

---

# 📚 PART 19 — Spring Security (인증·인가·JWT·OAuth2)

> **목표**: PART 17의 Filter가 본격적으로 활약하는 무대. **인증(누구인가) vs 인가(무엇을 할 수 있나)**를 분리하고, Session vs Token, JWT, OAuth2, 웹 보안까지 정복한다.

## 19.1 인증 vs 인가, 인증 방식의 진화

- **Authentication(인증)**: 본인 맞는가 → 실패 시 **401**. **Authorization(인가)**: 그 자원에 접근 가능한가 → 실패 시 **403**. 인증 OK여도 인가 NO 가능. 권한 없는 사용자에게 401을 주면 정보 노출 — 반드시 403.
- **인증 방식 진화**: Basic(Base64=평문, HTTPS 필수) → **Session-Cookie**(서버 상태, 분산 어려움) → **Token/JWT**(Stateless, 분산 적합) → **OAuth2/OIDC**(권한 위임 표준). SPA+REST→JWT, MSA→JWT, 서드파티 통합→OAuth2.

## 19.2 Filter Chain 아키텍처 (★ 정점)

Spring Security는 **Servlet Filter로 동작** → DispatcherServlet 도달 전 차단/통과 결정(가장 외곽).
```
Filter Chain
 └ DelegatingFilterProxy → FilterChainProxy
     ├ SecurityContextPersistenceFilter   (Session↔SecurityContext 복원/저장)
     ├ UsernamePasswordAuthenticationFilter (/login POST 처리)
     ├ BasicAuthenticationFilter
     ├ ExceptionTranslationFilter          (인증→401/로그인, 인가→403)
     └ FilterSecurityInterceptor           (최종 인가 결정)
```
- **DelegatingFilterProxy**: 표준 Filter이나 처리는 Spring 빈으로 위임(DI 사용 가능). **FilterChainProxy**: URL별 적절한 SecurityFilterChain 선택.
- **SecurityContextHolder**: **ThreadLocal 기반**(PART 7) — 어디서나 현재 사용자 접근. 비동기(`@Async`)에서 컨텍스트 손실 주의(전파 필요). 현재 사용자는 `@AuthenticationPrincipal` 또는 `Authentication` 주입으로.
- JWT 사용 시: 커스텀 `JwtAuthenticationFilter`를 `UsernamePasswordAuthenticationFilter` 앞에 추가하고 `SessionCreationPolicy.STATELESS`.

## 19.3 인증 처리 흐름

- **UserDetails / UserDetailsService**: 사용자 정보·조회 추상화(DB·LDAP·외부 API 교체 가능 — Strategy 패턴, PART 8). password는 검증용으로만 노출(응답엔 절대 X).
- **흐름**: Filter가 토큰 생성 → `AuthenticationManager`(ProviderManager) → `DaoAuthenticationProvider`가 `loadUserByUsername` + `PasswordEncoder.matches` → 성공 시 인증 토큰 → SecurityContext 저장.
- **PasswordEncoder**: **BCrypt** 권장(Salt 자동 포함, 의도적으로 느림 → 무차별 대입 방어, strength 조정). MD5/SHA-1 금지. 같은 비밀번호도 매번 다른 해시(Salt).

## 19.4 인가 — URL vs 메서드 보안

- **URL 인가**(`HttpSecurity.authorizeHttpRequests`): `permitAll`/`authenticated`/`hasRole`/`hasAuthority`/`hasAnyRole`. **순서 중요**(구체→일반). Role은 `ROLE_` 접두사 자동, Authority는 그대로.
- **메서드 보안**(`@EnableMethodSecurity`): `@PreAuthorize("hasRole('ADMIN')")`, SpEL로 인자 참조(`#id == authentication.principal.id`), `@PostAuthorize`(반환 객체 검사), `@PreFilter/@PostFilter`(컬렉션). **AOP 기반** → 자기 호출 함정 동일. `@PostFilter`는 DB에서 전부 가져와 필터링하므로 성능 주의.

## 19.5 Session vs Token (★★ 면접 핵심)

| 측면 | Session | JWT |
|---|---|---|
| 상태 | Stateful(서버 보관) | Stateless |
| 저장 | 서버 메모리/Redis | 클라이언트 |
| 확장성 | Sticky/공유 저장소 | 자유 |
| 즉시 폐기 | ✅ | ❌(어려움) |
| 공격 | CSRF 위험 | XSS 위험(저장 위치) |
| 모바일/MSA | 부적합 | 적합 |

- Session 저장소: 메모리(다중 서버 공유 X) / **Redis**(공유·영속) / JDBC. Cookie 보안 속성: **HttpOnly**(XSS 방어)·**Secure**(HTTPS)·**SameSite**(CSRF 방어).
- 선택: 전통 웹 B2C→Session, SPA+REST/모바일/MSA→JWT, 즉시 차단 필수(결제)→짧은 JWT+Refresh 또는 Session.

## 19.6 JWT 완전 정복

- 구조 `Header.Payload.Signature`(Base64URL `.` 구분). Header `alg`: HS256(대칭, 단일 서버) vs **RS256**(비대칭, MSA 권장 — 비밀키 발급·공개키 검증). Payload 표준 Claim: `iss/sub/aud/exp/iat/nbf/jti` + 커스텀. **Payload는 암호화가 아니라 인코딩 → 민감정보 금지**. Signature는 위변조 방지(JWT는 암호화가 아니라 **서명**: 내용은 보이되 변조하면 들킴).
- Java 구현: **JJWT**로 `JwtTokenProvider`(생성/검증) + `JwtAuthenticationFilter`(`OncePerRequestFilter` 상속 — 요청당 1회). 검증은 보통 DB 조회 없이 서명만.
- **Refresh Token 전략**: Access(짧게 15분~1h) + Refresh(길게, Redis/DB 저장 → 즉시 폐기 가능). **Rotation**(사용 시마다 새 Refresh 발급, 옛것 무효 → 탈취 감지). 저장은 Access=메모리, Refresh=HttpOnly Cookie 권장.
- **보안 취약점**: `alg:none` 공격, 알고리즘 혼동(RS256↔HS256), 약한 키(**256비트+**), 탈취(HttpOnly Cookie+HTTPS+짧은 만료), Clock Skew(`clockSkewSeconds`), Payload 민감정보 노출. 검증 시 알고리즘 명시.

## 19.7 OAuth2 / OIDC

- **OAuth2**: 비밀번호 공유 없이 **권한만 위임**(발렛 키 비유). 4역할: Resource Owner(사용자)·Client(앱)·Authorization Server(권한 발급)·Resource Server(보호 자원).
- **Authorization Code Grant**(일반 웹): 로그인 페이지 리다이렉트 → 동의 → Authorization Code(한 번만) → 서버 간 Code↔Token 교환(client_secret 보호) → Access Token으로 API 호출. SPA/모바일은 **PKCE**로 secret 대체.
- **OIDC**: OAuth2(인가) 위에 **인증** 레이어 표준화 → **ID Token(JWT)** + 표준 `/userinfo`. ID Token=사용자 정보, Access Token=API 권한. Spring은 `spring-boot-starter-oauth2-client` + `oauth2Login`. 자체 OAuth2 Server는 보통 Keycloak/Auth0 같은 솔루션 사용.

## 19.8 웹 보안 — CSRF·XSS·CORS

- **CSRF**: 타 사이트가 사용자의 자동 전송 Cookie를 악용해 원치 않는 요청 유발. 방어: CSRF Token·**SameSite Cookie**·**JWT(Authorization 헤더는 자동 전송 X)**. Session+Cookie면 활성화, Stateless API면 비활성화 OK.
- **XSS**: 악성 JS를 타 사용자 브라우저에서 실행(Stored/Reflected/DOM). 방어: **출력 이스케이프**(Thymeleaf 자동, React/Vue 기본), 입력 검증, **CSP**, **HttpOnly Cookie**(Cookie 탈취 방지). JWT를 LocalStorage에 두면 XSS 취약 → HttpOnly Cookie 권장.
- **CORS**: Same-Origin Policy(scheme+host+port) 예외 허용. Simple Request vs **Preflight**(OPTIONS 먼저: `Access-Control-Allow-Origin/Methods/Headers`). `allowCredentials=true`면 `*` 와일드카드 불가 → 명시적 origin. SPA(`localhost:3000`)↔API(`8080`) 분리 시 필수, 같은 도메인+리버스 프록시면 불필요.

---

# 📚 PART 20 — 테스트 심화

> **목표**: PART 9의 테스트 입문을 넘어 "테스트로 설계한다"의 단계로. Mockito·슬라이스·MockMvc·Testcontainers·TDD·품질 도구까지.

## 20.1 테스트 철학

- 작성 이유 4가지: **회귀 방지**(가장 중요), **설계 도구**(테스트하기 어렵다=설계가 나쁘다), **살아있는 문서**, **자신감**(리팩토링 두려움 ↓).
- **FIRST**: Fast / Isolated(순서·외부 의존 X) / Repeatable(시간·환경 무관, `Clock` 주입) / Self-validating(assertion) / Timely. + **Given-When-Then** 가독성, 한글 메서드명("조건_상황_결과").
- **피라미드**: 단위 70% / 통합 20% / E2E 10%. 역피라미드·아이스크림 콘은 안티패턴(느리고 fragile → 안 돌리게 됨).

## 20.2 JUnit5 본격

- 어노테이션: `@Test/@BeforeEach/@AfterEach/@BeforeAll(static)/@DisplayName/@Nested/@ParameterizedTest`. `@Nested`로 컨텍스트 그룹화.
- **AssertJ**(`assertThat`...): 객체·컬렉션(`extracting`)·예외(`assertThatThrownBy`)·Optional·시간. 한 객체 여러 속성은 **Soft Assertion**(`assertAll`로 모든 실패 보고).
- **`@ParameterizedTest`** 소스 5종: `@ValueSource`/`@CsvSource`/`@CsvFileSource`/`@MethodSource`(`Stream<Arguments>`)/`@EnumSource`. 같은 로직·다른 입력이면 파라미터화.

## 20.3 Mockito 깊이 (★ 정점 — Test Double)

| | Stub | Mock | Spy | Fake |
|---|---|---|---|---|
| 검증 | 상태(반환값) | 행동(호출) | 둘 다 | 상태 |
| 진짜 동작 | X | X | 일부 | 단순화 |

- Stub=`when().thenReturn()`, Mock=`verify()`. Spy=진짜 객체+일부 stub(남용 주의), Fake=메모리 구현(In-Memory Repo). Dummy=인자 채우기.
- 기본: `@ExtendWith(MockitoExtension.class)` + `@Mock` + `@InjectMocks`. `verify(repo, times(2)/never()/atLeast())`, Argument Matchers(`any()/eq()/argThat()` — 섞을 때 모두 매처), void는 `doThrow().when()`, 인자 상세 검증은 **ArgumentCaptor**.
- 함정: final/static(→`Clock` 주입 권장)/private(→추출)/`new`(→Factory·빈 분리). Best Practice: 한 테스트=한 검증, 인터페이스 mock, Mock 5개+면 통합 테스트 신호.

## 20.4 Spring 테스트 슬라이스

- `@SpringBootTest`(전체, 느림 — 남발 금지) 대신 필요한 슬라이스만: `@WebMvcTest`(Controller/Filter/Interceptor) / **`@DataJpaTest`**(Repository+EntityManager, 자동 트랜잭션 롤백·H2 기본) / `@JsonTest` / `@DataRedisTest`.
- `@DataJpaTest`: `TestEntityManager`로 준비 후 **`em.clear()`로 1차 캐시 비워** 진짜 SELECT 검증(PART 14). 운영 DB 특화 기능은 `@AutoConfigureTestDatabase(replace=NONE)`+Testcontainers. 쿼리 카운터로 N+1도 테스트.
- `@Mock`(Mockito 단독) vs **`@MockBean`**(Spring 컨텍스트 주입 — 남발 시 컨텍스트 재생성으로 느림).

## 20.5 MockMvc

- 진짜 HTTP 서버 X, **DispatcherServlet 시뮬레이션**(빠름). `perform(get/post...).andExpect(status()..., jsonPath("$.id").value(...)).andDo(print())`. JsonPath로 배열·중첩·조건 검증.
- Validation 실패(400)·`@RestControllerAdvice`(404 등) 검증. Security는 **`@WithMockUser(roles=)`**(빠르고 충분) / `@WithUserDetails` / 실제 JWT 헤더. `@Import(SecurityConfig.class)`로 슬라이스에 포함.

## 20.6 통합 테스트와 Testcontainers (★ 정점)

- H2는 빠르나 운영 DB와 호환성 한계(JSON 함수·락 동작 차이). **Testcontainers**는 실제 MySQL/Redis/Kafka를 Docker로 띄워 운영과 동일 — 현대 표준.
- 기본: `@Testcontainers` + `@Container` + `@DynamicPropertySource`. Spring Boot 3.1+는 **`@ServiceConnection`**으로 보일러플레이트 제거(여러 컨테이너 조합 가능). 성능은 `withReuse(true)`+`testcontainers.reuse.enable`.
- 격리: `@Transactional` 롤백(빠르나 REQUIRES_NEW·비동기엔 함정) / `@AfterEach` 정리 / `@Sql`. 비동기 검증은 **Awaitility `await()`**.

## 20.7 TDD·BDD와 테스트 더블 전략

- **TDD** Red-Green-Refactor: 실패 테스트 → 최소 코드 → 개선. 장점: 설계 도구·회귀 안전망·과잉 설계 방지·자신감. 비즈 로직·알고리즘에 적합, UI·탐색적 작업엔 부적합. **Inside-Out**(도메인부터) vs **Outside-In**(컨트롤러부터, Mock).
- **BDD**: Given-When-Then으로 비즈니스 행동 표현, `@DisplayName`으로 의도 명시(Cucumber는 학습비용 ↑).
- 더블 전략: 외부 시스템·느린 작업·부작용·시간/랜덤 → **Mock**. 도메인 객체·값 객체·Repository(`@DataJpaTest`) → **진짜**. Mock 남용은 통합 테스트 전환 신호.

## 20.8 테스트 품질 도구

- **Coverage(JaCoCo)**: Line/Branch/Method. 100%는 환상(실행≠검증, assertion 없어도 증가). 현실 목표: Line 70~80%, 핵심 로직 90%+, DTO/Entity 제외.
- **Mutation Testing(PIT)**: 코드를 의도적으로 변형 → 테스트가 깨지면 Killed(좋음), 통과하면 Survived(부족). Coverage의 질적 보완(매우 느림 → 정기 실행).
- **ArchUnit**: 아키텍처 규칙을 코드로 강제(레이어 의존성, 명명 규칙, **순환 참조 금지**, 필드 주입 금지 등). 코드 리뷰의 자동화 영역.

---

# 📚 PART 21 — HTTP·네트워크·DevOps·Observability

> **목표**: 앞의 모든 코드가 **사용자에게 전달되고 운영되는 영역**. HTTP/네트워크 토대 → 컨테이너/K8s → CI/CD → Observability.

## 21.1 HTTP 깊이

- 본질: TCP 위 텍스트 기반 요청-응답, Stateless·Connection-less. 메시지=Start/Status Line + Headers + (빈 줄) + Body. 메서드 멱등성/안전성: GET(안전·멱등), POST(둘 다 X), PUT/DELETE(멱등), PATCH(비멱등*). 주요 헤더: Content-Type/Accept/Authorization/Cache-Control/ETag/Host.
- **상태 코드 5계열 + 오해**: 401(인증) vs 403(인가), 400 vs 422(시맨틱), 304(ETag 캐시 유효), 302 vs 307(메서드 보존), **502**(upstream 다운: 프록시→앱 다운) vs **504**(upstream 응답 지연 timeout), 503(점검·과부하, Retry-After), 429(Rate Limit).
- **진화**: HTTP/1.1(Keep-Alive·**HOL Blocking**·헤더 중복) → **HTTP/2**(바이너리·**Multiplexing**으로 앱계층 HOL 해결·HPACK 헤더 압축, 단 TCP HOL 잔존) → **HTTP/3**(TCP→**QUIC/UDP**, TCP HOL까지 해결, 0-1RTT). Spring Boot는 `server.http2.enabled=true`.

## 21.2 TCP/IP와 TLS (★ 정점)

- OSI 7계층 중 Transport(4: TCP/UDP)·Network(3: IP)·TLS(5-6). 캡슐화: 데이터→TCP 세그먼트→IP 패킷→Frame.
- **TCP 3-way handshake**(연결): SYN → SYN-ACK → ACK(양쪽 송수신 능력 확인, 2번이면 한쪽만·4번은 중복). **4-way handshake**(종료): FIN/ACK 양방향. **TIME_WAIT**(마지막 ACK 손실 대비 2MSL 대기 → 부하 큰 클라/프록시에 소켓 누적 → `SO_REUSEADDR`·Connection Pool). 신뢰성: Sequence/ACK/Checksum/Flow Control/Congestion Control. TCP(신뢰·느림) vs UDP(비신뢰·빠름: DNS·게임·VoIP).
- **TLS**: HTTP+TLS=HTTPS. 1.2(2 RTT) → **1.3**(1 RTT·0-RTT 재개, 약한 알고리즘 제거·Forward Secrecy 강제). 원리: **비대칭**(인증서 검증·세션키 교환)+**대칭**(데이터 암호화 — 비대칭은 안전하나 느려서 키 교환만, 대칭으로 본문). 인증서는 CA 체인(Root→Intermediate→Leaf), 무료는 Let's Encrypt(90일·자동 갱신).
- **DNS**(도메인↔IP, 레코드 A/AAAA/CNAME/MX/TXT/NS) & **Load Balancing**(Round Robin/Least Conn/IP Hash/Weighted). **L4**(IP·Port, 빠름) vs **L7**(URL·Header, Path 라우팅 — API 경로 분기엔 L7). Sticky Session은 Session 기반 인증 시 필요, JWT면 불필요.

## 21.3 Docker

- **컨테이너 vs VM**: VM은 OS 가상화(GB), 컨테이너는 **프로세스 격리**(MB, OS 공유 → 빠른 시작). 메커니즘: Namespace(격리)·cgroups(제한)·Union FS(레이어). 3개념: Image(정적)·Container(실행)·Registry(저장).
- **Dockerfile 최적화**: **Multi-stage Build**(빌드/실행 분리 → jre만, 1GB→200MB), 레이어 캐싱(의존성 먼저 COPY), **Spring Boot Layered JAR**(의존성·코드 분리 → 코드만 바뀌면 빠른 재빌드). 보안: non-root 사용자, slim/distroless, `.dockerignore`, 명시적 버전(latest 금지).
- **Docker Compose**: 여러 컨테이너를 YAML로 정의·일괄 실행(`depends_on`+healthcheck, `volumes`로 데이터 영속). 개발/테스트용(운영은 K8s).

## 21.4 Kubernetes (★ 정점)

- 등장 이유: 컨테이너 다수의 자동 재시작·오토스케일·무중단 배포·서비스 디스커버리. 핵심 기능: Self-healing·Auto-scaling·Service Discovery·LB·Rolling Update·Config 관리. 구조: Control Plane(API Server·**etcd**(Raft, PART 18)·Scheduler·Controller Manager) + Worker Nodes(kubelet·kube-proxy·Pods).
- **Pod**(최소 단위, 일시적 IP, 사이드카) → **Deployment**(replicas 보장·Rolling Update·Rollback·Self-healing) → **Service**(Pod 그룹의 안정적 접근점: ClusterIP/NodePort/LoadBalancer/ExternalName, DNS로 디스커버리 — Eureka 불필요).
- **Ingress**(L7 HTTP 라우팅·TLS 종료·cert-manager 자동 발급), **ConfigMap**(설정), **Secret**(민감정보 — **Base64 인코딩만**, Vault/Sealed Secrets 권장).
- **Probe**: liveness(실패→재시작) / readiness(실패→트래픽 차단) / startup(느린 시작). Spring Boot Actuator `/actuator/health/{liveness,readiness}`. **HPA**(CPU 등 메트릭 기반 Pod 개수 자동 조절, min~max) — Scale-Out(VPA는 Scale-Up).

## 21.5 CI/CD

- CI(자주 통합: 빌드+테스트) / CD(Delivery=배포 가능 상태까지, Deployment=운영까지). 파이프라인: Build→Static Analysis→Unit→Integration(Testcontainers)→Image Build→Push→Deploy Dev→E2E→Staging→Manual Approval→Prod→Smoke.
- **GitHub Actions**: Workflow/Job(`needs` 의존)/Step/Action. Gradle·Docker 레이어 캐싱으로 50% 단축, Secret은 Repository Secrets. main 브랜치만 배포(안정성).
- **배포 전략**: **Rolling**(1개씩 교체, 단순·자원 효율, 롤백 느림) / **Blue-Green**(즉시 롤백, 자원 2배) / **Canary**(점진 트래픽 5→50→100%, 위험한 변경). 빠른 롤백 필요→Blue-Green, 위험 변경→Canary.

## 21.6 12-Factor App

12원칙 중 자주 위반: **Config**(환경변수/Secret 분리, 하드코딩 금지), **Processes/Stateless**(Pod 재시작 OK, Session은 외부 Redis — PART 19), **Logs**(파일 X, **stdout** → 플랫폼이 수집), **Disposability**(Graceful Shutdown: `server.shutdown=graceful` — SIGTERM 시 진행 요청 완료 후 종료), Dev/Prod Parity.

## 21.7 Observability — 3 Pillars

- **Monitoring**(알려진 문제, 사전 정의 지표) ⊂ **Observability**(알려지지 않은 문제까지 관찰 가능). **3 Pillars**: Logs(무슨 일?), Metrics(얼마나?), Traces(어떻게 흘렀나? — PART 18 분산 추적).
- **Logs**: 평문 대신 **구조화(JSON)** → 필드 검색·자동 알림. **MDC**로 `trace_id` 전 로그 전파. ELK(Elasticsearch/Logstash/Kibana) 또는 Grafana Loki.
- **Metrics(Prometheus Pull + Micrometer)**: `/actuator/prometheus` 노출. 타입 4종: Counter(누적)·Gauge(현재값)·Histogram(분포)·Summary(Percentile). Grafana 시각화. **SLI**(지표)/**SLO**(목표)/**SLA**(계약).
- **Traces(OpenTelemetry)**: Logs/Metrics/Traces 통합 표준. Micrometer Tracing+OTLP, 샘플링(운영 10%). 3 Pillars 연결: Log의 trace_id → Trace → 해당 시점 Metric.

## 21.8 장애 대응과 Postmortem

- 대응 5단계: 감지 → 분류 → **완화(우선!)** → 복구 → 분석. 핵심 원칙: **근본 원인 수정 전 영향 완화 우선**(예: 디버깅보다 롤백 먼저). 지표 MTTR/MTTF/MTBF. 알림은 Info/Warning/Critical, Alert Fatigue 주의.
- **Blameless Postmortem**: 사람이 아닌 시스템·프로세스를 분석. 템플릿: 요약·Timeline·Root Cause(단일 원인 X, 요인 결합)·잘된 점·잘못된 점·**Action Items(담당·기한)**. 모든 P1/P2 장애에 작성·공유.

---

# 🎓 통합 졸업 점검 (핵심 관문 질문)

> Part별 자기 점검은 본문 참조. 아래는 "이건 막힘없이 답해야 다음 단계로" 수준의 관문.

**언어·JVM**
1. 자바에 pass by reference가 없다는 말의 정확한 의미(스택 프레임으로)?
2. `m`과 `new Member()` 본체는 각각 어디에 저장되는가?
3. 바이트코드의 `#7`(심볼 참조)은 무엇이며 왜 필요한가?

**GC·컬렉션**
4. JVM이 참조 카운팅을 안 쓰는 이유는?
5. G1이 큰 힙에 적합한 이유(리전·정지시간 예측)?
6. HashMap LoadFactor 0.75와 Java 8 트리 변환의 의미는?

**제네릭·함수형**
7. PECS를 한 문장으로?
8. 스트림이 한 번만 사용 가능하고 지연 평가되는 이유는?

**동시성**
9. synchronized/volatile/Atomic의 해결 범위·성능 비교는?
10. CAS 4단계와 ABA 문제는?
11. Sync/Blocking을 가르는 두 개의 축은?
12. 직접 스레드 사용의 3가지 문제 → Executor가 어떻게 해결하나?

**스프링**
13. IoC에서 무엇이 무엇으로 역전되는가? DI와의 관계는?
14. 싱글톤 빈이 stateless여야 하는 이유(동시성과 연결)?
15. JdbcTemplate에 적용된 디자인 패턴 2가지는?

**DB·JPA(입문)**
16. Connection Pool이 필요한 이유를 TCP 관점에서?
17. ACID 4가지를 한 문장씩?
18. JPA가 JDBC를 대체하는가? (정확히)
19. @Transactional이 동작하기 위한 조건과 self-invocation 문제는?

**AOP·프록시 (PART 12)**
20. 수동 프록시 100개 문제 → JDK 동적 프록시 / CGLIB가 각각 어떻게 해결하나? (전제 조건 차이)
21. Pointcut·Advice·Advisor의 관계, target 1개에 AOP 여러 개면 프록시는 몇 개?
22. 빈 후처리기(AnnotationAwareAspectJAutoProxyCreator)가 하는 일은?
23. AOP 용어 7가지 중 위빙(Weaving)은 Spring AOP에서 언제 일어나나?

**트랜잭션 심화 (PART 13)**
24. internal call 함정과 @PostConstruct 함정 — 공통 본질과 각각의 해결은?
25. REQUIRED에서 내부 롤백 시 UnexpectedRollbackException이 던져지는 이유는?
26. Dirty / Non-repeatable / Phantom Read 차이와 4단계 격리 매트릭스, MySQL 기본값은?

**JPA 심화 (PART 14)**
27. 변경 감지(Dirty Checking)의 내부 동작(스냅샷)과 전제 조건은?
28. 4가지 연관관계의 기본 fetch 전략(외울 것)과 LAZY 명시 권장 이유는?
29. N+1이 EAGER·LAZY 모두에서 발생하는 이유, fetch join vs @BatchSize 선택은?
30. mappedBy의 값이 가리키는 것과 연관관계 주인이 필요한 이유는?

**데이터베이스 (PART 15~16)**
31. 1NF/2NF/3NF/BCNF를 한 줄씩, 3가지 이상 현상의 공통 원인은?
32. logN이 N보다 압도적인 이유(N=백만)와 멀티컬럼 인덱스 "왼쪽 우선" 원칙은?
33. EXPLAIN `type`의 좋은/나쁜 값, Covering Index란?
34. CAP에서 P가 필수인 이유, CP vs AP 대표 시스템은?
35. Replication vs Cluster의 결정적 차이, Quorum 최소 3노드 권장 이유는?
36. DELETE/TRUNCATE/DROP의 ROLLBACK 가능 여부와 그 이유(UNDO LOG)는?

**Spring MVC (PART 17)**
37. DispatcherServlet 9단계를 순서대로, HandlerMapping vs HandlerAdapter 역할 차이는?
38. Filter·Interceptor·AOP의 위치·표준·적용 단위 차이와 호출 순서는?
39. `@RequestBody`가 HttpMessageConverter로 동작하는 흐름, Lazy 프록시 직렬화 문제 해결은?
40. PUT/PATCH/POST 멱등성, Page vs Slice 선택은?

**분산 시스템·MSA (PART 18)**
41. 2PC의 한계와 Saga(Orchestration vs Choreography)가 대체하는 이유는?
42. 캐싱 4패턴과 3대 함정(Stampede/Penetration/Avalanche) 방어는?
43. Kafka Topic/Partition/Offset/Consumer Group 관계, acks 0/1/all 차이는?
44. Outbox가 해결하는 이중 쓰기 문제, At-least-once + 멱등성이 표준인 이유는?

**Spring Security (PART 19)**
45. 401 vs 403, SecurityFilterChain 핵심 필터와 SecurityContextHolder(ThreadLocal)는?
46. Session vs JWT 5가지 비교, Stateless의 장단점은?
47. JWT 3부분 역할, Payload 민감정보 금지 이유, HS256 vs RS256은?
48. CSRF·XSS·CORS의 원리와 방어, JWT는 어디에 저장하나?

**테스트 (PART 20)**
49. Mock/Stub/Spy/Fake 차이, @Mock vs @MockBean은?
50. @SpringBootTest 남발 문제와 슬라이스(@DataJpaTest의 em.clear 이유)는?
51. H2 vs Testcontainers 선택, @ServiceConnection 효과는?
52. 테스트 피라미드 비율과 Coverage 100%가 환상인 이유는?

**HTTP·DevOps·Observability (PART 21)**
53. TCP 3-way handshake와 TIME_WAIT, HTTP/1.1·2·3 차이는?
54. TLS 1.2 vs 1.3, 비대칭+대칭을 함께 쓰는 이유는?
55. Pod/Deployment/Service 역할, liveness/readiness/startup Probe 차이는?
56. Rolling/Blue-Green/Canary 선택, 502 vs 504, 3 Pillars와 SLI/SLO/SLA는?

---

# 📌 학습 운영 팁

## 9-섹션 마스터 프롬프트로 반드시 깊이 팔 단원 (면접·실무 직결)

- PART 1.8 SOLID 5원칙
- PART 2.4 Pass by value / 2.7 바이트코드·상수 풀
- PART 3.5 G1 GC
- PART 4.8 해시(HashMap 내부)
- PART 5.1 PECS / 5.4 스트림
- PART 7.2 4분면 / 7.5 동기화 3종(특히 Atomic·CAS) / 7.8 Executor·Future / 7.9 CompletableFuture
- PART 8 전체 (DAO 진화 → IoC/DI)
- PART 10.2 Connection Pool / 10.4 ACID / 10.5 JdbcTemplate
- PART 11.3 JPA 입문 / 11.5 @Transactional(★★★)
- PART 12.6 동적 프록시 / 12.7 ProxyFactory·Advisor / 12.9 @Aspect·AOP 용어
- PART 13.3 internal call / 13.4 @PostConstruct 함정 / 13.5 전파 / 13.6 격리 수준
- PART 14.6 영속성 컨텍스트 4대 장점(특히 변경 감지) / 14.9 LAZY·EAGER / 14.10 N+1(★★★) / 14.11 QueryDSL
- PART 15.2 정규화 / 15.5 CAP / 15.7 B-tree 인덱스 / 15.8 EXPLAIN·Covering Index
- PART 16.2 Quorum / 16.3 Replication vs Cluster / 16.5 DELETE·TRUNCATE·DROP
- PART 17.2 DispatcherServlet 9단계 / 17.5 Filter·Interceptor·AOP(★) / 17.6 @ControllerAdvice·@Valid / 17.7 멱등성·페이징
- PART 18.2 캐싱 4패턴 / 18.3 Redis 자료구조·분산락 / 18.6 Kafka Topic·Partition·Consumer Group(★) / 18.7 Saga·Outbox·MSA 패턴
- PART 19.2 SecurityFilterChain(★) / 19.3 BCrypt·AuthenticationProvider / 19.5 Session vs JWT(★) / 19.6 JWT 구조·취약점 / 19.8 CSRF·CORS
- PART 20.3 Mock vs Stub vs Spy vs Fake(★) / 20.4 @DataJpaTest / 20.6 Testcontainers·@ServiceConnection / 20.7 TDD
- PART 21.2 TCP 3-way·TLS(★) / 21.4 Pod·Deployment·Service·HPA(★) / 21.5 배포 전략 / 21.7 3 Pillars·SLI/SLO/SLA(★)

## 실무 연결 지점

| PART | 실무 적용 |
|---|---|
| 2~3 (JVM/GC) | OOM·heap dump 분석, GC 로그 튜닝 |
| 4 (컬렉션) | DTO/Entity 매핑 시 자료구조 선택 |
| 7 (동시성) | 스레드 덤프, `@Async`, 싱글톤 빈 동시성 |
| 8 (IoC/DI) | Service/Repository 분리, Strategy, Spring DI |
| 10 (DB) | HikariCP 튜닝, 트랜잭션 경계 설계 |
| 11 (JPA 입문) | Spring Data JPA + Querydsl, @Transactional 전파 설계 |
| 12 (AOP) | 변경 이력/감사 로그, 로그 추적기(ThreadLocal), 트랜잭션 프록시 |
| 13 (트랜잭션 심화) | 전파 설계, 격리 수준 선택(MySQL REPEATABLE READ), 초기 데이터 로딩 |
| 14 (JPA 심화) | N+1 튜닝(fetch join/@BatchSize), 영속성 컨텍스트·변경 감지, 연관관계 설계 |
| 15 (DB 이론) | 정규화 검토, 인덱스 설계·EXPLAIN, 마스터 데이터 Redis 캐싱 |
| 16 (DB 운영) | Read Replica 도입, 파티셔닝 후보, 데이터 타입 설계, 백업 전략 |
| 17 (Spring MVC) | 표준 에러 응답(@RestControllerAdvice), REST URL·상태코드 설계, 페이징·문서화(SpringDoc) |
| 18 (분산·MSA) | Redis 캐싱·분산 락, Kafka 비동기 처리·DLT, Modular Monolith·Saga·Outbox |
| 19 (Security) | JWT 인증 필터·Refresh Rotation, @PreAuthorize, CORS·CSRF·보안 체크리스트 |
| 20 (테스트) | 단위(Mockito)·@DataJpaTest·MockMvc·Testcontainers, ArchUnit 아키텍처 규칙 |
| 21 (운영) | Multi-stage·Layered JAR, K8s Probe·HPA, CI/CD 무중단 배포, 구조화 로그·메트릭·추적 |

## 전체 진도 체크리스트

```
[ ] PART 1  객체지향(OOP) 기초
[ ] PART 2  JVM 메모리 모델과 실행 원리
[ ] PART 3  GC
[ ] PART 4  문자열과 컬렉션
[ ] PART 5  제네릭·비교·함수형
[ ] PART 6  I/O와 직렬화
[ ] PART 7  멀티스레딩과 동시성
[ ] PART 8  객체 설계의 진화 → IoC/DI
[ ] PART 9  테스트와 웹 인프라
[ ] PART 10 DB 접근의 진화
[ ] PART 11 ORM/JPA와 트랜잭션 추상화
[ ] PART 12 프록시의 진화와 Spring AOP
[ ] PART 13 트랜잭션 심화 (전파·격리·라이프사이클 함정)
[ ] PART 14 JPA 심화 (영속성 컨텍스트·연관관계·N+1)
[ ] PART 15 데이터베이스 펀더멘털 (이론)
[ ] PART 16 데이터베이스 운영
[ ] PART 17 Spring MVC 내부와 REST API
[ ] PART 18 분산 시스템·캐싱·메시징·MSA
[ ] PART 19 Spring Security (인증·인가·JWT·OAuth2)
[ ] PART 20 테스트 심화
[ ] PART 21 HTTP·네트워크·DevOps·Observability
[ ] 통합 졸업 점검 관문 통과
```

## 학습 시 주의 — DB·JPA는 반드시 SQL 로그를 켜고

PART 14(영속성 컨텍스트·N+1)와 PART 15~16(인덱스·실행 계획)은 이론만 읽으면 체화되지 않는다. SQL 로그를 켜고(`show-sql`, `format_sql`, `org.hibernate.SQL: DEBUG`) 직접 쿼리가 어떻게 나가는지, `EXPLAIN`으로 실행 계획이 어떻게 잡히는지 눈으로 확인할 것.

---

> **다음 주차 추가 시**: PART 22 이후로 이어 붙인다. 새 주차가 기존 PART의 심화면 해당 PART에 "(심화)" 소단원으로 병합하고, 신규 주제면 새 PART로 만든 뒤 위 "기술 진화 척추" 표·졸업 관문·진도 체크리스트에 반영한다. (남은 후보 영역: 코딩 테스트 알고리즘, 시스템 디자인 면접, 프론트엔드 심화, 클라우드 네이티브 패턴)
