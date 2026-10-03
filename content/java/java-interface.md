---
title: 인터페이스
summary: 구현 없이 "무엇을 할 수 있는가"만 약속하는 타입
versionNote: Java 21 기준
ord: 1
minutes: { intro: 5, standard: 18 }
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
    private final MySqlUserRepository repo = new MySqlUserRepository();
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
