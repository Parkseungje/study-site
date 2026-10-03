---
title: 문법은 아는데 잘 짠 코드를 모른다
summary: 변경에 강한 코드의 다섯 기준, 그리고 그중 하나가 Spring DI 와 같은 원리인 이유
versionNote: Java 21 기준
ord: 5
minutes: 29
edges:
  - { to: abstract-vs-interface, type: prerequisite }
  - { to: inheritance, type: prerequisite }
sources:
  - { label: Robert C. Martin - Design Principles and Design Patterns, url: https://staff.cs.utu.fi/~jaakko/SCI-C1010/Martin00.pdf }
  - { label: Oracle Java Tutorials - Interfaces, url: https://docs.oracle.com/javase/tutorial/java/IandI/createinterface.html }
  - { label: Spring Framework - IoC Container, url: https://docs.spring.io/spring-framework/reference/core/beans.html }
---

[[abstract-vs-interface]] 끝에서 본 코드다.

```java file=SyntaxIsNotDesign.java bad label="문법은 맞는데"
class User {
    private String name;
    void save() { /* DB 저장 */ }
    void sendWelcomeEmail() { /* 메일 발송 */ }
    String toJson() { /* 직렬화 */ }
    boolean validatePassword(String p) { /* 검증 */ }
}
```

**컴파일된다. 동작한다.** 캡슐화도 했다.
그런데 **변경 이유가 네 개**다. 그러면 네 가지 이유로 깨진다.

SOLID 는 **"변경에 강하다"를 다섯 기준으로 쪼갠 것**이다.
그리고 마지막 하나(DIP)가 **Spring 의 DI 와 정확히 같은 원리**다.
PART 8 에서 스프링을 만날 때 이미 알고 있어야 한다.

## 0. 들어가기 전에 — 핵심 용어

- **SRP**: 단일 책임. 클래스가 **바뀔 이유가 하나**여야 한다.
- **OCP**: 개방-폐쇄. 확장에 열리고 **수정에 닫힌다.**
- **LSP**: 리스코프 치환. 자식이 **부모를 완전히 대체**할 수 있어야 한다.
- **ISP**: 인터페이스 분리. **안 쓰는 것에 의존하지 않는다.**
- **DIP**: 의존 역전. **추상에 의존하고 구체에 의존하지 않는다.**
- **결합도(coupling)**: 한쪽이 바뀔 때 다른 쪽이 영향받는 정도.

한 줄 그림: **다섯 원칙이 전부 "변경이 번지는 것을 막는" 한 가지 목표를 다른 각도로 본 것이다.**

비유하자면 **건물의 내진 설계**다. 지진(변경)은 반드시 온다.
막을 수 없으니 **흔들림이 전체로 번지지 않게** 만든다.
층을 분리하고(SRP), 증축 가능하게 설계하고(OCP),
부품을 규격화하고(LSP), 필요한 배선만 끌고(ISP),
벽이 아니라 **기둥에 의존**하게 한다(DIP).

## 1. 그전엔 어떻게 했나 — 동작하면 됐다

### 고통 1 — 한 클래스를 여러 이유로 고친다

위의 `User` 클래스다.

```
DB 를 MySQL 에서 PostgreSQL 로 → User 를 고친다
메일을 SendGrid 에서 SES 로    → User 를 고친다
JSON 필드명 규칙이 바뀐다       → User 를 고친다
비밀번호 정책이 강화된다        → User 를 고친다
```

**네 팀이 같은 파일을 고친다.** 머지 충돌이 끊이지 않고,
메일 관련 변경이 **DB 로직을 깨뜨릴 수 있다.**

그리고 테스트가 지옥이 된다. `User` 를 테스트하려면
**DB 와 메일 서버가 필요하다.**

### 고통 2 — 기능을 추가할 때 기존 코드를 고친다

[[polymorphism]] 의 고통 1 이다.

```java file=OpenClosedViolation.java bad label="할인 종류가 늘면"
long calculateDiscount(Order o) {
    if (o.getType() == MEMBER) return o.getTotal() * 5 / 100;
    else if (o.getType() == VIP) return o.getTotal() * 10 / 100;
    // 새 등급이 생기면 여기를 고친다
}
```

**잘 돌던 코드를 건드린다.** 그러면 잘 돌던 것이 깨질 수 있다.
그리고 이 메서드를 호출하는 **모든 곳을 다시 테스트**해야 한다.

### 고통 3 — 자식이 부모 자리에서 터진다

[[inheritance]] 의 고통 6 이다.

```java file=LspViolation.java bad label="치환이 깨진다"
class CheckingAccount extends Account {
    @Override void applyInterest() {
        throw new UnsupportedOperationException();
    }
}

for (Account a : accounts) a.applyInterest();   // 터진다
```

**부모 타입으로 묶은 이득이 사라진다.**
`List<Account>` 를 돌릴 때마다 `instanceof` 로 걸러야 하고,
그러면 [[polymorphism]] 으로 없앴던 타입 분기가 돌아온다.

### 고통 4 — 안 쓰는 메서드를 구현해야 한다

```java file=FatInterface.java bad label="인터페이스가 너무 크다"
interface UserService {
    User find(Long id);
    void save(User u);
    void sendEmail(User u);
    void exportToExcel(List<User> us);
    void syncToLegacySystem(User u);
}

class ReadOnlyUserService implements UserService {
    public User find(Long id) { ... }
    public void save(User u) { throw new UnsupportedOperationException(); }
    public void sendEmail(User u) { throw new UnsupportedOperationException(); }
    // 전부 구현해야 한다
}
```

**쓰지 않는 메서드를 구현한다.** 그리고 고통 3 이 같이 생긴다.

더 나쁜 것은 **의존이 번지는 것**이다.
`find` 만 쓰는 코드가 `UserService` 에 의존하면,
`exportToExcel` 의 시그니처가 바뀔 때 **그 코드도 다시 컴파일**된다.

### 고통 5 — 테스트할 수 없고 바꿀 수 없다

```java file=DipViolation.java bad label="구체 클래스에 묶였다"
class OrderService {
    private MySqlOrderRepository repo = new MySqlOrderRepository();
    private SendGridMailer mailer = new SendGridMailer();

    void placeOrder(Order o) {
        repo.save(o);
        mailer.send(o.getEmail(), "주문 완료");
    }
}
```

**`OrderService` 를 테스트하려면 MySQL 과 SendGrid 가 필요하다.**
단위 테스트가 불가능하고, 메일을 실제로 보낸다.

그리고 **DB 를 바꿀 수 없다.** `OrderService` 코드를 고쳐야 한다.
`new` 가 코드 안에 박혀 있기 때문이다.

다섯 고통의 뿌리는 **하나**다. **변경이 번진다.**
한 곳을 고치면 다른 곳이 깨지고, 그 범위를 예측할 수 없다.

## 2. 이렇게 피해봤다

### 시도 1 — 주석과 문서로 규칙을 적는다

"이 메서드는 DB 로직이니 건드리지 마세요"를 주석으로 적는다.

**컴파일러가 강제하지 않는다.** 주석은 금방 낡고, 새로 온 사람은 안 읽는다.
그리고 **구조가 허용하면 누군가 한다.**

### 시도 2 — 코드 리뷰로 잡는다

**필요하고 효과가 있다.** 다만 **사람에 의존한다.**
리뷰어가 바쁘면 통과하고, 리뷰어가 그 원칙을 모르면 못 잡는다.

그리고 **이미 그렇게 된 코드**는 리뷰로 되돌릴 수 없다.

### 시도 3 — 클래스를 작게 쪼갠다

```java file=TooManyClasses.java bad label="방향은 맞는데 기준이 없다"
class UserNameValidator { }
class UserEmailValidator { }
class UserAgeValidator { }
class UserNameFormatter { }
```

**기준 없이 쪼개면** 클래스가 폭발한다. 파일 50개를 열어야
한 흐름을 읽을 수 있게 된다.

**무엇을 기준으로 쪼갤지**가 필요했다. 그것이 SRP 의 "변경 이유"다.

### 시도 4 — 디자인 패턴을 외워서 적용한다

전략 패턴, 팩토리 패턴, 데코레이터를 외워 쓴다.

**패턴은 결과지 원인이 아니다.** 어떤 고통을 풀려고 그 패턴이 생겼는지를
모르면 **필요 없는 자리에 적용**하게 된다.

```java file=PatternOveruse.java bad label="추상화가 과하다"
interface GreetingStrategy { String greet(); }
class KoreanGreeting implements GreetingStrategy { ... }
class GreetingStrategyFactory { ... }
// "안녕하세요" 를 출력하려고 클래스 셋
```

> 네 시도의 공통점: **기준이 없었다.**
> SOLID 는 그 기준을 다섯 개로 정리한 것이다.

## 3. 그래서 나온 것 — 다섯 가지 기준

다섯 고통과 하나씩 대응된다.

| 고통 | 원칙 | 핵심 질문 |
| --- | --- | --- |
| 여러 이유로 고친다 | **SRP** | 이 클래스가 바뀔 이유가 몇 개인가? |
| 추가할 때 기존을 고친다 | **OCP** | 기능을 추가할 때 기존 코드를 건드리나? |
| 자식이 부모 자리에서 터진다 | **LSP** | 부모를 쓰는 코드가 자식에서도 되나? |
| 안 쓰는 것을 구현한다 | **ISP** | 쓰지 않는 메서드에 의존하고 있나? |
| 테스트·교체가 안 된다 | **DIP** | 구체 클래스를 `new` 하고 있나? |

### SRP — 변경 이유로 쪼갠다

```java file=Srp.java good label="이유마다 클래스"
class User {                         // 도메인. 비즈니스 규칙이 바뀔 때만
    private String name;
    boolean isAdult() { return age >= 19; }
}

interface UserRepository { void save(User u); }     // 저장 방식이 바뀔 때
interface Mailer { void send(String to, String body); }  // 메일 수단이 바뀔 때
class UserJsonMapper { String toJson(User u); }     // 포맷이 바뀔 때
```

**기준이 "변경 이유"**다. 시도 3 의 "기준 없이 쪼개기"와 다른 점이 이것이다.

```
변경 이유 = 요청하는 사람 또는 조직
DB 변경     → 인프라 팀
메일 변경   → 마케팅 팀
포맷 변경   → 프론트엔드 팀
```

**다른 팀이 요청하는 변경은 다른 클래스**로 가는 것이 신호다.

### OCP — 분기 대신 다형성

[[polymorphism]] 에서 이미 봤다.

```java file=Ocp.java good label="추가는 새 클래스로"
interface DiscountPolicy { long discount(Order o); }

class MemberDiscount implements DiscountPolicy {
    public long discount(Order o) { return o.getTotal() * 5 / 100; }
}
class VipDiscount implements DiscountPolicy {
    public long discount(Order o) { return o.getTotal() * 10 / 100; }
}
```

새 등급이 생기면 **클래스를 하나 추가**한다. 기존 코드는 안 건드린다.
이것이 **전략 패턴**이고, 시도 4 의 "패턴은 결과"가 여기서 보인다.

### LSP — 계약을 지킬 수 있는 것만 자식으로

```java file=Lsp.java good label="계층을 다시 나눈다"
abstract class Account {                       // 모든 계좌의 공통만
    abstract void deposit(long a);
}
interface InterestBearing {                    // 이자를 받는 것만
    void applyInterest();
}

class SavingsAccount extends Account implements InterestBearing { ... }
class CheckingAccount extends Account { }      // 이자 메서드가 없다
```

**`applyInterest` 가 공통에서 빠졌다.**
그래서 `UnsupportedOperationException` 을 던질 필요가 없다.

```java file=LspUsage.java
for (Account a : accounts) a.deposit(1000);                 // 전부 안전

accounts.stream()
    .filter(a -> a instanceof InterestBearing)
    .forEach(a -> ((InterestBearing) a).applyInterest());   // 능력으로 고른다
```

타입이 아니라 **능력으로 거른다.** [[abstract-vs-interface]] 의
"인터페이스는 can-do" 가 여기서 쓰인다.

### ISP — 쓰는 만큼만 의존한다

```java file=Isp.java good label="역할별로 쪼갠다"
interface UserReader { User find(Long id); }
interface UserWriter { void save(User u); }

class UserQueryController {
    private final UserReader reader;      // 읽기만 의존한다
}
```

`UserWriter` 가 바뀌어도 `UserQueryController` 는 **영향받지 않는다.**

그리고 **테스트가 쉬워진다.** 가짜 객체를 만들 때
메서드 하나만 구현하면 된다. 고통 4 가 사라진다.

### DIP — 추상에 의존한다

```java file=Dip.java good label="구체를 모른다"
class OrderService {
    private final OrderRepository repo;      // 인터페이스
    private final Mailer mailer;             // 인터페이스

    OrderService(OrderRepository repo, Mailer mailer) {   // 받는다
        this.repo = repo;
        this.mailer = mailer;
    }
}
```

**`new` 가 사라졌다.** 밖에서 넣어준다.

```java file=DipTest.java good label="테스트가 가능해진다"
@Test void placeOrder_저장하고_메일을_보낸다() {
    var repo = new FakeOrderRepository();
    var mailer = new FakeMailer();
    var service = new OrderService(repo, mailer);

    service.placeOrder(order);

    assertThat(repo.saved()).contains(order);
    assertThat(mailer.sent()).hasSize(1);
}
```

**DB 도 메일 서버도 없이 테스트된다.** 고통 5 가 사라진다.

**이것이 Spring DI 와 정확히 같은 원리다.** 4번 섹션에서 본다.

## 4. 어떻게 동작하나 — 왜 "역전"인가

DIP 가 다섯 중 가장 중요하고 가장 오해받는다.
**"역전"이 무엇의 역전인지**를 보면 분명해진다.

```visual
id: solid-dependency-inversion
kind: structure
title: 무엇이 역전되는가
nodes:
  - name: 의존의 방향
    detail: 코드가 서로를 참조하는 방향이다. A 가 B 를 안다면 B 가 바뀔 때 A 가 영향받는다. 그 방향을 어디로 둘지가 설계다
    code: 누가 누구를 아는가
    children:
      - name: 역전 전 — 상위가 하위를 안다
        detail: 자연스러운 방향이다. 주문 서비스가 MySQL 저장소를 직접 만들어 쓴다. 코드를 읽으면 호출 순서대로 적혀 있다
        code: OrderService → MySqlRepository
        children:
          - name: 그래서 생기는 일
            detail: 중요한 비즈니스 로직이 사소한 기술 선택에 묶인다. DB 를 바꾸면 비즈니스 코드를 고친다
            code: 상위가 하위에 끌려다닌다
          - name: 테스트가 안 된다
            detail: new 가 코드 안에 박혀 있어 가짜로 바꿀 방법이 없다. 고통 5 다
            code: 교체 불가
      - name: 추상을 끼운다
        detail: 인터페이스를 중간에 두고 양쪽이 그것을 본다. 이 한 단계가 방향을 바꾼다
        code: OrderRepository (인터페이스)
        children:
          - name: 상위가 추상을 본다
            detail: OrderService 가 OrderRepository 인터페이스에만 의존한다. 구현이 무엇인지 모른다
            code: OrderService → OrderRepository
          - name: 하위도 추상을 본다
            detail: MySqlRepository 가 그 인터페이스를 구현한다. 화살표가 아래에서 위를 향한다. 이것이 역전이다
            code: MySqlRepository → OrderRepository
          - name: 인터페이스는 누구 것인가
            detail: 중요한 지점이다. 상위 모듈이 필요한 것을 정의하므로 인터페이스는 상위 쪽에 속한다. 저장소 패키지가 아니라 도메인 패키지에 둔다
            code: 상위 모듈의 소유
      - name: 역전 후 — 양쪽이 추상을 안다
        detail: 비즈니스 로직이 기술 선택을 모른다. 기술을 바꿔도 비즈니스 코드가 안 바뀐다
        code: 화살표가 안쪽을 향한다
        children:
          - name: 교체가 가능해진다
            detail: PostgreSQL 구현을 새로 만들고 주입만 바꾼다. OrderService 는 한 글자도 안 바뀐다
            code: 구현 교체
          - name: 테스트가 가능해진다
            detail: 가짜 구현을 넣는다. DB 없이 비즈니스 로직만 검증한다
            code: 가짜 주입
          - name: 그런데 누가 주입하나
            detail: 이 질문이 남는다. 밖에서 넣어준다고 했는데 그 밖이 어디인가. 그것이 PART 8 의 주제다
            code: 조립하는 주체가 필요하다
```

### 마지막 질문 — 누가 넣어주나

DIP 를 적용하면 **새 문제**가 생긴다.

```java file=WhoAssembles.java bad label="조립 코드가 어딘가 있어야 한다"
public static void main(String[] args) {
    var repo = new MySqlOrderRepository(dataSource);
    var mailer = new SesMailer(awsClient);
    var service = new OrderService(repo, mailer);
    var controller = new OrderController(service);
    // 클래스가 100개면?
}
```

**`new` 가 사라진 것이 아니라 한 곳에 모인 것**이다.
그리고 그 한 곳이 **거대해진다.**

```
클래스 100개 → 조립 코드 수백 줄
의존 순서를 사람이 맞춰야 한다
하나 바뀌면 조립 코드를 고친다
```

이 고통이 **IoC 컨테이너**를 부른다.
**조립을 프레임워크가 대신**하는 것이고, 그것이 Spring 이다.

```java file=SpringDi.java good label="PART 8 에서 만날 것"
@Service
class OrderService {
    private final OrderRepository repo;
    OrderService(OrderRepository repo) { this.repo = repo; }   // 같은 코드
}
```

**`OrderService` 의 코드가 똑같다.** 달라진 것은
**누가 `new` 를 하고 누가 넣어주는가**뿐이다.

**Spring 이 DIP 를 발명한 것이 아니다.** DIP 를 쓰기 쉽게 만든 것이다.
그래서 이 글을 알고 PART 8 에 가면 "왜 DI 인가"가 이미 답되어 있다.

### 다섯 원칙의 관계

```visual
id: solid-relationships
kind: step
title: 다섯 원칙이 서로를 어떻게 돕나
steps:
  - name: SRP 로 쪼갠다
    detail: 변경 이유로 클래스를 나눈다. 이것이 출발점이고 나머지 넷이 올라앉을 바닥이다. 쪼개지 않으면 다른 원칙을 적용할 자리가 없다
    code: 변경 이유 하나당 클래스 하나
  - name: 쪼갠 것들을 어떻게 잇나 — 인터페이스가 필요해진다
    detail: 클래스가 서로를 직접 알면 결합이 생긴다. 그래서 사이에 추상을 둔다. 여기서 ISP 와 DIP 가 등장한다
    code: 사이에 추상을 둔다
  - name: ISP 로 그 인터페이스를 작게 만든다
    detail: 추상을 뒀는데 그것이 크면 의미가 줄어든다. 쓰는 만큼만 의존하도록 역할별로 자른다
    code: 역할별로 자른다
  - name: DIP 로 방향을 바꾼다
    detail: 상위가 하위를 아는 대신 둘 다 추상을 보게 한다. 비즈니스 로직이 기술 선택에서 분리된다
    code: 양쪽이 추상을 본다
  - name: OCP 는 그 결과로 따라온다
    detail: 추상에 의존하고 있으면 새 구현을 추가하는 것으로 기능이 확장된다. 기존 코드를 안 건드린다. OCP 는 목표이고 DIP 가 수단이다
    code: 추가로 확장된다
  - name: LSP 가 그 전제를 지킨다
    detail: 새 구현이 계약을 지키지 않으면 OCP 가 무너진다. 추가했는데 기존 코드가 깨지기 때문이다. LSP 는 다형성이 성립하는 조건이다
    code: 계약을 지켜야 성립한다
  - name: 그래서 전부 한 목표를 향한다
    detail: 변경이 번지지 않게 하는 것이다. 다섯 개를 각각 외우는 것이 아니라 그 목표에서 각 원칙을 되짚으면 기억할 것이 줄어든다
    code: 변경을 국소화한다
```

### 어디까지 적용할까

```visual
id: solid-how-far
kind: playground
title: 이 경우 원칙을 적용할까
inputs:
  - { name: 상황, label: 상황, options: [한 번 쓰고 버릴 스크립트, 요구사항이 자주 바뀐다, 외부 시스템에 붙는다, 팀이 여러 개다, 아직 요구사항을 모른다] }
  - { name: 원칙, label: 어느 원칙, options: [SRP, OCP, DIP, 전부] }
outcomes:
  - when: { 상황: 한 번 쓰고 버릴 스크립트, 원칙: 전부 }
    result: 적용하지 않는다. 변경이 없으면 변경에 강할 필요도 없다
    note: SOLID 는 변경 비용을 줄이는 투자다. 변경이 없으면 투자 회수가 안 된다. 과한 추상화가 시도 4 의 문제다
  - when: { 상황: 요구사항이 자주 바뀐다, 원칙: OCP }
    result: 효과가 크다. 어느 축으로 바뀌는지 보고 그 축을 추상화한다
    note: 모든 축을 추상화하면 코드가 읽히지 않는다. 실제로 바뀌는 축이 무엇인지는 두세 번 바뀌어 본 뒤에야 안다
  - when: { 상황: 외부 시스템에 붙는다, 원칙: DIP }
    result: 거의 항상 적용한다. DB, 메일, 결제, 외부 API 가 전부 해당한다
    note: 테스트 가능성이 가장 큰 이득이다. 외부 시스템 없이 비즈니스 로직을 검증할 수 있게 된다
  - when: { 상황: 팀이 여러 개다, 원칙: SRP }
    result: 변경 이유를 팀 경계로 보면 쪼갤 선이 보인다. 머지 충돌이 줄어든다
    note: 같은 파일을 네 팀이 고치는 것이 고통 1 이다. 팀이 다르면 변경 이유가 다르다는 신호다
  - when: { 상황: 아직 요구사항을 모른다, 원칙: 전부 }
    result: SRP 만 지키고 나머지는 나중에 한다. 추상화는 변경 축을 알고 나서 넣는다
    note: 모르는 축을 추상화하면 틀린 추상화가 된다. 틀린 추상화는 추상화가 없는 것보다 고치기 어렵다
  - when: { 상황: 요구사항이 자주 바뀐다, 원칙: DIP }
    result: 바뀌는 부분이 외부 의존이면 적용한다. 비즈니스 규칙 자체가 바뀌는 것이면 OCP 를 본다
    note: 두 원칙이 다른 종류의 변경을 다룬다. 무엇이 바뀌는지 먼저 가린다
  - when: { 원칙: SRP }
    result: 거의 모든 경우에 이득이다. 쪼개는 기준이 명확하므로 과하게 쪼갤 위험도 낮다
    note: 변경 이유라는 기준이 있어 시도 3 의 무기준 쪼개기와 다르다. 다섯 중 가장 먼저 익힐 것이다
```

**"아직 요구사항을 모를 때 추상화하지 않는다"**가 중요하다.
**틀린 추상화는 없는 것보다 고치기 어렵다.**

## 5. 이것도 끝이 아니다 — PART 1 이 여기서 끝난다

다섯 글을 묶으면 이렇게 된다.

```
procedural-to-oop     상태와 행동을 묶어 변경 경로를 가둔다
inheritance           공통을 올려 중복을 없애지만 결합이 생긴다
polymorphism          타입 분기를 없애고 확장을 열어둔다
abstract-vs-interface 상태가 필요하면 클래스, 능력이면 인터페이스
solid                 변경이 번지지 않게 하는 다섯 기준
```

전부 **"변경"**에 관한 이야기였다.
객체지향은 **코드를 아름답게 만드는 것이 아니라 바꾸기 쉽게 만드는 것**이다.

그런데 지금까지 **"어떻게 쓰는가"**만 봤다.
**"어떻게 동작하는가"**는 한 번도 안 봤다.

```java file=WhatHappensHere.java
Account a = new SavingsAccount();
```

이 한 줄에서 무슨 일이 일어나는가.

```
객체는 어디에 만들어지나
a 라는 참조는 어디에 있나
new 한 것을 안 지우는데 언제 사라지나
String s = "hello" 와 new String("hello") 가 왜 다른가
```

[[polymorphism]] 에서 **"메서드 테이블"**과 **"invokevirtual"**을 언급하고 넘어갔다.
그것이 어디 있고 어떻게 동작하는가.

그리고 실무에서 이런 오류를 만난다.

```
java.lang.OutOfMemoryError: Java heap space
java.lang.StackOverflowError
```

**둘이 왜 다른 이름인가.** 어디가 찬 것인가.

PART 2 에서 **JVM 메모리 모델**로 간다.
문법 위에서 설계를 봤으니, 이제 **문법 아래**를 본다.

## 자기 점검

- 클래스를 쪼개는 기준이 "변경 이유"인 것이 왜 "기능"보다 나은가?
- DIP 에서 역전되는 것은 무엇인가? 인터페이스는 누구의 것인가?
- LSP 가 깨지면 왜 다형성도 깨지는가?
- DIP 와 DI(의존성 주입)의 관계는? Spring 이 발명한 것은 무엇인가?
- 요구사항을 아직 모를 때 추상화하지 않는 이유는?

## 덧 — 흔한 오해

### "SRP 는 클래스가 메서드 하나만 가져야 한다는 뜻이다"

**변경 이유가 하나**라는 뜻이다. 메서드 수와 무관하다.

```java file=SrpNotAboutSize.java good label="메서드가 많아도 SRP 를 지킨다"
class Money {
    Money plus(Money other) { ... }
    Money minus(Money other) { ... }
    Money times(int n) { ... }
    boolean isGreaterThan(Money other) { ... }
    String format(Locale l) { ... }
}
```

메서드가 다섯 개지만 **바뀔 이유는 하나**다. 금액 계산 규칙이다.

반대로 메서드가 두 개인데 SRP 를 위반할 수도 있다.

```java file=TwoMethodsViolation.java bad label="메서드 둘인데 이유가 둘"
class Report {
    String generate() { ... }     // 보고서 내용이 바뀔 때
    void sendByEmail() { ... }    // 메일 수단이 바뀔 때
}
```

**세는 것은 메서드가 아니라 "이 클래스를 고치라고 요청할 사람의 수"**다.

### "OCP 를 지키려면 모든 것을 인터페이스로 만들어야 한다"

**바뀌는 축만** 추상화한다. 전부 하면 읽히지 않는다.

```java file=OverAbstraction.java bad label="바뀌지 않는 것까지 추상화"
interface StringFormatter { String format(String s); }
interface NumberParser { int parse(String s); }
interface ListFactory { <T> List<T> create(); }
// 한 번도 교체된 적이 없는 것들
```

**세 번 규칙**이 실용적이다. 같은 종류의 변경이 **세 번째** 올 때
추상화한다. 그때쯤이면 **어느 축으로 바뀌는지** 알게 된다.

그리고 **YAGNI** 와 충돌하는 지점이다.
"필요할 것 같아서" 만든 추상화가 **쓰이지 않고 남는 경우가 많다.**

### "SOLID 를 지키면 좋은 코드다"

**필요조건이고 충분조건이 아니다.** 그리고 **목적이 아니라 수단**이다.

```
SOLID 가 해주는 것   : 변경 비용을 낮춘다
안 해주는 것        : 성능, 가독성, 정확성, 요구사항 충족
```

SOLID 를 완벽히 지키면서 **느리고 읽기 어렵고 틀린 코드**를 쓸 수 있다.

그리고 **대립하는 경우**가 있다.

```
SRP 를 극단적으로 → 클래스가 폭발해 가독성이 떨어진다
DIP 를 극단적으로 → 간접 호출이 늘어 추적이 어려워진다
OCP 를 극단적으로 → 쓰지 않는 확장점이 복잡도만 만든다
```

**판단이 필요하다.** 원칙은 **생각의 도구**고, 체크리스트가 아니다.
"이 코드는 SRP 를 위반했으니 나쁘다"보다
**"이 코드는 세 팀이 같은 파일을 고쳐서 아프다"**가 더 유용한 말이다.
