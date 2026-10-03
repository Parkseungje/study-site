---
title: 중복을 없애려고 상속을 썼더니
summary: 공통을 위로 올리는 것이 왜 효과적이고, 왜 금방 발목을 잡는가
versionNote: Java 21 기준
ord: 2
minutes: 28
edges:
  - { to: procedural-to-oop, type: prerequisite }
  - { to: polymorphism, type: deepens }
sources:
  - { label: Oracle Java Tutorials - Inheritance, url: https://docs.oracle.com/javase/tutorial/java/IandI/subclasses.html }
  - { label: JLS - Class Declarations, url: https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html }
---

[[procedural-to-oop]] 끝에서 본 고통이다.

```java file=Duplication.java bad label="비슷한 클래스가 쌓인다"
class SavingsAccount {
    private long balance;
    void deposit(long a) { balance += a; }
}

class CheckingAccount {
    private long balance;
    void deposit(long a) { balance += a; }
}
```

**캡슐화를 얻으면서 중복을 얻었다.**
절차지향에서는 `deposit` 함수 하나만 고치면 됐는데, 이제 계좌 종류마다 있다.

상속은 이 문제를 **아주 잘** 푼다. 그리고 **아주 빠르게** 새 문제를 만든다.
이 글은 둘을 같이 본다.

## 0. 들어가기 전에 — 핵심 용어

- **`extends`**: 부모 클래스의 필드와 메서드를 물려받는 선언.
- **생성자 체이닝**: 자식 생성자가 **먼저 부모 생성자를 호출**하는 것.
- **`super`**: 부모를 가리키는 참조. 생성자 호출과 메서드 호출에 쓴다.
- **오버라이딩(overriding)**: 물려받은 메서드를 자식이 **다시 정의**하는 것.
- **다중 상속**: 부모가 둘 이상인 것. **자바는 금지한다.**
- **다이아몬드 문제**: 두 부모가 같은 메서드를 가질 때 어느 것을 쓸지 모호해지는 것.

한 줄 그림: **공통을 위로 올리면 중복이 사라지지만, 그 공통에 자식들이 묶인다.**

비유하자면 **가족 유전**이다. 부모의 특성을 물려받으면
**처음부터 다시 만들 필요가 없다.** 효율적이다.
그런데 **물려받은 것을 거부할 수 없다.** 부모가 바뀌면 자식도 바뀌고,
"이 특성만 빼고 싶다"가 안 된다.
그리고 **부모를 두 명 고를 수도 없다.**

## 1. 그전엔 어떻게 했나 — 복사해 붙이던 시절

### 고통 1 — 고칠 곳이 여러 군데다

계좌가 세 종류가 됐다.

```java file=BeforeInheritance.java bad label="같은 코드가 세 군데"
class SavingsAccount {
    private long balance;
    void deposit(long a) {
        if (a <= 0) throw new IllegalArgumentException();
        balance += a;
    }
}

class CheckingAccount {
    private long balance;
    void deposit(long a) {
        if (a <= 0) throw new IllegalArgumentException();
        balance += a;
    }
}
```

"입금액 상한 1억" 규칙이 추가된다. **세 군데를 고친다.**
그리고 한 군데를 빠뜨린다. 그 계좌만 상한이 없다.

**버그가 "없는 코드" 때문에 생긴다.** 고친 두 곳을 봐서는 안 보인다.

### 고통 2 — 공통인지 아닌지 구분이 안 된다

```java file=WhichIsCommon.java
class SavingsAccount {
    private long balance;
    private double interestRate;    // 이건 저축예금만?
    void deposit(long a) { ... }    // 이건 공통?
    void applyInterest() { ... }    // 이건?
}
```

클래스가 늘어나면 **무엇이 공통이고 무엇이 고유한지** 문서에도 코드에도 안 적혀 있다.
새로 합류한 사람이 `deposit` 을 고치면서 **그게 다른 데도 있는지** 모른다.

### 고통 3 — 같이 다뤄야 하는데 타입이 다르다

```java file=CannotGroup.java bad label="한 배열에 못 담는다"
SavingsAccount s = new SavingsAccount();
CheckingAccount c = new CheckingAccount();

// 전체 계좌의 잔액 합을 구하려면?
// 배열에 담을 공통 타입이 없다
```

"모든 계좌의 잔액 합"을 구하려는데 **담을 타입이 없다.**
`Object[]` 에 담으면 꺼낼 때 전부 캐스팅해야 하고,
계좌 종류가 늘면 `if-else` 가 늘어난다.

세 고통의 뿌리는 **하나**다. **공통이라는 사실이 코드에 표현되지 않았다.**
사람은 "이것들은 다 계좌다"를 아는데 **컴파일러는 모른다.**

## 2. 이렇게 피해봤다

### 시도 1 — 공통 로직을 유틸 클래스로 뺀다

```java file=AccountUtil.java
class AccountUtil {
    static void validateAmount(long a) {
        if (a <= 0) throw new IllegalArgumentException();
    }
}
```

**고통 1 이 상당히 풀린다.** 검증 규칙이 한 군데다.
그리고 이것은 **지금도 유효한 방법**이다.

그런데 `balance` 필드는 여전히 각자 갖고 있다.
**상태는 공유가 안 된다.** 그래서

```java file=StillDuplicated.java bad label="호출은 공통인데 필드는 각자"
class SavingsAccount {
    private long balance;              // 중복
    void deposit(long a) {
        AccountUtil.validateAmount(a); // 공통
        balance += a;                  // 중복
    }
}
```

**절반만 풀렸다.** 그리고 고통 2, 3 은 그대로다.

### 시도 2 — 공통 클래스를 필드로 가진다 (합성)

```java file=Composition.java
class SavingsAccount {
    private AccountCore core = new AccountCore();
    void deposit(long a) { core.deposit(a); }   // 위임
}
```

**상태도 행동도 공유된다.** 고통 1 과 2 가 풀린다.

**위임 코드가 늘어난다.** 공통 메서드가 열 개면 **열 개의 위임 메서드**를 쓴다.
그리고 고통 3 이 그대로다. `SavingsAccount` 와 `CheckingAccount` 는
여전히 **아무 관계가 없는 타입**이다.

> **이 방법이 나중에 다시 돌아온다.** 상속의 문제를 겪고 나면
> 많은 경우 이쪽이 더 나은 선택이라는 것을 알게 된다. 5번 섹션에서 다시 본다.

### 시도 3 — 인터페이스로 타입만 묶는다

```java file=InterfaceOnly.java
interface Account { void deposit(long a); long getBalance(); }
class SavingsAccount implements Account { ... }
```

**고통 3 이 풀린다.** `List<Account>` 에 담을 수 있다.

**구현 중복은 그대로다.** 인터페이스는 **약속만** 하고 구현을 안 준다.
(Java 8 의 `default` 메서드가 이것을 조금 바꾸는데, 다음 글에서 본다.)

> 세 시도의 공통점: **셋 중 하나만 푼다.**
> 상태 공유, 구현 공유, 타입 공유를 **한 번에** 하는 수단이 필요했다.

## 3. 그래서 나온 것 — 공통을 위로 올린다

```java file=Inheritance.java good label="공통을 한 곳에"
abstract class Account {
    protected long balance;                    // 상태 공유

    void deposit(long a) {                     // 구현 공유
        if (a <= 0) throw new IllegalArgumentException();
        balance += a;
    }

    long getBalance() { return balance; }
}

class SavingsAccount extends Account {
    private double interestRate;
    void applyInterest() { balance += balance * interestRate; }
}

class CheckingAccount extends Account {
    private long overdraftLimit;
}
```

```java file=NowGroupable.java
List<Account> accounts = List.of(
    new SavingsAccount(), new CheckingAccount());

long total = accounts.stream()
    .mapToLong(Account::getBalance).sum();     // 타입 공유
```

세 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 고칠 곳이 여러 군데 | 공통 구현이 **부모에 한 벌** |
| 공통인지 구분이 안 된다 | **위에 있으면 공통**이다. 코드가 문서가 된다 |
| 같이 못 담는다 | 부모 타입으로 **묶인다** |

**세 가지를 한 번에 푼다.** 그래서 상속이 강력하고, 그래서 과하게 쓰인다.

## 4. 어떻게 동작하나 — 생성자 체이닝과 오버라이딩

상속에서 **반드시 알아야 하는 것**이 생성자 호출 순서다.
모르면 "왜 null 이지"에서 몇 시간을 쓴다.

```visual
id: inheritance-constructor-chain
kind: step
title: new SavingsAccount() 가 실행되는 순서
steps:
  - name: new SavingsAccount() 호출
    detail: 자식 생성자가 시작된다. 그런데 첫 줄이 실행되기 전에 해야 할 일이 있다
    code: new SavingsAccount()
  - name: 암묵적 super() 가 먼저 불린다
    detail: 자식 생성자의 첫 문장은 항상 부모 생성자 호출이다. 안 적으면 컴파일러가 super() 를 넣는다. 부모가 기본 생성자가 없으면 여기서 컴파일 오류가 난다
    code: super() 가 자동 삽입된다
  - name: 부모의 필드 초기화
    detail: Account 의 balance 가 기본값 0 으로 설정되고, 필드 선언의 초기화식이 실행된다
    code: balance = 0
  - name: 부모 생성자 본문 실행
    detail: 여기서 부모가 오버라이딩된 메서드를 부르면 위험하다. 자식 필드가 아직 초기화되지 않았기 때문이다. 아래에서 자세히 본다
    code: Account 의 생성자 본문
  - name: 자식의 필드 초기화
    detail: 부모가 완성된 뒤에야 자식 필드가 초기화된다. interestRate 가 여기서 값을 받는다
    code: interestRate = 0.02
  - name: 자식 생성자 본문 실행
    detail: 이제 비로소 자식 생성자에 내가 쓴 코드가 돈다. 부모와 자식 모두 준비된 상태다
    code: SavingsAccount 의 생성자 본문
  - name: 그래서 순서가 아래에서 위로, 다시 위에서 아래로
    detail: 호출은 자식에서 부모로 올라가고 실제 초기화는 부모에서 자식으로 내려온다. 이 비대칭이 함정의 원인이다
    code: 호출 ↑ · 초기화 ↓
```

### 함정 — 생성자에서 오버라이딩된 메서드를 부르면

```java file=ConstructorTrap.java bad label="null 이 나온다"
abstract class Account {
    Account() { printInfo(); }        // 부모 생성자에서 호출
    abstract void printInfo();
}

class SavingsAccount extends Account {
    private String name = "저축";
    @Override void printInfo() {
        System.out.println(name.length());   // NPE
    }
}
```

**`name` 이 아직 `null` 이다.** 위 순서에서 **4번이 5번보다 먼저**이기 때문이다.
부모 생성자가 돌 때 자식 필드는 초기화되지 않았다.

```java file=ConstructorSafe.java good label="생성자에서는 부르지 않는다"
abstract class Account {
    Account() { }
    abstract void printInfo();
}
// 객체를 만든 뒤에 호출한다
Account a = new SavingsAccount();
a.printInfo();
```

**생성자에서 오버라이딩 가능한 메서드를 부르지 않는다.**
`final` 메서드나 `private` 메서드만 부른다.

### 다중 상속을 금지한 이유

```visual
id: inheritance-diamond
kind: structure
title: 다중 상속이 만드는 모호함
nodes:
  - name: 만약 자바가 다중 상속을 허용한다면
    detail: 두 부모에게서 같은 이름의 것을 물려받을 때 어느 것인지 정할 규칙이 필요해진다. 그 규칙이 복잡해지는 것이 금지한 이유다
    code: class C extends A, B
    children:
      - name: 메서드가 겹치면
        detail: A 와 B 가 모두 save() 를 구현했다면 C 의 save() 는 무엇인가. 컴파일러가 고를 근거가 없다
        code: A.save() vs B.save()
        children:
          - name: 언어마다 다르게 풀었다
            detail: C++ 는 명시적으로 지정하게 하고 Python 은 MRO 라는 탐색 순서를 정의한다. 둘 다 규칙을 외워야 한다
            code: 규칙이 복잡해진다
      - name: 필드가 겹치면 더 나쁘다
        detail: A 와 B 가 둘 다 공통 조상 D 를 상속하면 D 의 필드가 C 에 몇 벌 있는가. 한 벌이면 공유되고 두 벌이면 따로다. 어느 쪽이든 놀라게 된다
        code: 다이아몬드 문제
      - name: 자바의 선택 — 클래스는 하나만
        detail: 상태를 가진 것은 하나만 물려받게 했다. 모호함이 생길 여지를 언어 차원에서 없앴다
        code: extends 는 하나
        children:
          - name: 능력은 여러 개 가능
            detail: 인터페이스는 상태가 없으니 필드 충돌이 없다. 그래서 implements 는 여러 개가 된다
            code: implements 는 여러 개
          - name: default 메서드가 이 경계를 흔든다
            detail: Java 8 이 인터페이스에 구현을 허용하면서 메서드 충돌이 다시 가능해졌다. 그 경우 컴파일 오류를 내고 명시적으로 고르게 한다. 다음 글의 주제다
            code: Java 8 이후
```

## 5. 이것도 끝이 아니다 — 상속이 만드는 새 고통

중복이 사라졌다. 그런데 **쓰다 보면 아프기 시작한다.**

### 고통 4 — 부모를 고치면 자식이 다 깨진다

```java file=FragileBase.java bad label="부모의 사소한 변경이"
abstract class Account {
    void deposit(long a) {
        balance += a;
        logTransaction("deposit", a);    // 로깅을 추가했다
    }
}
```

로깅을 추가했더니 **`deposit` 을 오버라이딩한 자식**에서
로깅이 두 번 되거나 아예 안 된다.

**부모와 자식이 강하게 결합**된다. 이것을 깨지기 쉬운 기반 클래스 문제라고 한다.
그리고 자식이 **다른 팀 코드**면 고치는 것이 사실상 불가능해진다.

### 고통 5 — 상속 계층이 깊어지면 추적이 안 된다

```
Account
 └─ BankAccount
     └─ RetailAccount
         └─ SavingsAccount
             └─ PremiumSavingsAccount
```

`deposit` 이 실제로 어느 클래스의 것인지 **다섯 군데를 올라가며** 찾는다.
그리고 중간에서 오버라이딩하면 **호출 경로가 눈에 안 보인다.**

### 고통 6 — 공통이 아닌 것이 올라간다

```java file=WrongHierarchy.java bad label="모든 계좌가 이자를 받나"
abstract class Account {
    void applyInterest() { ... }      // 당좌예금에는 이자가 없다
}
```

"대부분 공통이니까" 올렸는데 **예외가 생긴다.**
그러면 자식에서 오버라이딩해 **빈 구현이나 예외 던지기**로 막는다.

```java file=LspViolation.java bad label="치환이 깨진다"
class CheckingAccount extends Account {
    @Override void applyInterest() {
        throw new UnsupportedOperationException();   // 이게 신호다
    }
}
```

**`List<Account>` 를 돌면서 `applyInterest()` 를 부르면 터진다.**
부모 타입으로 묶은 이득이 사라진다.

이것이 **리스코프 치환 원칙 위반**이고, SOLID 의 L 이다.
그래서 이 고통이 PART 1 의 마지막 글([[solid]])로 이어진다.

그리고 고통 4~6 때문에 **"상속보다 합성"**이라는 원칙이 나왔다.
시도 2 에서 "나중에 다시 돌아온다"고 한 것이 이것이다.

```java file=PreferComposition.java good label="합성으로 되돌린다"
class SavingsAccount {
    private final AccountCore core;        // 가지고 있다
    private final InterestPolicy interest; // 조합한다

    void deposit(long a) { core.deposit(a); }
}
```

**부모가 바뀌어도 안 깨진다.** 위임하는 메서드만 보면 되고,
필요한 능력만 조합한다. 위임 코드가 늘어나는 대가를 치르지만,
**결합이 약해지는 것이 대개 더 가치 있다.**

그러면 언제 상속을 쓰는가. 판단 기준이 몇 개 있다.

```visual
id: inheritance-or-composition
kind: playground
title: 이 경우 상속인가 합성인가
inputs:
  - { name: 상황, label: 상황, options: [공통 상태와 구현이 있다, 능력 몇 개를 조합한다, 외부 라이브러리 클래스를 확장, 프레임워크가 상속을 요구, 예외가 하나 생겼다] }
  - { name: 관계, label: 관계, options: [자식이 부모를 완전히 대체 가능, 일부 계약을 못 지킨다, 그냥 코드를 재사용하고 싶다] }
outcomes:
  - when: { 상황: 공통 상태와 구현이 있다, 관계: 자식이 부모를 완전히 대체 가능 }
    result: 상속이 맞다. 세 가지를 한 번에 푸는 유일한 수단이다
    note: 다만 부모를 final 메서드로 보호하고 상속을 전제로 문서화한다. 그래야 고통 4 가 안 생긴다
  - when: { 상황: 공통 상태와 구현이 있다, 관계: 일부 계약을 못 지킨다 }
    result: 상속하면 안 된다. 치환이 깨지면 부모 타입으로 묶은 이득이 사라진다
    note: 고통 6 이다. UnsupportedOperationException 을 던지게 되면 이미 틀린 설계다. 계층을 다시 나눈다
  - when: { 상황: 능력 몇 개를 조합한다 }
    result: 인터페이스와 합성이다. 상속은 하나만 고를 수 있어 조합이 안 된다
    note: Comparable 과 Serializable 처럼 능력은 여러 개를 붙인다. 다음 글의 인터페이스가 이 역할이다
  - when: { 상황: 외부 라이브러리 클래스를 확장 }
    result: 합성이 거의 항상 맞다. 그 클래스의 내부 구현에 묶이게 된다
    note: 라이브러리가 업데이트되면서 부모 메서드가 바뀌면 조용히 깨진다. 내가 고칠 수 없는 코드에 상속으로 결합하면 안 된다
  - when: { 상황: 프레임워크가 상속을 요구 }
    result: 따른다. 다만 그 클래스에는 비즈니스 로직을 넣지 않고 얇게 유지한다
    note: 과거 Spring 의 일부 추상 클래스가 그랬다. 요즘은 대개 인터페이스나 애너테이션으로 바뀌었다
  - when: { 관계: 그냥 코드를 재사용하고 싶다 }
    result: 합성이나 유틸 클래스다. 재사용은 상속의 목적이 아니다
    note: 상속의 목적은 타입 계층을 만드는 것이다. 코드 재사용만 원하면서 상속을 쓰면 is-a 가 아닌 계층이 생긴다
  - when: { 상황: 예외가 하나 생겼다 }
    result: 그 하나를 계층에서 빼거나 공통을 더 작게 자른다. 오버라이딩으로 막지 않는다
    note: 공통이 아닌 것이 위에 올라간 것이 원인이다. 올린 것을 내리는 쪽이 맞다
```

### 그래서 타입을 묶는 것만 남는다

상속에서 **정말 유용한 부분**은 고통 3 의 해결 — **타입으로 묶이는 것**이었다.
구현을 물려받는 것은 부작용이 크다.

그러면 **타입만 묶고 구현은 안 물려받는** 수단이 필요하다.
그리고 부모 타입으로 호출했을 때 **실제 객체의 메서드가 돌아야** 쓸모가 있다.

```java file=WhyPolymorphism.java
List<Account> accounts = ...;
for (Account a : accounts) {
    a.printStatement();      // 각자 다르게 동작해야 한다
}
```

**어떻게 부모 타입으로 불렀는데 자식 구현이 도는가.**
그 메커니즘이 [[polymorphism]] 의 주제다.

## 자기 점검

- 상속이 유틸 클래스와 합성에 비해 한 번에 푸는 것 세 가지는?
- 자식 생성자에서 `super()` 를 안 적어도 부모 생성자가 도는 이유는?
- 부모 생성자에서 오버라이딩된 메서드를 부르면 왜 위험한가?
- 자바가 클래스 다중 상속을 금지한 이유를 필드 충돌로 설명하면?
- `UnsupportedOperationException` 을 오버라이딩에서 던지는 것이 어떤 신호인가?

## 덧 — 흔한 오해

### "`protected` 는 캡슐화를 조금만 깨는 것이다"

**자식 전체에 공개하는 것**이고, 자식은 누구나 만들 수 있다.

```java file=ProtectedIsPublic.java bad label="사실상 공개 API 다"
abstract class Account {
    protected long balance;        // 자식이 아무렇게나 바꿀 수 있다
}

class EvilAccount extends Account {
    void hack() { balance = Long.MAX_VALUE; }
}
```

[[procedural-to-oop]] 에서 캡슐화로 "아무 데서나 바뀌는 것"을 막았는데,
`protected` 필드는 그 보호를 **상속 경로로 되돌린다.**

그리고 **한 번 `protected` 로 공개하면 바꿀 수 없다.**
모르는 자식 클래스가 그것에 의존하고 있을 수 있다.

필드는 `private` 으로 두고 **`protected` 메서드로** 접근을 주는 것이 낫다.
그러면 나중에 내부 표현을 바꿀 수 있다.

### "상속은 is-a 관계면 쓰면 된다"

**is-a 는 필요조건이고 충분조건이 아니다.**

```
Penguin is-a Bird    → 참이다
그런데 Bird.fly() 가 있으면 LSP 위반
```

판단 기준이 하나 더 있다. **부모의 모든 계약을 자식이 지킬 수 있는가.**

```java file=IsAIsNotEnough.java
class Square extends Rectangle { ... }
// Square is-a Rectangle 은 참이다
// 그런데 setWidth(5); setHeight(3); 후 getArea() 가 15가 아니다
```

유명한 예다. 수학적으로는 정사각형이 직사각형이지만,
**"너비와 높이를 따로 설정할 수 있다"는 계약**을 정사각형이 못 지킨다.

**"부모를 쓰는 모든 코드가 자식에서도 동작하는가"**로 물어야 한다.

### "`final` 클래스는 확장성을 막아서 나쁘다"

**의도적으로 막는 것이 좋은 설계인 경우가 많다.**

```java
public final class String { ... }
public final class Integer { ... }
```

`String` 이 `final` 인 이유가 있다. 불변성을 보장해야 하고,
누가 상속해 `equals` 를 바꾸면 **모든 컬렉션이 깨진다.**

고통 4(깨지기 쉬운 기반 클래스)는 **부모 쪽에서도 문제**다.
상속을 허용하면 **그 클래스의 모든 메서드가 공개 계약**이 된다.
내부 구현을 바꿀 자유가 사라진다.

> 상속을 위해 설계하고 문서화하라. 그렇지 않으면 금지하라.

Effective Java 의 조언이고, 실무에서 **대부분은 금지하는 쪽**이 맞다.
확장이 필요하면 **인터페이스로 열어두는 것**이 다음 글의 이야기다.
