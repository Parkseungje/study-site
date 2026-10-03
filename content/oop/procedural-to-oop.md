---
title: 절차지향에서 객체지향으로
summary: 데이터와 함수가 흩어져 생기던 고통을, 상태와 행동을 한 덩어리로 묶어 해결한 과정
versionNote: Java 21 기준
ord: 1
minutes: 35
sources:
  - { label: Java Language Specification - Classes, url: https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html }
  - { label: Alan Kay - The Early History of Smalltalk, url: https://dl.acm.org/doi/10.1145/234286.1057828 }
---

객체지향은 **"데이터와 그 데이터를 다루는 함수가 따로 노는 고통"** 을 없애려고 나왔다.
이 글은 그 고통이 무엇이었고, 사람들이 어떻게 피해보려 했고, 결국 무엇으로 해결했는지를 따라간다.

## 0. 들어가기 전에 — 핵심 용어

- **절차지향(procedural)**: 프로그램을 **함수의 나열**로 본다. 데이터는 함수들이 돌려쓰는 재료다. (C, 초기 Pascal)
- **객체지향(object-oriented)**: 프로그램을 **객체들의 상호작용**으로 본다. 데이터와 행동이 한 덩어리다.
- **상태(state) / 필드**: 객체가 지금 어떤 상황인지 담는 데이터. 계좌의 잔액.
- **행동(behavior) / 메서드**: 그 객체로 할 수 있는 일. 입금, 출금.
- **캡슐화(encapsulation)**: 상태를 감추고 **정해진 통로로만** 바꾸게 하는 것.

한 줄 그림: **데이터와 그 데이터를 다루는 코드를 한 울타리에 넣고, 울타리 밖에서는 못 만지게 한다.**

비유하자면 **자판기**다. 안에 음료와 동전이 들어 있지만 손을 넣을 수 없다.
버튼이라는 정해진 통로로만 꺼낼 수 있고, 거스름돈 계산은 자판기가 알아서 한다.
절차지향은 음료와 동전을 창고 바닥에 쌓아두고 "가져가되 장부에 적어주세요"라고
벽에 써 붙인 것에 가깝다. 대부분은 지키지만, 한 명만 안 지켜도 재고가 안 맞는다.

## 1. 그전엔 어떻게 했나 — 흩어진 데이터

은행 프로그램을 절차지향으로 짜보자. 구조체로 데이터를 정의하고, 함수를 따로 만든다.

```c file=bank.c
struct Account {
    char owner[50];
    long balance;
};

void deposit(struct Account *a, long amount) {
    a->balance += amount;
}

void withdraw(struct Account *a, long amount) {
    if (a->balance < amount) return;
    a->balance -= amount;
}
```

처음엔 멀쩡해 보인다. `withdraw`는 잔액을 검사하고, `deposit`은 더하기만 한다.
문제는 **파일이 늘어나면서** 드러난다.

### 고통 1 — 누구나 아무 데서나 바꿀 수 있다

`withdraw`는 잔액을 검사한다. 그런데 **그 함수를 안 거치면** 검사도 없다.

```c file=report.c highlight=4
void print_report(struct Account *a) {
    printf("%s: %ld\n", a->owner, a->balance);

    a->balance = 0;   // 실수든 고의든 막을 방법이 없다
}
```

컴파일러가 아무 말도 안 한다. 잔액이 음수가 되는 버그가 터졌을 때
**어디서 바꿨는지 찾으려면 `balance`를 건드리는 코드를 전부 뒤져야 한다.**
파일이 50개면 50개를 뒤진다. 그중 49개는 멀쩡할 텐데도 다 봐야 한다.

이게 절차지향에서 디버깅이 힘든 진짜 이유다. 버그가 어려워서가 아니라
**용의자 범위를 좁힐 수 없어서**다.

### 고통 2 — 함수 이름이 충돌한다

계좌에도 출금이 있고, 창고에도 출고가 있고, 지갑에도 꺼내기가 있다.
셋 다 `withdraw`라고 부르고 싶지만 C에서는 안 된다. 전역 이름 공간이 하나뿐이다.

```c file=names.c
void account_withdraw(struct Account *a, long amount);
void inventory_withdraw(struct Inventory *i, int count);
void wallet_withdraw(struct Wallet *w, long amount);
```

접두어로 피한다. 그런데 이게 뭘 하는 건지 보자.
**"이 함수는 이 데이터에 속한다"를 사람이 손으로 표시하는 것**이다.
언어가 안 해주니 네이밍 규칙으로 때운다. 규칙을 안 지켜도 컴파일은 된다.

### 고통 3 — 데이터가 바뀌면 함수를 전부 찾아 고쳐야 한다

`balance`를 `long`에서 통화 단위를 가진 구조체로 바꾼다고 하자.

```c file=money.h
struct Money { long amount; char currency[4]; };
```

`balance`를 쓰는 **모든 함수**가 깨진다. 문제는 어느 함수가 그걸 쓰는지
**컴파일해봐야 안다**는 것이다. 구조체와 함수가 묶여 있지 않으니
"이 데이터와 관련된 코드 전부"를 한눈에 볼 방법이 없다.

세 고통은 사실 **하나**다. **데이터와 코드 사이에 소속 관계가 없다.**
사람 머릿속에만 있고 언어에는 없다.

## 2. 이렇게 피해봤다 — C로 흉내내기

C 프로그래머들이 이 고통을 몰랐던 게 아니다. 나름의 방법을 찾았고, 꽤 멀리까지 갔다.

### 시도 1 — 네이밍 규칙

위에서 본 `account_` 접두어다. 가장 널리 쓰였고 지금도 쓰인다.

**규칙일 뿐 강제가 아니다.** 새로 온 사람이 안 지키면 그만이고, 컴파일러는 침묵한다.
그리고 고통 1은 전혀 못 푼다. 이름을 아무리 잘 지어도 `a->balance = 0`은 여전히 된다.

### 시도 2 — 불투명 포인터로 숨기기

구조체 정의를 `.c`에 숨기고 헤더에는 이름만 노출한다.

```c file=account.h
typedef struct Account Account;          // 내용을 모른다

Account* account_create(const char *owner);
void     account_destroy(Account *a);
void     account_deposit(Account *a, long amount);
long     account_balance(const Account *a);
```

```c file=account.c
struct Account {          // 이 파일 안에서만 보인다
    char owner[50];
    long balance;
};
```

**이건 진짜로 캡슐화가 된다.** 다른 파일에서는 구조체 내용을 모르니
`a->balance`를 쓸 수가 없다. 컴파일 에러가 난다. 고통 1이 풀렸다.

실제로 좋은 방법이라 리눅스 커널, SQLite, libcurl 이 다 이 방식을 쓴다.

그런데 대가가 크다.

| 대가 | 내용 |
| --- | --- |
| 보일러플레이트 | 필드 하나 읽으려면 함수 하나를 만들어야 한다 |
| 힙 강제 | 크기를 모르니 스택에 못 올린다. 반드시 `malloc` |
| 수동 해제 | `account_destroy`를 손으로 불러야 한다. 안 부르면 누수 |
| 타입마다 반복 | 새 타입을 만들 때마다 이 네 줄을 또 쓴다 |

고통 2(이름 충돌)와 고통 3(관련 코드 추적)도 그대로다.

### 시도 3 — 구조체 안에 함수 포인터를 넣는다

"행동도 데이터 안에 넣자"는 발상이다. 여기까지 오면 거의 다 왔다.

```c file=shape.c
struct Shape {
    double (*area)(struct Shape *self);    // 직접 넣은 "메서드"
    double (*perimeter)(struct Shape *self);
    double width, height;
};

double rect_area(struct Shape *self) {
    return self->width * self->height;
}

void rect_init(struct Shape *s, double w, double h) {
    s->area = rect_area;                   // 손으로 연결
    s->perimeter = rect_perimeter;
    s->width = w;
    s->height = h;
}
```

**이게 사실상 객체지향이다.** `self`를 첫 인자로 받는 것,
타입마다 함수 테이블이 다른 것 — 뒤에서 볼 자바의 동작과 구조가 같다.
리눅스 커널의 `file_operations`가 정확히 이 방식이다.

문제는 **전부 손으로 한다**는 것이다.

- `rect_init`을 빠뜨리면 함수 포인터가 널이고, 호출하는 순간 죽는다
- 함수 하나를 추가하면 모든 `*_init`을 찾아 고쳐야 한다
- `self`에 엉뚱한 객체를 넘겨도 컴파일러가 안 막는다

> 세 시도의 공통점: **할 수는 있는데 사람이 규율로 지켜야 한다.**
> 객체지향이 한 일은 새로운 발상을 내놓은 게 아니다.
> 이미 하던 것을 **언어가 강제하게** 만든 것이다.

## 3. 그래서 나온 것 — 상태와 행동을 묶는다

자바는 위 세 시도를 문법으로 흡수했다.

```java file=Account.java highlight=2-3,5
class Account {
    private final String owner;    // 밖에서 못 본다
    private long balance;          // 밖에서 못 바꾼다

    void withdraw(long amount) {   // 바꾸는 유일한 통로
        if (balance < amount) throw new IllegalStateException("잔액 부족");
        balance -= amount;
    }

    long balance() { return balance; }
}
```

세 고통이 각각 어떻게 사라졌는지 대응시켜 보자.

| 절차지향의 고통 | C의 대응 | 자바의 해결 |
| --- | --- | --- |
| 누구나 데이터를 바꾼다 | 불투명 포인터 (보일러플레이트) | `private` 한 단어 |
| 함수 이름이 충돌한다 | 접두어 네이밍 (규칙일 뿐) | 이름이 클래스 안에 갇힌다 |
| 관련 코드가 흩어진다 | 파일 분리 관례 | 클래스 파일 하나가 경계 |
| 함수 테이블을 손으로 채움 | `*_init`에서 수동 연결 | 컴파일러가 만든다 |

`private` 하나가 **"잔액이 바뀌는 경로는 이 파일 안에만 있다"** 를 컴파일러가 보장해준다.
고통 1에서 봤던 "파일 50개를 뒤져야 한다"가 **"이 파일 하나만 보면 된다"** 로 바뀐다.

이게 객체지향이 준 가장 큰 실용적 이득이다. 멋있어서가 아니라
**버그를 찾을 때 뒤질 범위가 줄어서** 쓴다.

## 4. 어떻게 동작하나 — 메서드는 결국 함수다

`account.withdraw(1000)`이 특별한 마법은 아니다.
컴파일하면 **시도 3에서 손으로 짜던 것과 거의 같은 모양**이 된다.

```visual
id: procedural-to-oop-dispatch
kind: step
title: 메서드 호출은 숨겨진 첫 인자로 자기 자신을 받는 함수 호출이다
steps:
  - name: 내가 쓴 코드
    detail: 객체에 점을 찍어 메서드를 부른다
    code: account.withdraw(1000)
  - name: 컴파일러가 보는 것
    detail: 호출 대상 객체가 숨겨진 첫 인자로 들어간다. C에서 self를 손으로 넘기던 그 자리다
    code: Account.withdraw(account, 1000)
  - name: 메서드 안의 balance
    detail: 그냥 balance라고 써도 this.balance다. 어느 객체의 잔액인지는 첫 인자가 정한다
    code: this.balance -= amount
  - name: 객체마다 다른 결과
    detail: 같은 코드를 불러도 받은 객체가 다르면 바뀌는 데이터가 다르다
```

그래서 **"행동은 떠다니는 함수가 아니라 특정 객체에 소속된 동작"** 이라는 말이 성립한다.

여기서 중요한 사실 하나가 따라 나온다.
**`withdraw` 코드는 메모리에 한 벌만 있다.** 객체마다 복사되지 않는다.
객체마다 다른 것은 **상태뿐**이다.

```
Account 객체 100만 개
├─ 필드(owner, balance)  × 100만  ← 메모리를 먹는 쪽
└─ 메서드 코드           × 1       ← 클래스 정보에 한 벌
```

객체를 많이 만들면 메모리가 걱정되는데, 메서드 때문은 아니다.
늘어나는 건 필드뿐이다. 이걸 알면 "메서드가 많은 클래스는 무겁다"는 오해가 풀린다.

## 5. 이것도 끝이 아니다 — 다음 고통

캡슐화로 "데이터가 아무 데서나 바뀌는" 문제는 잡혔다.
그런데 클래스가 늘어나면 **새로운 중복**이 생긴다.

```java file=Duplication.java bad label="비슷한 클래스가 쌓인다"
class SavingsAccount {
    private long balance;
    void deposit(long a) { balance += a; }    // 똑같은 코드
}

class CheckingAccount {
    private long balance;
    void deposit(long a) { balance += a; }    // 또 똑같은 코드
}
```

입금 로직을 고치려면 **두 군데를 고쳐야 한다.** 계좌 종류가 열 개면 열 군데다.
절차지향에서는 `deposit` 함수 하나만 고치면 끝이었다.
캡슐화를 얻으면서 **중복을 얻었다.**

이 고통이 **상속**을 부른다. 공통을 위로 올리고 다른 것만 아래에 둔다.
그리고 상속이 또 다른 고통(상위 클래스가 바뀌면 하위가 다 깨지는 문제)을 만들면서
**다형성과 인터페이스**로 넘어간다.

이 "고통 → 해결 → 새 고통" 사슬이 이 책 전체를 관통한다.
다음 글에서 상속부터 이어간다.

## 자기 점검

- C의 불투명 포인터로도 캡슐화가 된다. 그런데도 자바를 객체지향 언어라고 부르는 **결정적 차이**는 무엇인가?
- `private`를 하나도 붙이지 않은 자바 클래스는 절차지향 구조체와 무엇이 다른가?
- 메서드 코드가 객체마다 복사되지 않는다면, 같은 메서드가 객체마다 다르게 동작하는 이유는 무엇인가?
- 상태 없이 메서드만 있는 클래스는 의미가 있을까? 있다면 그것을 여러 개 만들 이유가 있을까?
- 캡슐화를 얻는 대가로 중복이 생겼다. 절차지향으로 돌아가는 것 말고 이 중복을 줄일 방법은?

## 덧 — 흔한 오해 세 가지

### "캡슐화 = getter/setter"

가장 흔한 오해다. 필드를 `private`로 막고 getter/setter를 전부 열면
**캡슐화한 게 아니라 이름만 길어진 것**이다.

```java file=Fake.java bad label="사실상 public 필드"
class Account {
    private long balance;
    public long getBalance() { return balance; }
    public void setBalance(long b) { balance = b; }
}

account.setBalance(account.getBalance() - 1000);   // 검사가 없다
```

```java file=Real.java good label="의도를 메서드로"
class Account {
    private long balance;

    public void withdraw(long amount) {
        if (amount <= 0) throw new IllegalArgumentException();
        if (balance < amount) throw new IllegalStateException();
        balance -= amount;
    }
}
```

차이는 **규칙이 어디 있느냐**다. 위쪽은 잔액을 깎는 쪽이 규칙을 알아야 한다.
호출하는 곳이 열 군데면 검사도 열 군데에 흩어지고, 한 군데라도 빠뜨리면 버그다.
아래쪽은 규칙이 `Account` 안에 한 번 있다.

**데이터를 감추는 게 목적이 아니라, 데이터를 다루는 규칙을 한 곳에 모으는 게 목적이다.**
setter는 "이 값은 아무 때나 아무 값으로 바뀌어도 된다"는 선언이다. 정말 그런 필드에만 쓴다.

### "객체지향 = 클래스와 상속"

지금 우리가 객체지향이라 부르는 것은 **이 말을 만든 사람의 의도와 다르다.**

Alan Kay가 Smalltalk를 만들며 쓴 이 단어의 초점은 **메시지 전달**이었다.
객체는 서로의 내부를 전혀 모르고 메시지를 보내 부탁할 뿐이며,
받은 쪽이 어떻게 처리할지는 받은 쪽만 안다. 세포들이 신호를 주고받는 모습에 가깝다.
Kay는 나중에 "객체지향이라는 말을 만든 걸 후회한다, 사람들이 클래스에만 꽂혔다"고 했다.

이 구분은 실무에 쓸모가 있다. **마이크로서비스는 메시지 중심 객체지향을 네트워크 규모로 한 것**이다.
서비스끼리 내부를 모르고 요청만 주고받는다. "객체지향을 크게 하면 MSA가 된다"는 말이
비유가 아니라 계보인 이유다.

### "객체지향이 항상 낫다"

**상태가 없고 변환만 하는 코드**는 함수가 낫다.

```java file=Transform.java
// 억지로 객체로 만들 이유가 없다
record CsvParser(String raw) {
    List<Row> parse() { ... }
}

// 그냥 함수가 맞다
static List<Row> parseCsv(String raw) { ... }
```

데이터 파이프라인, 수치 계산, 컴파일러처럼 입력을 받아 출력을 내는 일은
지킬 상태가 없다. 숨길 것이 없으니 캡슐화할 것도 없다.
자바에 람다와 스트림이 들어온 것이 이 인정이다.

판단 기준 하나면 된다. **"이것에 이름을 붙여 기억시킬 상태가 있는가."**
있으면 객체, 없으면 함수다.
