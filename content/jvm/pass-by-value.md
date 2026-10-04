---
title: 같은 변수에 한 일인데 한쪽만 반영된다
summary: 자바에 pass by reference 가 없다는 말의 정확한 의미
versionNote: Java 21 기준
ord: 2
minutes: 25
edges:
  - { to: memory-areas, type: prerequisite }
  - { to: method-dispatch, type: deepens }
sources:
  - { label: JLS - Method Invocation Conversion, url: https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html }
  - { label: JVM Specification - Frames, url: https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html }
  - { label: Oracle Java Tutorials - Passing Information to a Method, url: https://docs.oracle.com/javase/tutorial/java/javaOO/arguments.html }
---

[[memory-areas]] 끝에서 본 혼란이다.

```java file=ConfusingBehavior.java
static void modify(Account acc) {
    acc.deposit(1000);              // 호출자에 반영된다
    acc = new SavingsAccount();     // 호출자에 반영되지 않는다
}
```

**같은 변수에 한 일인데 한쪽만 반영된다.**

"자바는 객체를 참조로 넘긴다"고 알면 두 번째가 설명되지 않고,
"값으로 넘긴다"고 알면 첫 번째가 설명되지 않는다.

둘 다 설명하는 모델은 하나다. 그리고 그 모델은
[[memory-areas]] 에서 본 **Stack 과 Heap 의 분리**에서 바로 나온다.

## 0. 들어가기 전에 — 핵심 용어

- **pass by value**: 인자의 **값을 복사**해 넘긴다. 자바는 **이것뿐이다.**
- **pass by reference**: 변수 **자체의 별칭**을 넘긴다. C++ 의 `&`. 자바에 없다.
- **참조값(reference value)**: 객체가 Heap 의 어디에 있는지를 가리키는 값.
- **역참조(dereference)**: 참조를 따라가 실제 객체에 닿는 것. 자바는 `.` 이 한다.
- **스택 프레임**: 메서드 호출 하나의 작업 공간. 지역 변수가 여기 있다.

한 줄 그림: **복사되는 것은 "주소를 적은 쪽지"다. 쪽지를 바꿔 써도 원본 쪽지는 안 바뀌지만, 쪽지가 가리키는 집은 같다.**

비유하자면 **주소가 적힌 쪽지**다.
친구에게 "서울 종로구 1번지"라고 적은 쪽지를 **복사해서** 준다.
친구가 그 집에 가서 **가구를 바꾸면** 내가 가도 바뀌어 있다(필드 변경).
친구가 자기 쪽지에 **다른 주소를 적으면** 내 쪽지는 그대로다(재대입).

쪽지를 복사해 준 것이지 **내 쪽지를 준 것이 아니다.**

## 1. 그전엔 어떻게 했나 — C 의 포인터

C 에서는 주소를 **직접 다룬다.**

```c file=pointer.c
int a = 10;
int *p = &a;        // &a = a 의 주소
*p = 20;            // 역참조해서 a 를 바꾼다
printf("%d", a);    // 20
```

이 직접성이 강력하고, 그래서 위험했다.

### 고통 1 — 주소를 산술로 조작할 수 있다

```c file=pointerArith.c bad label="배열 밖으로 나간다"
int arr[3] = {1, 2, 3};
int *p = arr;
p += 10;            // 배열 밖
*p = 99;            // 남의 메모리를 덮어쓴다
```

**컴파일된다. 그리고 돈다.** 어딘가 다른 변수나 반환 주소가 망가진다.
버그가 **엉뚱한 곳에서** 나타나므로 원인을 찾기가 매우 어렵다.

버퍼 오버플로 공격의 기초가 이것이다.

### 고통 2 — 값을 바꾸려면 포인터를 넘겨야 한다

```c file=swapC.c
void swap(int *x, int *y) {    // 포인터로 받아야 한다
    int t = *x; *x = *y; *y = t;
}
swap(&a, &b);                   // 호출할 때도 & 를 붙인다
```

**함수 시그니처가 지저분해지고**, 호출하는 쪽도 `&` 를 기억해야 한다.
빠뜨리면 컴파일 오류거나, 더 나쁘게는 **주소를 값으로 해석**한다.

### 고통 3 — 함수가 무엇을 할지 모른다

```c file=whatWillItDo.c
void process(Data *d);     // 읽기만 하나 고치나
```

**시그니처가 알려주지 않는다.** `const Data *d` 로 의도를 적을 수 있지만
관례이고 강제가 약하다. 그리고 포인터를 통째로 바꿔
**호출자의 변수를 다른 곳으로 돌릴 수도** 있다.

```c file=doublePointer.c
void reassign(Data **d) { *d = malloc(sizeof(Data)); }
```

**이중 포인터**가 나오면서 읽기가 급격히 어려워진다.

### 고통 4 — C++ 의 참조는 또 다른 규칙이다

C++ 이 `&` 로 **참조 전달**을 추가했다.

```cpp file=refCpp.cpp
void modify(int &x) { x = 20; }   // 호출자의 변수 자체를 바꾼다
int a = 10;
modify(a);                         // a 가 20 이 된다. & 를 안 붙인다
```

**호출하는 쪽에서 구분이 안 된다.** `modify(a)` 만 보고는
`a` 가 바뀔지 안 바뀔지 **알 수 없다.** 시그니처를 찾아봐야 한다.

편의를 얻고 **호출 지점의 명확성**을 잃었다.

네 고통의 뿌리는 **하나**다. **주소를 1급 값으로 다루면 할 수 있는 일이 너무 많다.**

## 2. 이렇게 피해봤다

### 시도 1 — 코딩 규칙으로 제한한다

"포인터 산술 금지", "`const` 를 꼭 붙인다" 같은 규칙을 둔다.

**사람이 지켜야 한다.** 그리고 라이브러리 코드는 내 규칙을 안 따른다.
MISRA C 처럼 정적 분석으로 강제하는 방법이 있지만 도구가 필요하다.

### 시도 2 — 참조만 쓰고 포인터를 안 쓴다 (C++)

고통 1 이 사라진다. **참조는 산술이 안 된다.**

그런데 고통 4 가 생긴다. **호출 지점에서 구분이 안 된다.**
그리고 참조는 `null` 이 될 수 없어서 "없을 수도 있는 값"은 결국 포인터다.

### 시도 3 — 전부 값으로만 넘긴다

복사만 하면 안전하다.

**큰 객체를 복사하는 비용**이 든다. 그리고 **객체를 고칠 방법이 없다.**
반환값으로 새 객체를 돌려주는 방식이 되는데,
그러면 그래프 구조를 다루기가 매우 어려워진다.

> 세 시도의 공통점: **안전과 표현력 중 하나를 포기했다.**
> 자바는 **"참조는 값으로만 넘긴다"**는 한 가지 규칙으로 둘을 조정했다.

## 3. 그래서 나온 것 — 규칙이 하나다

**자바는 pass by value 만 있다.** 예외가 없다.

```
원시 타입 → 값 자체를 복사
객체 타입 → 참조값(Heap 주소)을 복사
```

그리고 **참조값을 조작할 수단이 없다.**

```java file=NoPointerArith.java bad label="컴파일되지 않는다"
Account a = new SavingsAccount();
a = a + 1;          // 오류. 참조에 산술 연산 불가
long addr = (long) a;  // 오류. 주소를 꺼낼 수 없다
```

네 고통과 대응시켜 보자.

| 고통 | C | 자바 |
| --- | --- | --- |
| 주소 산술 조작 | 가능. 배열 밖으로 나간다 | **불가능.** 참조에 연산이 없다 |
| 값 바꾸려면 포인터 | `&` 와 `*` 를 써야 한다 | 객체 필드는 **그냥** 바뀐다 |
| 함수가 뭘 할지 모른다 | 시그니처가 안 알려준다 | **재대입은 절대 반영 안 된다**가 보장된다 |
| C++ 참조는 호출 지점이 모호 | `modify(a)` 로 구분 불가 | **항상 값 복사.** 규칙이 하나다 |

**세 번째가 자바의 실질적 이득**이다.

```java file=Guarantee.java
void process(Account acc);

Account a = new SavingsAccount();
process(a);
// a 가 다른 객체를 가리키게 되는 일은 절대 없다. 보장된다.
// 다만 a 가 가리키는 객체의 내용은 바뀔 수 있다.
```

**호출 지점에서 알 수 있는 것과 알 수 없는 것이 명확하다.**
"내 변수가 다른 것을 가리키게 되나"는 **항상 아니다.**

## 4. 어떻게 동작하나 — 스택 프레임으로 보면 설명된다

[[memory-areas]] 의 Stack 과 Heap 분리로 그림을 그리면 끝난다.

```visual
id: pass-by-value-stack-frames
kind: step
title: modify(acc) 에서 두 줄이 다르게 동작하는 이유
steps:
  - name: 호출 전 — main 의 프레임
    detail: a 라는 지역 변수가 main 의 스택 프레임에 있다. 그 안에 든 것은 객체가 아니라 Heap 주소를 적은 값이다
    code: main 프레임 · a = 0x1000
  - name: modify 를 호출한다 — 새 프레임이 생긴다
    detail: 스택에 modify 용 프레임이 하나 더 쌓인다. 매개변수 acc 는 이 새 프레임의 지역 변수다. main 의 a 와 별개의 칸이다
    code: modify 프레임 · acc = ?
  - name: 값이 복사된다
    detail: a 에 든 0x1000 이 acc 에 복사된다. 두 변수가 같은 주소를 적고 있지만 칸은 둘이다. 이 복사가 pass by value 의 전부다
    code: acc ← 0x1000 (복사)
  - name: acc.deposit(1000) — 역참조해서 Heap 을 고친다
    detail: 점 연산자가 0x1000 을 따라가 Heap 의 객체에 닿는다. 그 객체는 하나뿐이므로 main 에서 봐도 바뀌어 있다
    code: Heap 0x1000 의 balance 변경
  - name: acc = new SavingsAccount() — acc 칸을 덮어쓴다
    detail: Heap 에 새 객체를 만들고 그 주소를 acc 에 넣는다. acc 는 modify 프레임의 칸이므로 main 의 a 는 손대지 않았다
    code: acc ← 0x2000 · a 는 여전히 0x1000
  - name: modify 가 끝난다 — 프레임이 사라진다
    detail: acc 칸이 통째로 없어진다. 0x2000 을 가리키는 것이 아무도 없게 되어 그 객체는 GC 대상이 된다
    code: 프레임 제거 · 0x2000 은 쓰레기
  - name: 그래서 한쪽만 반영된다
    detail: Heap 을 고친 것은 공유되고 Stack 칸을 고친 것은 공유되지 않는다. 두 영역이 분리돼 있다는 사실 하나로 설명이 끝난다
    code: Heap 공유 · Stack 분리
```

**"주소값이 복사된다"와 "pass by reference"의 차이**가 여기서 보인다.

```
pass by reference : acc 가 a 의 별칭이다. acc = ... 가 a 를 바꾼다
pass by value     : acc 가 a 의 값을 복사한 별도 칸이다. acc = ... 는 a 와 무관
```

자바에서 **별칭을 만들 방법이 없다.** 그래서 pass by reference 가 없다.

### 원시 타입과 객체 타입이 같은 규칙이다

```visual
id: pass-by-value-primitive-vs-object
kind: structure
title: 두 경우가 다른 규칙이 아니라 같은 규칙이다
nodes:
  - name: 복사되는 것은 변수 안에 든 값이다
    detail: 원시 타입과 객체 타입이 다른 규칙으로 동작하는 것처럼 보이지만 규칙은 하나다. 변수 안에 든 것이 다를 뿐이다
    code: 규칙은 하나 · 내용이 다르다
    children:
      - name: 원시 타입 — 변수 안에 값이 있다
        detail: int x = 10 이면 x 라는 칸 안에 10 이 들어 있다. 복사하면 10 이 복사된다
        code: x = 10
        children:
          - name: 넘기면
            detail: 새 프레임의 칸에 10 이 복사된다. 거기서 20 으로 바꿔도 원본 칸은 10 이다
            code: 영향 없음
          - name: 바꿀 방법이 없다
            detail: 원시 타입은 가리키는 대상이 없으므로 역참조할 것도 없다. 그래서 호출자의 값을 바꿀 수단이 아예 없다
            code: 반환값으로만 전달
      - name: 객체 타입 — 변수 안에 주소가 있다
        detail: Account a = new ... 이면 a 라는 칸 안에 Heap 주소가 들어 있다. 객체 자체가 들어 있는 것이 아니다
        code: a = 0x1000
        children:
          - name: 넘기면
            detail: 새 프레임의 칸에 0x1000 이 복사된다. 원시 타입과 완전히 같은 동작이다
            code: 주소가 복사된다
          - name: 역참조로 내용을 바꿀 수 있다
            detail: 점 연산자가 주소를 따라간다. 도착한 객체는 하나뿐이라 양쪽이 같은 것을 본다
            code: Heap 은 공유된다
          - name: 칸 자체를 덮어쓰면 끊긴다
            detail: 재대입은 그 프레임의 칸만 바꾼다. 원본 칸과 아무 관계가 없다
            code: 재대입은 전파 안 됨
      - name: 불변 객체는 원시 타입처럼 보인다
        detail: String 과 Integer 는 내용을 바꿀 메서드가 없다. 그래서 역참조로도 바꿀 수 없고 결과적으로 원시 타입처럼 동작한다
        code: String · Integer · LocalDate
        children:
          - name: 그래서 혼란이 줄어든다
            detail: 불변이면 넘겨도 안 바뀐다는 것이 보장된다. 방어적 복사가 필요 없어지는 이유이고 불변을 권하는 실질적 근거다
            code: 넘겨도 안전하다
```

### 실무에서 생기는 문제

```java file=SwapDoesNotWork.java bad label="자바에서 swap 은 불가능하다"
static void swap(int a, int b) {
    int t = a; a = b; b = t;     // 지역 변수만 바뀐다
}
int x = 1, y = 2;
swap(x, y);                       // x=1, y=2. 안 바뀐다
```

```java file=SwapWorkaround.java label="객체로 감싸면 된다"
static void swap(int[] arr) {
    int t = arr[0]; arr[0] = arr[1]; arr[1] = t;
}
int[] pair = {1, 2};
swap(pair);                       // 바뀐다. 배열은 객체다
```

**배열 요소를 고치는 것은 역참조**이므로 반영된다.
`arr = new int[]{...}` 로 재대입하면 반영되지 않는다. 규칙이 일관된다.

### 방어적 복사가 필요한 이유

```java file=DefensiveCopy.java bad label="내부가 새어 나간다"
class Order {
    private final List<Item> items = new ArrayList<>();
    List<Item> getItems() { return items; }      // 참조를 그대로 준다
}

order.getItems().clear();      // 외부에서 내부를 비울 수 있다
```

[[procedural-to-oop]] 에서 캡슐화로 "아무 데서나 바뀌는 것"을 막았는데,
**참조를 반환하면 그 보호가 뚫린다.**

```java file=DefensiveCopyFixed.java good label="복사해서 주거나 불변으로 준다"
List<Item> getItems() { return List.copyOf(items); }
```

`private final` 이어도 **가리키는 객체의 내용은 바뀐다.**
`final` 은 **그 칸을 다시 대입하지 못한다**는 뜻일 뿐이다.

```visual
id: pass-by-value-will-it-reflect
kind: playground
title: 이 동작이 호출자에게 반영되나
inputs:
  - { name: 동작, label: 메서드 안에서 하는 일, options: [필드를 바꾼다, 매개변수에 재대입한다, 컬렉션에 add 한다, 컬렉션을 새로 만들어 대입, 배열 요소를 바꾼다, String 을 바꾼다] }
  - { name: 타입, label: 매개변수 타입, options: [가변 객체, 불변 객체, 원시 타입] }
outcomes:
  - when: { 동작: 필드를 바꾼다, 타입: 가변 객체 }
    result: 반영된다. 역참조해서 Heap 의 객체를 고친 것이다
    note: 객체가 하나뿐이므로 양쪽이 같은 것을 본다. 이것이 의도라면 괜찮고 의도가 아니라면 방어적 복사가 필요하다
  - when: { 동작: 매개변수에 재대입한다, 타입: 가변 객체 }
    result: 반영되지 않는다. 그 프레임의 칸만 바뀌었다
    note: 자바에서 절대 반영되지 않는 유일한 경우다. 그래서 호출자의 변수가 다른 객체를 가리키게 되는 일은 없다
  - when: { 동작: 컬렉션에 add 한다, 타입: 가변 객체 }
    result: 반영된다. 컬렉션 객체의 내부 상태를 바꾼 것이다
    note: 메서드에 List 를 넘길 때 가장 자주 당하는 지점이다. 읽기만 할 거면 List.copyOf 로 받거나 불변으로 넘긴다
  - when: { 동작: 컬렉션을 새로 만들어 대입 }
    result: 반영되지 않는다. 재대입이다
    note: items = new ArrayList<>() 와 items.clear() 가 전혀 다르게 동작한다. 후자는 반영되고 전자는 안 된다
  - when: { 동작: 배열 요소를 바꾼다 }
    result: 반영된다. 배열도 객체이고 요소 접근은 역참조다
    note: 자바에서 swap 을 흉내내는 방법이 이것이다. 원시 타입 두 개는 못 바꾸지만 배열로 감싸면 된다
  - when: { 동작: String 을 바꾼다, 타입: 불변 객체 }
    result: 바꿀 방법이 없다. String 에는 내용을 바꾸는 메서드가 없다
    note: s = s + "x" 는 새 String 을 만들어 재대입하는 것이므로 반영되지 않는다. 불변이 혼란을 줄이는 이유다
  - when: { 타입: 원시 타입 }
    result: 어떤 동작도 반영되지 않는다. 가리키는 대상이 없어 역참조할 것이 없다
    note: 값을 돌려주려면 반환값을 쓴다. 여러 값이면 객체나 레코드로 묶는다
```

## 5. 이것도 끝이 아니다 — 호출 자체는 어떻게 일어나나

무엇이 복사되는지는 알았다. 그런데 **호출 자체**를 아직 안 봤다.

```java file=HowIsItCalled.java
acc.deposit(1000);
```

`acc` 가 가리키는 객체의 실제 타입이 `SavingsAccount` 라고 하자.
JVM 은 **어떻게 `SavingsAccount.deposit` 을 찾아** 실행하는가.

[[polymorphism]] 에서 이렇게 설명하고 넘어갔다.

> 런타임에 그 클래스의 **메서드 테이블**을 찾는다.
> `invokevirtual` 명령이 어느 클래스의 구현인지를 **적지 않는다.**

**그 테이블이 어디 있나.** [[memory-areas]] 에서 영역을 다 봤는데
"메서드 테이블"이라는 것은 안 나왔다.

그리고 질문이 하나 더 있다. `static` 메서드는 왜 인스턴스 메서드를
**직접 못 부르는가.** 둘이 다른 곳에 있다면 그 차이가 설명되어야 한다.

[[method-dispatch]] 에서 본다.

## 자기 점검

- "주소값이 복사된다"와 "pass by reference"의 차이는?
- `acc = new ...` 가 호출자에 영향 못 주는 이유를 스택 프레임으로 설명하면?
- `final` 필드가 가리키는 컬렉션의 내용이 바뀔 수 있는 이유는?
- 자바에서 `swap(int, int)` 이 불가능한 이유와, 배열로는 되는 이유는?
- 불변 객체를 넘기는 것이 안전한 이유는?

## 덧 — 흔한 오해

### "자바는 객체를 참조로 넘긴다"

**널리 쓰이는 표현인데 정확하지 않다.** "참조를 값으로 넘긴다"가 맞다.

```
"참조로 넘긴다"(pass by reference) → 변수 자체의 별칭. 재대입이 전파된다
"참조를 값으로 넘긴다"              → 주소를 복사. 재대입이 전파되지 않는다
```

영어로도 `pass by reference` 와 `pass a reference by value` 가 다르다.
한 단어 차이인데 **동작이 반대**다.

이 구분이 면접 단골인 이유는 **설명할 수 있으면 메모리 모델을 이해한 것**이기 때문이다.
외운 답을 말하는 것과 스택 프레임을 그려 설명하는 것이 구별된다.

### "`final` 을 붙이면 객체가 안 바뀐다"

**그 변수가 다른 것을 가리키지 못하게** 하는 것뿐이다.

```java file=FinalIsShallow.java
final List<String> list = new ArrayList<>();
list.add("x");          // 된다. 내용은 자유
list = new ArrayList<>();  // 컴파일 오류. 재대입만 막힌다
```

`final` 은 **이 글의 "재대입"에 해당하는 것을 금지**한다.
역참조로 내용을 바꾸는 것은 막지 않는다.

내용까지 막으려면 **불변 객체**로 만들어야 한다.

```java file=TrulyImmutable.java good label="둘 다 막는다"
private final List<String> list = List.of("a", "b");   // 불변 리스트
```

`record` 도 같은 주의가 필요하다. **필드가 `final` 이지만 얕다.**
`record Order(List<Item> items)` 의 `items` 내용은 바뀔 수 있다.

### "메서드에 큰 객체를 넘기면 복사 비용이 크다"

**참조값만 복사된다.** 객체 크기와 무관하다.

```
객체가 1KB 든 100MB 든 복사되는 것은 참조값 하나 (64비트면 8바이트, 압축되면 4바이트)
```

그래서 **자바에서 "큰 객체를 넘기지 마라"는 조언은 근거가 없다.**
C++ 에서 값 전달이 비싼 것과 혼동한 것이다.

다만 **방어적 복사를 하면** 비용이 생긴다.

```java file=CopyCost.java
List<Item> getItems() { return List.copyOf(items); }   // 여기서 비용이 든다
```

그래서 트레이드오프가 있다. 안전을 위해 복사하면 비용이고,
**불변 객체로 설계하면** 복사도 비용도 없다. 그것이 불변을 권하는 또 하나의 이유다.
