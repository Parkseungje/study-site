---
title: 추상 클래스와 인터페이스 중 무엇을 쓰나
summary: 둘이 왜 둘인지, default 메서드가 경계를 흐린 이유, 그리고 고르는 기준
versionNote: Java 21 기준
ord: 4
minutes: 27
edges:
  - { to: polymorphism, type: prerequisite }
  - { to: solid, type: deepens }
sources:
  - { label: Oracle Java Tutorials - Abstract Methods and Classes, url: https://docs.oracle.com/javase/tutorial/java/IandI/abstract.html }
  - { label: Oracle Java Tutorials - Default Methods, url: https://docs.oracle.com/javase/tutorial/java/IandI/defaultmethods.html }
  - { label: JLS - Interface Declarations, url: https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html }
---

[[polymorphism]] 끝에서 남은 질문이다.

```java file=TwoOptions.java
abstract class Account { abstract void printStatement(); }
interface Account { void printStatement(); }
```

**둘 다 다형성이 된다.** 그러면 무엇이 다른가.

[[inheritance]] 의 고통 4~6 때문에 **"상속보다 합성"**이 나왔으니
거의 항상 인터페이스가 나아 보인다. 그런데 **추상 클래스는 여전히 남아 있고**,
Java 8 이 인터페이스에 구현을 허용하면서 **경계가 흐려졌다.**

이 글은 둘의 차이가 **무엇에서 오는지**를 본다. 표를 외우는 것이 아니다.

## 0. 들어가기 전에 — 핵심 용어

- **추상 클래스**: `abstract` 로 선언한 클래스. 구현된 메서드와 **상태를 가질 수 있다.**
- **인터페이스**: 능력의 약속. **상태를 못 가진다**(상수는 예외).
- **`default` 메서드**: 인터페이스에 구현을 담는 것. Java 8 에서 추가됐다.
- **`static` 메서드 (인터페이스)**: 인터페이스에 붙는 유틸 메서드. Java 8 부터.
- **`private` 메서드 (인터페이스)**: `default` 메서드끼리 공유하는 내부 구현. Java 9 부터.
- **익명 클래스**: 이름 없이 즉석에서 정의하는 클래스. **람다의 전신**이다.

한 줄 그림: **차이의 뿌리는 하나다. 추상 클래스는 상태를 갖고 인터페이스는 못 갖는다.**

비유하자면 **직업과 자격증**이다.
직업은 **하나만** 가진다. 그 직업의 소속과 급여와 자리가 따라온다(상태).
자격증은 **여러 개** 가진다. "이것을 할 수 있다"는 증명이고 자리를 차지하지 않는다.
그래서 "의사이면서 변호사"는 어렵지만 **"운전 가능하고 통역 가능"은 쉽다.**

## 1. 그전엔 어떻게 했나 — 추상 클래스만 쓰기

Java 8 이전에는 선택이 단순했다. **구현을 주려면 추상 클래스**였다.

```java file=AbstractOnly.java
abstract class Account {
    protected long balance;                  // 상태
    void deposit(long a) { balance += a; }   // 공통 구현
    abstract void printStatement();          // 약속
}
```

**잘 동작한다.** 그런데 쓰다 보면 막힌다.

### 고통 1 — 하나만 상속할 수 있다

```java file=OnlyOneParent.java bad label="둘 다 필요한데"
abstract class Account { ... }
abstract class Auditable { void logAccess() { ... } }

class SavingsAccount extends Account, Auditable { }   // 컴파일 오류
```

계좌이면서 **감사 대상**이기도 하다. 둘 다 공통 구현이 있다.
그런데 **하나만 고를 수 있다.**

그래서 억지로 계층을 만든다.

```java file=ForcedHierarchy.java bad label="관계없는 것이 계층이 된다"
abstract class Auditable { void logAccess() { ... } }
abstract class Account extends Auditable { ... }
```

**"계좌는 감사 대상의 한 종류"**가 된다. 말이 안 되는 계층이다.
그리고 감사가 필요 없는 계좌가 생기면 [[inheritance]] 의 고통 6 이다.

### 고통 2 — 능력 조합이 안 된다

```
읽을 수 있다
쓸 수 있다
닫을 수 있다
비교할 수 있다
직렬화할 수 있다
```

이것들은 **서로 독립적인 능력**이다. 어떤 클래스는 읽고 닫을 수 있고,
어떤 것은 쓰고 비교할 수 있다. **조합이 2의 거듭제곱**으로 늘어난다.

추상 클래스로는 **조합마다 클래스를 만들어야** 한다. 불가능하다.

### 고통 3 — 기존 인터페이스에 메서드를 추가할 수 없다

이것이 Java 8 을 바꾼 고통이다.

```java file=BreakingChange.java bad label="모든 구현체가 깨진다"
interface Collection<E> {
    boolean add(E e);
    // stream() 을 추가하고 싶다
}
```

`Collection` 에 `stream()` 을 추가하면 **그것을 구현한 모든 클래스가 깨진다.**
JDK 안의 것만이 아니라 **전 세계의 모든 커스텀 컬렉션**이 컴파일 안 된다.

```
Java 8 에서 스트림 API 를 넣어야 한다
→ Collection 에 stream() 이 필요하다
→ 추가하면 하위 호환이 깨진다
→ 그러면 스트림을 못 넣는다
```

**언어 발전이 막힌다.** 이것이 가장 심각한 고통이었다.

### 고통 4 — 간단한 구현에 클래스 파일을 만든다

```java file=TinyClass.java bad label="파일 하나가 아깝다"
// Comparator 하나를 넘기려고
class BalanceComparator implements Comparator<Account> {
    public int compare(Account a, Account b) {
        return Long.compare(a.getBalance(), b.getBalance());
    }
}
accounts.sort(new BalanceComparator());
```

**한 번 쓰는 구현에 파일 하나**를 만든다.
이름을 짓는 것도 부담이고, 그 파일을 찾아가 읽어야 의도를 안다.

네 고통의 뿌리는 **둘**이다.
**(1) 상태를 가진 것은 하나만 물려받을 수 있다.**
**(2) 약속만 하는 것은 나중에 추가할 수 없다.**

## 2. 이렇게 피해봤다

### 시도 1 — 인터페이스 + 추상 클래스를 같이 둔다

```java file=InterfaceAndSkeleton.java
interface Account { void deposit(long a); void printStatement(); }

abstract class AbstractAccount implements Account {
    protected long balance;
    public void deposit(long a) { balance += a; }    // 공통 구현
}

class SavingsAccount extends AbstractAccount { ... }
```

**고통 1 과 2 가 상당히 풀린다.** 타입은 인터페이스로 묶고,
구현을 원하면 추상 클래스를 상속하고, 원하지 않으면 인터페이스만 구현한다.

**JDK 가 실제로 이 패턴을 쓴다.** `List` / `AbstractList`,
`Map` / `AbstractMap` 이 그렇다. **지금도 유효한 좋은 패턴**이다.

다만 **클래스가 두 배**가 되고, 고통 3 은 그대로다.
`Account` 에 메서드를 추가하면 여전히 구현체가 깨진다.

### 시도 2 — 인터페이스에 짝이 되는 유틸 클래스를 둔다

```java file=UtilityPair.java
interface Account { ... }
class Accounts {                                  // 유틸
    static long totalOf(List<Account> as) { ... }
}
```

`Collections`, `Arrays` 가 이 방식이다.
**호출 방법이 어색하다.** `account.summary()` 가 아니라
`Accounts.summaryOf(account)` 다.

그리고 **발견하기 어렵다.** IDE 의 자동완성에 안 뜬다.
인터페이스를 보고 있는데 그 기능이 다른 클래스에 있다.

### 시도 3 — 익명 클래스로 즉석 구현한다

고통 4 의 대응이다.

```java file=AnonymousClass.java
accounts.sort(new Comparator<Account>() {
    public int compare(Account a, Account b) {
        return Long.compare(a.getBalance(), b.getBalance());
    }
});
```

**파일이 안 늘어난다.** 쓰는 자리에 바로 있어서 의도도 보인다.

**여전히 길다.** 핵심은 한 줄인데 네 줄의 껍데기가 붙는다.
그리고 **`this` 가 익명 클래스를 가리켜서** 헷갈린다.

> 세 시도의 공통점: **인터페이스가 구현을 못 담는다는 제약을 우회했다.**
> 그 제약을 풀면 셋이 한꺼번에 나아진다.

## 3. 그래서 나온 것 — 인터페이스가 구현을 담는다

Java 8 이 **`default` 메서드**를 넣었다.

```java file=DefaultMethod.java good label="하위 호환을 지키며 추가한다"
interface Collection<E> {
    boolean add(E e);

    default Stream<E> stream() {                 // 구현이 들어왔다
        return StreamSupport.stream(spliterator(), false);
    }
}
```

**기존 구현체가 안 깨진다.** 구현하지 않으면 `default` 구현이 쓰인다.
그래서 Java 8 이 **스트림 API 를 넣을 수 있었다.**

고통 3 의 해결이 **언어 발전을 가능하게 한 것**이다.
`Collection.stream()`, `Comparator.reversed()`, `Iterable.forEach()` 가
전부 이렇게 추가됐다.

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 하나만 상속할 수 있다 | 인터페이스는 **여러 개**. `default` 로 구현도 함께 |
| 능력 조합이 안 된다 | 인터페이스를 **조합**한다 |
| 메서드를 추가할 수 없다 | **`default`** 로 하위 호환을 지킨다 |
| 간단한 구현에 파일을 만든다 | 익명 클래스 → **람다**(Java 8) |

```java file=Lambda.java good label="람다는 익명 클래스를 줄인 것"
accounts.sort(Comparator.comparingLong(Account::getBalance));
```

**한 줄이 됐다.** 추상 메서드가 하나인 인터페이스(함수형 인터페이스)에만
적용되는데, 그래서 `Comparator` 와 `Runnable` 같은 것에 쓰인다.

그런데 그 `Comparator.comparingLong` 이 **`static` 메서드**고,
`reversed()` 가 **`default` 메서드**다. 시도 2 의 유틸 클래스가
**인터페이스 안으로 들어온 것**이다.

## 4. 어떻게 동작하나 — 차이의 뿌리는 상태다

표를 외우면 금방 잊는다. **왜 그런지**를 보면 외울 것이 없다.

```visual
id: abstract-vs-interface-root-cause
kind: structure
title: 모든 차이가 상태를 가질 수 있는지에서 나온다
nodes:
  - name: 추상 클래스는 상태를 갖고 인터페이스는 못 갖는다
    detail: 이 한 가지 차이에서 나머지 전부가 따라 나온다. 표의 항목들을 각각 외울 필요가 없다
    code: 뿌리는 하나
    children:
      - name: 그래서 다중 상속이 갈린다
        detail: 상태가 있으면 두 부모에게서 같은 필드를 물려받을 때 몇 벌인지 모호해진다. inheritance 에서 본 다이아몬드 문제다
        code: extends 하나 · implements 여럿
        children:
          - name: 인터페이스는 필드 충돌이 없다
            detail: 상태가 없으니 겹칠 것이 없다. 그래서 여러 개를 구현해도 모호함이 생기지 않는다
            code: 안전하게 조합된다
          - name: 상수는 예외다
            detail: 인터페이스의 필드는 자동으로 public static final 이 된다. 객체마다 갖는 상태가 아니라 클래스 수준의 상수라 충돌 문제가 없다
            code: public static final 로 고정
      - name: 그래서 생성자가 갈린다
        detail: 생성자의 역할은 상태를 초기화하는 것이다. 초기화할 상태가 없으면 생성자도 필요 없다
        code: 추상 클래스만 생성자를 가진다
        children:
          - name: 추상 클래스는 직접 인스턴스화는 안 된다
            detail: 생성자가 있어도 new 로 못 만든다. 자식 생성자가 super() 로 부를 뿐이다. inheritance 의 생성자 체이닝이 그 경로다
            code: super() 로만 불린다
      - name: 그래서 default 메서드에 제약이 생긴다
        detail: 구현을 담을 수 있게 됐지만 상태는 여전히 못 가진다. 그래서 default 메서드는 다른 추상 메서드를 호출해서만 일할 수 있다
        code: 상태 없이 구현한다
        children:
          - name: 템플릿 메서드처럼 동작한다
            detail: stream() 이 spliterator() 를 부르는 식이다. 자기 상태를 못 읽으니 약속된 메서드를 통해 데이터를 얻는다
            code: 추상 메서드에 위임
          - name: 필드 캐싱 같은 것은 못 한다
            detail: 계산 결과를 필드에 저장해두는 최적화가 불가능하다. 그 경우는 추상 클래스가 필요하다
            code: 상태가 필요하면 추상 클래스
      - name: 의도도 갈린다
        detail: 문법 차이가 설계 의도의 차이로 이어진다. 읽는 사람에게 다른 신호를 준다
        code: is-a vs can-do
        children:
          - name: 추상 클래스는 is-a
            detail: 저축예금은 계좌다. 강한 분류 관계이고 하나만 고를 수 있다는 제약이 그 의미와 맞는다
            code: 무엇인가
          - name: 인터페이스는 can-do
            detail: 비교할 수 있다. 닫을 수 있다. 여러 개를 가질 수 있다는 성질이 능력의 의미와 맞는다
            code: 무엇을 할 수 있나
```

### `default` 메서드가 충돌하면

[[inheritance]] 에서 "다중 상속을 금지한 이유"를 봤다.
`default` 메서드가 들어오면서 **그 모호함이 돌아왔다.**

```java file=DefaultConflict.java bad label="컴파일 오류가 난다"
interface A { default String name() { return "A"; } }
interface B { default String name() { return "B"; } }

class C implements A, B { }    // 오류: name() 이 모호하다
```

**자바는 모호함을 허용하지 않는다.** 컴파일 오류를 내고
**명시적으로 고르게** 한다.

```java file=DefaultResolve.java good label="직접 정한다"
class C implements A, B {
    @Override public String name() {
        return A.super.name();      // 어느 것인지 적는다
    }
}
```

필드가 아니라 **메서드만** 겹치므로 이 방식이 가능하다.
필드가 겹치면 "몇 벌인가"라는 질문에 답이 없어서 안 됐다.

### 그럼 추상 클래스는 왜 남아 있나

`default` 메서드로 구현을 담을 수 있게 됐는데도 추상 클래스가 필요한 이유다.

```java file=WhyAbstractRemains.java good label="상태가 필요한 경우"
abstract class AbstractCache<K, V> {
    private final Map<K, V> store = new HashMap<>();   // 상태

    public V get(K key) {
        return store.computeIfAbsent(key, this::load);
    }
    protected abstract V load(K key);
}
```

**캐시를 필드로 갖는다.** 인터페이스로는 불가능하다.

그리고 **접근 제한**도 다르다.

```
추상 클래스 : protected 메서드로 자식에게만 공개할 수 있다
인터페이스   : 모든 메서드가 public 이다 (private default 는 자기 안에서만)
```

**"자식에게만 주고 싶은 것"**이 있으면 추상 클래스다.
템플릿 메서드 패턴이 그 경우다.

### 무엇을 고를까

```visual
id: abstract-vs-interface-choose
kind: playground
title: 이 경우 무엇을 쓰나
inputs:
  - { name: 상황, label: 상황, options: [공통 상태가 있다, 능력 몇 개를 조합, 기존 타입에 기능 추가, 템플릿 메서드 패턴, 둘 다 가능해 보인다, 상수만 모으고 싶다] }
outcomes:
  - when: { 상황: 공통 상태가 있다 }
    result: 추상 클래스다. 인터페이스는 상태를 못 가진다
    note: 다만 그 상태가 정말 공통인지 먼저 묻는다. inheritance 의 고통 6 처럼 공통이 아닌 것이 올라가면 치환이 깨진다
  - when: { 상황: 능력 몇 개를 조합 }
    result: 인터페이스다. 하나만 고를 수 있는 제약이 능력에는 맞지 않는다
    note: Comparable 과 AutoCloseable 처럼 서로 독립적인 능력은 조합이 자연스럽다
  - when: { 상황: 기존 타입에 기능 추가 }
    result: 인터페이스의 default 메서드다. 이 문제를 풀려고 생긴 기능이다
    note: 고통 3 이고 Java 8 이 스트림을 넣을 수 있었던 근거다. 구현체를 하나도 안 깨뜨린다
  - when: { 상황: 템플릿 메서드 패턴 }
    result: 추상 클래스가 낫다. protected 로 자식에게만 공개할 수 있다
    note: 인터페이스는 모든 메서드가 public 이라 훅 메서드가 외부에 노출된다. 의도하지 않은 공개 API 가 된다
  - when: { 상황: 둘 다 가능해 보인다 }
    result: 인터페이스를 고른다. 나중에 조합이 필요해질 여지를 남긴다
    note: Spring 과 JPA 가 전부 인터페이스 우선인 이유다. 되돌릴 수 없는 결정은 더 느슨한 쪽으로 한다
  - when: { 상황: 상수만 모으고 싶다 }
    result: 둘 다 아니다. enum 이나 final class 에 static final 로 둔다
    note: 상수 인터페이스는 안티패턴이다. 구현하면 그 상수가 그 클래스의 공개 API 가 되어버린다
```

**"둘 다 가능하면 인터페이스"**가 실무의 기본값이다.
되돌릴 수 없는 결정을 **더 느슨한 쪽**으로 하는 것이다.

### 익명 클래스와 람다

고통 4 의 해결 경로다. [[polymorphism]] 의 다형성이
**즉석 구현**으로 쓰이는 자리다.

```java file=EvolutionOfInline.java
// 1. 별도 클래스 — 파일이 늘어난다
class BalanceComparator implements Comparator<Account> { ... }

// 2. 익명 클래스 — 파일은 안 늘지만 길다
new Comparator<Account>() {
    public int compare(Account a, Account b) { ... }
}

// 3. 람다 — 추상 메서드가 하나면 가능하다
(a, b) -> Long.compare(a.getBalance(), b.getBalance())

// 4. 메서드 참조 — 그냥 넘기면 되는 경우
Comparator.comparingLong(Account::getBalance)
```

**익명 클래스가 람다의 전신**이다. 그래서 람다를 이해하려면
익명 클래스를 먼저 알아야 한다.

다만 **같은 것은 아니다.**

```java file=AnonymousVsLambda.java
new Runnable() { public void run() { System.out.println(this); } }
// this = 익명 클래스 인스턴스

Runnable r = () -> System.out.println(this);
// this = 둘러싼 클래스의 인스턴스
```

`this` 의 의미가 다르고, 익명 클래스는 **추상 메서드가 여러 개여도** 되고
**상태를 가질 수 있다.** 람다는 함수형 인터페이스에만 쓴다.
자세한 것은 PART 5 의 함수형에서 본다.

## 5. 이것도 끝이 아니다 — 문법은 알았는데 설계를 모른다

PART 1 의 네 글을 거쳐 왔다.

```
procedural-to-oop    상태와 행동을 묶는다
inheritance          공통을 위로 올린다. 그런데 결합이 생긴다
polymorphism         타입 분기를 없앤다
abstract-vs-interface 상태가 필요하면 추상 클래스, 아니면 인터페이스
```

**문법은 전부 나왔다.** 그런데 이것으로 충분하지 않다.

```java file=SyntaxIsNotDesign.java bad label="문법은 맞는데 설계가 나쁘다"
class User {
    private String name;
    private String email;

    void save() { /* DB 저장 */ }
    void sendWelcomeEmail() { /* 메일 발송 */ }
    String toJson() { /* 직렬화 */ }
    boolean validatePassword(String p) { /* 검증 */ }
}
```

**컴파일된다. 동작한다.** 캡슐화도 했다.
그런데 이 클래스는 **DB 가 바뀌어도, 메일 서버가 바뀌어도,
JSON 포맷이 바뀌어도, 비밀번호 정책이 바뀌어도** 고쳐야 한다.

**변경 이유가 네 개**다. 그러면 네 가지 이유로 깨진다.

그리고 [[inheritance]] 의 고통 6 에서 본 것 —
`UnsupportedOperationException` 을 던지는 오버라이딩 —
그것이 **왜 나쁜지**를 아직 원칙으로 정리하지 않았다.

**변경에 강한 코드의 다섯 가지 기준**이 있다.
그리고 그중 하나(DIP)가 **Spring 의 DI 와 정확히 같은 원리**다.
PART 8 에서 스프링을 만날 때 이미 알고 있어야 하는 것이다.

[[solid]] 에서 본다. PART 1 의 마지막이다.

## 자기 점검

- 추상 클래스와 인터페이스의 모든 차이가 어느 한 가지에서 나오는가?
- Java 8 이 `default` 메서드를 넣은 이유를 하위 호환으로 설명하면?
- `default` 메서드가 충돌할 때 필드 충돌과 달리 해결이 가능한 이유는?
- 템플릿 메서드 패턴에 추상 클래스가 나은 이유는?
- 익명 클래스와 람다에서 `this` 가 가리키는 것이 어떻게 다른가?

## 덧 — 흔한 오해

### "인터페이스에는 구현을 못 담는다"

**Java 8 부터 담을 수 있다.** 세 종류가 있다.

```java file=InterfaceMethods.java
interface Account {
    void deposit(long a);                              // 추상

    default String summary() {                         // 인스턴스 메서드
        return format(getBalance());
    }

    static Account empty() { return new EmptyAccount(); }  // 팩토리

    private String format(long b) { return b + "원"; }     // Java 9+. 내부용
}
```

- **`default`** — 구현체가 안 만들면 쓰이는 기본 구현
- **`static`** — 시도 2 의 유틸 클래스가 인터페이스 안으로 들어온 것
- **`private`** — `default` 메서드끼리 공유하는 내부 구현. Java 9 부터

그래서 요즘은 **`AbstractXxx` 짝 클래스가 덜 필요해졌다.**
다만 **상태가 필요하면 여전히 추상 클래스**다.

### "상수 인터페이스는 상수를 모으는 좋은 방법이다"

**안티패턴이다.** `implements` 하면 그 상수가 **그 클래스의 공개 API** 가 된다.

```java file=ConstantInterface.java bad label="구현하면 상수가 노출된다"
interface Constants { int MAX = 100; }
class Service implements Constants { }

Service.MAX;        // 외부에서 이렇게 접근된다. 의도하지 않았다
```

`implements` 는 **"이 능력을 가진다"**는 선언인데
상수를 쓰려고 그 선언을 하는 것은 의미가 안 맞는다.

```java file=ConstantsProper.java good label="유틸 클래스나 enum 으로"
final class Constants {
    private Constants() { }
    static final int MAX = 100;
}
```

그리고 **관련된 상수 묶음이면 `enum`** 이 낫다.
타입 안전성이 생기고 `switch` 에서 누락을 잡아준다.

### "추상 클래스는 레거시고 이제 인터페이스만 쓴다"

**상태가 필요한 자리가 계속 있다.**

```java file=AbstractInSpring.java
// Spring 안에서도 쓰인다
public abstract class AbstractAuthenticationProcessingFilter
        extends GenericFilterBean {
    private AuthenticationManager authenticationManager;   // 상태
    protected abstract Authentication attemptAuthentication(...);
}
```

템플릿 메서드 패턴, 공통 상태를 가진 기반 클래스,
`protected` 훅을 제공하는 확장점 — **다 추상 클래스의 자리**다.

다만 **공개 API 로 추상 클래스를 노출하는 것**은 신중해야 한다.
[[inheritance]] 의 덧에서 본 것처럼 **모든 메서드가 공개 계약**이 되고
내부 구현을 바꿀 자유가 사라진다.

그래서 **밖에는 인터페이스, 안에는 추상 클래스**가 흔한 구조다.
`List` 가 인터페이스고 `AbstractList` 가 내부 구현 보조인 것이 그 예다.

### "Java 8 이후로는 추상 클래스가 할 수 있는 것을 인터페이스가 다 한다"

**세 가지가 여전히 다르다.** 그리고 그 셋이 실무에서 자주 걸린다.

```visual
id: abstract-vs-interface-remaining-gaps
kind: structure
title: default 메서드가 들어온 뒤에도 남은 차이
nodes:
  - name: 인터페이스가 할 수 없는 일
    detail: 구현을 담을 수 있게 되면서 둘의 경계가 흐려졌다. 그래도 상태를 못 가진다는 뿌리에서 나오는 차이가 셋 남는다
    code: 뿌리는 여전히 상태다
    children:
      - name: 인스턴스 상태를 가질 수 없다
        detail: 계산 결과를 필드에 캐싱하거나 호출 횟수를 세는 것이 불가능하다. default 메서드는 매번 다시 계산해야 한다
        code: 필드 캐싱 불가
        children:
          - name: 그래서 필요한 경우
            detail: 커넥션 풀이나 캐시처럼 내부 자원을 들고 있어야 하는 기반 클래스는 추상 클래스여야 한다
            code: 자원을 들고 있는 기반 클래스
      - name: protected 로 자식에게만 공개할 수 없다
        detail: 인터페이스의 메서드는 모두 public 이다. private default 는 자기 안에서만 쓰이고 자식에게 줄 수 없다
        code: 접근 제한이 둘뿐
        children:
          - name: 그래서 필요한 경우
            detail: 템플릿 메서드 패턴의 훅이다. 자식만 오버라이딩해야 하고 외부에서 부르면 안 되는 메서드가 있을 때다
            code: 템플릿 메서드의 훅
          - name: 인터페이스로 하면
            detail: 그 훅이 공개 API 가 된다. 외부에서 부를 수 있고 한 번 공개하면 되돌릴 수 없다
            code: 의도하지 않은 공개
      - name: 생성자로 불변식을 강제할 수 없다
        detail: 객체가 만들어지는 순간 지켜야 하는 조건을 검사할 자리가 없다. 인터페이스에는 생성자가 없다
        code: 생성 시점 검증 불가
        children:
          - name: 그래서 필요한 경우
            detail: 필수 의존성을 생성자로 받아 final 로 두는 패턴이다. solid 의 DIP 에서 쓰는 그 방식이다
            code: final 필드 + 생성자 주입
      - name: 그래도 기본값은 인터페이스다
        detail: 위 셋이 필요하지 않으면 인터페이스를 고른다. 나중에 조합이 필요해질 여지를 남기는 쪽이 되돌릴 수 없는 결정에서 안전하다
        code: 셋이 필요할 때만 추상 클래스
```
