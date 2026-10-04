# 🎯 스프링 — HTTP 에서 Security 까지

> **목적**: 스프링이 **무엇을 대신해주는 프레임워크인지**를 원리로 이해한다.
> HTTP 와 웹의 기초에서 시작해 IoC/DI, MVC 내부, 프록시와 AOP, 그리고 Security 까지.
>
> **왜 HTTP 가 맨 앞인가**: `DispatcherServlet` 의 9단계를 배우기 전에
> 요청과 응답이 무엇인지 알아야 한다. 원본 커리큘럼에서 HTTP 가 맨 뒤에 있던 것이
> 가장 큰 순서 오류였다.
>
> **선행**: 자바 과목. 특히 PART 1 의 SOLID(DIP)와 PART 7 의 동시성(싱글톤 빈이 왜 stateless 여야 하나).
> **다음**: 데이터 접근 과목. `@Transactional` 이 이 과목의 AOP 위에서 동작한다.

---

## 🧭 전체 지도 (한눈에)

```
  [1] HTTP와 웹의 기초         ← 요청·응답·TLS. MVC 의 전제
   ↓
  [2] IoC와 DI                 ← 자바 SOLID 의 DIP 가 여기서 프레임워크가 된다
   ↓
  [3] Spring MVC               ← Servlet 의 한계 → DispatcherServlet
   ↓
  [4] 프록시의 진화             ← 수동 프록시 → 동적 프록시 → CGLIB
   ↓
  [5] Spring AOP               ← ProxyFactory → @Aspect
   ↓
  [6] Spring Security          ← Filter Chain · JWT · OAuth2
```

순서의 이유: **[4] 를 [5] 보다, 둘을 [3] 뒤에** 둔다.
AOP 는 프록시 메커니즘의 **결과**이므로 프록시를 먼저 본다.
그리고 Filter / Interceptor / AOP 를 비교하려면([3] 의 마지막)
MVC 의 요청 흐름을 먼저 알아야 하므로 MVC 가 프록시보다 앞이다.

### 기술 진화의 척추

| 영역 | 로우레벨(고통) | 중간 | 하이레벨(해결) |
|---|---|---|---|
| HTTP 전송 | HTTP/1.1(HOL·헤더 중복) | HTTP/2(멀티플렉싱) | HTTP/3(QUIC) |
| 객체 생성·연결 | DAO 가 모든 책임 떠안음 | 상속·디자인패턴 | 인터페이스+DI → Spring IoC |
| 조립 코드 | `new` 수백 줄을 손으로 | 팩토리 | ApplicationContext(컨테이너) |
| 요청 라우팅 | URL 마다 Servlet 폭증 | Front Controller | DispatcherServlet(+HandlerMapping/Adapter) |
| 부가 관심사 | 메서드마다 try-catch 반복 | 템플릿 메서드 → 전략 → 템플릿 콜백 | AOP `@Around` |
| 프록시 생성 | 수동 프록시 클래스 100개 | Reflection → JDK 동적 프록시 / CGLIB | ProxyFactory → @Aspect |
| 횡단 관심사(웹) | 모든 Servlet 에 공통 코드 중복 | Filter / Interceptor | AOP(메서드 단위) |
| 인증 상태 | 서버 Session(Stateful) | Session in Redis | JWT(Stateless) + OAuth2 |

---

# 📚 PART 1 — HTTP와 웹의 기초

> **목표**: MVC 를 배우기 전에 요청과 응답이 무엇인지 안다. TLS 와 웹 인프라의 구성 요소까지.

## 1.1 HTTP 깊이

- 본질: TCP 위 텍스트 기반 요청-응답, Stateless·Connection-less. 메시지=Start/Status Line + Headers + (빈 줄) + Body. 메서드 멱등성/안전성: GET(안전·멱등), POST(둘 다 X), PUT/DELETE(멱등), PATCH(비멱등*). 주요 헤더: Content-Type/Accept/Authorization/Cache-Control/ETag/Host.
- **상태 코드 5계열 + 오해**: 401(인증) vs 403(인가), 400 vs 422(시맨틱), 304(ETag 캐시 유효), 302 vs 307(메서드 보존), **502**(upstream 다운: 프록시→앱 다운) vs **504**(upstream 응답 지연 timeout), 503(점검·과부하, Retry-After), 429(Rate Limit).
- **진화**: HTTP/1.1(Keep-Alive·**HOL Blocking**·헤더 중복) → **HTTP/2**(바이너리·**Multiplexing**으로 앱계층 HOL 해결·HPACK 헤더 압축, 단 TCP HOL 잔존) → **HTTP/3**(TCP→**QUIC/UDP**, TCP HOL까지 해결, 0-1RTT). Spring Boot는 `server.http2.enabled=true`.


## 1.2 TCP/IP와 TLS (★ 정점)

- OSI 7계층 중 Transport(4: TCP/UDP)·Network(3: IP)·TLS(5-6). 캡슐화: 데이터→TCP 세그먼트→IP 패킷→Frame.
- **TCP 3-way handshake**(연결): SYN → SYN-ACK → ACK(양쪽 송수신 능력 확인, 2번이면 한쪽만·4번은 중복). **4-way handshake**(종료): FIN/ACK 양방향. **TIME_WAIT**(마지막 ACK 손실 대비 2MSL 대기 → 부하 큰 클라/프록시에 소켓 누적 → `SO_REUSEADDR`·Connection Pool). 신뢰성: Sequence/ACK/Checksum/Flow Control/Congestion Control. TCP(신뢰·느림) vs UDP(비신뢰·빠름: DNS·게임·VoIP).
- **TLS**: HTTP+TLS=HTTPS. 1.2(2 RTT) → **1.3**(1 RTT·0-RTT 재개, 약한 알고리즘 제거·Forward Secrecy 강제). 원리: **비대칭**(인증서 검증·세션키 교환)+**대칭**(데이터 암호화 — 비대칭은 안전하나 느려서 키 교환만, 대칭으로 본문). 인증서는 CA 체인(Root→Intermediate→Leaf), 무료는 Let's Encrypt(90일·자동 갱신).
- **DNS**(도메인↔IP, 레코드 A/AAAA/CNAME/MX/TXT/NS) & **Load Balancing**(Round Robin/Least Conn/IP Hash/Weighted). **L4**(IP·Port, 빠름) vs **L7**(URL·Header, Path 라우팅 — API 경로 분기엔 L7). Sticky Session은 Session 기반 인증 시 필요, JWT면 불필요.


## 1.3 웹 인프라 기초

**웹서버 vs WAS**

| | 웹서버 | WAS |
|---|---|---|
| 역할 | 정적 자원(HTML/CSS/이미지) | 동적 자원(서블릿/JSP) |
| 예시 | Apache, Nginx | Tomcat, Jetty, Undertow |

- 실무: `[클라이언트] ↔ [Nginx 정적] ↔ [Tomcat 동적] ↔ [DB]`

**서블릿/JSP**: 서블릿=자바로 HTTP 요청 처리하는 클래스. JSP=HTML 안에 자바, **컴파일 시 서블릿으로 변환**. 진화: 서블릿만(가독성 최악) → JSP만(유지보수 지옥) → **MVC(JSP=View, 서블릿=로직)** → 현대는 Thymeleaf 등.

**SSR vs CSR**

| | SSR | CSR |
|---|---|---|
| 화면 생성 | 서버에서 HTML 완성 | 브라우저(JS) |
| 초기 로딩 | 빠름 | 느림 |
| SEO | 좋음 | 까다로움 |
| 예시 | JSP, Thymeleaf, Next.js | React/Vue SPA |

**JAR vs WAR**

| | JAR | WAR |
|---|---|---|
| 포함 | Class, 라이브러리 | + JSP/Servlet/WEB-INF |
| 실행 | `java -jar`(JRE) | 외부 WAS 필요 |

- **Spring Boot는 JAR 권장**: WAS(Tomcat) 내장 → 배포·실행 간단, DevOps 부담 ↓. (마이크로서비스에서 선호)

---


# 📚 PART 2 — IoC와 DI

> **목표**: 자바 과목의 DIP 가 프레임워크가 되는 과정. new 를 누가 하고 누가 넣어주는가.

## 2.1 전통 DAO의 문제 (로우레벨 — 모든 책임을 떠안은 코드)

```java
public void add(User user) throws ... {
    Class.forName("com.mysql.jdbc.Driver");        // ① 드라이버 로딩
    Connection c = DriverManager.getConnection(    // ② 접속 정보
        "jdbc:mysql://localhost/toby", "root", "*****");
    PreparedStatement ps = c.prepareStatement(     // ③ SQL
        "insert into users(id,name,password) values (?,?,?)");
    ps.setString(1, user.getId());                 // ④ 바인딩
    ps.executeUpdate();                            // ⑤ 실행
    ps.close(); c.close();                         // ⑥ 자원 해제
}
```

- 한 메서드에 **연결 정보·드라이버 로딩·SQL·자원 해제·예외 처리**가 혼재.
- DB 종류·접속 정보 바뀌면 **모든 메서드 수정** = 변경 1번 = 수정 N곳 = 유지보수 지옥. (SRP·OCP·DIP 위반)


## 2.2 관심사의 분리

> "관심이 같은 것끼리 모으고, 다른 것은 떨어뜨려라" (= SRP)

- **1단계 — 메서드 추출**: 중복되는 `getConnection()`을 private 메서드로 → 중복 제거, DB 정보 변경 시 한 곳만.
- **2단계 — 추상클래스로 확장**: "고객사마다 다른 DB, 단 UserDao 코드는 공개 안 하고 싶다" → `getConnection()`을 **추상 메서드**로. 변하지 않는 흐름은 부모, 변하는 부분은 자식(`NUserDao`, `DUserDao`).


## 2.3 디자인 패턴의 적용과 한계

- 위 구조는 사실 **2개 패턴**의 동시 적용:
  - **템플릿 메소드 패턴**: 슈퍼클래스에 기본 흐름, 변하는 부분만 서브클래스 구현. (Spring `JdbcTemplate`의 이름 유래)
  - **팩토리 메소드 패턴**: 객체 생성(`getConnection`)을 서브클래스에 위임. (`BeanFactory`의 "Factory")
- **상속 기반 분리의 한계**: 단일 상속 제약, 컴파일 타임 결합, 부모 변경 시 자식 영향. → **상속 대신 인터페이스 + 합성(composition)**.


## 2.4 인터페이스 + 합성 → OCP + 전략 패턴

```java
public interface ConnectionMaker { Connection makeConnection(); }

public class UserDao {
    private ConnectionMaker connectionMaker;   // 인터페이스에만 의존
    public UserDao(ConnectionMaker cm) { this.connectionMaker = cm; }  // 외부 주입
    public void add(User u) { Connection c = connectionMaker.makeConnection(); ... }
}
```

- UserDao는 **새 DB 추가에도 변경 없음**(확장 O, 수정 X) = **OCP 만족**.
- 용어 매핑(**전략 패턴**): Context=UserDao, Strategy=ConnectionMaker, ConcreteStrategy=N/DConnectionMaker. → **전략 패턴은 OCP의 구현 도구**. (자바 PART 1의 DIP가 여기서 실현)


## 2.5 IoC (제어의 역전) + 프레임워크 vs 라이브러리

- **전통**: UserDao가 `new NConnectionMaker()`로 **자기가 결정·생성**.
- **IoC**: "어떤 구현체를 쓸지"의 결정권이 **외부로 넘어감**. 객체가 자신이 쓸 객체를 선택하지 않음.

| | 라이브러리 | 프레임워크 |
|---|---|---|
| 흐름 제어 | 내 코드 | 프레임워크 |
| 호출 방향 | 내 코드 → 라이브러리 | 프레임워크 → 내 코드 |

- **Hollywood Principle**: "Don't call us, we'll call you" → Spring이 프레임워크인 이유.
- **IoC 컨테이너**: 객체 생성·관계 설정·생명주기 관리 = Spring의 **ApplicationContext**.


## 2.6 ApplicationContext + DI + 싱글톤 레지스트리

```java
@Configuration
public class DaoFactory {
    @Bean public UserDao userDao() { return new UserDao(connectionMaker()); }
    @Bean public ConnectionMaker connectionMaker() { return new DConnectionMaker(); }
}
ApplicationContext ctx = new AnnotationConfigApplicationContext(DaoFactory.class);
UserDao dao = ctx.getBean("userDao", UserDao.class);
```

- **빈(Bean)**: Spring이 관리하는 객체. **BeanFactory**(기본) → **ApplicationContext**(확장, i18n·이벤트 등 + 실무 표준).
- **getBean()**: 빈 목록에서 찾고, 없으면 `@Bean` 호출해 생성·의존 주입.
- **싱글톤 레지스트리**: `getBean()`을 100번 호출해도 객체 1개. 모든 빈은 기본 싱글톤. **단 싱글톤 빈은 stateless여야 안전**(인스턴스 변수에 요청별 데이터 보관 ❌ → 자바 PART 7 동시성과 직결).
- **DI(의존관계 주입)**: 구체 의존 객체와 클라이언트를 **런타임에 연결**. ① 의존 ② 인터페이스 의존 ③ 외부 주입. 방식: **생성자 주입(권장)**, Setter, 필드. 생성자 주입 권장 이유: final 가능, 순환 참조 감지, 테스트 용이.
- **DI는 IoC의 한 형태**.

---


## 2.7 @Import — 설정 클래스 결합

- 여러 `@Configuration`을 한 곳에서 결합(`@Import({A.class, B.class})`). `@ComponentScan`(자동)과 달리 **명시적**. 컴포넌트 스캔 대상 밖(외부 라이브러리 `@Configuration`, 테스트 전용 빈) 등록에 사용. `@EnableXxx`도 내부적으로 @Import 활용.


# 📚 PART 3 — Spring MVC 내부와 REST API

> **목표**: 매일 쓰지만 내부는 모르는 DispatcherServlet 의 요청 처리 흐름과 REST API 설계.

## 3.1 Servlet의 한계 → Front Controller (왜 DispatcherServlet인가)

**로우레벨의 불편함**: 순수 Servlet은 URL마다 클래스를 만든다. URL이 수백 개면 Servlet이 폭증하고, 인증·로깅 같은 공통 처리가 모든 Servlet에 중복되며, URL 라우팅과 JSON 변환을 전부 수동 작성해야 한다.

**해결 — Front Controller 패턴**: 모든 요청을 한 곳에서 받아 적절한 처리기로 위임한다(전화 교환원 비유). 공통 처리를 한곳에 모으고 라우팅을 중앙화한다. Spring MVC의 **DispatcherServlet**이 정확히 이 역할이며, 그 정체는 **`HttpServlet`을 상속한 평범한 Servlet 하나**다. Spring Boot가 `/` 경로에 자동 등록한다.

위치 그림(요청이 흐르는 순서):
```
[Client] → [Servlet Container(Tomcat)] → [Filter Chain] → [DispatcherServlet]
        → [Interceptor Chain] → [Controller] → [Service/Repository(AOP)] → [DB]
```


## 3.2 DispatcherServlet 9단계 처리 흐름 (★★★ 면접 단골)

```
1. DispatcherServlet  HTTP 요청 수신
2. HandlerMapping     어떤 컨트롤러 메서드인지 탐색
3. HandlerAdapter     그 메서드를 통일된 방식으로 호출
4. Interceptor.preHandle   컨트롤러 호출 전
5. Controller         로직 실행 → (ModelAndView 또는 객체) 반환
6. Interceptor.postHandle  컨트롤러 호출 후, View 렌더 전
7. ViewResolver       View 이름 → View 객체 (REST면 HttpMessageConverter가 객체→JSON)
8. View.render()      HTML/JSON 응답 생성
9. Interceptor.afterCompletion  응답 완료 후(예외 포함)
```
모든 단계가 인터페이스로 추상화돼 빈 등록으로 확장 가능하다는 점이 Spring MVC의 핵심 강점이다.

- **HandlerMapping**: URL+HTTP 메서드 → 컨트롤러 메서드 매핑 테이블. 현대 표준은 `RequestMappingHandlerMapping`(`@GetMapping` 등 스캔). 같은 URL 중복 매핑 시 `AmbiguousMappingException`. 매핑 확인은 Actuator `/actuator/mappings`.
- **HandlerAdapter**(Adapter 패턴): 다양한 형태의 핸들러를 한 방식으로 호출. `RequestMappingHandlerAdapter`가 표준. 내부에서 **ArgumentResolver**가 `@PathVariable`/`@RequestParam`/`HttpServletRequest`/`@AuthenticationPrincipal` 등 파라미터를 타입별로 추출 — 커스텀 ArgumentResolver로 확장 가능(예: 인증 사용자 자동 주입).
- **HandlerInterceptor** 3메서드: `preHandle`(false 반환 시 컨트롤러·이후 인터셉터 모두 중단), `postHandle`, `afterCompletion`. 등록은 `WebMvcConfigurer.addInterceptors`로 `addPathPatterns`/`excludePathPatterns`.


## 3.3 요청 데이터 바인딩

| 어노테이션 | 추출 위치 | 용도 |
|---|---|---|
| `@PathVariable` | URL 경로 `/users/{id}` | 리소스 식별자 |
| `@RequestParam` | 쿼리/폼 `?name=` | 검색 조건·필터 |
| `@RequestBody` | HTTP body(JSON) | 복잡한 객체(POST/PUT) |
| `@ModelAttribute` | 쿼리+폼 → 객체 바인딩 | GET 다중 검색 조건 |

- **HttpMessageConverter**: `@RequestBody`/`@ResponseBody`의 실체. `MappingJackson2HttpMessageConverter`가 Jackson `ObjectMapper`로 JSON↔객체 변환. `JavaTimeModule`(LocalDateTime), `Include.NON_NULL` 등 커스터마이즈. **JPA Lazy 프록시를 그대로 직렬화하면 `LazyInitializationException`·무한 루프** → DTO 변환 / `@JsonIgnore` / fetch join으로 해결(데이터 접근 PART 3~5 연결).
- **Content Negotiation**: `Accept` 헤더로 응답 형식 결정. `produces`/`consumes`로 명시 가능.


## 3.4 응답 처리 — ViewResolver vs @RestController, ResponseEntity

- **ViewResolver**는 View 이름→View 객체(전통 SSR: Thymeleaf/JSP). SPA+REST 시대엔 거의 안 쓰고 `@RestController`가 ViewResolver를 건너뛰고 HttpMessageConverter로 직접 JSON 변환.
- `@RestController` = `@Controller` + `@ResponseBody`.
- **ResponseEntity**로 상태 코드·헤더·바디 직접 제어:
```java
return ResponseEntity.status(HttpStatus.CREATED)
    .header("Location", "/users/" + saved.getId()).body(saved); // 201
```
표준 코드: 200/201/204, 400/401/403/404/409, 500. (401=인증 실패, 403=권한 없음 — 스프링 PART 6와 직결)


## 3.5 Filter vs Interceptor vs AOP (★★★ 면접 단골 — 횡단 관심사 3도구)

세 도구는 "공통 처리를 어디서 거느냐"의 위치가 다르다.

| | Filter | Interceptor | AOP |
|---|---|---|---|
| 위치 | DispatcherServlet **외부** | DispatcherServlet **내부** | **메서드 단위** |
| 표준 | Servlet 표준 | Spring | Spring |
| Spring 빈 접근 | 제한적 | 가능 | 가능 |
| Handler 정보 | X | ✅(HandlerMethod) | ✅ |
| req/res 자체 변경 | ✅(Wrapper) | 어려움 | 인자/반환 |
| 적용 단위 | 전역 | URL 패턴 | 메서드 |
| 대표 활용 | Security·CORS·인코딩 | 인증·로깅·Rate Limit | 트랜잭션·비즈 로깅 |

호출 순서: `Filter → Interceptor.preHandle → AOP before → Controller → AOP after → Interceptor.postHandle → afterCompletion → Filter`.
선택 기준: 모든 요청 인코딩/CORS·Security → **Filter**(가장 외곽 차단), URL 패턴별 인증/로깅 → **Interceptor**, 메서드 단위 트랜잭션/감사 로그 → **AOP**(스프링 PART 4~5). 자기 호출 함정도 AOP에 그대로 적용(데이터 접근 PART 2.3).


## 3.6 예외 처리와 Bean Validation

- **HandlerExceptionResolver**가 컨트롤러 예외를 위임받아 처리. 핵심은 `@ExceptionHandler`(`ExceptionHandlerExceptionResolver`).
- **`@RestControllerAdvice`** 로 전역 예외 처리 → 모든 컨트롤러 예외를 한곳에서 표준 응답으로.
```java
@RestControllerAdvice
class GlobalExceptionHandler {
  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex){ ... } // 400
  @ExceptionHandler(EntityNotFoundException.class) ... // 404
  @ExceptionHandler(Exception.class) ... // 500 (운영에선 스택트레이스 숨김)
}
```
- **Bean Validation(@Valid)**: `@NotBlank`/`@Size`/`@Email`/`@Min` 등. 컨트롤러 파라미터에 `@Valid` 없으면 검증 안 됨. 실패 시 `MethodArgumentNotValidException`. 중첩 객체·리스트는 `@Valid` 재귀.
- 표준 에러 응답 5요소: `code`(프로그래밍 식별), `message`(사람용), `timestamp`, `path`, `errors`(필드별). 운영에서 스택트레이스·DB 메시지 노출 금지.


## 3.7 REST API 설계

- RESTful 원칙 6가지(Client-Server, Stateless, Cacheable, Uniform Interface, Layered, Code-on-Demand). URL은 **명사·복수형·계층**(`/users/{id}/orders`), 동사는 HTTP 메서드로.
- 메서드↔성공코드: GET 200, POST **201**, PUT 200/204, PATCH 200/204, DELETE **204**.
- **멱등성**: GET·PUT·DELETE 멱등, POST 비멱등(중복 생성 방지엔 Idempotency Key).
- **페이징**: `Pageable`(page/size/sort 자동 바인딩). **Page**(전체 count 쿼리 추가 — 페이지 번호 UI) vs **Slice**(size+1 조회, count 없음 — 무한 스크롤). 대용량 OFFSET 비용은 Cursor 기반(`afterId`)으로. 페이징+`OneToMany` fetch join은 메모리 페이징 위험 → `@BatchSize`(데이터 접근 PART 3~5).
- **문서화**: SpringDoc OpenAPI(`/swagger-ui.html`). 버저닝은 URL Path(`/api/v1`) 방식이 가장 명확.

---


# 📚 PART 4 — 프록시의 진화

> **목표**: 흩어진 관심사에서 출발해 수동 프록시의 한계와 동적 프록시 두 방식까지. AOP 의 전제다.

## 4.1 AOP의 동기 — 흩어진 관심사 (로그 추적기)

- **핵심 관점**(비즈니스 로직) vs **부가 관점**(로깅·트랜잭션·보안·캐싱)을 나눠 본다. 부가 관점은 여러 클래스에 반복 등장하는 **흩어진 관심사(Cross-cutting Concerns)** — OOP만으로 깔끔히 분리하기 어렵다.
- **로우레벨의 고통**: 로그 추적기(호출 깊이·실행 시간·예외 추적)를 넣으려면 **모든 메서드에 try-catch + 로그 시작/종료 코드**를 박아야 한다. 100개 메서드면 100군데 수정 = "배보다 배꼽".
- 변하지 않는 것(로그 시작/종료·시간 측정) vs 변하는 것(비즈니스 로직)의 분리가 핵심 → 이게 AOP가 풀려는 문제.


## 4.2 ThreadLocal — 싱글톤 환경의 동시성 해결

- **문제**: 로그 추적기는 싱글톤 빈. 여러 요청이 동시에 같은 인스턴스의 상태(트랜잭션 ID·호출 깊이)를 변경 → **서로 섞임**.
- **ThreadLocal**: 각 스레드마다 독립 저장소 제공(synchronized 없이 안전). `set/get`은 그 스레드만 본다. (자바 PART 7 동시성 + 스프링 PART 2 싱글톤과 직결)
- **⚠️ 치명적 함정 — `remove()` 필수**: 스레드 풀에서 스레드가 **재사용**되므로 값이 남아있으면 다음 요청에 **이전 사용자 데이터 노출**(보안 사고). 반드시 `finally`에서 `remove()`.


## 4.3 디자인 패턴의 진화 — 템플릿 메서드 → 전략 → 템플릿 콜백

> 스프링 PART 2에서 본 패턴들의 재등장. 여기에 **콜백**이 신규로 더해진다.

- **템플릿 메서드 패턴**: 슈퍼클래스에 변하지 않는 흐름, 변하는 부분만 자식 구현. **한계 = 상속의 강한 결합**(부모에 의존, 작업마다 클래스/익명클래스 필요).
- **전략 패턴**: 상속 대신 **합성(위임)**. Context는 Strategy 인터페이스에만 의존(= DI). 람다로 간결.
- **템플릿 콜백 패턴**(스프링 전용 용어): 전략을 **실행 시점에 파라미터로** 전달. `Context→Template`, `Strategy→Callback`. **콜백** = 인수로 넘겨 나중에 호출되는 실행 코드. → Spring의 `JdbcTemplate`·`RestTemplate`·`TransactionTemplate` 등 **`XxxTemplate` 시리즈**가 모두 이 패턴.
- **공통 한계**: 이 모든 방법은 결국 **원본 코드를 수정해야** 한다. → 프록시 등장.


## 4.4 프록시 개념과 조건

- **프록시(대리인)**: 클라이언트와 실제 객체 사이의 중간 객체. 클라이언트는 프록시를 호출 → 프록시가 부가 기능 후 실제 객체에 위임.
- **조건**: 클라이언트가 서버인지 프록시인지 몰라야 함 → **서버와 프록시가 같은 인터페이스 구현** + **DI로 주입** → 클라이언트 코드 변경 0.
- **기능 2가지**: 접근 제어(권한·캐싱·지연 로딩) / 부가 기능(로그·시간 측정).


## 4.5 프록시 패턴 vs 데코레이터 패턴 (의도로 구분)

- **모양은 같고 의도가 다르다.** 프록시 패턴 = **접근 제어**(캐시·권한·지연 로딩), 데코레이터 패턴 = **기능 추가**(로깅·꾸미기·시간 측정).
- 자바 I/O의 `BufferedReader`/`InputStreamReader`(자바 PART 6)가 데코레이터의 대표 사례.


## 4.6 동적 프록시 — Reflection → JDK 동적 프록시 → CGLIB

> **로우레벨의 고통**: 수동 프록시는 적용 대상 100개면 거의 같은 프록시 클래스 100개. 유지보수 지옥.

- **Reflection**(출발점): `method.invoke(target)`로 어떤 메서드든 동적 호출. 유연하지만 **컴파일 시점 오류 검출 불가** → 프레임워크 개발용.
- **JDK 동적 프록시**(인터페이스 필수): `InvocationHandler` 하나로 프록시 클래스를 **런타임 자동 생성**(`$Proxy1`). 구현체가 100개여도 핸들러 1개.
- **CGLIB**(구체 클래스 가능): **바이트코드 조작**으로 구체 클래스를 **상속**해 프록시 생성(`MethodInterceptor`). 인터페이스 없어도 OK. `final` 클래스/메서드엔 불가(상속 불가). → 데이터 접근 PART 3~5 JPA 프록시, 엔티티 final 금지의 이유와 연결.

| | JDK 동적 프록시 | CGLIB |
|---|---|---|
| 전제 | 인터페이스 필요 | 구체 클래스로 OK |
| 방식 | 인터페이스 구현 | 클래스 상속 |
| 핸들러 | `InvocationHandler` | `MethodInterceptor` |


# 📚 PART 5 — Spring AOP

> **목표**: 프록시를 프레임워크가 대신 만들어주는 층. ProxyFactory 에서 @Aspect 까지.

## 5.1 ProxyFactory — JDK/CGLIB 통합 + Advisor (★ 정점)

- **ProxyFactory**: 인터페이스 있으면 JDK, 구체 클래스면 CGLIB **자동 선택**(`proxyTargetClass=true`면 강제 CGLIB). **Spring Boot는 기본 CGLIB**(일관성).
- **Advice 추상화**: JDK(`InvocationHandler`)와 CGLIB(`MethodInterceptor`)를 개념적으로 통합. 개발자는 `org.aopalliance.intercept.MethodInterceptor`의 `invoke(MethodInvocation)`에서 `invocation.proceed()`만 감싸면 됨.
- **3대 개념** ⭐:

| 용어 | 의미 |
|---|---|
| **Pointcut** | "어디에" 적용할지 (필터링) |
| **Advice** | "어떤 로직"(부가 기능) |
| **Advisor** | Pointcut + Advice |

- 실무 표준 Pointcut: **`AspectJExpressionPointcut`**. 예: `execution(* hello.proxy.app..*(..))`.
- **Spring AOP 최적화**: target 1개당 **프록시 1개 + 어드바이저 N개**(여러 AOP 동시 적용해도). 순서는 등록 순서 / `@Order`.


## 5.2 빈 후처리기와 자동 프록시 생성기

- **로우레벨의 고통**: 빈 100개에 일일이 프록시 설정 = 설정 지옥. + `@Service`·`@Repository`로 **컴포넌트 스캔된 실제 객체**는 프록시로 바꿀 방법이 없음.
- **BeanPostProcessor**: 빈을 컨테이너 등록 **직전에 가로채** 객체를 교체/조작 → **프록시로 바꿔치기** 가능.
- **AnnotationAwareAspectJAutoProxyCreator**(`spring-boot-starter-aop`가 자동 등록하는 빈 후처리기): 등록된 모든 `Advisor`를 찾아 각 빈의 Pointcut 매칭 시 **프록시로 교체**. 이름 = Annotation 인식 + AspectJ 표현식 + AutoProxyCreator.


## 5.3 @Aspect와 AOP 용어 7가지

- **@Aspect**: AspectJ 어노테이션을 Spring이 차용. `@Aspect` 클래스 → **Advisor 자동 변환**. 단 **자동 빈 등록은 아님**(`@Component`/`@Bean`/`@Import` 필요).
- `@Around`(어드바이스+포인트컷), `ProceedingJoinPoint.proceed()`로 target 호출.

| 용어 | 의미 |
|---|---|
| 조인 포인트(Join point) | 부가 기능을 적용할 수 있는 **모든 지점** |
| 포인트컷(Pointcut) | 조인 포인트 중 **실제 적용할 곳 선택** |
| 어드바이스(Advice) | 적용할 **부가 기능** |
| 애스펙트(Aspect) | 포인트컷 + 어드바이스의 모듈 |
| 타겟(Target) | 부가 기능이 적용되는 실제 객체 |
| 위빙(Weaving) | 포인트컷으로 어드바이스를 결합(Spring AOP는 빈 후처리 시점) |
| AOP 프록시 | JDK 동적 프록시 또는 CGLIB |

- **AOP는 OOP를 대체하지 않고 보조한다**(횡단 관심사). 남용하면 흐름 추적·디버깅이 어려워짐.


## 5.4 어드바이스 5종 + @Pointcut 분리

- **@Around가 가장 강력**(전후 + 예외 + proceed 호출 여부 제어 + 반환/예외 변환). 나머지는 단순 케이스용: `@Before`, `@AfterReturning`, `@AfterThrowing`, `@After`(finally).
- `@Pointcut`으로 시그니처 분리 → 여러 어드바이스가 재사용(DRY). 별도 `Pointcuts` 클래스로 모으고 `&&`/`||`/`!`로 조합.


## 5.5 AspectJ vs Spring AOP

- **AspectJ**: 자체 컴파일러·문법, 기능 강력. AOP 적용 시점이 **컴파일/클래스 로딩 시점**.
- **Spring AOP**: AspectJ **문법만 차용**, **런타임 프록시 방식**. 별도 컴파일러 불필요. 메서드 조인 포인트만 지원.
- **중요 귀결**: Spring AOP는 항상 프록시를 거쳐야 하므로 **내부 호출(internal call)을 못 가로챈다**(데이터 접근 PART 2.3). AspectJ 컴파일 방식은 이 문제가 없다.

---


# 📚 PART 6 — Spring Security

> **목표**: 인증과 인가를 Filter Chain 으로 구현한 구조. Session 에서 JWT 와 OAuth2 까지.

## 6.1 인증 vs 인가, 인증 방식의 진화

- **Authentication(인증)**: 본인 맞는가 → 실패 시 **401**. **Authorization(인가)**: 그 자원에 접근 가능한가 → 실패 시 **403**. 인증 OK여도 인가 NO 가능. 권한 없는 사용자에게 401을 주면 정보 노출 — 반드시 403.
- **인증 방식 진화**: Basic(Base64=평문, HTTPS 필수) → **Session-Cookie**(서버 상태, 분산 어려움) → **Token/JWT**(Stateless, 분산 적합) → **OAuth2/OIDC**(권한 위임 표준). SPA+REST→JWT, MSA→JWT, 서드파티 통합→OAuth2.


## 6.2 Filter Chain 아키텍처 (★ 정점)

Spring Security는 **Servlet Filter로 동작** → DispatcherServlet 도달 전 차단/통과 결정(가장 외곽).
```
Filter Chain
 └ DelegatingFilterProxy → FilterChainProxy
     ├ SecurityContextPersistenceFilter   (Session↔SecurityContext 복원/저장)
     ├ UsernamePasswordAuthenticationFilter (/login POST 처리)
     ├ BasicAuthenticationFilter
     ├ ExceptionTranslationFilter          (인증→401/로그인, 인가→403)
     └ FilterSecurityInterceptor           (최종 인가 결정)
```
- **DelegatingFilterProxy**: 표준 Filter이나 처리는 Spring 빈으로 위임(DI 사용 가능). **FilterChainProxy**: URL별 적절한 SecurityFilterChain 선택.
- **SecurityContextHolder**: **ThreadLocal 기반**(자바 PART 7) — 어디서나 현재 사용자 접근. 비동기(`@Async`)에서 컨텍스트 손실 주의(전파 필요). 현재 사용자는 `@AuthenticationPrincipal` 또는 `Authentication` 주입으로.
- JWT 사용 시: 커스텀 `JwtAuthenticationFilter`를 `UsernamePasswordAuthenticationFilter` 앞에 추가하고 `SessionCreationPolicy.STATELESS`.


## 6.3 인증 처리 흐름

- **UserDetails / UserDetailsService**: 사용자 정보·조회 추상화(DB·LDAP·외부 API 교체 가능 — Strategy 패턴, 스프링 PART 2). password는 검증용으로만 노출(응답엔 절대 X).
- **흐름**: Filter가 토큰 생성 → `AuthenticationManager`(ProviderManager) → `DaoAuthenticationProvider`가 `loadUserByUsername` + `PasswordEncoder.matches` → 성공 시 인증 토큰 → SecurityContext 저장.
- **PasswordEncoder**: **BCrypt** 권장(Salt 자동 포함, 의도적으로 느림 → 무차별 대입 방어, strength 조정). MD5/SHA-1 금지. 같은 비밀번호도 매번 다른 해시(Salt).


## 6.4 인가 — URL vs 메서드 보안

- **URL 인가**(`HttpSecurity.authorizeHttpRequests`): `permitAll`/`authenticated`/`hasRole`/`hasAuthority`/`hasAnyRole`. **순서 중요**(구체→일반). Role은 `ROLE_` 접두사 자동, Authority는 그대로.
- **메서드 보안**(`@EnableMethodSecurity`): `@PreAuthorize("hasRole('ADMIN')")`, SpEL로 인자 참조(`#id == authentication.principal.id`), `@PostAuthorize`(반환 객체 검사), `@PreFilter/@PostFilter`(컬렉션). **AOP 기반** → 자기 호출 함정 동일. `@PostFilter`는 DB에서 전부 가져와 필터링하므로 성능 주의.


## 6.5 Session vs Token (★★ 면접 핵심)

| 측면 | Session | JWT |
|---|---|---|
| 상태 | Stateful(서버 보관) | Stateless |
| 저장 | 서버 메모리/Redis | 클라이언트 |
| 확장성 | Sticky/공유 저장소 | 자유 |
| 즉시 폐기 | ✅ | ❌(어려움) |
| 공격 | CSRF 위험 | XSS 위험(저장 위치) |
| 모바일/MSA | 부적합 | 적합 |

- Session 저장소: 메모리(다중 서버 공유 X) / **Redis**(공유·영속) / JDBC. Cookie 보안 속성: **HttpOnly**(XSS 방어)·**Secure**(HTTPS)·**SameSite**(CSRF 방어).
- 선택: 전통 웹 B2C→Session, SPA+REST/모바일/MSA→JWT, 즉시 차단 필수(결제)→짧은 JWT+Refresh 또는 Session.


## 6.6 JWT 완전 정복

- 구조 `Header.Payload.Signature`(Base64URL `.` 구분). Header `alg`: HS256(대칭, 단일 서버) vs **RS256**(비대칭, MSA 권장 — 비밀키 발급·공개키 검증). Payload 표준 Claim: `iss/sub/aud/exp/iat/nbf/jti` + 커스텀. **Payload는 암호화가 아니라 인코딩 → 민감정보 금지**. Signature는 위변조 방지(JWT는 암호화가 아니라 **서명**: 내용은 보이되 변조하면 들킴).
- Java 구현: **JJWT**로 `JwtTokenProvider`(생성/검증) + `JwtAuthenticationFilter`(`OncePerRequestFilter` 상속 — 요청당 1회). 검증은 보통 DB 조회 없이 서명만.
- **Refresh Token 전략**: Access(짧게 15분~1h) + Refresh(길게, Redis/DB 저장 → 즉시 폐기 가능). **Rotation**(사용 시마다 새 Refresh 발급, 옛것 무효 → 탈취 감지). 저장은 Access=메모리, Refresh=HttpOnly Cookie 권장.
- **보안 취약점**: `alg:none` 공격, 알고리즘 혼동(RS256↔HS256), 약한 키(**256비트+**), 탈취(HttpOnly Cookie+HTTPS+짧은 만료), Clock Skew(`clockSkewSeconds`), Payload 민감정보 노출. 검증 시 알고리즘 명시.


## 6.7 OAuth2 / OIDC

- **OAuth2**: 비밀번호 공유 없이 **권한만 위임**(발렛 키 비유). 4역할: Resource Owner(사용자)·Client(앱)·Authorization Server(권한 발급)·Resource Server(보호 자원).
- **Authorization Code Grant**(일반 웹): 로그인 페이지 리다이렉트 → 동의 → Authorization Code(한 번만) → 서버 간 Code↔Token 교환(client_secret 보호) → Access Token으로 API 호출. SPA/모바일은 **PKCE**로 secret 대체.
- **OIDC**: OAuth2(인가) 위에 **인증** 레이어 표준화 → **ID Token(JWT)** + 표준 `/userinfo`. ID Token=사용자 정보, Access Token=API 권한. Spring은 `spring-boot-starter-oauth2-client` + `oauth2Login`. 자체 OAuth2 Server는 보통 Keycloak/Auth0 같은 솔루션 사용.


## 6.8 웹 보안 — CSRF·XSS·CORS

- **CSRF**: 타 사이트가 사용자의 자동 전송 Cookie를 악용해 원치 않는 요청 유발. 방어: CSRF Token·**SameSite Cookie**·**JWT(Authorization 헤더는 자동 전송 X)**. Session+Cookie면 활성화, Stateless API면 비활성화 OK.
- **XSS**: 악성 JS를 타 사용자 브라우저에서 실행(Stored/Reflected/DOM). 방어: **출력 이스케이프**(Thymeleaf 자동, React/Vue 기본), 입력 검증, **CSP**, **HttpOnly Cookie**(Cookie 탈취 방지). JWT를 LocalStorage에 두면 XSS 취약 → HttpOnly Cookie 권장.
- **CORS**: Same-Origin Policy(scheme+host+port) 예외 허용. Simple Request vs **Preflight**(OPTIONS 먼저: `Access-Control-Allow-Origin/Methods/Headers`). `allowCredentials=true`면 `*` 와일드카드 불가 → 명시적 origin. SPA(`localhost:3000`)↔API(`8080`) 분리 시 필수, 같은 도메인+리버스 프록시면 불필요.

---


---

## 🎓 졸업 점검

**HTTP**
1. HTTP/1.1 의 HOL 블로킹을 HTTP/2 가 어떻게 푸는가? HTTP/3 가 더 푸는 것은?
2. TLS 핸드셰이크에서 대칭키와 비대칭키가 각각 어디에 쓰이는가?

**IoC·DI**
3. IoC 에서 무엇이 무엇으로 역전되는가? DI 와의 관계는?
4. 싱글톤 빈이 stateless 여야 하는 이유(동시성과 연결)?
5. 생성자 주입이 필드 주입보다 권장되는 이유 세 가지는?

**MVC**
6. DispatcherServlet 9단계를 순서대로?
7. Filter · Interceptor · AOP 의 적용 시점과 접근 가능한 정보의 차이는?
8. `@RestController` 와 `ViewResolver` 경로가 갈리는 지점은?

**프록시·AOP**
9. 수동 프록시 100개 문제 → JDK 동적 프록시 / CGLIB 가 각각 어떻게 해결하나? (전제 조건 차이)
10. Pointcut · Advice · Advisor 의 관계. target 1개에 AOP 여러 개면 프록시는 몇 개?
11. 프록시 패턴과 데코레이터 패턴을 무엇으로 구분하는가?

**Security**
12. Filter Chain 에서 인증과 인가가 각각 어느 필터에서 일어나는가?
13. Session 과 JWT 의 트레이드오프는? JWT 를 무효화하기 어려운 이유는?
14. CSRF 가 Stateless API 에서 덜 문제가 되는 이유는?

---

## ✅ 진도 체크리스트

```
[ ] 1  HTTP와 웹의 기초
[ ] 2  IoC와 DI
[ ] 3  Spring MVC 내부와 REST API
[ ] 4  프록시의 진화
[ ] 5  Spring AOP
[ ] 6  Spring Security
```

**실무 연결**: 프록시는 디버거로 확인해야 체감된다.
`@Transactional` 이 붙은 빈을 주입받아 `getClass()` 를 찍어보면
`$$SpringCGLIB$$` 가 보인다. 그것이 프록시이고, self-invocation 함정의 원인이다.
