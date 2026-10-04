# 🎯 자바 — 언어에서 동시성까지

> **목적**: 자바 언어 자체를 "왜 이렇게 생겼는지"부터 이해한다.
> 객체지향 문법에서 시작해 JVM 메모리 구조, GC, 컬렉션 내부, 함수형, 동시성까지.
>
> **핵심 서사**: 모든 단원이 **"로우레벨의 불편함 → 그래서 이 기술이 등장"** 구조다.
> 먼저 고통을 느끼고, 그 고통을 없애는 도구로 다음 단계를 만난다.
>
> **선행**: 없다. 이 커리큘럼의 출발점이다.
> **다음**: 스프링 과목. 이 과목 PART 1 의 SOLID 가 그 입구다.

---

## 🧭 전체 지도 (한눈에)

```
  [1] 객체지향(OOP) 기초          ← 왜 OOP 인가. SOLID 가 스프링의 입구
   ↓
  [2] JVM 메모리 모델과 실행 원리  ← 객체가 어디 만들어지나
   ↓
  [3] GC                          ← new 한 것을 누가 치우나
   ↓
  [4] 문자열과 컬렉션              ← 매일 쓰는 것의 내부
   ↓
  [5] 제네릭 · 비교 · 함수형        ← 타입 안전성과 람다
   ↓
  [6] I/O와 직렬화                 ← 밖과 데이터를 주고받기
   ↓
  [7] 멀티스레딩과 동시성           ← 여럿이 동시에 쓸 때
```

순서의 이유: **원리를 먼저, 활용을 나중에** 둔다.
컬렉션([4])을 쓰기 전에 객체가 어디 저장되는지([2])와 언제 회수되는지([3])를
알아야 `HashMap` 의 동작이 설명된다. 동시성([7])을 맨 뒤에 둔 것도
Stack 이 스레드별이라는 사실([2])이 전제이기 때문이다.

### 기술 진화의 척추 (이 과목을 관통하는 "고통 → 해결" 라인)

| 영역 | 로우레벨(고통) | 중간 | 하이레벨(해결) |
|---|---|---|---|
| 코드 구조 | 데이터와 함수가 흩어짐 | C 구조체 + 함수 포인터 | 상태+행동을 묶은 객체 |
| 중복 제거 | 복사해 붙이기 | 유틸 클래스 · 합성 | 상속 → 다형성 → 인터페이스 |
| 변경 전파 | 한 곳 고치면 여기저기 깨짐 | 주석과 코드 리뷰 | SOLID(특히 DIP) |
| 메모리 전달 | C 포인터 직접 조작 | — | 자바 값 복사(참조값 복사) |
| 메모리 회수 | 참조 카운팅(순환 참조 누수) | Mark-Sweep/Compact | Generational → G1 → ZGC |
| 문자열 합치기 | `String +` (객체 폭증) | — | StringBuilder |
| 데이터 검색 | 순차 탐색 O(n) | 정렬+이진탐색 | 해시 O(1) |
| 타입 안전성 | `Object` 캐스팅 | — | 제네릭 + 와일드카드(PECS) |
| 즉석 구현 | 클래스 파일 하나씩 | 익명 클래스 | 람다 → 메서드 참조 |
| I/O | 1바이트 Stream, Blocking | NIO Channel+Buffer | Non-blocking + Selector |
| 스레드 | `new Thread()` 직접 생성 | Runnable 분리 | Executor 풀 → CompletableFuture |
| 동기화 | synchronized(블로킹) | volatile(가시성만) | Atomic/CAS(논블로킹) |

---

# 📚 자바 PART 1 — 객체지향(OOP) 기초

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
- 익명 클래스는 **람다의 전신** (자바 PART 5에서 연결)


## 1.8 SOLID 5원칙

> OOP 문법은 알지만 "잘 짠 코드"를 모르는 단계에서, 변경에 강한 코드의 5계명.

- **SRP (단일 책임)**: 클래스의 변경 이유는 하나. `User` / `UserRepository` / `EmailService`로 분리.
- **OCP (개방-폐쇄)**: 확장에 열림, 수정에 닫힘. `if-else` 타입 분기 → 인터페이스 다형성. (전략 패턴의 뿌리)
- **LSP (리스코프 치환)**: 자식은 부모를 완벽히 대체. `Penguin extends Bird`에서 `fly()`를 막으면 위반.
- **ISP (인터페이스 분리)**: 안 쓰는 인터페이스에 의존하지 말 것. `Worker{work,eat}` → `Workable`/`Eatable` 분리.
- **DIP (의존 역전)**: 추상화에 의존, 구체에 의존 말 것. **Spring DI와 정확히 같은 원리** (스프링 PART 2에서 만남).

**자기 점검**
- LSP가 깨지면 왜 다형성도 깨지는가?
- DIP와 DI(Dependency Injection)의 관계는?

---


# 📚 자바 PART 2 — JVM 메모리 모델과 실행 원리

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
- Stack은 **스레드별로 따로** (→ 동시성에서 지역변수가 스레드 안전한 이유, 자바 PART 7)


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

- `new` 없이 객체 만드는 법: **Reflection, clone, 역직렬화** (자바 PART 5, 6과 연결)


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


# 📚 자바 PART 3 — GC (가비지 컬렉션)

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


# 📚 자바 PART 4 — 문자열과 컬렉션

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


# 📚 자바 PART 5 — 제네릭 · 비교 · 함수형

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


# 📚 자바 PART 6 — I/O와 직렬화

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


# 📚 자바 PART 7 — 멀티스레딩과 동시성

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


---

## 🎓 졸업 점검

> 소절별 자기 점검은 본문 참조. 아래는 "막힘없이 답해야 다음 과목으로" 수준의 관문.

**객체지향**
1. C 구조체로 OOP 를 흉내낼 수 있는데 자바와의 결정적 차이는?
2. 상속이 유틸 클래스·합성에 비해 한 번에 푸는 것 세 가지는?
3. 오버라이딩과 오버로딩 중 런타임에 결정되는 쪽은? 왜인가?
4. 추상 클래스와 인터페이스의 모든 차이가 어느 한 가지에서 나오는가?
5. DIP 에서 역전되는 것은 무엇이며 인터페이스는 누구의 것인가?

**JVM**
6. 자바에 pass by reference 가 없다는 말의 정확한 의미(스택 프레임으로)?
7. `m` 과 `new Member()` 본체는 각각 어디에 저장되는가?
8. 바이트코드의 `#7`(심볼 참조)은 무엇이며 왜 필요한가?

**GC·컬렉션**
9. JVM 이 참조 카운팅을 안 쓰는 이유는?
10. G1 이 큰 힙에 적합한 이유(리전·정지시간 예측)?
11. HashMap LoadFactor 0.75 와 Java 8 트리 변환의 의미는?

**제네릭·함수형**
12. PECS 를 한 문장으로?
13. 스트림이 한 번만 사용 가능하고 지연 평가되는 이유는?

**동시성**
14. synchronized / volatile / Atomic 의 해결 범위·성능 비교는?
15. CAS 4단계와 ABA 문제는?
16. Sync/Blocking 을 가르는 두 개의 축은?
17. 직접 스레드 사용의 3가지 문제 → Executor 가 어떻게 해결하나?

---

## ✅ 진도 체크리스트

```
[ ] 1  객체지향(OOP) 기초
[ ] 2  JVM 메모리 모델과 실행 원리
[ ] 3  GC
[ ] 4  문자열과 컬렉션
[ ] 5  제네릭 · 비교 · 함수형
[ ] 6  I/O와 직렬화
[ ] 7  멀티스레딩과 동시성
```

**실무 연결**: JVM 메모리와 GC 는 이론만 읽으면 체화되지 않는다.
`-verbose:gc`, `-Xlog:gc*` 를 켜고 실제로 어느 세대가 언제 수집되는지 눈으로 확인할 것.
컬렉션은 `HashMap` 에 충돌을 일부러 만들어 `hashCode` 를 같게 준 객체 수천 개를 넣어보면
트리 변환이 체감된다.
