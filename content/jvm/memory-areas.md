---
title: OutOfMemoryError 와 StackOverflowError 는 왜 다른 이름인가
summary: 변수가 어디 저장되는지, 그리고 JVM 이 메모리를 영역으로 나눈 이유
versionNote: Java 21 · HotSpot 기준
ord: 1
minutes: 28
edges:
  - { to: solid, type: prerequisite }
  - { to: pass-by-value, type: deepens }
sources:
  - { label: JVM Specification - Run-Time Data Areas, url: https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html }
  - { label: Oracle - Java HotSpot VM Options, url: https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html }
  - { label: JEP 122 - Remove the Permanent Generation, url: https://openjdk.org/jeps/122 }
---

[[solid]] 끝에서 질문을 남겼다. 이 한 줄에서 무슨 일이 일어나는가.

```java file=OneLine.java
Account a = new SavingsAccount();
```

그리고 실무에서 만나는 두 오류가 있다.

```
java.lang.OutOfMemoryError: Java heap space
java.lang.StackOverflowError
```

**둘 다 "메모리가 부족하다"인데 이름이 다르다.**
JVM 이 메모리를 **한 덩어리로 안 쓰고 영역으로 나눴기** 때문이다.

그 나눔을 알면 두 오류의 원인도, `static` 이 왜 공유되는지도,
스레드가 늘어나면 왜 메모리가 더 드는지도 같이 설명된다.

## 0. 들어가기 전에 — 핵심 용어

- **Stack**: 메서드 호출 정보와 지역 변수가 쌓이는 곳. **스레드마다 하나씩.**
- **Heap**: `new` 로 만든 모든 객체가 사는 곳. **스레드가 공유한다.**
- **Method Area**: 클래스 정보, `static` 변수, 상수 풀. Java 8 부터 **Metaspace** 다.
- **스택 프레임**: 메서드 호출 하나에 대응하는 Stack 의 한 칸.
- **PC Register**: 그 스레드가 지금 실행 중인 바이트코드 위치.
- **Metaspace**: Java 8 에서 PermGen 을 대체한 영역. **네이티브 메모리**를 쓴다.

한 줄 그림: **수명이 다른 것을 같은 곳에 두면 회수할 수 없다. 그래서 수명별로 나눴다.**

비유하자면 **작업대와 창고와 설명서 보관함**이다.
작업대는 **일 하나 할 때만** 쓰고 끝나면 치운다(Stack).
창고에는 **계속 쓸 물건**을 둔다. 언제 버릴지는 따로 판단해야 한다(Heap).
설명서는 **제품 종류마다 한 장**이면 되고 제품을 다 팔아도 남는다(Method Area).

작업대를 창고처럼 쓰면 일을 못 하고, 창고를 작업대처럼 쓰면 물건을 못 찾는다.

## 1. 그전엔 어떻게 했나 — C 에서 직접 관리하던 시절

C 에서는 메모리를 **내가 정한다.**

```c file=manual.c
void f() {
    int local = 10;              // 스택. 함수가 끝나면 자동으로 사라진다
    int *heap = malloc(4);       // 힙. 내가 free 해야 사라진다
    *heap = 20;
    free(heap);                  // 안 하면 누수
}
```

**스택과 힙의 구분이 이미 있었다.** 자바가 발명한 것이 아니다.
문제는 **그 관리를 사람이 했다**는 것이다.

### 고통 1 — 어디에 할당했는지 기억해야 한다

```c file=whichIsIt.c bad label="free 를 해야 하나 말아야 하나"
void g(int *p) {
    free(p);          // p 가 malloc 으로 왔으면 맞다
}                     // 스택 변수의 주소였으면 프로그램이 죽는다

int main() {
    int x = 5;
    g(&x);            // 터진다
}
```

**함수 시그니처가 알려주지 않는다.** `int *p` 만 보고는
힙인지 스택인지 알 수 없다. 문서와 관례에 의존한다.

### 고통 2 — 끝난 뒤의 주소를 들고 있는다

```c file=dangling.c bad label="사라진 것을 가리킨다"
int *bad() {
    int local = 42;
    return &local;      // 함수가 끝나면 이 스택 칸은 재사용된다
}
```

**컴파일은 된다.** 그리고 돌 때 **다른 값이 나온다.**
운이 좋으면 42 가 나와서 버그를 못 찾는다.

### 고통 3 — 수명이 섞이면 회수할 수 없다

메모리를 **한 덩어리로** 관리하면 이런 일이 생긴다.

```
[긴 수명 객체][짧은 객체][긴 수명][짧은][긴 수명]...
```

짧은 것들을 치워도 **중간중간 빈 칸**이 남는다(단편화).
큰 객체를 할당할 연속 공간이 없어서 **총 여유는 있는데 할당이 실패**한다.

### 고통 4 — 어디가 찼는지 알 수 없다

메모리가 부족하다. 그런데 **무엇 때문인지** 알 수 없다.
객체가 너무 많은 건지, 호출이 너무 깊은 건지, 클래스를 너무 많이 로딩한 건지.

오류 메시지가 **"메모리 부족"** 하나뿐이면 **진단이 불가능하다.**

네 고통의 뿌리는 **하나**다. **수명이 다른 것이 섞여 있었다.**
언제 사라지는지가 다르면 관리 방법도 달라야 한다.

## 2. 이렇게 피해봤다

### 시도 1 — 명명 규칙으로 구분한다

`p_heap`, `p_stack` 처럼 변수명에 적는다.

**사람이 지켜야 한다.** 그리고 함수 경계를 넘으면 소용없다.
고통 1 이 그대로다.

### 시도 2 — 참조 카운팅을 붙인다

객체마다 "몇 명이 가리키나"를 세고 0 이 되면 해제한다.
C++ 의 `shared_ptr` 과 파이썬이 쓰는 방식이다.

**순환 참조를 못 푼다.**

```
A → B → A
```

서로를 가리키면 카운트가 영원히 0 이 안 된다. **누수된다.**
그리고 카운트를 올리고 내리는 비용이 **모든 대입마다** 든다.

이 한계가 PART 3 에서 **GC 가 참조 카운팅을 안 쓰는 이유**가 된다.

### 시도 3 — 영역을 하나 더 두고 큰 것만 따로

큰 객체 전용 영역을 만들어 단편화를 줄인다. 실제로 쓰이는 기법이다.

**부분적으로 효과가 있다.** 그런데 "큰 것"의 기준을 정해야 하고,
수명이 아니라 **크기**로 나눈 것이라 고통 3 의 뿌리는 남는다.

> 세 시도의 공통점: **한 덩어리라는 전제를 유지했다.**
> 수명과 공유 범위로 나누면 관리 방법이 각각 정해진다.

## 3. 그래서 나온 것 — 수명과 공유 범위로 나눈다

JVM 은 메모리를 **다섯 영역**으로 나눈다.
그리고 각 영역의 **수명 규칙이 다르다.**

| 영역 | 무엇이 | 수명 | 공유 |
| --- | --- | --- | --- |
| **Stack** | 지역 변수, 호출 프레임 | 메서드 호출 ~ 종료 | **스레드마다 따로** |
| **Heap** | `new` 한 모든 객체 | 참조가 끊길 때까지 | 전체 공유 |
| **Method Area** | 클래스 정보, `static`, 상수 풀 | 클래스 로딩 ~ 언로딩 | 전체 공유 |
| **PC Register** | 실행 중인 명령 위치 | 스레드 수명 | 스레드마다 따로 |
| **Native Method Stack** | 네이티브 호출 | 호출 ~ 종료 | 스레드마다 따로 |

**변수 세 종류가 각각 다른 영역**에 간다.

```java file=WhereDoTheyLive.java
class Account {
    static int count;          // Method Area — 클래스마다 하나
    private long balance;      // Heap — 객체와 함께

    void deposit(long amount) { // amount, temp — Stack
        long temp = balance + amount;
        balance = temp;
    }
}
```

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 어디에 할당했는지 기억 | **자바는 선택이 없다.** `new` 면 Heap, 지역 변수면 Stack |
| 끝난 주소를 들고 있는다 | 스택 변수의 **주소를 얻을 방법이 없다** |
| 수명이 섞여 회수 불가 | 영역을 나눴고, Heap 안에서 또 세대로 나눈다 (PART 3) |
| 어디가 찼는지 모른다 | **오류 이름이 영역을 알려준다** (아래) |

## 4. 어떻게 동작하나 — 오류 이름이 영역을 말해준다

고통 4 의 해결이다. 영역이 나뉘어 있으니 **어디가 찼는지가 메시지에 나온다.**

```visual
id: memory-areas-which-error
kind: structure
title: 오류 이름으로 어느 영역이 찼는지 안다
nodes:
  - name: 메모리 관련 오류
    detail: 이름이 영역을 가리킨다. 한 덩어리로 관리하면 이 구분이 불가능하고, 그래서 영역을 나눈 실용적 이득이 진단에서 나온다
    code: 이름 → 영역 → 원인 → 조치
    children:
      - name: StackOverflowError — Stack 이 찼다
        detail: 호출 프레임이 너무 많이 쌓였다. 스레드 하나의 스택 크기를 넘긴 것이다
        code: 호출 깊이 문제
        children:
          - name: 전형적인 원인
            detail: 종료 조건이 없는 재귀다. 그리고 상호 재귀나 toString 안에서 자기 필드를 또 출력하는 경우도 흔하다
            code: 무한 재귀
          - name: 조치
            detail: 재귀를 반복문으로 바꾸거나 깊이를 줄인다. -Xss 로 스택을 키우는 것은 근본 해결이 아니고 스레드 수를 줄인다
            code: 코드를 고친다
          - name: 메모리가 남아도 난다
            detail: 힙이 텅 비어 있어도 스택이 차면 이 오류다. 둘이 별도 영역이기 때문이다
            code: 영역별로 독립이다
      - name: OutOfMemoryError Java heap space — Heap 이 찼다
        detail: 객체가 너무 많거나 참조가 안 끊겨 GC 가 회수하지 못한다
        code: 객체 수명 문제
        children:
          - name: 전형적인 원인
            detail: 컬렉션에 계속 담고 안 비우는 경우, 캐시에 상한이 없는 경우, 리스너를 등록하고 해제하지 않는 경우
            code: 누수 또는 한도 부족
          - name: 조치
            detail: 힙 덤프를 떠서 무엇이 많은지 본다. -Xmx 를 올리는 것은 누수면 시간만 버는 것이다
            code: 힙 덤프 분석
      - name: OutOfMemoryError Metaspace — Method Area 가 찼다
        detail: 클래스를 너무 많이 로딩했다. Java 8 이전에는 PermGen 이라는 이름이었다
        code: 클래스 로딩 문제
        children:
          - name: 전형적인 원인
            detail: 애플리케이션 재배포를 반복하면서 옛 클래스로더가 회수되지 않는 경우. 그리고 동적 프록시나 바이트코드 생성을 남용하는 경우
            code: 클래스로더 누수 · 동적 생성
          - name: 왜 이름이 바뀌었나
            detail: PermGen 은 힙 안에 고정 크기로 있어서 쉽게 찼다. Java 8 이 Metaspace 로 옮기며 네이티브 메모리를 쓰게 해 기본적으로 무제한에 가까워졌다
            code: Java 8 의 변경
      - name: OutOfMemoryError unable to create native thread
        detail: 힙도 메타스페이스도 아니다. 스레드를 만들 네이티브 메모리가 없는 것이다
        code: 스레드 수 문제
        children:
          - name: 스택과 얽힌다
            detail: 스레드마다 스택을 따로 받으므로 스레드 수 × 스택 크기가 네이티브 메모리를 먹는다. -Xss 를 키웠으면 만들 수 있는 스레드가 줄어든다
            code: 스레드 수 × -Xss
```

**스택을 키우면 스레드 수가 줄어든다**는 것이 마지막 줄의 교환 관계다.
`-Xss` 를 올려 `StackOverflowError` 를 피하려 하면
**다른 오류가 나타난다.** 영역이 나뉘어 있어도 **전체 메모리는 유한하다.**

### `static` 이 공유되는 이유

```java file=StaticShared.java
class Counter {
    static int count;        // Method Area 에 딱 하나
    int instanceCount;       // 객체마다 하나
}

Counter a = new Counter();
Counter b = new Counter();
a.count++;                   // b.count 도 1 이 된다
a.instanceCount++;           // b.instanceCount 는 0
```

**Method Area 에 하나만 있기 때문**이다. 설명이 끝난다.
"static 은 공유된다"를 외우는 것이 아니라 **어디 있는지**로 설명된다.

그리고 여기서 따라 나오는 사실이 있다.
**`static` 변수는 스레드 안전하지 않다.** 전체가 공유하므로
여러 스레드가 동시에 고친다. PART 7 의 동시성 문제가 여기서 시작된다.

반대로 **지역 변수는 스레드 안전하다.** Stack 이 스레드마다 따로이므로
다른 스레드가 볼 수 없다. 이것도 PART 7 의 전제가 된다.

### `new` 한 줄이 하는 일

[[solid]] 에서 남긴 질문이다.

```visual
id: memory-areas-new-operator
kind: step
title: new SavingsAccount() 가 실행되는 순서
steps:
  - name: 1. Method Area 에서 클래스 정보를 찾는다
    detail: 아직 로딩되지 않았으면 클래스로더가 .class 를 읽어 Method Area 에 올린다. 그래서 어떤 클래스는 처음 쓸 때 유독 느리다
    code: 클래스 정보 확인 · 필요하면 로딩
  - name: 2. Heap 에 객체 공간을 확보한다
    detail: 필드 크기의 합만큼 할당한다. 이 단계에서 공간이 없으면 OutOfMemoryError Java heap space 다
    code: Heap 에 메모리 할당
  - name: 3. 필드를 기본값으로 초기화한다
    detail: int 는 0, boolean 은 false, 참조는 null. 생성자가 돌기 전에 이미 이 값이다. 그래서 inheritance 에서 본 생성자 함정이 null 로 나타났다
    code: 0 · false · null
  - name: 4. 생성자를 호출한다
    detail: inheritance 에서 본 생성자 체이닝이 여기서 일어난다. 부모 생성자가 먼저 돌고 자식 필드 초기화가 그 뒤다
    code: super() → 필드 초기화식 → 생성자 본문
  - name: 5. 참조를 Stack 의 변수에 넣는다
    detail: a 라는 지역 변수는 Stack 에 있고 그 안에는 Heap 주소가 들어간다. 객체 자체가 Stack 에 들어가는 것이 아니다
    code: Stack 의 a ← Heap 주소
  - name: new 없이 객체를 만드는 길도 있다
    detail: Reflection, clone, 역직렬화가 생성자를 건너뛰거나 다르게 부른다. 그래서 JPA 가 기본 생성자를 요구하고 불변식을 생성자에만 두면 뚫릴 수 있다
    code: 자바 PART 5 · 6 과 연결
```

**5번이 중요하다.** 변수와 객체가 **다른 영역에** 있다.
이 분리가 다음 글의 주제가 된다.

### 영역별로 확인하는 법

```bash file=terminal
$ java -XX:+PrintFlagsFinal -version | grep -E 'MaxHeapSize|ThreadStackSize'
   size_t MaxHeapSize   = 4294967296      # -Xmx. Heap 상한
   intx ThreadStackSize = 1024            # -Xss. 스레드당 스택(KB)

$ jcmd <pid> VM.native_memory summary     # 영역별 실사용
$ jcmd <pid> GC.heap_info                 # Heap 상세
$ jmap -dump:live,format=b,file=heap.hprof <pid>   # 힙 덤프
```

**`-Xmx` 를 올리는 것이 항상 답이 아니다.**
누수면 시간만 벌고, 스레드가 많으면 네이티브 메모리가 먼저 떨어진다.

```visual
id: memory-areas-diagnosis
kind: playground
title: 이 증상에는 어느 영역을 보나
inputs:
  - { name: 증상, label: 증상, options: [StackOverflowError, OOM Java heap space, OOM Metaspace, OOM unable to create native thread, 메모리가 계속 는다, 특정 클래스 첫 호출만 느리다] }
  - { name: 상황, label: 상황, options: [재귀 코드가 있다, 컬렉션에 계속 담는다, 재배포를 반복했다, 스레드를 많이 만든다] }
outcomes:
  - when: { 증상: StackOverflowError, 상황: 재귀 코드가 있다 }
    result: 종료 조건을 먼저 본다. -Xss 를 키우는 것은 근본 해결이 아니다
    note: 힙이 비어 있어도 난다. 영역이 독립이기 때문이다. 재귀를 반복문으로 바꾸면 Stack 대신 Heap 을 쓰게 되어 깊이 제약이 사라진다
  - when: { 증상: OOM Java heap space, 상황: 컬렉션에 계속 담는다 }
    result: 힙 덤프를 떠서 무엇이 많은지 본다. 상한 없는 캐시가 가장 흔한 범인이다
    note: -Xmx 를 올리면 터지는 시점만 늦춰진다. 누수인지 한도 부족인지를 먼저 가려야 조치가 갈린다
  - when: { 증상: OOM Metaspace, 상황: 재배포를 반복했다 }
    result: 클래스로더 누수다. 옛 클래스로더가 회수되지 않아 클래스가 쌓인다
    note: 전형적인 WAS 재배포 문제다. 스레드 로컬이나 정적 참조가 옛 클래스로더를 붙잡고 있는 경우가 많다
  - when: { 증상: OOM unable to create native thread, 상황: 스레드를 많이 만든다 }
    result: 힙이 아니라 네이티브 메모리다. 스레드 수 × 스택 크기를 계산해본다
    note: -Xss 를 키워뒀으면 만들 수 있는 스레드가 줄어든다. 스레드를 직접 만들지 말고 풀을 쓰는 것이 근본 해결이다
  - when: { 증상: 메모리가 계속 는다, 상황: 컬렉션에 계속 담는다 }
    result: 힙 덤프를 두 시점에 떠서 차이를 본다. 무엇이 늘어나는지가 범인이다
    note: 한 번만 떠서는 많은 것이 원래 많은 것인지 늘어나는 것인지 모른다. 비교가 핵심이다
  - when: { 증상: 특정 클래스 첫 호출만 느리다 }
    result: 클래스 로딩이다. new 의 1단계에서 .class 를 읽어 Method Area 에 올리는 비용이다
    note: 메모리 문제가 아니다. 웜업으로 미리 로딩하거나 AOT 컴파일을 검토한다. JIT 컴파일도 같은 이유로 초기에 느리다
  - when: { 상황: 스레드를 많이 만든다 }
    result: 스레드마다 스택을 따로 받는다는 것을 기억한다. 스레드 수가 메모리 설계에 들어온다
    note: 스레드 1000개에 -Xss 1MB 면 그것만 1GB 다. 힙과 별개로 네이티브 메모리에서 나간다
```

## 5. 이것도 끝이 아니다 — 넘길 때 무엇이 복사되나

영역이 나뉘었다. 그런데 위 `new` 의 5번에서 본 분리가 질문을 만든다.

```java file=WhatGetsCopied.java
Account a = new SavingsAccount();   // a 는 Stack, 객체는 Heap
process(a);                         // 메서드에 넘기면 무엇이 복사되나
```

`a` 는 Stack 에 있고 객체는 Heap 에 있다.
메서드를 호출하면 **새 스택 프레임**이 생긴다. 거기에 무엇이 들어가나.

그리고 이것 때문에 실무에서 혼란이 생긴다.

```java file=ConfusingBehavior.java
static void modify(Account acc) {
    acc.deposit(1000);              // 호출자에 반영된다
    acc = new SavingsAccount();     // 호출자에 반영되지 않는다
}
```

**같은 변수에 한 일인데 한쪽은 반영되고 한쪽은 안 된다.**

"자바는 객체를 참조로 넘긴다"고 알면 두 번째가 설명되지 않고,
"값으로 넘긴다"고 알면 첫 번째가 설명되지 않는다.

**둘 다 설명하는 하나의 모델**이 필요하다. [[pass-by-value]] 에서 본다.

## 자기 점검

- 변수 세 종류(지역·인스턴스·클래스)가 각각 어느 영역에 저장되는가?
- `static` 변수가 모든 객체에 공유되는 이유를 영역으로 설명하면?
- 지역 변수가 스레드 안전한 이유는?
- `-Xss` 를 키워 `StackOverflowError` 를 피하면 어떤 대가가 따라오는가?
- `new` 한 줄의 다섯 단계 중 `OutOfMemoryError` 가 날 수 있는 단계는?

## 덧 — 흔한 오해

### "객체는 무조건 Heap 에 간다"

**대체로 맞지만 예외가 있다.** JIT 가 **탈출 분석**으로 Stack 에 올리기도 한다.

```java file=EscapeAnalysis.java
void compute() {
    Point p = new Point(1, 2);     // 메서드 밖으로 안 나간다
    System.out.println(p.x + p.y); // JIT 가 스택 할당으로 바꿀 수 있다
}
```

객체가 메서드를 **탈출하지 않으면** JIT 가 Heap 할당을 생략할 수 있다.
그러면 GC 대상이 아예 안 된다.

다만 **의존할 수는 없다.** JIT 가 할지 안 할지는 실행 중에 정해지고
`-XX:+PrintEscapeAnalysis` 로 확인은 되지만 보장이 아니다.

**"객체는 Heap 에 간다"는 모델로 생각하고**, JIT 의 최적화는
덤으로 받는 것으로 보면 된다.

### "Method Area 는 PermGen 이다"

**Java 8 에서 바뀌었다.** 이름도 위치도 다르다.

```
Java 7 이전 : PermGen. Heap 안. 고정 크기 → 쉽게 찬다
Java 8 이후 : Metaspace. 네이티브 메모리. 기본 무제한에 가깝다
```

그래서 **옛 글의 `-XX:MaxPermSize` 는 지금 무효**다.
옵션을 주면 경고가 뜨고 무시된다.

```bash file=terminal
$ java -XX:MaxPermSize=256m -version
OpenJDK 64-Bit Server VM warning: Ignoring option MaxPermSize
```

`-XX:MaxMetaspaceSize` 가 대응되는 옵션인데, **보통 안 건다.**
걸지 않으면 네이티브 메모리가 허용하는 만큼 쓴다.
`OutOfMemoryError: Metaspace` 가 난다면 **한도 문제가 아니라 누수**인 경우가 많다.

### "Heap 이 크면 성능이 좋다"

**GC 시간이 길어진다.** 교환 관계가 있다.

```
Heap 작음 → GC 가 자주 돈다. 한 번은 짧다
Heap 큼   → GC 가 드물게 돈다. 한 번이 길다
```

그리고 **힙이 너무 크면** 한 번의 정지가 초 단위가 되어
응답 시간이 튄다. 그 문제를 푸는 것이 PART 3 의 G1 과 ZGC 다.

컨테이너에서는 더 조심해야 한다. **컨테이너 메모리 한도와 힙이 다르다.**

```
컨테이너 한도 512MB
-Xmx 512MB 로 주면 → 힙 외에 Metaspace, 스택, 네이티브가 더 필요하다
→ 컨테이너가 OOM 으로 죽는다 (JVM 의 OutOfMemoryError 가 아니라 커널이 SIGKILL)
```

그래서 Java 10 부터 **컨테이너 한도를 인식**해 힙을 그 일부로 잡는다.
Docker 과목의 `cgroups` 에서 본 그 문제다.
