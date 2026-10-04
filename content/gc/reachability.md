---
title: 아무도 free 를 안 부르는데 어떻게 회수되나
summary: 참조 카운팅이 못 푼 순환 참조, 그래서 루트에서 거꾸로 찾는 방식
versionNote: Java 21 · HotSpot 기준
ord: 1
minutes: 27
edges:
  - { to: memory-areas, type: prerequisite }
  - { to: bytecode, type: prerequisite }
  - { to: generations, type: deepens }
sources:
  - { label: Oracle - HotSpot Virtual Machine Garbage Collection Tuning Guide, url: https://docs.oracle.com/en/java/javase/21/gctuning/index.html }
  - { label: JVM Specification - Heap, url: https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html }
  - { label: Oracle - Reference Objects, url: https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ref/package-summary.html }
---

[[bytecode]] 끝에서 질문을 남겼다.

```java file=WhoCleansUp.java
Account a = new SavingsAccount();   // Heap 에 할당했다
a = null;                            // 참조를 끊었다
// 그 객체는 언제 사라지나
```

C 는 `free` 를 내가 불렀다. **자바는 아무도 안 부른다.**

[[memory-areas]] 의 시도 2 에서 참조 카운팅을 보고
**"순환 참조를 못 푼다"**고 하고 넘어갔다. 그러면 무엇을 쓰나.

답이 **거꾸로 생각하는 것**이다. "이 객체가 쓰이고 있나"를 묻는 대신
**"루트에서 닿을 수 있나"**를 묻는다.

## 0. 들어가기 전에 — 핵심 용어

- **가비지(garbage)**: 더 이상 **도달할 수 없는** 객체. "안 쓰는" 객체가 아니다.
- **GC 루트(GC Root)**: 탐색의 출발점. 스택의 지역 변수, `static` 변수 등.
- **도달 가능성 분석(reachability analysis)**: 루트에서 참조를 따라가 살아있는 것을 표시.
- **Mark-Sweep**: 표시하고 안 표시된 것을 회수.
- **Compact**: 살아남은 것을 한쪽으로 몰아 단편화를 없애는 것.
- **STW (Stop The World)**: GC 동안 애플리케이션 스레드를 전부 멈추는 것.

한 줄 그림: **"누가 이걸 쓰나"는 알 수 없지만 "루트에서 닿나"는 알 수 있다.**

비유하자면 **창고 정리**다.
물건마다 "몇 명이 찾았나"를 적어두는 방식이 참조 카운팅이다.
그런데 **두 물건이 서로를 가리키면** 아무도 안 찾는데 숫자가 0 이 안 된다.

대신 **입구에서 출발해 닿는 것에 스티커를 붙이고**
스티커 없는 것을 전부 버리는 방식이 도달 가능성 분석이다.
서로를 가리키든 말든 **입구에서 못 가면 버린다.**

## 1. 그전엔 어떻게 했나 — 사람이 부르거나 숫자를 세거나

### 수동 해제 — C 의 방식

```c file=manual.c
Account *a = malloc(sizeof(Account));
free(a);           // 내가 부른다
```

#### 고통 1 — 두 번 해제하거나 안 하거나

```c file=doubleFree.c bad label="둘 다 사고다"
free(a);
free(a);           // double free. 힙 메타데이터가 망가진다

// 또는
return;            // free 를 빠뜨렸다. 누수
```

**누수는 조용히 쌓인다.** 며칠 돌다가 메모리가 차서 죽는다.
그리고 **어디서 빠뜨렸는지** 역추적이 어렵다.

#### 고통 2 — 소유권을 사람이 추적해야 한다

```c file=ownership.c
Account *create();          // 반환한 것을 누가 free 하나
void register(Account *a);  // 등록하면 소유권이 넘어가나
```

**함수 시그니처가 알려주지 않는다.** 문서와 관례에 의존하고,
라이브러리마다 규약이 다르다. 그래서 `_new`, `_free`, `_ref` 같은
**이름 규칙**이 생겼지만 강제되지 않는다.

그래프 구조에서는 더 어렵다. 노드 하나를 지울 때
**그것을 가리키는 것이 또 있는지** 사람이 알아야 한다.

### 참조 카운팅 — `shared_ptr` 과 파이썬의 방식

객체마다 "몇 명이 가리키나"를 세고 0 이 되면 즉시 해제한다.

```
a = new Account()   → count 1
b = a               → count 2
a = null            → count 1
b = null            → count 0 → 즉시 해제
```

**고통 1 과 2 가 상당히 풀린다.** 소유권을 세는 것이 자동이고,
해제 시점이 **결정적**이라 자원 반납(파일 닫기 등)에 유리하다.

#### 고통 3 — 순환 참조를 못 푼다

```java file=Cycle.java bad label="아무도 안 쓰는데 숫자가 0 이 아니다"
class Node { Node next; }

Node a = new Node();
Node b = new Node();
a.next = b;        // b 의 count = 2
b.next = a;        // a 의 count = 2
a = null;          // a 의 count = 1 (b.next 가 가리킴)
b = null;          // b 의 count = 1 (a.next 가 가리킴)
// 둘 다 아무도 못 닿는데 count 가 0 이 안 된다 → 영구 누수
```

**치명적이다.** 그리고 순환은 생각보다 흔하다.
부모-자식 양방향 참조, 리스너 등록, 캐시가 객체를 들고 있는 경우.

JPA 의 양방향 연관관계가 전부 순환이다. 파이썬은 이것 때문에
**참조 카운팅에 추가로 순환 수집기**를 따로 돌린다.

#### 고통 4 — 카운터 갱신 비용이 모든 대입에 든다

```
b = a;      → a 가 가리키던 것의 count++ , b 가 가리키던 것의 count--
```

**모든 참조 대입마다** 숫자를 고친다. 그리고 멀티스레드면
그 숫자를 **원자적으로** 고쳐야 한다. 락이나 CAS 가 필요하고,
그 비용이 **캐시 라인 경쟁**으로 나타난다.

PART 7 의 동시성 비용이 여기서 미리 드러난다.

네 고통의 뿌리는 **하나**다. **"이 객체가 필요한가"를 객체 쪽에서 판단하려 했다.**
객체는 자기를 누가 쓰는지 알 수 없다.

## 2. 이렇게 피해봤다

### 시도 1 — 소유권 규약을 언어에 넣는다

Rust 가 이 길을 갔다. **컴파일 시점에** 소유권과 수명을 검사한다.

```rust file=ownership.rs
let a = Account::new();
let b = a;              // 소유권이 b 로 이동. a 는 더 못 쓴다
```

**런타임 비용이 0 이다.** GC 도 카운터도 없다.

대신 **프로그래머가 수명을 명시**해야 하고 학습 곡선이 급하다.
그리고 순환 구조를 만들려면 `Rc<RefCell<>>` 같은 것으로
**결국 참조 카운팅을 쓴다.** 고통 3 이 특정 상황에서 돌아온다.

### 시도 2 — 참조 카운팅에 순환 수집기를 더한다

파이썬의 방식이다. 평소에는 카운팅으로 즉시 회수하고,
**주기적으로 순환을 찾아** 따로 수집한다.

**동작한다.** 그런데 **두 메커니즘을 다 운영**해야 하고,
카운터 갱신 비용(고통 4)은 그대로 남는다.

### 시도 3 — 약한 참조를 쓰게 한다

순환이 생길 자리에 **카운트를 올리지 않는 참조**를 쓴다.

```
부모 → 자식 : 강한 참조
자식 → 부모 : 약한 참조
```

**사람이 어디가 순환인지 판단**해야 한다. 그리고 틀리면
누수거나 **너무 일찍 회수**된다. 고통 2 의 "소유권을 사람이 추적"이 되돌아왔다.

> 세 시도의 공통점: **객체에게 "너를 누가 쓰나"를 묻는 틀을 유지했다.**
> 질문을 뒤집으면 순환이 문제가 되지 않는다.

## 3. 그래서 나온 것 — 루트에서 거꾸로 찾는다

**"누가 이 객체를 쓰나"를 묻지 않는다.**
대신 **"루트에서 이 객체에 닿을 수 있나"**를 묻는다.

```
루트 ──→ A ──→ C
     └──→ B

D ⇄ E        ← 서로를 가리키지만 루트에서 못 닿는다 → 가비지
```

**순환이어도 루트에서 못 닿으면 가비지**다.
고통 3 이 **구조적으로** 사라진다. 특별한 처리가 필요 없다.

### GC 루트가 무엇인가

```
Stack 의 지역 변수와 매개변수   ← 지금 실행 중인 모든 스레드의 모든 프레임
static 변수                     ← Method Area
JNI 참조                        ← 네이티브 코드가 들고 있는 것
동기화 모니터로 쓰인 객체        ← synchronized 블록의 대상
```

[[memory-areas]] 에서 본 영역들이 그대로 루트다.
**Stack 과 Method Area 가 루트고 Heap 이 탐색 대상**이다.

네 고통과 대응시켜 보자.

| 고통 | 참조 카운팅 | 도달 가능성 분석 |
| --- | --- | --- |
| 두 번 해제하거나 안 하거나 | 자동이라 해결 | 자동이라 해결 |
| 소유권을 사람이 추적 | 자동이라 해결 | 자동이라 해결 |
| 순환 참조를 못 푼다 | **누수된다** | **문제가 아니다** |
| 카운터 갱신 비용 | 모든 대입마다 | **대입은 공짜.** GC 때만 비용 |

**거래가 바뀐 것**이다. 참조 카운팅은 비용을 **평소에 조금씩** 내고,
도달 가능성 분석은 **GC 할 때 몰아서** 낸다.

그 "몰아서"가 **STW** 이고, GC 튜닝의 거의 전부가 그 시간을 줄이는 일이다.

## 4. 어떻게 동작하나 — 표시하고 쓸고 모은다

```visual
id: reachability-mark-sweep-compact
kind: step
title: GC 한 번이 하는 일
steps:
  - name: 1. STW — 세상을 멈춘다
    detail: 탐색 중에 참조가 바뀌면 결과가 틀린다. 그래서 애플리케이션 스레드를 안전한 지점에서 멈춘다. 이 멈춤이 GC 튜닝의 주제다
    code: safepoint 에서 전체 정지
  - name: 2. Mark — 루트에서 따라가며 표시한다
    detail: 스택의 지역 변수와 static 변수에서 출발해 참조를 따라간다. 닿은 객체에 살아있다는 표시를 한다. 순환이 있어도 이미 표시한 것은 건너뛰므로 무한 루프가 안 된다
    code: 루트 → 참조 → 표시
  - name: 3. 표시 안 된 것이 가비지다
    detail: 루트에서 못 닿은 것 전부다. 서로를 가리키던 D 와 E 도 여기 들어온다. 참조 카운팅이 못 풀던 것이 자동으로 풀린다
    code: 순환도 여기 포함된다
  - name: 4. Sweep — 표시 안 된 공간을 회수한다
    detail: 가용 목록에 올린다. 그런데 여기서 멈추면 문제가 생긴다. 회수된 공간이 조각조각 흩어져 있다
    code: 빈 공간을 목록에 추가
  - name: 5. 단편화 문제
    detail: 총 여유는 100MB 인데 연속한 10MB 가 없어서 큰 배열 할당이 실패한다. memory-areas 의 고통 3 이 Heap 안에서 재현된다
    code: 총량은 있는데 할당 실패
  - name: 6. Compact — 살아남은 것을 한쪽으로 몬다
    detail: 객체를 옮기고 그것을 가리키던 모든 참조를 새 주소로 고친다. 단편화가 사라지고 할당이 포인터를 밀기만 하면 되어 빨라진다
    code: 객체 이동 + 참조 갱신
  - name: 7. 그런데 Compact 가 비싸다
    detail: 객체를 복사하고 참조를 전부 고치는 비용이 든다. 그래서 언제 어디를 Compact 할지가 GC 설계의 핵심 선택이 된다
    code: 다음 글의 주제
```

**객체가 이동한다**는 것이 중요하다.
그래서 자바에서 **객체의 주소를 얻을 방법이 없다**([[pass-by-value]]).
주소를 노출했으면 GC 가 옮길 때마다 그 값이 틀려진다.

### 알고리즘 네 가지의 관계

```visual
id: reachability-algorithms
kind: structure
title: 알고리즘 네 가지는 서로를 보완한 역사다
nodes:
  - name: 가비지를 어떻게 찾고 어떻게 치우나
    detail: 네 가지가 병렬적인 선택지가 아니라 앞의 한계를 뒤가 보완한 순서다. 실제 JVM 은 마지막 것을 쓴다
    code: 찾기 + 치우기의 조합
    children:
      - name: Reference Counting — 찾기 방식
        detail: 객체마다 카운터를 두고 0 이면 회수한다. 즉시 회수되는 것이 장점이다
        code: 즉시 회수
        children:
          - name: 못 푸는 것
            detail: 순환 참조다. 그리고 모든 대입에 카운터 갱신 비용이 든다. JVM 이 안 쓰는 이유다
            code: 순환 누수 · 갱신 비용
      - name: Mark-and-Sweep — 찾기를 뒤집었다
        detail: 루트에서 도달 가능성을 추적한다. 순환이 자동으로 해결된다. JVM 의 기초가 이것이다
        code: 루트에서 표시 후 제거
        children:
          - name: 해결한 것
            detail: 순환 참조. 그리고 평소 대입이 공짜가 된다. 비용이 GC 시점으로 몰린다
            code: 순환 해결 · 대입 공짜
          - name: 못 푸는 것
            detail: 단편화다. 빈 공간이 흩어져 큰 객체를 못 넣는다. 그리고 할당할 때 맞는 크기의 구멍을 찾아야 해서 느리다
            code: 단편화
      - name: Mark-and-Compact — 치우기를 보강했다
        detail: Sweep 후에 살아남은 객체를 한쪽으로 몬다. 단편화가 사라지고 할당이 포인터 증가만으로 끝난다
        code: 모아서 단편화 제거
        children:
          - name: 해결한 것
            detail: 단편화와 할당 속도. 연속 공간이 보장되므로 큰 객체도 들어간다
            code: 단편화 해결
          - name: 대가
            detail: 객체를 복사하고 참조를 전부 고치는 비용이다. 살아있는 객체가 많으면 비싸진다
            code: 이동 비용
      - name: Generational — 어디를 할지 나눴다
        detail: 실제 JVM 이 쓰는 방식이다. Heap 을 나눠 영역마다 다른 전략을 쓴다. 왜 그래도 되는지가 다음 글의 주제다
        code: 영역별로 다른 전략
        children:
          - name: 해결한 것
            detail: 매번 전체를 훑는 비용이다. 대부분의 객체가 금방 죽는다는 관찰을 이용한다
            code: 전체 탐색 회피
          - name: 대가
            detail: 구조가 복잡해지고 세대 간 참조를 추적하는 추가 장치가 필요해진다
            code: 복잡도
```

### `null` 로 만들면 즉시 회수되나

가장 흔한 오해다.

```java file=NullDoesNotFree.java
Account a = new SavingsAccount();
a = null;           // 참조만 끊었다. 객체는 아직 Heap 에 있다
// 다음 GC 가 돌 때 회수된다
```

**`null` 대입은 "회수 가능해졌다"는 표시**일 뿐이다.
그리고 대부분의 경우 **쓸 필요도 없다.**

```java file=NullIsUseless.java bad label="의미 없는 코드"
void process() {
    Account a = new SavingsAccount();
    use(a);
    a = null;        // 어차피 메서드가 끝나면 스택 프레임이 사라진다
}
```

[[pass-by-value]] 에서 본 것이다. 지역 변수는 **프레임과 함께 사라지므로**
루트에서 자동으로 빠진다.

**`null` 이 의미 있는 경우**는 수명이 긴 참조다.

```java file=NullIsUseful.java good label="필드와 컬렉션"
class Cache {
    private byte[] huge = new byte[100_000_000];
    void release() { huge = null; }     // 필드는 객체가 살아있는 동안 루트다
}
```

### 메모리 누수가 자바에도 있다

GC 가 있으면 누수가 없다고 생각하기 쉽다. **있다.**
다만 원인이 다르다. **"안 쓰는데 루트에서 닿는" 것**이 누수다.

```visual
id: reachability-leak-patterns
kind: playground
title: 이 코드에 누수가 있나
inputs:
  - { name: 코드, label: 상황, options: [static 컬렉션에 계속 add, 리스너를 등록하고 해제 안 함, 상한 없는 HashMap 캐시, ThreadLocal 을 remove 안 함, 지역 변수를 null 로 안 만듦, 내부 클래스가 외부를 참조] }
outcomes:
  - when: { 코드: static 컬렉션에 계속 add }
    result: 누수다. static 변수가 GC 루트이므로 담긴 것이 영원히 도달 가능하다
    note: 가장 흔한 자바 누수다. memory-areas 에서 본 Method Area 의 수명이 JVM 종료까지라는 사실이 원인이다
  - when: { 코드: 리스너를 등록하고 해제 안 함 }
    result: 누수다. 등록된 쪽이 리스너를 들고 있어 리스너가 참조하는 모든 것이 산다
    note: 옵저버 패턴의 전형적 함정이다. 등록이 있으면 해제가 짝으로 있어야 한다. 약한 참조로 등록하는 설계도 있다
  - when: { 코드: 상한 없는 HashMap 캐시 }
    result: 누수다. 정확히는 무한 증가다. 넣기만 하고 빼지 않으면 힙이 찬다
    note: 캐시는 반드시 상한이나 만료가 있어야 한다. LinkedHashMap 의 LRU 나 Caffeine 같은 라이브러리를 쓴다
  - when: { 코드: ThreadLocal 을 remove 안 함 }
    result: 누수다. 스레드 풀에서 특히 심각하다. 스레드가 재사용되므로 값이 영원히 남는다
    note: 스레드가 살아있는 동안 그 ThreadLocal 맵이 루트에서 닿는다. 그리고 WAS 재배포 시 Metaspace 누수의 원인이기도 하다
  - when: { 코드: 지역 변수를 null 로 안 만듦 }
    result: 누수가 아니다. 메서드가 끝나면 스택 프레임과 함께 루트에서 빠진다
    note: 불필요한 null 대입이다. 다만 메서드가 아주 길고 그 뒤로 오래 도는 경우에는 의미가 있을 수 있다
  - when: { 코드: 내부 클래스가 외부를 참조 }
    result: 상황에 따라 누수다. 비정적 내부 클래스는 외부 인스턴스를 암묵적으로 참조한다
    note: 그 내부 클래스 객체가 오래 살면 외부 객체도 같이 산다. static 중첩 클래스로 만들면 끊어진다. Effective Java 의 조언이 이것이다
```

**"루트에서 닿는가"로 전부 설명된다.**
누수를 찾을 때 `static`, 컬렉션, 리스너, `ThreadLocal` 을 먼저 보는 이유다.

### 확인하는 법

```bash file=terminal
$ jmap -histo:live <pid> | head -10     # 무엇이 많은지
 num     #instances         #bytes  class name
   1:       1452301       58092040  [B
   2:        891234       21389616  java.lang.String

$ jmap -dump:live,format=b,file=h.hprof <pid>   # 힙 덤프
# Eclipse MAT 나 VisualVM 으로 열어 "GC 루트까지의 경로" 를 본다
```

**"GC 루트까지의 경로(Path to GC Roots)"**가 누수 분석의 핵심 기능이다.
"이 객체가 왜 안 죽는가"에 **정확히 답해준다.**

## 5. 이것도 끝이 아니다 — 매번 전체를 훑으면 느리다

도달 가능성 분석으로 순환이 해결됐다. 그런데 **비용이 어디로 갔는지** 보자.

```
힙에 객체가 1000만 개 있다
GC 가 돌 때마다 루트에서 전부 따라가며 표시한다
→ 살아있는 객체 수에 비례하는 시간
→ 그동안 STW
```

**힙이 크면 멈춤이 길어진다.** [[memory-areas]] 의 덧에서
"Heap 이 크면 GC 시간이 길어진다"고 한 것이 이것이다.

그리고 **대부분이 낭비**다.

```java file=MostDieYoung.java
for (int i = 0; i < 1_000_000; i++) {
    String s = "item" + i;      // 만들자마자 버려진다
    process(s);
}
```

이 객체들은 **거의 즉시 가비지**가 된다. 그런데 GC 는
**오래 살아있는 객체까지 매번 다시 표시**한다.

애플리케이션 캐시에 10년 산 객체가 있어도 **매번 다시 따라간다.**
그것이 죽을 가능성은 거의 없는데도.

**이 관찰에서 세대별 GC 가 나온다.**
객체의 수명 분포에 규칙이 있고, 그 규칙을 이용하면
**전체를 안 훑어도** 대부분의 가비지를 잡을 수 있다.

[[generations]] 에서 본다.

## 자기 점검

- JVM 이 참조 카운팅을 안 쓰는 두 가지 이유는?
- 순환 참조가 도달 가능성 분석에서 왜 문제가 아닌가?
- GC 루트 네 종류는? 그것들이 [[memory-areas]] 의 어느 영역인가?
- Mark-Sweep 만으로 끝내면 어떤 문제가 남는가?
- 자바에서 객체의 주소를 얻을 수 없는 이유를 Compact 로 설명하면?

## 덧 — 흔한 오해

### "`System.gc()` 를 부르면 GC 가 돈다"

**요청일 뿐이고 JVM 이 무시할 수 있다.** 그리고 불러서는 안 된다.

```java file=DoNotCallGc.java bad label="부르지 않는다"
System.gc();        // Full GC 를 유발할 수 있다. 수백 ms STW
```

JVM 은 **언제 GC 할지가 자기 판단**이고 그 판단이 사람보다 낫다.
`System.gc()` 는 보통 **Full GC** 를 유발해서
가장 긴 STW 를 **일부러 일으키는** 셈이 된다.

```bash file=terminal
$ java -XX:+DisableExplicitGC MyApp     # 아예 무시하게 만든다
```

운영에서 이 옵션을 켜두는 경우가 있다.
라이브러리가 `System.gc()` 를 부르는 것을 막기 위해서다.

### "finalize 로 자원을 정리하면 된다"

**`finalize()` 는 Java 9 부터 폐기 예정이고 Java 18 에서 비활성화됐다.**

```
호출이 보장되지 않는다      → JVM 이 종료되면 안 불릴 수 있다
언제 불릴지 모른다          → GC 시점에 달렸다
객체를 되살릴 수 있다       → finalize 안에서 자기를 다시 참조하면 부활한다
GC 를 느리게 만든다        → finalize 가 있는 객체는 추가 처리가 필요하다
```

**자원 정리는 `try-with-resources`** 로 한다.

```java file=UseTryWithResources.java good label="결정적으로 닫힌다"
try (var conn = dataSource.getConnection()) {
    // 블록을 벗어나면 반드시 close 가 불린다
}
```

**GC 는 메모리만 관리한다.** 파일 핸들, 소켓, DB 커넥션은
GC 의 책임이 아니고 **GC 가 돌 때까지 기다리면 고갈된다.**
PART 6 의 I/O 에서 다시 본다.

### "GC 가 있으니 객체를 마음껏 만들어도 된다"

**만드는 비용은 싸고 치우는 비용이 있다.**

```java file=AllocationCost.java
for (int i = 0; i < 10_000_000; i++) {
    list.add(Integer.valueOf(i));     // 1000만 개 객체
}
```

할당 자체는 **포인터를 밀기만** 해서 빠르다(Compact 덕분이다).
그런데 그 1000만 개를 **표시하고 회수하는 비용**이 나중에 온다.

그리고 **캐시 지역성**이 나빠진다. 객체가 흩어져 있으면
CPU 캐시 미스가 늘어 체감 성능이 떨어진다.

그래서 **객체를 덜 만드는 것**이 여전히 유효한 최적화다.
`String +` 를 루프에서 쓰지 않는 것, 오토박싱을 피하는 것,
원시 타입 배열을 쓰는 것 — 전부 PART 4 의 주제다.
