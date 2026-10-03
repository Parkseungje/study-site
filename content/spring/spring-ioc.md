---
title: IoC Container
summary: 객체를 대신 만들고 서로 연결해 보관해두는 Spring 의 핵심 장치
versionNote: Spring Boot 3.2 기준
ord: 2
minutes: { intro: 5, standard: 20, deep: 32 }
edges:
  - { to: java-interface, type: prerequisite }
  - { to: spring-bean-lifecycle, type: deepens }
sources:
  - { label: Spring 공식 문서 - The IoC Container, url: https://docs.spring.io/spring-framework/reference/core/beans.html }
---

# intro

IoC 는 Inversion of Control, **제어의 역전**이다.
내가 객체를 만들던 것을 컨테이너가 대신 만든다.

```java file=Before.java bad label="내가 만든다"
UserRepository repo = new MySqlUserRepository();
UserService service = new UserService(repo);
```

```java file=After.java good label="컨테이너가 만든다"
@Service
public class UserService {
    public UserService(UserRepository repo) { ... }
}
```

아래쪽에는 `new` 가 없다. 애플리케이션이 뜰 때 컨테이너가 `UserRepository` 구현체를 찾아
`UserService` 를 만들어 보관한다. 그 보관된 객체를 **빈(Bean)** 이라 부른다.

# standard

## 무엇이 역전되는가

"제어"는 **객체의 생명주기와 연결을 누가 정하는가**를 말한다.

일반적인 코드는 내가 `new` 를 부르고, 내가 인자를 고르고, 내가 버린다.
IoC 에서는 그 셋을 컨테이너가 한다. 나는 "이 타입이 필요하다"고 선언만 한다.

[[spring-di]] 는 이 역전을 실현하는 **방법**이다. IoC 가 목적이고 DI 가 수단이다.
둘을 같은 말처럼 쓰는 글이 많은데, 구분해두면 "왜 주입이라는 형태여야 했나"가 설명된다.

## 컨테이너는 무엇을 보관하는가

빈 하나당 **정의(definition)** 와 **인스턴스**가 따로 있다.

정의는 "이 타입을 이렇게 만들어라"는 설계도다. 클래스, 생성자 인자, 스코프, 초기화 방법이
들어간다. 컨테이너는 먼저 정의를 전부 모으고, 그다음에 인스턴스를 만든다.

```visual
id: spring-ioc-startup
kind: step
title: 컨테이너는 정의를 다 모은 뒤에야 객체를 만든다
steps:
  - name: 스캔
    detail: "@Component 계열이 붙은 클래스를 찾아 빈 정의로 등록한다. 아직 객체는 없다"
  - name: 정의 보정
    detail: "BeanFactoryPostProcessor 가 정의를 고칠 기회를 갖는다. @Value 의 플레이스홀더가 여기서 채워진다"
  - name: 의존 관계 해석
    detail: 생성자가 요구하는 타입을 정의 목록에서 찾아 만들 순서를 정한다
  - name: 인스턴스화
    detail: 싱글톤 스코프 빈을 전부 미리 만들어 보관한다
    code: new UserService(mySqlUserRepository)
  - name: 보관
    detail: 이후 같은 타입을 요구하면 새로 만들지 않고 이 인스턴스를 건넨다
```

정의를 먼저 다 모으는 이유는 순서 때문이다. A 를 만들려면 B 가 필요한데 B 정의를 아직
못 봤다면 순서를 정할 수 없다.

## BeanFactory 와 ApplicationContext

컨테이너 인터페이스가 둘이다.

| 구분 | BeanFactory | ApplicationContext |
| --- | --- | --- |
| 역할 | 빈 조회의 최소 계약 | BeanFactory + 부가 기능 |
| 생성 시점 | 요청할 때 (lazy) | 싱글톤은 기동 시 미리 |
| 추가 기능 | 없음 | 이벤트 발행, 메시지 국제화, 환경 설정 |

실제로 쓰는 것은 거의 항상 `ApplicationContext` 다. Spring Boot 가 기동할 때 만드는 것도
이쪽이다. `BeanFactory` 는 그 상위 인터페이스라고 알아두면 된다.

싱글톤을 **기동 시에 미리 만드는 것**이 중요하다. 설정이 틀렸으면 첫 요청이 아니라
애플리케이션이 뜰 때 터진다. 운영 중에 터지는 것보다 낫다.

## 스코프

같은 타입을 요구할 때마다 같은 객체를 줄지 새로 만들지를 정한다.

| 스코프 | 의미 | 쓰는 곳 |
| --- | --- | --- |
| `singleton` | 컨테이너당 하나 (기본값) | 대부분의 서비스, 저장소 |
| `prototype` | 요청할 때마다 새로 | 상태를 가진 객체 |
| `request` | HTTP 요청당 하나 | 요청 범위 데이터 |
| `session` | 세션당 하나 | 로그인 사용자 정보 |

기본이 싱글톤이라는 사실이 함정을 만든다. **빈에 상태를 두면 요청끼리 공유된다.**

```java file=CounterService.java bad label="싱글톤에 상태"
@Service
public class CounterService {
    private int count = 0;

    public int next() {
        return ++count;
    }
}
```

이 `count` 는 모든 요청이 같이 쓴다. 동시에 들어오면 값이 깨진다.
빈은 무상태로 두고, 상태는 메서드 인자나 반환값으로 흘려보내는 게 원칙이다.

## 같은 타입이 둘일 때

`UserRepository` 구현체가 둘이면 컨테이너는 무엇을 넣을지 모른다.

```java file=Ambiguous.java highlight=1-2
@Repository public class MySqlUserRepository implements UserRepository { }
@Repository public class RedisUserRepository implements UserRepository { }

// NoUniqueBeanDefinitionException
```

해결 수단이 세 가지다.

- `@Primary` 를 한쪽에 붙여 기본값으로 삼는다
- `@Qualifier("mySqlUserRepository")` 로 주입 지점에서 지목한다
- 파라미터 이름을 빈 이름과 맞춘다 (이름이 맞으면 Spring 이 그걸로 고른다)

세 번째는 동작하긴 하지만 변수명을 바꾸는 순간 조용히 깨진다. 앞의 둘을 쓰는 게 낫다.

# deep

## BeanDefinition: 객체보다 먼저 있는 것

컨테이너가 처음 만드는 것은 객체가 아니라 **설계도**다.
`BeanDefinition` 하나가 "이 빈을 어떻게 만들어라"를 담는다.

| 항목 | 내용 |
| --- | --- |
| `beanClassName` | 만들 클래스 |
| `scope` | singleton / prototype / request ... |
| `lazyInit` | 기동 때 만들지, 요청 때 만들지 |
| `dependsOn` | 먼저 만들어야 하는 빈 |
| `primary` | 같은 타입이 여럿일 때 기본값인지 |
| `constructorArgumentValues` | 생성자에 넣을 값 |

`@Component` 스캔, `@Bean` 메서드, XML 이 전부 **이 한 가지 형태로 수렴한다.**
출처가 달라도 컨테이너 입장에서는 똑같은 정의일 뿐이다.

## 후처리기가 둘인 이유

이름이 비슷해서 헷갈리지만 **대상과 시점이 완전히 다르다.**

| | BeanFactoryPostProcessor | BeanPostProcessor |
| --- | --- | --- |
| 대상 | 빈 **정의** | 빈 **인스턴스** |
| 시점 | 객체 만들기 전 | 각 빈의 초기화 앞뒤 |
| 횟수 | 전체에 한 번 | 빈마다 |
| 예 | `@Value` 플레이스홀더 치환 | AOP 프록시 씌우기 |

```
정의 수집 → BeanFactoryPostProcessor (정의를 고친다)
         → 인스턴스화 → BeanPostProcessor (객체를 감싼다) → 사용
```

`@Value("${db.url}")` 의 `${...}` 가 실제 값으로 바뀌는 것은 **객체가 생기기 전**이다.
정의 단계에서 치환되므로 생성자 인자로 이미 완성된 값이 들어온다.

세부 순서는 [[spring-bean-lifecycle]] 에서 본다.

## 순환 참조를 푸는 3단계 캐시

싱글톤을 만드는 동안 컨테이너는 캐시를 세 개 쓴다.

| 캐시 | 담기는 것 |
| --- | --- |
| `singletonObjects` | 완성된 빈 |
| `earlySingletonObjects` | 주입 전, 만들어지기만 한 빈 |
| `singletonFactories` | 미완성 빈을 꺼내는 팩토리 |

```visual
id: spring-ioc-early-reference
kind: step
title: 미완성 객체를 미리 꺼내 쓰게 해서 순환을 끊는다
steps:
  - name: A 생성
    detail: 생성자를 호출해 객체만 만든다. 필드는 아직 비어 있다
  - name: A 를 팩토리에 등록
    detail: singletonFactories 에 넣는다. 이 시점부터 남이 꺼내 갈 수 있다
  - name: A 에 B 주입 시도
    detail: B 가 아직 없으니 B 를 먼저 만든다
  - name: B 가 A 를 요구
    detail: 완성본은 없지만 팩토리에서 미완성 A 를 꺼내 B 에 넣는다
  - name: B 완성
    detail: B 가 완성되어 A 에 주입된다
  - name: A 완성
    detail: 둘 다 서로를 가리키게 됐다
```

왜 두 단계가 아니라 세 단계인가. 팩토리를 거치는 이유는 **AOP 때문**이다.
A 가 프록시로 감싸져야 하는 빈이라면, 미완성 A 를 그냥 넘기면 B 는 원본을 쥐게 된다.
팩토리가 "지금 꺼내면 프록시로 감싸서 준다"를 처리한다.

생성자 주입은 1단계에서 이미 막힌다. 객체를 만들 수가 없으니 캐시에 올릴 것도 없다.

## @Configuration 은 왜 프록시가 되는가

`@Configuration` 클래스는 CGLIB 로 감싸진다. `@Bean` 메서드를 가로채기 위해서다.

```java file=AppConfig.java highlight=8
@Configuration
public class AppConfig {
    @Bean DataSource dataSource() { return new HikariDataSource(); }

    @Bean
    UserRepository userRepository() {
        // 평범한 자바라면 여기서 DataSource 가 하나 더 만들어진다
        return new UserRepository(dataSource());
    }
}
```

프록시가 `dataSource()` 호출을 가로채 **컨테이너에 이미 있는 빈을 돌려준다.**
그래서 몇 번을 불러도 같은 인스턴스다. 이걸 full mode 라 한다.

`@Component` 에 `@Bean` 을 쓰면 프록시가 없다(lite mode). 메서드 호출이 그냥 호출이라
`new` 가 두 번 일어난다. **조용히 빈이 둘이 된다.** 설정 클래스에는 `@Configuration` 을 쓴다.

`@Configuration(proxyBeanMethods = false)` 로 프록시를 끌 수 있다.
메서드끼리 호출하지 않는 설정이라면 기동이 조금 빨라진다.

## FactoryBean: 만드는 법이 복잡한 빈

생성 과정이 까다로운 객체는 **만드는 방법 자체를 빈으로** 등록한다.

```java file=MyFactoryBean.java
@Component
public class SqlSessionFactoryBean implements FactoryBean<SqlSessionFactory> {
    @Override public SqlSessionFactory getObject() { /* 복잡한 조립 */ }
    @Override public Class<?> getObjectType() { return SqlSessionFactory.class; }
}
```

컨테이너는 이 빈을 주입할 때 **`getObject()` 의 결과**를 넘긴다.
팩토리 자체가 필요하면 이름 앞에 `&` 를 붙인다 (`&sqlSessionFactoryBean`).

MyBatis, JPA 연동 라이브러리가 이 방식을 쓴다. 직접 만들 일은 드물지만,
`&` 가 붙은 빈 이름을 로그에서 봤을 때 뭔지 알게 된다.

## 기동이 느릴 때 보는 곳

싱글톤을 전부 미리 만들기 때문에, 빈이 많으면 기동이 느려진다.

```properties file=application.properties
spring.main.lazy-initialization=true
```

전부 지연 생성으로 바꾼다. 개발 중 재기동이 빨라진다.
대신 **설정 오류를 첫 요청 때 만나게 된다.** 운영에는 켜지 않는다.

특정 빈만 미루려면 `@Lazy` 를 클래스에 붙인다. 무거운 외부 연결처럼
실제로 안 쓰일 수도 있는 것에만 선택적으로 쓰는 쪽이 안전하다.
