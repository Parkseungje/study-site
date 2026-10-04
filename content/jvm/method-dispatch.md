---
title: 그 메서드 테이블은 어디 있나
summary: 다형성이 실제로 어떻게 가능한지, 그리고 static 이 인스턴스 메서드를 못 부르는 이유
versionNote: Java 21 · HotSpot 기준
ord: 3
minutes: 26
edges:
  - { to: pass-by-value, type: prerequisite }
  - { to: polymorphism, type: prerequisite }
  - { to: bytecode, type: deepens }
sources:
  - { label: JVM Specification - Method Invocation, url: https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-6.html }
  - { label: JVM Specification - Linking and Resolution, url: https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html }
  - { label: HotSpot - Virtual Calls and Inline Caches, url: https://wiki.openjdk.org/display/HotSpot/VirtualCalls }
---

[[polymorphism]] 에서 이렇게 설명하고 넘어갔다.

> 런타임에 그 클래스의 **메서드 테이블**을 찾는다.
> `invokevirtual` 명령이 어느 클래스의 구현인지를 **적지 않는다.**

**그 테이블이 어디 있나.** [[memory-areas]] 에서 영역을 다 봤는데
"메서드 테이블"은 안 나왔다.

그리고 질문이 하나 더 있다.

```java file=WhyCannotCall.java bad label="컴파일되지 않는다"
class App {
    void instanceMethod() { }
    static void main(String[] args) {
        instanceMethod();        // 오류: non-static method cannot be referenced
    }
}
```

**`static` 이 인스턴스 메서드를 직접 못 부른다.** 왜인가.
이 둘이 같은 질문의 양면이다.

## 0. 들어가기 전에 — 핵심 용어

- **정적 디스패치**: 컴파일 시점에 호출 대상이 정해지는 것. 오버로딩이 그렇다.
- **동적 디스패치**: 실행 시점에 정해지는 것. 오버라이딩이 그렇다.
- **vtable (가상 메서드 테이블)**: 클래스마다 하나씩 있는 **메서드 주소 배열**.
- **itable**: 인터페이스 호출용 테이블. vtable 보다 느리다.
- **인라인 캐시**: JIT 가 "직전에 어느 타입이었나"를 기억해 건너뛰는 최적화.
- **역가상화(devirtualization)**: JIT 가 동적 호출을 정적 호출로 바꾸는 것.

한 줄 그림: **"무엇을 부를지"와 "누구의 것을 부를지"가 분리되어 있고, 그 분리가 다형성의 비용이자 수단이다.**

비유하자면 **전화 교환원이 있는 회사**다.
"회계팀 담당자 부탁합니다"라고 하면 **번호를 몰라도** 연결된다(동적 디스패치).
담당자가 바뀌어도 **내가 거는 방식은 그대로**다.
대신 **교환을 한 번 거친다**(간접 호출 비용).

직통 번호를 알면 빠르다(정적 디스패치). 그런데 담당자가 바뀌면 못 건다.

## 1. 그전엔 어떻게 했나 — 주소를 직접 적던 시절

C 에서는 함수 호출이 **주소로 직접** 간다.

```c file=directCall.c
void greet() { printf("hi"); }
greet();          // 컴파일 시점에 greet 의 주소가 명령에 박힌다
```

**빠르다.** 간접 참조가 없다. 그런데 **바꿀 수 없다.**

### 고통 1 — 타입마다 다른 동작을 하려면 분기해야 한다

[[polymorphism]] 의 고통 1 이다.

```c file=cBranching.c bad label="타입을 물어보고 갈라야 한다"
void draw(Shape *s) {
    if (s->type == CIRCLE) drawCircle(s);
    else if (s->type == SQUARE) drawSquare(s);
}
```

타입이 늘면 **모든 분기를 찾아 고친다.** 그리고 라이브러리 안의 분기는 못 고친다.

### 고통 2 — 함수 포인터를 쓰면 객체마다 테이블이 생긴다

C 에서 다형성을 흉내내는 방법이 **구조체에 함수 포인터를 넣는 것**이다.

```c file=funcPointer.c
typedef struct {
    int type;
    void (*draw)(void *self);     // 함수 포인터
} Shape;

Shape circle = { CIRCLE, drawCircle };
circle.draw(&circle);
```

[[procedural-to-oop]] 의 시도 3 에서 본 그것이다. **동작한다.**

문제는 **객체마다 함수 포인터를 들고 있다**는 것이다.

```
원 10,000개 × 함수 포인터 5개 × 8바이트 = 400KB
```

**같은 함수 주소를 10,000번 저장한다.** 낭비다.
그리고 객체를 만들 때마다 **포인터를 전부 채워야** 한다.

### 고통 3 — 초기화를 빠뜨리면 조용히 깨진다

```c file=forgotInit.c bad label="NULL 포인터 호출"
Shape s;
s.type = CIRCLE;
// s.draw 를 안 넣었다
s.draw(&s);        // 세그먼테이션 폴트
```

**컴파일된다.** 그리고 호출하는 순간 죽는다.
구조체 필드를 채우는 것을 컴파일러가 강제하지 않는다.

### 고통 4 — 같은 이름의 함수를 못 만든다

```c file=noOverload.c bad label="이름이 충돌한다"
void print(int x);
void print(char *s);     // C 에서는 오류
```

[[procedural-to-oop]] 의 고통 2 다. 그래서 `printInt`, `printString` 처럼
**이름에 타입을 적는다.** 호출하는 쪽이 타입을 알고 골라야 한다.

네 고통의 뿌리는 **둘**이다.
**(1) 호출 대상을 컴파일 시점에 고정하면 다형성이 안 된다.**
**(2) 객체마다 테이블을 두면 낭비이고 초기화가 위험하다.**

## 2. 이렇게 피해봤다

### 시도 1 — 타입 태그와 거대한 switch

고통 1 의 대응이다. `switch` 를 한 곳에 모아 관리한다.

**분기가 한 곳에 모이는 것은 개선**이다. 그런데
타입이 늘면 **여전히 그 switch 를 고쳐야** 하고,
동작 종류마다 switch 가 하나씩 생긴다.

### 시도 2 — 함수 포인터 테이블을 공유한다

고통 2 의 대응이다. 객체마다 포인터를 두지 않고
**타입별 테이블을 하나 만들어** 그 주소만 객체에 둔다.

```c file=sharedVtable.c
typedef struct { void (*draw)(void*); void (*area)(void*); } ShapeOps;
static ShapeOps circleOps = { drawCircle, areaCircle };   // 타입당 하나

typedef struct { ShapeOps *ops; int r; } Circle;
```

**이것이 사실상 vtable 이다.** 메모리 낭비가 사라진다.

그래도 **ops 를 채우는 책임이 사람에게** 있다. 고통 3 이 남는다.
그리고 **모든 생성 지점에서** 빠뜨리지 않아야 한다.

### 시도 3 — 매크로로 생성 코드를 만든다

초기화를 매크로로 감싸 빠뜨릴 수 없게 한다.

**디버깅이 어려워진다.** 매크로가 펼쳐진 코드를 봐야 하고,
오류 메시지가 엉뚱한 곳을 가리킨다.

> 세 시도의 공통점: **언어가 해주지 않아 사람이 규율로 지켰다.**
> 컴파일러와 런타임이 그것을 맡으면 빠뜨릴 수 없게 된다.

## 3. 그래서 나온 것 — 언어가 테이블을 만들고 채운다

자바는 **클래스마다 vtable 을 하나 만들고** 객체에는 **클래스 포인터만** 둔다.
그리고 그 작업을 **JVM 이 클래스 로딩 때** 한다.

```
Heap 의 객체              Method Area
┌──────────────┐         ┌─────────────────────┐
│ 클래스 포인터 │────────→│ SavingsAccount 클래스 │
│ balance      │         │  ├─ 필드 정보        │
│ rate         │         │  └─ vtable           │
└──────────────┘         │      [0] deposit →   │
                         │      [1] printState→ │
                         └─────────────────────┘
```

**이것이 [[memory-areas]] 에서 안 보였던 테이블의 자리**다.
Method Area 에 있다. 그리고 객체마다가 아니라 **클래스마다 하나**다.

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 타입마다 분기해야 한다 | vtable 을 거치므로 **분기가 없다** |
| 객체마다 테이블이 생긴다 | **클래스마다 하나.** 객체는 포인터만 |
| 초기화를 빠뜨린다 | **JVM 이 채운다.** 빠뜨릴 수 없다 |
| 같은 이름을 못 만든다 | 오버로딩. 컴파일 시점에 **시그니처로** 구분 |

**세 번째가 결정적**이다. 시도 2 의 `ops` 를 채우는 책임이
언어와 런타임으로 옮겨가서 **고통 3 이 구조적으로 사라졌다.**

## 4. 어떻게 동작하나 — 두 단계로 나뉘어 있다

커리큘럼이 말하는 **"무엇을" 과 "어디에" 의 분리**가 이것이다.

```visual
id: method-dispatch-two-phases
kind: step
title: acc.deposit(1000) 이 실행되기까지
steps:
  - name: 컴파일 시점 — 시그니처를 확정한다
    detail: 변수의 선언 타입 Account 에 deposit(long) 이 있는지 본다. 오버로딩이 여럿이면 여기서 하나가 선택된다. 이 선택은 런타임에 바뀌지 않는다
    code: Account.deposit(long) 으로 확정
  - name: 컴파일 시점 — 상수 풀에 심볼로 적는다
    detail: 실제 메모리 주소를 모르므로 이름으로 적어둔다. invokevirtual #12 처럼 상수 풀 인덱스를 가리킨다. 다음 글의 주제다
    code: invokevirtual #12
  - name: 클래스 로딩 시점 — vtable 을 만든다
    detail: JVM 이 부모의 vtable 을 복사하고 오버라이딩한 것만 자기 구현으로 덮어쓴다. 그래서 자식의 vtable 에는 부모 메서드와 자식 메서드가 같은 슬롯 번호로 정렬된다
    code: 부모 vtable 복사 후 덮어쓰기
  - name: 첫 호출 시점 — 심볼을 해석한다
    detail: #12 가 가리키는 이름을 실제 vtable 슬롯 번호로 바꾼다. 한 번만 하고 결과를 캐싱한다. 이것이 지연 해석이다
    code: #12 → vtable 슬롯 0
  - name: 실행 시점 — 객체의 클래스 포인터를 따라간다
    detail: acc 가 가리키는 객체에서 클래스 포인터를 읽는다. 이것이 pass-by-value 에서 본 역참조의 또 다른 쓰임이다
    code: 객체 → SavingsAccount 클래스
  - name: 실행 시점 — 그 클래스의 vtable 슬롯을 읽는다
    detail: 슬롯 번호는 컴파일 시점에 정해졌고 어느 클래스의 vtable 인지는 지금 정해졌다. 이 조합이 동적 디스패치의 전부다
    code: vtable[0] → SavingsAccount.deposit
  - name: 그래서 슬롯 번호가 같아야 한다
    detail: 부모 타입으로 호출했는데 자식 구현이 돌 수 있는 이유다. 어느 클래스의 vtable 이든 deposit 은 같은 슬롯에 있다
    code: 슬롯은 정적 · 테이블은 동적
```

**마지막 줄이 핵심**이다. 슬롯 번호는 컴파일 시점에 고정이고
**어느 테이블을 볼지만 런타임에 정해진다.** 그래서 빠르다.
이름으로 매번 검색하는 것이 아니라 **배열 인덱스 접근**이다.

### 네 가지 호출 명령

```visual
id: method-dispatch-invoke-kinds
kind: structure
title: invoke 명령 네 종류와 각자의 디스패치 방식
nodes:
  - name: 메서드 호출 바이트코드
    detail: 자바의 모든 메서드 호출이 이 넷 중 하나다. 어느 것이 쓰이는지로 디스패치 비용과 다형성 가능 여부가 갈린다
    code: invokestatic · invokespecial · invokevirtual · invokeinterface
    children:
      - name: invokestatic — 테이블을 안 거친다
        detail: static 메서드다. 객체가 없으므로 받을 대상도 없다. 컴파일 시점에 대상이 완전히 확정된다
        code: 정적 · 가장 빠르다
        children:
          - name: 그래서 오버라이딩이 안 된다
            detail: polymorphism 의 덧에서 본 것이다. static 메서드를 자식에 같은 이름으로 두면 숨김이지 오버라이딩이 아니다
            code: 다형성 불가
          - name: 그래서 테스트에서 모킹이 어렵다
            detail: 호출 대상이 코드에 박혀 있어 바꿔치기할 지점이 없다. 테스트 과목에서 다시 만난다
            code: 바꿔치기 지점이 없다
      - name: invokespecial — 특별히 고정해야 하는 것
        detail: 생성자, private 메서드, super 호출. 이 셋은 다형적으로 동작하면 안 되므로 정적으로 묶는다
        code: 생성자 · private · super
        children:
          - name: 왜 고정해야 하나
            detail: 생성자가 다형적이면 inheritance 의 생성자 체이닝이 성립하지 않는다. super.method() 가 다형적이면 자기를 다시 부르는 무한 재귀가 된다
            code: 고정이 의미를 만든다
          - name: private 이 final 처럼 동작하는 이유
            detail: 자식이 같은 이름을 써도 오버라이딩이 아니다. 호출이 정적으로 묶이므로 서로 다른 메서드로 공존한다
            code: 오버라이딩 대상이 아니다
      - name: invokevirtual — vtable 을 거친다
        detail: 일반 인스턴스 메서드다. 자바 메서드 호출의 대부분이 이것이고 다형성이 여기서 일어난다
        code: 동적 · 배열 인덱스 한 번
        children:
          - name: 비용
            detail: 객체에서 클래스 포인터를 읽고 vtable 슬롯을 읽는다. 간접 참조 두 번이다. 직통 호출보다 느리지만 검색은 아니다
            code: 간접 참조 2회
          - name: JIT 가 거의 없앤다
            detail: 실제로 한 타입만 들어오면 JIT 가 직통 호출로 바꾼다. 아래에서 자세히 본다
            code: 역가상화
      - name: invokeinterface — itable 을 거친다
        detail: 인터페이스 타입으로 호출할 때다. 구현 클래스마다 메서드 순서가 다를 수 있어 슬롯 번호를 고정할 수 없다
        code: 동적 · 탐색이 필요하다
        children:
          - name: 왜 더 느리나
            detail: 한 클래스가 여러 인터페이스를 구현할 수 있으므로 어느 인터페이스의 몇 번째인지를 찾아야 한다. vtable 처럼 번호로 바로 못 간다
            code: itable 탐색
          - name: 그래도 신경 쓸 수준은 아니다
            detail: JIT 의 인라인 캐시가 이것도 거의 없앤다. 인터페이스를 쓰지 말 이유가 되지 않는다
            code: 측정 없이 피하지 않는다
      - name: invokedynamic — 람다와 메서드 참조
        detail: Java 7 에 추가됐다. 호출 대상을 런타임에 부트스트랩 메서드가 결정한다. 람다가 익명 클래스보다 가벼운 이유가 이것이다
        code: 람다 · 메서드 참조
```

### `static` 이 인스턴스 메서드를 못 부르는 이유

이제 설명된다.

```java file=WhyCannotCall.java bad label="받을 객체가 없다"
static void main(String[] args) {
    instanceMethod();        // 어느 객체의 vtable 을 볼 것인가
}
```

`invokevirtual` 은 **객체에서 클래스 포인터를 읽어야** 한다.
`static` 메서드에는 **그 객체가 없다.** `this` 가 없기 때문이다.

```java file=HowToCall.java good label="객체를 만들어 넘긴다"
static void main(String[] args) {
    new App().instanceMethod();     // 이제 받을 객체가 있다
}
```

**"Static Zone 이 Non-Static Zone 을 직접 못 부른다"**는 설명이
실제로는 **"`this` 가 없어서 vtable 에 도달할 경로가 없다"**는 뜻이다.

[[polymorphism]] 에서 "메서드는 결국 숨겨진 첫 인자로 자기 자신을 받는 함수"라고 했는데,
`static` 은 **그 첫 인자가 없는 함수**다.

### JIT 가 비용을 거의 없앤다

```java file=MonomorphicCall.java
List<Account> accounts = ...;
for (Account a : accounts) {
    a.deposit(1000);          // invokevirtual
}
```

**실제로 `SavingsAccount` 만 들어오면** JIT 가 이렇게 바꾼다.

```
1. 인라인 캐시: "직전에 SavingsAccount 였다"를 기억한다
2. 타입을 확인하고 맞으면 vtable 을 건너뛰고 직통 호출
3. 더 나아가 메서드 본문을 호출 지점에 인라인한다
4. 틀리면 원래 경로로 되돌아간다 (deoptimization)
```

**한 타입만 오면(monomorphic)** 거의 직통 호출만큼 빠르다.
두 타입이면(bimorphic) 조금 느리고, **세 타입 이상(megamorphic)**이면
vtable 경로로 떨어진다.

```visual
id: method-dispatch-perf-reality
kind: playground
title: 이 호출의 디스패치 비용이 문제가 되나
inputs:
  - { name: 상황, label: 상황, options: [인터페이스로 호출한다, 구현체가 하나뿐이다, 구현체가 다섯 개 이상, 루프 안에서 수억 번, 람다를 많이 쓴다] }
  - { name: 걱정, label: 걱정하는 것, options: [디스패치 비용, 인라이닝이 막히나, 설계를 바꿔야 하나] }
outcomes:
  - when: { 상황: 구현체가 하나뿐이다, 걱정: 디스패치 비용 }
    result: 걱정할 것이 없다. JIT 가 역가상화해서 직통 호출로 만든다
    note: 인터페이스를 썼어도 실제로 한 구현만 로딩되면 JIT 가 그것을 알고 최적화한다. 측정 가능한 차이가 없다
  - when: { 상황: 인터페이스로 호출한다, 걱정: 설계를 바꿔야 하나 }
    result: 바꾸지 않는다. itable 이 vtable 보다 느리다는 것은 사실이지만 체감 수준이 아니다
    note: 인터페이스를 피해 설계를 망치는 것이 훨씬 큰 손해다. solid 의 DIP 를 성능 때문에 포기할 근거가 되지 않는다
  - when: { 상황: 구현체가 다섯 개 이상, 걱정: 인라이닝이 막히나 }
    result: megamorphic 이 되어 인라인 캐시가 포기한다. 그런데 그래도 vtable 경로이고 검색은 아니다
    note: 측정해서 그 호출이 실제 병목인지 확인하는 것이 먼저다. 대개는 다른 곳이 병목이다
  - when: { 상황: 루프 안에서 수억 번, 걱정: 디스패치 비용 }
    result: 여기서는 측정할 가치가 있다. JMH 로 재보고 필요하면 호출을 루프 밖으로 끌어낸다
    note: 수억 번이면 나노초 차이가 초 단위가 된다. 다만 그 전에 JIT 가 이미 최적화했는지 확인한다
  - when: { 상황: 람다를 많이 쓴다, 걱정: 디스패치 비용 }
    result: invokedynamic 은 첫 호출에 부트스트랩 비용이 있고 그 뒤로는 가볍다
    note: 람다가 익명 클래스보다 가벼운 이유다. 클래스 파일을 미리 만들지 않고 런타임에 필요할 때 만든다
  - when: { 걱정: 설계를 바꿔야 하나 }
    result: 측정하기 전에는 바꾸지 않는다. 디스패치 비용으로 설계를 정하는 것은 거의 항상 잘못된 최적화다
    note: 이 글의 목적은 원리를 아는 것이고 설계를 비틀라는 것이 아니다. 알고 나서 안 바꾸는 것이 대부분의 정답이다
```

**"알고 나서 안 바꾸는 것"**이 대부분의 정답이다.
원리를 아는 목적은 **문제가 생겼을 때 어디를 볼지** 아는 것이다.

### 확인하는 법

```bash file=terminal
$ javap -c App.class | grep invoke
      4: invokespecial #1    // Object.<init>
      9: invokevirtual #7    // Account.deposit
     15: invokestatic  #13   // Math.max
     21: invokeinterface #19 // List.add

$ java -XX:+PrintCompilation App          # JIT 컴파일 로그
$ java -XX:+UnlockDiagnosticVMOptions -XX:+PrintInlining App
```

**`javap -c` 로 어느 명령이 쓰였는지 바로 보인다.**
오버라이딩이 안 되는 메서드가 왜 안 되는지도 명령 이름으로 설명된다.

## 5. 이것도 끝이 아니다 — `#7` 은 무엇인가

호출 메커니즘을 봤다. 그런데 위 `javap` 출력에 설명 안 한 것이 있다.

```
9: invokevirtual #7    // Account.deposit
```

**`#7` 이 무엇인가.** 그리고 2번 단계에서 이렇게 말했다.

> 실제 메모리 주소를 모르므로 **이름으로 적어둔다.**

**컴파일러가 주소를 모르는데 어떻게 호출 코드를 만드나.**
그리고 더 큰 질문이 있다.

```
같은 .class 파일이 윈도우에서도 리눅스에서도 맥에서도 돈다
```

**Write Once, Run Anywhere** 가 어떻게 가능한가.
C 는 플랫폼마다 다시 컴파일해야 하는데 자바는 안 한다.

그 답이 **바이트코드와 상수 풀**에 있고, 거기에 `#7` 의 정체도 있다.

[[bytecode]] 에서 본다. PART 2 의 마지막이다.

## 자기 점검

- vtable 이 어느 영역에 있고 몇 개 만들어지는가?
- 부모 타입으로 호출했는데 자식 구현이 도는 이유를 슬롯 번호로 설명하면?
- `static` 메서드가 인스턴스 메서드를 직접 못 부르는 이유는?
- 생성자와 `private` 메서드가 `invokespecial` 인 이유는?
- 구현체가 하나뿐일 때 인터페이스 호출 비용을 걱정하지 않아도 되는 이유는?

## 덧 — 흔한 오해

### "인터페이스는 느리니까 성능이 중요하면 클래스를 쓴다"

**측정 가능한 차이가 거의 없다.** 그리고 JIT 가 대부분 없앤다.

```
itable 탐색이 vtable 인덱싱보다 느린 것은 사실이다
그런데 인라인 캐시가 적용되면 둘 다 직통 호출이 된다
```

**구현체가 하나면** JIT 가 역가상화해서 아예 가상 호출이 사라진다.
Spring 의 모든 것이 인터페이스인데 느리지 않은 이유다.

성능을 이유로 [[solid]] 의 DIP 를 포기하는 것은
**얻는 것보다 잃는 것이 훨씬 크다.**

### "`final` 메서드는 빨라진다"

**예전에는 그랬고 지금은 거의 의미가 없다.**

```java file=FinalMethod.java
final void process() { }     // 오버라이딩 불가 → 정적 바인딩 가능
```

이론적으로는 `final` 이면 오버라이딩이 없으니 직통 호출로 바꿀 수 있다.
그런데 **JIT 가 `final` 없이도 그 판단을 한다.**

실제로 로딩된 클래스를 보고 "이 메서드는 아무도 오버라이딩하지 않았다"를
알아내 역가상화한다. 그래서 `final` 을 **성능 목적으로 붙일 이유가 없다.**

`final` 을 붙이는 이유는 [[inheritance]] 의 덧에서 본 것 —
**확장을 막는 설계 의도**다. 성능이 아니다.

### "`invokevirtual` 이면 항상 vtable 을 거친다"

**JIT 컴파일 전에만 그렇다.** 그리고 인터프리터와 컴파일된 코드가 다르다.

```
처음 몇천 번    → 인터프리터. vtable 을 매번 거친다
그 다음         → C1 컴파일. 인라인 캐시
더 뜨거워지면   → C2 컴파일. 역가상화 + 인라이닝
```

그래서 **벤치마크를 처음 몇 번 돌려 측정하면 틀린다.**
웜업 없이 측정한 수치는 인터프리터 성능이다.

JMH 같은 도구가 **웜업 구간을 따로 두는 이유**가 이것이다.
그리고 이 성질이 [[memory-areas]] 의 덧에서 본
"특정 클래스 첫 호출만 느리다"와 같은 뿌리다.
