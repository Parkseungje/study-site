---
title: Bean 생명주기
summary: 컨테이너가 빈을 만들고 쓰고 버리기까지 거치는 단계들
versionNote: Spring Boot 3.2 기준
ord: 3
minutes: { intro: 4, standard: 18, deep: 28 }
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

# deep

## Aware 인터페이스들

컨테이너가 자기 정보를 빈에게 건네는 통로다. 초기화 **직전**에 순서대로 호출된다.

| 인터페이스 | 받는 것 |
| --- | --- |
| `BeanNameAware` | 이 빈의 이름 |
| `BeanClassLoaderAware` | 클래스로더 |
| `BeanFactoryAware` | 컨테이너 자신 |
| `EnvironmentAware` | 프로퍼티·프로파일 |
| `ApplicationContextAware` | 컨텍스트 전체 |

쓸수록 코드가 Spring 에 묶이므로 **되도록 피한다.** 대부분은 주입으로 해결된다.
`Environment` 가 필요하면 그냥 생성자로 받으면 된다.

예외는 프레임워크 확장이다. 빈 목록을 훑어야 하는 후처리기 같은 것은
`BeanFactoryAware` 말고는 방법이 없다.

## 모든 싱글톤이 준비된 뒤에 할 일

`@PostConstruct` 는 **그 빈 하나**가 준비됐을 때 돈다.
다른 빈이 아직 안 만들어졌을 수 있다.

전부 뜬 뒤에 뭔가 하려면 두 가지가 있다.

```java file=Warmup.java
@Component
class CacheWarmer implements SmartInitializingSingleton {
    @Override
    public void afterSingletonsInstantiated() {
        // 모든 싱글톤이 만들어진 직후
    }
}

@Component
class Starter {
    @EventListener(ApplicationReadyEvent.class)
    void onReady() {
        // 웹 서버까지 떠서 요청을 받을 수 있게 된 뒤
    }
}
```

캐시 예열이나 외부 연결 확인은 `ApplicationReadyEvent` 가 맞다.
`@PostConstruct` 에서 다른 빈을 호출하면 **그 빈이 아직 초기화 전**일 수 있다.

## 종료는 생각보다 자주 안 돈다

`@PreDestroy` 가 도는 조건은 생각보다 좁다.

| 상황 | 소멸 콜백 |
| --- | --- |
| `SIGTERM` (`docker stop`, k8s) | 돈다 |
| `Ctrl+C` | 돈다 |
| `SIGKILL` (`kill -9`) | **안 돈다** |
| `System.exit()` | 돈다 (셧다운 훅) |
| prototype 빈 | **안 돈다** |

[[docker-container]] 에서 본 PID 1 문제가 여기 걸린다.
`CMD npm start` 처럼 셸을 거치면 `SIGTERM` 이 자바 프로세스까지 안 간다.
그러면 10초 뒤 `SIGKILL` 이 날아와 **소멸 콜백 없이 죽는다.**

Spring Boot 는 종료를 기다려주는 설정이 있다.

```properties file=application.properties
server.shutdown=graceful
spring.lifecycle.timeout-per-shutdown-phase=20s
```

`graceful` 은 처리 중인 요청을 끝낸 뒤 닫는다. 이걸 안 켜면 종료 신호가 온 순간
진행 중이던 요청이 끊긴다. 컨테이너로 배포한다면 거의 항상 켜야 한다.

## prototype 빈은 왜 버려지지 않는가

컨테이너는 prototype 빈을 **건네준 뒤 잊는다.** 참조를 들고 있지 않다.

```visual
id: spring-bean-lifecycle-prototype
kind: step
title: prototype 은 만들어 주기까지만 관여한다
steps:
  - name: 요청
    detail: 누군가 prototype 빈을 달라고 한다
  - name: 생성과 주입
    detail: 새로 만들고 의존성을 채운다. 여기까지는 싱글톤과 같다
  - name: 초기화
    detail: "@PostConstruct 가 돈다"
  - name: 건네고 잊는다
    detail: 컨테이너는 이 인스턴스를 추적하지 않는다
  - name: 소멸
    detail: "@PreDestroy 는 돌지 않는다. GC 가 가져갈 뿐이다"
```

자원을 쥐는 객체를 prototype 으로 두면 **아무도 안 닫는다.**
`try-with-resources` 로 쓰는 쪽이 닫거나, 애초에 싱글톤으로 두는 게 맞다.

## 싱글톤이 prototype 을 주입받으면

싱글톤은 한 번만 만들어진다. 그때 주입된 prototype 도 **하나로 고정된다.**
요청마다 새로 받고 싶었다면 기대가 어긋난다.

```java file=Wrong.java bad label="한 번만 주입된다"
@Service
public class ReportService {
    // prototype 인데 하나로 고정된다
    private final ReportBuilder builder;
}
```

```java file=Right.java good label="쓸 때마다 꺼낸다"
@Service
public class ReportService {
    private final ObjectProvider<ReportBuilder> builders;

    public Report make() {
        return builders.getObject().build();   // 매번 새 인스턴스
    }
}
```

`ObjectProvider` 가 가장 단순하다. `@Lookup` 메서드나 scoped proxy 도 같은 문제를 푼다.
[[spring-di]] 에서 본 주입 방식 선택이 생명주기와 맞물리는 지점이다.

## 초기화에서 예외가 나면

`@PostConstruct` 가 던지면 기동이 **통째로 실패한다.** 반쪽짜리로 뜨지 않는다.

이게 좋은 성질이다. DB 연결이 안 되는 상태로 떠서 첫 요청에 500 을 주는 것보다,
배포 단계에서 바로 실패하는 쪽이 낫다.

그래서 초기화 콜백에서 예외를 삼키면 안 된다.

```java file=Swallow.java bad label="삼키면 숨는다"
@PostConstruct
void init() {
    try {
        connect();
    } catch (Exception e) {
        log.warn("실패", e);
    }
}
```

이러면 연결이 안 된 채로 애플리케이션이 뜬다. 문제는 운영 중에 드러난다.
