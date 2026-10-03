---
title: 부모 타입으로 불렀는데 자식 것이 돈다
summary: if-else 타입 분기를 없애는 동적 바인딩, 그리고 컴파일 타임에 정해지는 것들
versionNote: Java 21 기준
ord: 3
minutes: 27
edges:
  - { to: inheritance, type: prerequisite }
  - { to: abstract-vs-interface, type: deepens }
sources:
  - { label: Oracle Java Tutorials - Polymorphism, url: https://docs.oracle.com/javase/tutorial/java/IandI/polymorphism.html }
  - { label: JLS - Method Invocation Expressions, url: https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html }
  - { label: JEP 394 - Pattern Matching for instanceof, url: https://openjdk.org/jeps/394 }
---

[[inheritance]] 끝에서 남은 질문이다.

```java file=WhyPolymorphism.java
List<Account> accounts = ...;
for (Account a : accounts) {
    a.printStatement();      // 각자 다르게 동작해야 한다
}
```

**부모 타입으로 불렀는데 자식 구현이 돌아야** 쓸모가 있다.
안 그러면 묶어둔 의미가 없다.

이것이 다형성이고, **`if-else` 타입 분기를 없애는** 수단이다.
그런데 "전부 실행 시점에 정해진다"고 알면 틀린다.
**컴파일 타임에 정해지는 것이 따로 있고**, 그 경계를 모르면 당황하게 된다.

## 0. 들어가기 전에 — 핵심 용어

- **컴파일 타임 타입**: 변수에 선언된 타입. `Account a` 의 `Account`.
- **런타임 타입**: 실제로 가리키는 객체의 타입. `new SavingsAccount()` 의 그것.
- **동적 바인딩**: 어느 구현을 실행할지 **실행 시점에** 결정하는 것.
- **정적 바인딩**: **컴파일 시점에** 결정하는 것. 오버로딩이 그렇다.
- **오버라이딩 / 오버로딩**: 재정의 / 같은 이름 다른 매개변수.
- **가변인자(varargs)**: `String... args`. 개수가 가변인 매개변수.

한 줄 그림: **무엇을 부를지는 컴파일 타임에, 누구의 것을 부를지는 런타임에 정해진다.**

비유하자면 **전화번호와 받는 사람**이다.
"고객센터로 전화한다"는 **번호는 미리 정해져 있다**(메서드 시그니처).
그런데 **누가 받을지는 전화한 순간에 정해진다**(실제 구현).
번호를 잘못 알면 아예 안 걸리고(컴파일 오류),
번호는 맞는데 받는 사람이 다르면 **다른 답이 온다**(동적 바인딩).

## 1. 그전엔 어떻게 했나 — 타입을 물어보고 분기하기

타입으로 묶기는 했는데([[inheritance]]) 각자 다르게 동작시키려면
**타입을 확인해서 갈라야** 한다.

```java file=TypeBranching.java bad label="타입마다 분기한다"
void printStatement(Account a) {
    if (a instanceof SavingsAccount) {
        SavingsAccount s = (SavingsAccount) a;
        System.out.println("저축 " + s.getInterestRate());
    } else if (a instanceof CheckingAccount) {
        CheckingAccount c = (CheckingAccount) a;
        System.out.println("당좌 " + c.getOverdraftLimit());
    }
}
```

### 고통 1 — 타입이 늘면 모든 분기를 찾아 고쳐야 한다

계좌 종류를 하나 추가한다. 그러면

```
printStatement()      → if-else 추가
calculateFee()        → if-else 추가
validateTransfer()    → if-else 추가
exportToCsv()         → if-else 추가
```

**타입 하나가 늘면 분기 네 군데를 고친다.** 그리고 한 군데를 빠뜨린다.

빠뜨린 곳은 **조용히 아무것도 안 한다.** `else` 가 없으면 그냥 넘어간다.
컴파일러가 안 잡아준다.

### 고통 2 — 캐스팅이 터진다

```java file=CastFailure.java bad label="런타임에 터진다"
void process(Account a) {
    SavingsAccount s = (SavingsAccount) a;   // 당좌가 오면?
    s.applyInterest();
}
```

```
ClassCastException: CheckingAccount cannot be cast to SavingsAccount
```

**컴파일은 통과한다.** `Account` 를 `SavingsAccount` 로 캐스팅하는 것이
문법적으로 가능하기 때문이다. 실제로 그 타입이 아닌 것은 **실행해봐야** 안다.

### 고통 3 — 분기가 여러 곳에 흩어진다

같은 타입 분기가 **파일 열 개에** 흩어져 있다.
"저축예금이 어떻게 처리되나"를 알려면 **열 군데를 찾아 읽는다.**

그리고 분기 조건이 **조금씩 달라진다.**

```java file=InconsistentBranching.java bad label="어디는 있고 어디는 없다"
// A.java
if (a instanceof SavingsAccount || a instanceof PremiumAccount) { ... }
// B.java
if (a instanceof SavingsAccount) { ... }    // Premium 을 빠뜨렸다
```

**어느 쪽이 맞는지 아무도 모른다.**

### 고통 4 — 라이브러리 코드는 고칠 수 없다

```java file=LibraryProblem.java
// 라이브러리 안의 코드
void render(Shape s) {
    if (s instanceof Circle) { ... }
    else if (s instanceof Square) { ... }
}
```

내가 `Triangle` 을 만들어도 **라이브러리의 분기에 추가할 수 없다.**
그래서 그 라이브러리로는 **새 타입을 쓸 수 없다.**

네 고통의 뿌리는 **하나**다. **"무엇을 할지"를 호출하는 쪽이 결정한다.**
타입마다 다른 동작인데 그 지식이 **타입 밖에** 있다.

## 2. 이렇게 피해봤다

### 시도 1 — `enum` 과 `switch` 로 정리한다

```java file=EnumSwitch.java
enum AccountType { SAVINGS, CHECKING }

void printStatement(Account a) {
    switch (a.getType()) {
        case SAVINGS -> ...;
        case CHECKING -> ...;
    }
}
```

**고통 2 가 풀린다.** 캐스팅이 없어 `ClassCastException` 이 안 난다.
그리고 `enum` 에 대한 `switch` 는 **빠뜨린 경우를 경고**해준다.

고통 1 과 3 은 그대로다. **분기 자체가 여전히 흩어져 있다.**
타입이 늘면 `enum` 에 상수를 추가하고 **모든 `switch` 를 찾아 고친다.**

### 시도 2 — 함수 테이블을 만든다

```java file=FunctionTable.java
Map<AccountType, Consumer<Account>> printers = Map.of(
    SAVINGS, a -> ...,
    CHECKING, a -> ...);
```

**고통 3 이 조금 풀린다.** 한 군데에 모였다.

그런데 **동작 종류마다 테이블이 하나씩** 필요하다.
`printers`, `feeCalculators`, `validators`... 테이블이 늘어난다.
그리고 **테이블과 타입의 동기화**를 사람이 지켜야 한다.

이 방식이 사실 **다형성을 손으로 구현하는 것**이다.
언어가 해주는 일을 직접 하고 있다.

### 시도 3 — 모든 동작을 부모에 다 넣는다

```java file=FatParent.java bad label="부모가 전부 안다"
abstract class Account {
    void printStatement() {
        if (this instanceof SavingsAccount) { ... }   // 여전히 분기
    }
}
```

**분기를 옮긴 것**뿐이다. 그리고 부모가 **자식을 전부 알아야** 한다.
새 자식을 추가할 때마다 **부모를 고친다.** 더 나빠졌다.

> 세 시도의 공통점: **타입별 동작을 타입 밖에서 관리했다.**
> 그 지식을 **각 타입 안으로** 옮기면 전부 사라진다.

## 3. 그래서 나온 것 — 각자 자기 것을 안다

```java file=Polymorphism.java good label="분기가 사라진다"
abstract class Account {
    abstract void printStatement();      // 약속만 한다
}

class SavingsAccount extends Account {
    @Override void printStatement() {
        System.out.println("저축 " + interestRate);
    }
}

class CheckingAccount extends Account {
    @Override void printStatement() {
        System.out.println("당좌 " + overdraftLimit);
    }
}
```

```java file=CallSite.java good label="호출하는 쪽은 타입을 모른다"
for (Account a : accounts) {
    a.printStatement();      // 각자 자기 구현이 돈다
}
```

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 타입이 늘면 분기를 다 고친다 | **클래스 하나만 추가.** 호출하는 쪽은 안 바뀐다 |
| 캐스팅이 터진다 | 캐스팅이 **없다** |
| 분기가 흩어진다 | 각 타입의 동작이 **그 클래스 안에** 모인다 |
| 라이브러리를 못 고친다 | 라이브러리가 **인터페이스로 받으면** 내 타입이 들어간다 |

**`abstract` 로 선언하면 컴파일러가 강제한다.**
새 자식을 만들면서 `printStatement` 를 안 구현하면 **컴파일이 안 된다.**
고통 1 의 "빠뜨려도 조용히 넘어간다"가 **컴파일 오류**로 바뀐다.

이것이 **OCP(개방-폐쇄 원칙)** 다. 확장에는 열려 있고(새 클래스 추가)
수정에는 닫혀 있다(기존 코드 안 건드림). [[solid]] 에서 다시 본다.

같은 요구사항이 두 방식에서 어떻게 다르게 번지는지 펼쳐 보자.

```visual
id: polymorphism-adding-a-type
kind: structure
title: 계좌 종류를 하나 추가할 때 고쳐야 하는 것
nodes:
  - name: 요구사항 — 적립식 예금을 추가한다
    detail: 비즈니스에서는 한 줄짜리 요구다. 그런데 코드에 번지는 범위가 설계에 따라 전혀 다르다
    code: 새 계좌 종류 하나
    children:
      - name: 타입 분기 방식 — 번진다
        detail: 동작마다 if-else 가 있으므로 그 전부를 찾아 고쳐야 한다. 그리고 빠뜨린 곳은 컴파일러가 안 잡아준다
        code: 분기가 있는 모든 파일
        children:
          - name: printStatement 의 분기
            detail: else if 를 추가한다. 안 하면 아무것도 출력되지 않고 오류도 안 난다
            code: 조용히 누락될 수 있다
          - name: calculateFee 의 분기
            detail: 다른 파일이다. 여기도 추가한다. 이 파일이 있는 줄 모르면 못 찾는다
            code: 다른 파일
          - name: validateTransfer 의 분기
            detail: 또 다른 파일. 분기 조건이 조금씩 달라 어느 쪽이 맞는지도 판단해야 한다
            code: 조건이 일관되지 않을 수 있다
          - name: 라이브러리 안의 분기
            detail: 고통 4 다. 고칠 수 없다. 그 라이브러리로는 새 타입을 쓸 수 없다
            code: 고칠 수 없다
      - name: 다형성 방식 — 한 곳에 모인다
        detail: 새 클래스 하나를 만들고 약속된 메서드를 구현한다. 호출하는 쪽은 한 글자도 안 바뀐다
        code: 새 클래스 파일 하나
        children:
          - name: abstract 가 강제한다
            detail: 구현을 빠뜨리면 컴파일이 안 된다. 고통 1 의 조용한 누락이 컴파일 오류로 바뀐다
            code: 빠뜨릴 수 없다
          - name: 호출하는 쪽은 안 바뀐다
            detail: for 루프도 스트림도 그대로다. 이것이 수정에 닫혀 있다는 뜻이다
            code: 기존 코드 무변경
          - name: 라이브러리도 받아준다
            detail: 라이브러리가 인터페이스로 받으면 내 타입이 그대로 들어간다. 고통 4 가 사라진다
            code: 인터페이스로 받으면 된다
      - name: 그래서 어디를 봐야 하나
        detail: 새 타입을 추가하는 일이 잦으면 다형성이고, 그 판단이 OCP 다
        code: 변경의 방향으로 고른다
```

## 4. 어떻게 동작하나 — 무엇이 언제 정해지나

여기가 핵심이다. **전부 런타임에 정해지는 것이 아니다.**

```visual
id: polymorphism-binding-timing
kind: step
title: a.printStatement() 가 실행되기까지
steps:
  - name: 컴파일 타임 — 타입을 확인한다
    detail: 변수의 선언 타입이 Account 다. 컴파일러는 Account 에 printStatement 라는 메서드가 있는지만 본다. 없으면 여기서 컴파일 오류다
    code: Account 에 그 메서드가 있나?
  - name: 컴파일 타임 — 어느 시그니처인지 정한다
    detail: 오버로딩된 메서드가 여럿이면 여기서 하나가 선택된다. 인자의 컴파일 타임 타입으로 정해지고 런타임에 바뀌지 않는다. 이것이 정적 바인딩이다
    code: printStatement() 시그니처 확정
  - name: 컴파일 타임 — 호출 명령을 만든다
    detail: invokevirtual 명령이 생긴다. 이 명령은 어느 클래스의 구현인지를 적지 않는다. 메서드 이름과 시그니처만 적는다
    code: invokevirtual Account.printStatement()
  - name: 런타임 — 실제 객체를 본다
    detail: 여기서 비로소 객체의 실제 타입을 확인한다. 참조가 가리키는 객체의 클래스 정보를 읽는다
    code: 이 객체는 SavingsAccount 다
  - name: 런타임 — 그 클래스의 메서드 테이블을 찾는다
    detail: 각 클래스는 메서드 테이블을 갖고 있다. 오버라이딩했으면 자식 구현이, 안 했으면 부모 구현이 거기 적혀 있다
    code: SavingsAccount 의 vtable
  - name: 런타임 — 찾은 구현을 실행한다
    detail: 이것이 동적 바인딩이다. 같은 호출 코드가 객체에 따라 다른 구현을 실행한다
    code: SavingsAccount.printStatement() 실행
  - name: 그래서 경계가 이렇다
    detail: 무엇을 부를지는 컴파일 타임에, 누구의 것을 부를지는 런타임에 정해진다. 이 경계를 모르면 오버로딩에서 당황하게 된다
    code: 시그니처는 정적 · 구현은 동적
```

### 오버로딩은 동적이 아니다

이것이 가장 자주 당하는 지점이다.

```java file=OverloadIsStatic.java bad label="예상과 다르게 동작한다"
void describe(Account a) { System.out.println("계좌"); }
void describe(SavingsAccount s) { System.out.println("저축예금"); }

Account a = new SavingsAccount();
describe(a);     // "계좌" 가 출력된다
```

**"저축예금"이 아니다.** `a` 의 **컴파일 타임 타입이 `Account`** 이므로
컴파일러가 `describe(Account)` 를 선택했고, **런타임에 안 바뀐다.**

```
오버라이딩 → 런타임 타입으로 결정 (동적)
오버로딩   → 컴파일 타임 타입으로 결정 (정적)
```

**이름이 비슷해서 헷갈리는데 완전히 다른 메커니즘**이다.
그래서 오버로딩으로 타입 분기를 하려고 하면 안 된다.

### 가변인자도 정적으로 결정된다

```java file=Varargs.java
void log(String... args) { }          // 내부에서는 String[] 이다
```

가변인자는 **오버로딩 폭발을 막으려고** 나왔다.

```java file=BeforeVarargs.java bad label="개수마다 만들어야 했다"
void log(String a) { }
void log(String a, String b) { }
void log(String a, String b, String c) { }
```

```java file=WithVarargs.java good label="하나로 끝난다"
void log(String... args) {
    for (String a : args) { ... }      // 배열로 다룬다
}
```

**규칙이 둘 있다.**

```java file=VarargsRules.java
void log(String prefix, String... args) { }   // 마지막에만 올 수 있다
void log(String... args, String suffix) { }   // 컴파일 오류
```

그리고 **오버로딩과 섞이면 모호해진다.**

```java file=VarargsAmbiguity.java bad label="어느 것이 불릴까"
void log(String a) { System.out.println("단일"); }
void log(String... args) { System.out.println("가변"); }

log("x");     // "단일" 이 불린다
```

**구체적인 것이 이긴다.** 가변인자는 **마지막 후보**로 고려된다.
그래서 가변인자 메서드가 안 불려서 당황하는 경우가 생긴다.

### `instanceof` 가 필요한 경우가 남는다

다형성으로 대부분 사라지지만 **완전히 없어지지는 않는다.**

```java file=PatternMatching.java good label="Java 16+ 패턴 매칭"
if (a instanceof SavingsAccount s) {
    s.applyInterest();                 // 캐스팅이 필요 없다
}
```

변수 선언과 캐스팅이 **한 줄로 합쳐진다.** 고통 2 의 `ClassCastException` 이
구조적으로 불가능해진다. `instanceof` 가 참일 때만 `s` 가 존재하기 때문이다.

```java file=SwitchPattern.java good label="Java 21 switch 패턴"
String describe(Account a) {
    return switch (a) {
        case SavingsAccount s -> "저축 " + s.getRate();
        case CheckingAccount c -> "당좌 " + c.getLimit();
    };
}
```

`sealed` 로 자식을 제한하면 **빠뜨린 경우를 컴파일러가 잡아준다.**
고통 1 의 "조용히 넘어간다"가 해결된다.

### 어느 쪽을 쓸까

```visual
id: polymorphism-which-approach
kind: playground
title: 이 경우 다형성인가 패턴 매칭인가
inputs:
  - { name: 상황, label: 상황, options: [타입마다 동작이 다르다, 타입이 계속 늘어난다, 타입이 고정이고 동작이 늘어난다, 외부 타입을 다룬다, 타입에 로직을 넣을 수 없다] }
outcomes:
  - when: { 상황: 타입마다 동작이 다르다 }
    result: 다형성이 기본이다. 동작을 각 타입 안에 둔다
    note: 호출하는 쪽이 타입을 모르게 되고 새 타입 추가가 기존 코드를 안 건드린다. OCP 의 모습이다
  - when: { 상황: 타입이 계속 늘어난다 }
    result: 다형성이 분명히 유리하다. 클래스 하나만 추가하면 끝난다
    note: 패턴 매칭이면 모든 switch 를 찾아 고쳐야 한다. 고통 1 이 그대로 재현된다
  - when: { 상황: 타입이 고정이고 동작이 늘어난다 }
    result: sealed 와 패턴 매칭이 유리하다. 새 동작을 추가할 때 타입들을 안 건드린다
    note: 방향이 반대인 경우다. 다형성은 타입 추가에 강하고 패턴 매칭은 동작 추가에 강하다. 표현 문제라고 부른다
  - when: { 상황: 외부 타입을 다룬다 }
    result: 패턴 매칭이다. 남의 클래스에 메서드를 추가할 수 없다
    note: 라이브러리의 타입을 분류해야 할 때다. instanceof 패턴으로 쓰되 한 곳에 모아둔다
  - when: { 상황: 타입에 로직을 넣을 수 없다 }
    result: 패턴 매칭이나 방문자 패턴이다. 도메인 타입에 표현 로직을 섞고 싶지 않을 때도 해당한다
    note: Account 에 toCsv 와 toJson 과 toPdf 를 다 넣으면 책임이 섞인다. 그 경우 밖에서 분류하는 것이 낫다
```

**방향이 반대**라는 것이 핵심이다.
다형성은 **타입 추가**에 강하고, 패턴 매칭은 **동작 추가**에 강하다.
어느 쪽이 더 자주 바뀌는지로 고른다.

## 5. 이것도 끝이 아니다 — 추상화 도구가 둘이다

다형성을 쓰려면 **부모가 있어야** 한다. 그리고 그 부모는
구현을 주지 않고 **약속만** 하는 것이 좋았다.

```java file=TwoOptions.java
abstract class Account { abstract void printStatement(); }
interface Account { void printStatement(); }
```

**둘 다 된다.** 그러면 무엇이 다른가.

[[inheritance]] 에서 두 가지를 봤다.
**클래스는 하나만 상속**할 수 있고, **인터페이스는 여러 개** 구현할 수 있다.
그리고 상속의 고통 4~6 때문에 **"상속보다 합성"**이 나왔다.

그러면 **거의 항상 인터페이스가 낫지 않나.**

그런데 Java 8 이 인터페이스에 **구현을 허용**하면서 경계가 흐려졌다.

```java file=DefaultMethod.java
interface Account {
    void printStatement();
    default String summary() { return "계좌"; }   // 구현이 들어왔다
}
```

**왜 이런 것이 생겼고**, 그러면 추상 클래스는 왜 남아 있고,
둘 중 무엇을 골라야 하는지 [[abstract-vs-interface]] 에서 본다.

## 자기 점검

- `if-else` 타입 분기가 타입이 늘어날 때 왜 위험한가? 컴파일러는 왜 못 잡나?
- 오버라이딩과 오버로딩 중 런타임에 결정되는 쪽은? 왜 그런가?
- `describe(a)` 에서 `a` 의 런타임 타입이 `SavingsAccount` 인데 `describe(Account)` 가 불리는 이유는?
- 가변인자와 단일 인자 오버로드가 둘 다 있으면 어느 것이 불리는가?
- 다형성과 패턴 매칭 중 "타입이 자주 늘어나는" 경우에 맞는 쪽은?

## 덧 — 흔한 오해

### "필드도 다형적으로 동작한다"

**필드는 정적으로 바인딩된다.** 메서드와 다르다.

```java file=FieldHiding.java bad label="예상과 다르다"
class Parent { String name = "부모"; }
class Child extends Parent { String name = "자식"; }

Parent p = new Child();
System.out.println(p.name);        // "부모" 가 출력된다
```

필드는 **오버라이딩이 아니라 숨김(hiding)** 이다.
같은 이름의 필드가 **두 개 존재**하고, 컴파일 타임 타입으로 고른다.

그래서 **필드를 같은 이름으로 재선언하지 않는다.**
의도한 동작이 거의 없고 혼란만 만든다.
상태는 `private` 으로 두고 접근자를 오버라이딩하는 것이 맞다.

### "`static` 메서드도 오버라이딩된다"

**안 된다.** 숨김이다. 그리고 컴파일 타임 타입으로 결정된다.

```java file=StaticHiding.java bad label="오버라이딩이 아니다"
class Parent { static String who() { return "부모"; } }
class Child extends Parent { static String who() { return "자식"; } }

Parent p = new Child();
System.out.println(p.who());       // "부모". 그리고 경고가 뜬다
```

`static` 메서드는 **클래스에 속하고 객체에 속하지 않는다.**
그래서 객체의 실제 타입과 무관하다.

`static` 메서드를 인스턴스 참조로 부르는 것 자체가 **좋지 않은 습관**이고,
IDE 가 경고한다. `Parent.who()` 로 클래스 이름으로 부른다.

이 성질 때문에 **`static` 메서드는 다형성에 참여하지 못하고**,
그래서 테스트에서 모킹하기 어렵다는 문제가 따라온다.
PART 20 의 테스트 심화에서 다시 만난다.

### "다형성을 쓰면 `if` 가 전부 사라진다"

**타입 분기만 사라진다.** 값에 대한 분기는 그대로다.

```java file=StillNeedIf.java
void withdraw(long amount) {
    if (amount > balance) throw new InsufficientFundsException();
    balance -= amount;
}
```

이 `if` 는 다형성으로 없앨 수 없고 **없앨 이유도 없다.**

"`if` 를 없애는 것"이 목표가 되면 과하게 클래스를 만들게 된다.
없애야 할 것은 **"타입을 물어보는 `if`"** 이고,
그 신호는 `instanceof` 나 `getType()` 같은 호출이다.

그리고 **열거형이 두세 개로 고정**이고 동작이 간단하면
`switch` 가 다형성보다 **읽기 쉬운 경우도 많다.**
클래스 셋을 만드는 비용이 더 클 수 있다.
