---
title: Bean 생명주기
summary: 컨테이너가 빈을 만들고 쓰고 버리기까지 거치는 단계들
versionNote: Spring Boot 3.2 기준
ord: 3
minutes: { intro: 4, standard: 18 }
edges:
  - { to: spring-ioc, type: prerequisite }
  - { to: spring-di, type: related }
sources:
  - { label: Spring 공식 문서 - Lifecycle Callbacks, url: https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html }
---

# intro

빈은 `new` 되고 끝이 아니다. 쓸 수 있게 되기까지 단계를 거친다.

```java file=MailSender.java highlight=5-8
@Component
public class MailSender {
    private final SmtpConfig config;

    @PostConstruct
    public void connect() {
        // 생성자에서는 못 한다. 의존성이 아직 안 들어와 있을 수 있다
    }
}
```

생성자가 끝났다고 해서 그 객체가 준비된 것은 아니다.
**의존성 주입이 끝난 뒤에** 할 일이 있으면 `@PostConstruct` 에 둔다.

# standard

## 전체 순서

```visual
id: spring-bean-lifecycle-flow
kind: step
title: 생성자 호출과 사용 가능 사이에 네 단계가 더 있다
steps:
  - name: 인스턴스화
    detail: 생성자를 호출한다. 생성자 주입이면 이 시점에 의존성도 같이 들어온다
    code: new MailSender(smtpConfig)
  - name: 의존성 주입
    detail: 세터·필드 주입분을 채운다. 생성자 주입만 썼다면 할 일이 없다
  - name: Aware 콜백
    detail: BeanNameAware, ApplicationContextAware 가 붙어 있으면 컨테이너 정보를 건넨다
  - name: 초기화 전 후처리
    detail: BeanPostProcessor.postProcessBeforeInitialization 이 돌아간다
  - name: 초기화
    detail: "@PostConstruct → InitializingBean.afterPropertiesSet → initMethod 순서"
  - name: 초기화 후 후처리
    detail: postProcessAfterInitialization. AOP 프록시가 여기서 원본을 감싼다
  - name: 사용
    detail: 이제부터 주입받은 쪽이 쓴다. 싱글톤이면 컨테이너가 닫힐 때까지 산다
  - name: 소멸
    detail: "@PreDestroy → DisposableBean.destroy → destroyMethod"
```

외울 필요는 없다. **"생성자 → 주입 → 초기화 → 사용 → 소멸"** 다섯 덩어리만 잡고,
세부는 필요할 때 찾아보면 된다.

## 왜 생성자에서 다 하면 안 되는가

생성자 주입만 쓴다면 사실 생성자에서 해도 되는 경우가 많다.
문제가 되는 것은 **세터·필드 주입**을 섞었을 때다.

```java file=Broken.java bad label="필드 주입 + 생성자에서 사용"
@Component
public class MailSender {
    @Autowired private SmtpConfig config;

    public MailSender() {
        connect(config.host());  // NullPointerException
    }
}
```

```java file=Fixed.java good label="초기화 콜백으로 미룬다"
@Component
public class MailSender {
    @Autowired private SmtpConfig config;

    @PostConstruct
    public void init() {
        connect(config.host());
    }
}
```

필드 주입은 객체가 만들어진 **다음에** 리플렉션으로 채워진다.
생성자가 도는 시점에는 아직 `null` 이다. [[spring-di]] 에서 생성자 주입을 권하는 이유가
여기서도 나온다.

## 초기화 방법 세 가지

| 방법 | 형태 | 비고 |
| --- | --- | --- |
| `@PostConstruct` | 메서드에 애노테이션 | 가장 흔하다. 표준(JSR-250) |
| `InitializingBean` | 인터페이스 구현 | 코드가 Spring 에 묶인다 |
| `@Bean(initMethod=)` | 설정에서 지정 | 내가 못 고치는 외부 클래스에 쓴다 |

셋 다 있으면 표 순서대로 돈다. 보통은 `@PostConstruct` 하나로 끝난다.
라이브러리 클래스처럼 애노테이션을 못 붙이는 경우에만 `initMethod` 를 꺼낸다.

## 소멸 콜백이 안 돌 때

`@PreDestroy` 는 **컨테이너가 정상적으로 닫힐 때만** 돈다.

- `kill -9` 나 프로세스 강제 종료 → 안 돈다
- `prototype` 스코프 빈 → 안 돈다. 컨테이너가 만든 뒤 추적하지 않는다

두 번째가 특히 함정이다. prototype 빈이 커넥션 같은 자원을 쥐고 있으면 아무도 안 닫는다.
그런 빈은 쓰는 쪽에서 직접 닫거나, 애초에 prototype 으로 두지 않는 게 맞다.

## 후처리기가 하는 일

`BeanPostProcessor` 는 모든 빈의 초기화 앞뒤에 끼어드는 훅이다.
직접 만들 일은 드물지만, **Spring 의 상당수 기능이 이걸로 돌아간다**는 것은 알아둘 만하다.

[[spring-aop]] 의 프록시가 대표적이다. `@Transactional` 이 붙은 빈은 초기화 후처리 단계에서
프록시로 감싸인다. 그래서 주입받은 객체가 사실은 원본이 아니라 프록시인 경우가 생기고,
같은 클래스 안에서 메서드를 호출하면 트랜잭션이 안 먹는 문제가 여기서 비롯된다.
