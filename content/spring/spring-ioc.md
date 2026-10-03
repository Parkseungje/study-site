---
title: IoC Container
summary: 객체를 대신 만들고 서로 연결해 보관해두는 Spring 의 핵심 장치
versionNote: Spring Boot 3.2 기준
ord: 2
minutes: { intro: 5, standard: 20 }
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

| | BeanFactory | ApplicationContext |
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
