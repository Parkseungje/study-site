---
title: 인터페이스
summary: 구현 없이 "무엇을 할 수 있는가"만 약속하는 타입
versionNote: Java 21 기준
ord: 1
minutes: { intro: 5, standard: 18, deep: 30 }
sources:
  - { label: Java Language Specification - Interfaces, url: https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html }
---

# intro

인터페이스는 **할 수 있는 일의 목록**이다. 어떻게 하는지는 적지 않는다.

```java file=UserRepository.java
public interface UserRepository {
    User findById(Long id);
    void save(User user);
}
```

이걸 구현한 클래스는 저 두 메서드를 반드시 갖는다.

```java file=MySqlUserRepository.java
public class MySqlUserRepository implements UserRepository {
    public User findById(Long id) { /* SQL 조회 */ return null; }
    public void save(User user) { /* SQL 저장 */ }
}
```

쓰는 쪽은 `UserRepository` 타입으로만 받는다. MySQL 을 쓰는지 메모리를 쓰는지 몰라도 된다.
이 "몰라도 된다"가 인터페이스의 전부다.

# standard

## 왜 구현을 숨기는가

구체 클래스에 직접 붙으면 그 클래스를 바꿀 때 쓰는 쪽까지 따라 바뀐다.

```java file=OrderService.java bad label="구체 클래스에 직접"
public class OrderService {
    private final MySqlUserRepository repo
            = new MySqlUserRepository();
}
```

```java file=OrderService.java good label="인터페이스로"
public class OrderService {
    private final UserRepository repo;

    public OrderService(UserRepository repo) {
        this.repo = repo;
    }
}
```

아래쪽은 테스트에서 가짜 구현을 넣을 수 있다. 이게 [[spring-di]] 가 성립하는 전제다.
주입할 자리가 타입으로 열려 있어야 컨테이너가 끼워 넣을 수 있다.

## 추상 클래스와 무엇이 다른가

둘 다 "미완성 타입"이지만 쓰는 목적이 다르다.

| 구분 | 인터페이스 | 추상 클래스 |
| --- | --- | --- |
| 다중 상속 | 여러 개 구현 가능 | 하나만 상속 |
| 상태(필드) | 상수만 | 인스턴스 필드 가능 |
| 생성자 | 없음 | 있음 |
| 묻는 것 | "무엇을 할 수 있나" | "무엇인가" |

`Comparable`, `Runnable` 처럼 **역할**을 나타내면 인터페이스다.
`AbstractList` 처럼 공통 구현을 물려주려면 추상 클래스다.

## default 메서드

Java 8 부터 인터페이스가 구현을 가질 수 있다.

```java file=UserRepository.java highlight=4-6
public interface UserRepository {
    User findById(Long id);

    default boolean exists(Long id) {
        return findById(id) != null;
    }
}
```

이게 생긴 이유는 **기존 인터페이스에 메서드를 추가하기 위해서**다.
`List` 에 `forEach` 를 그냥 추가했다면 세상의 모든 구현체가 컴파일 에러를 냈을 것이다.
default 를 붙이면 기존 구현체는 손대지 않아도 된다.

남용하면 인터페이스가 추상 클래스처럼 뚱뚱해진다. 편의 메서드 정도로 끝내는 게 좋다.

## 함수형 인터페이스

추상 메서드가 **하나뿐인** 인터페이스는 람다로 쓸 수 있다.

```java file=Functional.java
@FunctionalInterface
public interface Validator {
    boolean test(String input);
}

Validator notEmpty = s -> !s.isBlank();
```

`@FunctionalInterface` 는 강제가 아니라 확인용이다. 붙여두면 나중에 누가 추상 메서드를
하나 더 넣을 때 컴파일이 막힌다.

## 인터페이스를 언제 만들지 말아야 하나

구현체가 하나뿐이고 앞으로도 하나일 것 같으면 만들지 않는 편이 낫다.

`UserService` 와 `UserServiceImpl` 쌍이 그 예다. 파일이 둘로 늘고 추적만 번거로워진다.
Spring 은 구체 클래스도 프록시로 감쌀 수 있어서, 인터페이스가 없다고 [[spring-aop]] 가
막히지도 않는다.

인터페이스를 만드는 기준은 "구현이 바뀔 여지가 실제로 있는가" 하나다.
저장소, 외부 API 클라이언트, 알림 발송처럼 **갈아끼울 이유가 보이는 곳**에 둔다.

# deep

## default 메서드가 충돌할 때

인터페이스 둘을 구현했는데 같은 시그니처의 default 메서드가 양쪽에 있으면
컴파일이 막힌다. 다중 상속의 다이아몬드 문제가 default 메서드로 돌아온 것이다.

```java file=Diamond.java highlight=9-12
interface Walker {
    default String move() { return "걷는다"; }
}
interface Swimmer {
    default String move() { return "헤엄친다"; }
}

// class inherits unrelated defaults for move()
class Duck implements Walker, Swimmer {
    @Override
    public String move() {
        return Walker.super.move();   // 어느 쪽인지 직접 고른다
    }
}
```

`인터페이스이름.super.메서드()` 로 지목한다. 컴파일러가 알아서 고르지 않고
**반드시 사람이 정하게** 만든 것이 설계 의도다.

클래스와 인터페이스가 충돌하면 규칙이 다르다. **클래스가 항상 이긴다.**
상위 클래스에 `move()` 가 있으면 인터페이스의 default 는 무시되고 오류도 안 난다.
이쪽이 더 위험하다. 조용히 동작이 바뀐다.

## 인터페이스 안의 네 가지 메서드

Java 9 부터 private 메서드까지 들어와, 인터페이스가 가질 수 있는 멤버가 늘었다.

| 종류 | 호출 주체 | 쓰는 곳 |
| --- | --- | --- |
| `abstract` | 구현체가 구현 | 본래의 계약 |
| `default` | 인스턴스 | 기존 구현체를 안 깨고 메서드 추가 |
| `static` | 인터페이스 자신 | 팩토리, 유틸리티 |
| `private` | 같은 인터페이스 안에서만 | default 끼리 공통 코드 |

```java file=Validator.java
public interface Validator {
    boolean test(String input);

    static Validator notBlank() {          // 팩토리
        return s -> s != null && !s.isBlank();
    }

    default Validator and(Validator other) {
        return s -> check(s) && other.test(s);
    }

    private boolean check(String s) {      // default 들이 쓰는 공통 조각
        return test(s);
    }
}
```

`static` 팩토리를 인터페이스에 두면 `XxxUtils` 클래스를 따로 만들 일이 줄어든다.
`Comparator.comparing`, `List.of` 가 그 방식이다.

## sealed: 구현체를 내가 정한다

Java 17 부터 **누가 구현할 수 있는지**를 인터페이스가 제한할 수 있다.

```java file=Payment.java
public sealed interface Payment
        permits CardPayment, BankTransfer, Voucher { }

public record CardPayment(String cardNo) implements Payment { }
public record BankTransfer(String account) implements Payment { }
public record Voucher(String code) implements Payment { }
```

이러면 `switch` 에서 **모든 경우를 다뤘는지 컴파일러가 검사한다.**

```java file=PaymentHandler.java highlight=2-6
String describe(Payment p) {
    return switch (p) {                       // default 가 없어도 된다
        case CardPayment c -> "카드 " + c.cardNo();
        case BankTransfer b -> "계좌 " + b.account();
        case Voucher v -> "상품권 " + v.code();
    };
}
```

나중에 `Payment` 구현체를 하나 더 추가하면 이 `switch` 가 **컴파일 에러**로 알려준다.
`default:` 로 뭉개면 새 타입이 조용히 그리로 빠지는데, sealed 는 그걸 막는다.

열려 있어야 하는 확장 지점(저장소, 플러그인)에는 쓰면 안 된다.
**경우의 수가 닫혀 있는 도메인**에만 쓴다.

## 호출은 어떻게 찾아가는가

클래스 메서드 호출은 `invokevirtual`, 인터페이스는 `invokeinterface` 바이트코드를 쓴다.
둘이 다른 이유는 **메서드를 찾는 방식**이 다르기 때문이다.

클래스는 상속이 한 줄이라 메서드 테이블에서 **같은 위치**가 보장된다. 인덱스로 바로 간다.
인터페이스는 한 클래스가 여럿을 구현할 수 있어 위치가 클래스마다 다르다.
그래서 별도 테이블(itable)을 뒤져야 한다.

예전에는 이 차이가 성능 문제로 거론됐다. **지금은 거의 의미 없다.**
JIT 가 호출 지점에서 실제 타입이 하나뿐인 것을 보면 그 자리를 직접 호출로 바꾼다.
구현체가 둘셋이어도 분기로 처리한다. 넷 이상으로 늘어나야 테이블 조회로 돌아간다.

성능 때문에 인터페이스를 피할 이유는 없다는 뜻이다.

## 마커 인터페이스는 이제 쓰지 않는다

메서드가 없는 인터페이스로 "이 타입은 이런 성질이 있다"를 표시하던 방식이 있다.
`Serializable`, `Cloneable` 이 그것이다.

지금은 애노테이션이 그 자리를 대신한다. 다만 **타입으로 쓸 수 있다는 점**은
마커 인터페이스만 가진 장점이다.

```java file=Marker.java
void save(Serializable obj) { }   // 컴파일 시점에 걸러진다

void save(Object obj) {           // 애노테이션은 런타임에야 확인한다
    if (!obj.getClass().isAnnotationPresent(Storable.class)) throw ...;
}
```

컴파일러가 막아주길 원하면 마커 인터페이스, 메타데이터만 붙이려면 애노테이션이다.
새로 만들 일은 드물지만 `Serializable` 을 볼 때 왜 저렇게 생겼는지는 설명된다.
