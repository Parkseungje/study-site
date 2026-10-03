---
title: Dependency Injection
summary: 객체가 필요한 의존성을 직접 생성하지 않고 외부에서 받는 방식
versionNote: Spring Boot 3.2 기준
ord: 1
minutes: { intro: 5, standard: 20, deep: 32 }
edges:
  - { to: java-interface, type: prerequisite }
  - { to: spring-ioc, type: deepens }
sources:
  - { label: Spring 공식 문서 - IoC Container, url: https://docs.spring.io/spring-framework/reference/core/beans.html }
---

# intro

객체가 일할 때 필요한 다른 객체를 **직접 만들지 않고 밖에서 받는** 방식이다.

```java file=UserService.java bad label="직접 생성"
public class UserService {
    private final UserRepository repo
            = new UserRepository();
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
    private final UserRepository repo
            = new MySqlUserRepository();

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

# deep

## 생성자가 여러 개면 무엇을 고르는가

규칙이 셋이고, 위에서부터 적용된다.

| 상황 | 컨테이너의 선택 |
| --- | --- |
| 생성자가 하나 | 그것. `@Autowired` 없어도 된다 |
| `@Autowired` 붙은 게 하나 | 그것 |
| 여럿인데 표시가 없음 | 기본 생성자를 찾는다. 없으면 실패 |

생성자가 하나면 애노테이션이 필요 없다는 점이 Spring 4.3 부터의 변화다.
그래서 요즘 코드에 `@Autowired` 가 잘 안 보인다.

```java file=OrderService.java
@Service
public class OrderService {
    private final PaymentGateway gateway;

    // 생성자가 이것뿐이라 @Autowired 가 없어도 주입된다
    public OrderService(PaymentGateway gateway) {
        this.gateway = gateway;
    }
}
```

Lombok 의 `@RequiredArgsConstructor` 가 널리 쓰이는 이유도 이것이다.
`final` 필드만 받는 생성자를 하나 만들어주면 끝이다.

## 없을 수도 있는 의존성

주입 대상이 없으면 기본적으로 기동이 실패한다. 선택적으로 만드는 방법이 셋이다.

```java file=Optional.java
// 1. 없으면 null
@Autowired(required = false)
private MetricsCollector metrics;

// 2. 없으면 비어 있는 Optional
public OrderService(Optional<MetricsCollector> metrics) { }

// 3. 필요할 때 꺼낸다. 늦게 평가된다
public OrderService(ObjectProvider<MetricsCollector> metrics) {
    this.metrics = metrics.getIfAvailable(NoOpCollector::new);
}
```

`ObjectProvider` 가 가장 유연하다. 조회를 **쓰는 시점까지 미루므로** 순환 참조를 끊는
데도 쓰인다. 다만 코드가 Spring 타입에 묶인다.

## 같은 타입을 전부 받기

타입이 여럿일 때 하나를 고르는 대신 **다 받을 수도** 있다.

```java file=Notifier.java highlight=3-6
@Service
public class NotificationService {
    private final List<Notifier> notifiers;        // 구현체 전부
    private final Map<String, Notifier> byName;    // 빈 이름 → 구현체

    public NotificationService(List<Notifier> notifiers,
                               Map<String, Notifier> byName) {
        this.notifiers = notifiers;
        this.byName = byName;
    }
}
```

전략 패턴을 쓸 때 편하다. 구현체를 하나 추가하면 **코드를 안 고쳐도** 목록에 들어온다.
순서가 중요하면 구현체에 `@Order` 를 붙인다. 안 붙이면 순서가 보장되지 않는다.

## 순환 참조는 왜 생성자에서만 막히는가

[[spring-ioc]] 는 싱글톤을 만들면서 캐시를 세 단계로 둔다.

| 캐시 | 담기는 것 |
| --- | --- |
| `singletonObjects` | 완성된 빈 |
| `earlySingletonObjects` | 주입은 아직인, 만들어지기만 한 빈 |
| `singletonFactories` | 그 미완성 빈을 꺼낼 수 있는 팩토리 |

세터·필드 주입이면 **객체를 먼저 만들고** 미완성 상태를 두 번째 캐시에 올려둔다.
상대가 그걸 집어가면 순환이 풀린다.

생성자 주입은 그게 안 된다. **객체를 만들려면 상대가 이미 있어야 하므로**
미완성 상태 자체가 존재할 수 없다. 그래서 생성자 순환만 기동을 세운다.

```
세터 주입 : A 생성 → 캐시 등록 → B 생성 → B 가 A 집어감 → A 에 B 주입  ✅
생성자 주입: A 생성하려면 B 필요 → B 생성하려면 A 필요 → 막힘          ❌
```

이게 "생성자 주입을 쓰면 순환 참조를 기동 시점에 발견한다"는 말의 실체다.
세터 주입은 순환을 **숨긴다**. 못 고치는 게 아니라 안 보이게 만드는 것이다.

## @Lazy 가 하는 일

`@Lazy` 를 주입 지점에 붙이면 **진짜 객체 대신 프록시**가 들어간다.
실제 조회는 그 프록시의 메서드가 처음 불릴 때 일어난다.

```java file=Lazy.java highlight=3
@Service
public class OrderService {
    public OrderService(@Lazy PaymentService payment) { ... }
}
```

생성 시점에는 프록시만 받으므로 순환이 깨진다. 동작은 한다.

그런데 이건 **설계 문제를 런타임으로 미루는 것**이다. 두 서비스가 서로를 필요로 한다는
사실은 그대로다. 공유 로직을 제3의 클래스로 빼는 쪽이 대개 맞다.
`@Lazy` 는 외부 라이브러리 빈처럼 **내가 못 고치는 쪽**에만 쓴다.

## 테스트에서 주입을 갈아끼우기

생성자 주입의 값어치가 가장 크게 드러나는 자리다.

```java file=OrderServiceTest.java good label="컨테이너 없이"
var service = new OrderService(new FakeGateway());
assertThat(service.place(order)).isEqualTo(APPROVED);
```

```java file=OrderServiceTest.java bad label="컨테이너를 띄워야"
@SpringBootTest
class OrderServiceTest {
    @MockitoBean PaymentGateway gateway;   // 컨텍스트 기동 수 초
    @Autowired OrderService service;
}
```

위쪽은 밀리초, 아래쪽은 수 초다. 테스트가 수백 개가 되면 차이가 분 단위로 벌어진다.
필드 주입을 쓰면 **위쪽 방식 자체가 불가능해진다.**

`@MockitoBean` 은 Spring Boot 3.4 부터의 이름이다. 그 전에는 `@MockBean` 이었다.
