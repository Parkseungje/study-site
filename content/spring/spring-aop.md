---
title: AOP
summary: 여러 곳에 흩어지는 공통 처리를 원본 코드를 건드리지 않고 끼워 넣는 방식
versionNote: Spring Boot 3.2 기준
ord: 4
minutes: { intro: 5, standard: 20, deep: 35 }
edges:
  - { to: spring-ioc, type: prerequisite }
  - { to: spring-bean-lifecycle, type: related }
sources:
  - { label: Spring 공식 문서 - Aspect Oriented Programming, url: https://docs.spring.io/spring-framework/reference/core/aop.html }
  - { label: Spring 공식 문서 - Proxying Mechanisms, url: https://docs.spring.io/spring-framework/reference/core/aop/proxying.html }
---

# intro

AOP 는 Aspect Oriented Programming, **관점 지향 프로그래밍**이다.
로깅·트랜잭션처럼 **여기저기 똑같이 반복되는 처리**를 한 곳에 모은다.

```java file=OrderService.java bad label="공통 처리가 섞임"
public void placeOrder(Order order) {
    long start = System.currentTimeMillis();
    repository.save(order);
    log.info("걸린 시간 {}ms", System.currentTimeMillis() - start);
}
```

```java file=OrderService.java good label="본래 할 일만"
@Timed
public void placeOrder(Order order) {
    repository.save(order);
}
```

아래쪽에는 측정 코드가 없다. 대신 `@Timed` 를 보고 Spring 이 **메서드 호출을 가로채**
앞뒤로 시간을 잰다. 원본 코드는 자기 할 일만 한다.

# standard

## 용어 네 개

| 용어 | 뜻 |
| --- | --- |
| Aspect | 끼워 넣을 공통 처리 묶음. 클래스 하나 |
| Advice | 실제로 할 일. 메서드 하나 |
| Pointcut | 어디에 끼울지 고르는 조건 |
| Join Point | 끼울 수 있는 지점. Spring AOP 에서는 **메서드 호출**뿐 |

마지막이 중요하다. AspectJ 는 필드 접근이나 생성자까지 가로챌 수 있지만,
**Spring AOP 는 메서드 호출만** 가로챈다. 필요한 경우의 대부분은 이걸로 충분하다.

```java file=TimedAspect.java highlight=4,6
@Aspect
@Component
public class TimedAspect {
    @Around("@annotation(Timed)")
    public Object measure(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        try {
            return pjp.proceed();
        } finally {
            log.info("{} {}ms", pjp.getSignature(), System.currentTimeMillis() - start);
        }
    }
}
```

`@Around` 가 advice 종류, 괄호 안이 pointcut, 클래스 전체가 aspect 다.

## Advice 종류

| 종류 | 도는 시점 | 비고 |
| --- | --- | --- |
| `@Before` | 메서드 전 | 막을 수는 없다 |
| `@AfterReturning` | 정상 반환 후 | 반환값을 볼 수 있다 |
| `@AfterThrowing` | 예외가 나간 뒤 | 예외를 볼 수 있다 |
| `@After` | 정상·예외 무관하게 끝 | `finally` 에 해당 |
| `@Around` | 전부 감쌈 | 가장 강력. `proceed()` 를 안 부르면 원본이 안 돈다 |

`@Around` 하나로 나머지를 다 흉내낼 수 있지만, 할 일이 단순하면 좁은 것을 쓰는 게 낫다.
`@Before` 면 "아, 앞에서만 뭔가 하는구나"가 읽는 즉시 보인다.

## 어떻게 가로채는가: 프록시

Spring 은 원본 객체를 **프록시로 감싼다.** 주입받는 쪽은 원본이 아니라 프록시를 받는다.

```visual
id: spring-aop-proxy
kind: step
title: 주입받은 객체는 원본이 아니라 프록시다
steps:
  - name: 원본 생성
    detail: 컨테이너가 OrderService 를 평소대로 만든다
    code: new OrderService(repository)
  - name: 대상 판별
    detail: pointcut 에 걸리는 메서드가 있는지 본다. 없으면 프록시를 안 만든다
  - name: 프록시 생성
    detail: 초기화 후처리 단계에서 원본을 감싼 프록시를 만든다
  - name: 프록시를 등록
    detail: 컨테이너에는 프록시가 빈으로 들어간다. 원본은 프록시 안에만 있다
  - name: 호출
    detail: 다른 빈이 주입받아 호출하면 프록시가 먼저 받아 advice 를 돌리고 원본에 넘긴다
    code: proxy.placeOrder(order)
```

프록시가 만들어지는 자리는 [[spring-bean-lifecycle]] 의 **초기화 후처리** 단계다.
그래서 `@PostConstruct` 안에서 자기 메서드를 불러도 AOP 가 안 먹는다.
그 시점엔 아직 프록시가 없다.

## 직접 만들 일은 드물다

`@Aspect` 를 손으로 쓰는 일은 생각보다 적다. 이미 쓰고 있는 것들이 전부 AOP 이기 때문이다.

- `@Transactional` — 트랜잭션 시작·커밋·롤백
- `@Cacheable` — 캐시 조회·저장
- `@Async` — 별도 스레드에서 실행
- `@Retryable` — 실패 시 재시도

이것들이 왜 가끔 "안 먹는지" 설명하려면 프록시를 알아야 한다. 다음 단계에서 본다.

# deep

## JDK 동적 프록시와 CGLIB

프록시를 만드는 방법이 둘이다.

| | JDK 동적 프록시 | CGLIB |
| --- | --- | --- |
| 방식 | 인터페이스를 구현한 클래스를 런타임에 생성 | 원본을 **상속**한 서브클래스 생성 |
| 전제 | 인터페이스가 있어야 함 | 없어도 됨 |
| 한계 | 인터페이스에 선언된 메서드만 가로챔 | `final` 클래스·메서드는 불가 |

Spring Boot 는 **기본이 CGLIB** 다. `spring.aop.proxy-target-class` 가 `true` 로 깔려 있다.
예전에는 인터페이스가 있으면 JDK 프록시를 썼는데, 그때는 구체 타입으로 주입받으면
`ClassCastException` 이 나는 함정이 있었다. 지금은 그 문제가 없다.

CGLIB 를 쓰기 때문에 **`final` 이 붙은 클래스나 메서드는 프록시가 안 된다.**
조용히 AOP 가 안 먹는 것이 아니라, Spring Boot 는 기동 시 경고를 남긴다.

Kotlin 은 클래스가 기본 `final` 이라 이 문제를 자주 만난다. `allopen` 플러그인을 쓰는
이유가 이것이다.

## self-invocation: 가장 흔한 함정

같은 클래스 안에서 자기 메서드를 부르면 **프록시를 거치지 않는다.**

```java file=OrderService.java bad label="내부 호출" highlight=3,8
@Service
public class OrderService {
    public void placeOrder(Order order) {
        this.saveWithTx(order);   // 프록시를 안 거친다
    }

    @Transactional
    public void saveWithTx(Order order) {
        repository.save(order);   // 트랜잭션 없이 돈다
    }
}
```

주입받은 쪽이 `placeOrder` 를 부를 때는 프록시를 거친다. 하지만 `placeOrder` 안에서
`this.saveWithTx(...)` 를 부르는 순간 `this` 는 **원본 객체**다. 프록시가 아니다.
`@Transactional` 이 조용히 무시된다.

```java file=OrderFacade.java good label="다른 빈으로 분리"
@Service
public class OrderFacade {
    private final OrderService orderService;   // 프록시가 주입된다

    public void placeOrder(Order order) {
        orderService.saveWithTx(order);        // 프록시를 거친다
    }
}
```

해결책이 몇 가지 있지만 우선순위가 다르다.

1. **다른 빈으로 분리** — 대개 맞다. 트랜잭션 경계가 눈에 보이게 된다
2. 자기 자신을 주입 — 동작하지만 순환 참조처럼 보여서 읽기 나쁘다
3. `AopContext.currentProxy()` — 동작하지만 코드가 Spring 에 묶인다

## 적용 안 되는 자리

프록시 방식이라 가로챌 수 없는 곳이 있다.

| 자리 | 이유 |
| --- | --- |
| `private` 메서드 | 서브클래스가 오버라이드할 수 없다 |
| `final` 메서드 | 오버라이드 자체가 막혀 있다 |
| `static` 메서드 | 인스턴스 메서드가 아니다 |
| 생성자 | 프록시가 만들어지기 전이다 |
| 내부 호출 | 위의 self-invocation |

`@Transactional` 을 `private` 메서드에 붙여놓고 "왜 안 되지" 하는 경우가 자주 나온다.
컴파일도 되고 경고도 없지만 그냥 안 돈다.

## 여러 Aspect 의 순서

하나의 메서드에 advice 가 여럿 걸리면 `@Order` 로 순서를 정한다.

```java file=Ordering.java
@Aspect @Order(1) class LoggingAspect { }   // 바깥
@Aspect @Order(2) class TimedAspect { }     // 안쪽
```

숫자가 **작을수록 바깥**이다. 바깥 advice 가 먼저 시작하고 나중에 끝난다.
`@Transactional` 의 기본 순서는 `Ordered.LOWEST_PRECEDENCE` 라 거의 항상 가장 안쪽이다.
트랜잭션 바깥에서 뭔가 하고 싶으면 내 aspect 의 order 를 더 작게 주면 된다.

## 언제 쓰지 말아야 하나

AOP 는 **코드를 읽어도 안 보이는 동작**을 만든다. 그게 장점이자 위험이다.

비즈니스 규칙을 aspect 에 넣으면 나중에 그 규칙을 찾을 수가 없다.
`placeOrder` 를 아무리 읽어도 "주문 금액이 100만 원 넘으면 승인 대기"가 어디에도 없다.

기준은 **그 처리가 도메인과 무관한가**다. 로깅·트랜잭션·캐시·측정은 무관하다.
할인 계산이나 승인 조건은 무관하지 않다. 그건 그냥 코드로 쓴다.
