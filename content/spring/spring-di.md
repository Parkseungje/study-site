---
title: Dependency Injection
summary: 객체가 필요한 의존성을 직접 생성하지 않고 외부에서 받는 방식
versionNote: Spring Boot 3.2 기준
ord: 1
minutes: { intro: 5, standard: 20 }
edges:
  - { to: spring-ioc, type: deepens }
sources:
  - { label: Spring 공식 문서 - IoC Container, url: https://docs.spring.io/spring-framework/reference/core/beans.html }
---

# intro

객체가 일할 때 필요한 다른 객체를 **직접 만들지 않고 밖에서 받는** 방식이다.

```java file=UserService.java bad label="직접 생성"
public class UserService {
    private final UserRepository repo = new UserRepository();
}
```

```java file=UserService.java good label="주입받기"
public class UserService {
    private final UserRepository repo;

    public UserService(UserRepository repo) {
        this.repo = repo;
    }
}
```

차이는 한 줄이지만, 아래쪽은 `UserService` 가 `UserRepository` 를 **고르지 않는다**.
누가 넣어줄지는 밖에서 정한다. 이게 전부다.

# standard

## 직접 new 하면 무엇이 곤란한가

`new` 로 박아두면 그 조합이 코드에 고정된다. 바꾸려면 코드를 고쳐야 한다.

```java file=UserService.java bad highlight=2
public class UserService {
    private final UserRepository repo = new MySqlUserRepository();

    public User find(Long id) {
        return repo.findById(id);
    }
}
```

테스트에서 가짜 저장소를 쓰고 싶어도 끼워 넣을 자리가 없다. `UserService` 를 만드는
순간 `MySqlUserRepository` 도 같이 만들어지기 때문이다. DB 없이는 이 클래스를
테스트할 수 없다.

## 주입의 세 가지 방식

받는 통로는 세 가지다.

```java file=Injection.java highlight=2,5,8
// 1. 생성자 주입
public UserService(UserRepository repo) { this.repo = repo; }

// 2. 세터 주입
public void setRepo(UserRepository repo) { this.repo = repo; }

// 3. 필드 주입
@Autowired private UserRepository repo;
```

필드 주입이 가장 짧아 보이지만 권장되지 않는다. 다음 절에서 이유를 본다.

## 생성자 주입을 권장하는 이유

세 가지다.

- **final 을 붙일 수 있다.** 생성 후에 바뀌지 않는다는 걸 컴파일러가 보장한다.
- **필수 의존성이 드러난다.** 생성자 시그니처만 보면 이 객체가 뭘 필요로 하는지 안다.
- **프레임워크 없이 테스트된다.** `new UserService(fakeRepo)` 로 끝난다.

필드 주입은 셋 다 안 된다. `@Autowired` 필드는 리플렉션으로 채워지므로
스프링 컨테이너 없이는 객체가 반쪽짜리로 만들어진다.

## 컨테이너가 하는 일

누가 주입하는가. [[spring-ioc]] 가 한다. 애플리케이션이 뜰 때 컨테이너가
객체들을 만들고, 생성자가 요구하는 타입을 찾아 넣어준다.

```visual
id: spring-di-wiring
kind: step
title: 컨테이너가 의존성을 연결하는 순서
steps:
  - name: 후보 수집
    detail: "@Component 가 붙은 클래스를 전부 찾는다"
  - name: 생성 순서 계산
    detail: 생성자가 요구하는 타입을 보고 먼저 만들 것부터 정렬한다
  - name: 인스턴스화와 주입
    detail: 의존성이 준비된 것부터 생성자를 호출한다
    code: new UserService(userRepository)
  - name: 컨테이너에 보관
    detail: 이후 같은 타입을 요구하면 이 인스턴스를 그대로 건넨다
```

## 순환 참조가 생길 때

A 가 B 를, B 가 A 를 생성자로 요구하면 어느 쪽도 먼저 만들 수 없다.
Spring Boot 2.6 부터는 이 경우 기동 자체가 실패한다.

```java file=CircularReference.java fold
// A 가 B 를 요구하고
@Service
public class OrderService {
    private final PaymentService payment;
    public OrderService(PaymentService payment) {
        this.payment = payment;
    }
}

// B 가 다시 A 를 요구한다
@Service
public class PaymentService {
    private final OrderService order;
    public PaymentService(OrderService order) {
        this.order = order;
    }
}

// 기동 시:
// The dependencies of some of the beans in the application context
// form a cycle
```

고치는 방법은 보통 셋 중 하나다. 한쪽을 세터 주입으로 바꾸거나, `@Lazy` 를 붙이거나,
둘이 공유하는 로직을 제3의 클래스로 빼는 것이다. 앞의 둘은 증상만 가리므로
세 번째가 대개 맞다.
