# 🎯 테스트 — 검증에서 설계로

> **목적**: 테스트를 "통과 확인"이 아니라 **설계 도구**로 쓴다.
> JUnit 기초에서 시작해 테스트 더블, 스프링 테스트 슬라이스, Testcontainers 까지.
>
> **원본에서 고친 것**: 테스트가 **PART 9 와 PART 20 으로 두 동강** 나 있었고
> 그 사이에 11개 PART 가 끼어 있었다. 한 과목으로 합쳤다.
>
> **선행**: 자바 과목. 스프링 테스트 부분은 스프링 과목과 데이터 접근 과목이 전제다.
> 다만 PART 1~2 는 자바만 알아도 읽을 수 있다.

---

## 🧭 전체 지도 (한눈에)

```
  [1] 테스트 철학과 JUnit      ← 무엇을 왜 테스트하나
   ↓
  [2] 테스트 더블과 Mockito     ← 의존을 끊는 다섯 가지 방법
   ↓
  [3] 스프링 테스트             ← 컨텍스트를 얼마나 띄울까
   ↓
  [4] 통합 테스트와 품질        ← 운영과 같은 환경에서
```

순서의 이유: **[2] 를 [3] 보다 앞에** 둔다.
`@MockBean` 이 무엇을 하는지는 **테스트 더블의 분류**를 먼저 알아야 설명된다.
그리고 [4] 를 맨 뒤에 둔 것은 슬라이스 테스트의 한계를 겪어야
Testcontainers 가 무엇을 푸는지 보이기 때문이다.

### 기술 진화의 척추

| 영역 | 로우레벨(고통) | 중간 | 하이레벨(해결) |
|---|---|---|---|
| 검증 | main 에서 출력 보고 눈으로 | assert 문 | JUnit + 단정 라이브러리 |
| 의존 끊기 | 실제 DB·API 를 그대로 호출 | 손으로 만든 Fake | Mockito(Stub·Mock·Spy) |
| 스프링 컨텍스트 | 전체 컨텍스트(느림) | `@SpringBootTest` + 프로필 | 슬라이스(`@WebMvcTest` 등) |
| 테스트 환경 | 수동 세팅·로컬 DB 공유 | H2 인메모리 | Testcontainers(운영 동일) |
| 설계 | 코드 먼저 테스트 나중 | 테스트 나중에 추가 | TDD·BDD(테스트가 설계를 끌고 감) |

---

# 📚 PART 1 — 테스트 철학과 JUnit

> **목표**: 무엇을 왜 테스트하는지 정하고, JUnit 5 의 도구를 손에 익힌다.

## 1.1 테스트 철학

- 작성 이유 4가지: **회귀 방지**(가장 중요), **설계 도구**(테스트하기 어렵다=설계가 나쁘다), **살아있는 문서**, **자신감**(리팩토링 두려움 ↓).
- **FIRST**: Fast / Isolated(순서·외부 의존 X) / Repeatable(시간·환경 무관, `Clock` 주입) / Self-validating(assertion) / Timely. + **Given-When-Then** 가독성, 한글 메서드명("조건_상황_결과").
- **피라미드**: 단위 70% / 통합 20% / E2E 10%. 역피라미드·아이스크림 콘은 안티패턴(느리고 fragile → 안 돌리게 됨).


## 1.2 JUnit 테스트 입문

- **왜 테스트인가**: `main()` 검증은 매번 사람이 눈으로 판단·반복 → 비효율. **자동화 단위 테스트** = 코드가 코드를 검증. 조건: 자동화·격리·빠름·반복 가능.
- **assertThat + 매처(Hamcrest)**: `assertThat(actual, is(expected))` — 자연어처럼 읽힘. (`nullValue`, `containsString`, `greaterThan` 등)
- **실행 방식**: `@Test` 메서드마다 **새 인스턴스 생성** → 테스트 간 독립성 보장. `@BeforeEach`(각 테스트 전) vs `@BeforeAll`(전체 1회).
- **픽스처(Fixture)**: 테스트에 필요한 공통 준비물. `@BeforeEach`로 매번 새로 생성, 시작 상태 보장(`deleteAll()` 등).
- **통합 테스트 DB 잔여 데이터**: `@Transactional`, `@Sql`로 격리.


## 1.3 JUnit5 본격

- 어노테이션: `@Test/@BeforeEach/@AfterEach/@BeforeAll(static)/@DisplayName/@Nested/@ParameterizedTest`. `@Nested`로 컨텍스트 그룹화.
- **AssertJ**(`assertThat`...): 객체·컬렉션(`extracting`)·예외(`assertThatThrownBy`)·Optional·시간. 한 객체 여러 속성은 **Soft Assertion**(`assertAll`로 모든 실패 보고).
- **`@ParameterizedTest`** 소스 5종: `@ValueSource`/`@CsvSource`/`@CsvFileSource`/`@MethodSource`(`Stream<Arguments>`)/`@EnumSource`. 같은 로직·다른 입력이면 파라미터화.


# 📚 PART 2 — 테스트 더블과 Mockito

> **목표**: 의존을 끊는 다섯 가지 방법과 그 선택 기준. 과한 모킹이 왜 테스트를 망치는지.

## 2.1 Mockito 깊이 (★ 정점 — Test Double)

| | Stub | Mock | Spy | Fake |
|---|---|---|---|---|
| 검증 | 상태(반환값) | 행동(호출) | 둘 다 | 상태 |
| 진짜 동작 | X | X | 일부 | 단순화 |

- Stub=`when().thenReturn()`, Mock=`verify()`. Spy=진짜 객체+일부 stub(남용 주의), Fake=메모리 구현(In-Memory Repo). Dummy=인자 채우기.
- 기본: `@ExtendWith(MockitoExtension.class)` + `@Mock` + `@InjectMocks`. `verify(repo, times(2)/never()/atLeast())`, Argument Matchers(`any()/eq()/argThat()` — 섞을 때 모두 매처), void는 `doThrow().when()`, 인자 상세 검증은 **ArgumentCaptor**.
- 함정: final/static(→`Clock` 주입 권장)/private(→추출)/`new`(→Factory·빈 분리). Best Practice: 한 테스트=한 검증, 인터페이스 mock, Mock 5개+면 통합 테스트 신호.


## 2.2 TDD·BDD와 테스트 더블 전략

- **TDD** Red-Green-Refactor: 실패 테스트 → 최소 코드 → 개선. 장점: 설계 도구·회귀 안전망·과잉 설계 방지·자신감. 비즈 로직·알고리즘에 적합, UI·탐색적 작업엔 부적합. **Inside-Out**(도메인부터) vs **Outside-In**(컨트롤러부터, Mock).
- **BDD**: Given-When-Then으로 비즈니스 행동 표현, `@DisplayName`으로 의도 명시(Cucumber는 학습비용 ↑).
- 더블 전략: 외부 시스템·느린 작업·부작용·시간/랜덤 → **Mock**. 도메인 객체·값 객체·Repository(`@DataJpaTest`) → **진짜**. Mock 남용은 통합 테스트 전환 신호.


# 📚 PART 3 — 스프링 테스트

> **목표**: 컨텍스트를 얼마나 띄울지가 속도와 신뢰도를 가른다. 슬라이스와 MockMvc.

## 3.1 Spring 테스트 슬라이스

- `@SpringBootTest`(전체, 느림 — 남발 금지) 대신 필요한 슬라이스만: `@WebMvcTest`(Controller/Filter/Interceptor) / **`@DataJpaTest`**(Repository+EntityManager, 자동 트랜잭션 롤백·H2 기본) / `@JsonTest` / `@DataRedisTest`.
- `@DataJpaTest`: `TestEntityManager`로 준비 후 **`em.clear()`로 1차 캐시 비워** 진짜 SELECT 검증(데이터 접근 PART 3~5). 운영 DB 특화 기능은 `@AutoConfigureTestDatabase(replace=NONE)`+Testcontainers. 쿼리 카운터로 N+1도 테스트.
- `@Mock`(Mockito 단독) vs **`@MockBean`**(Spring 컨텍스트 주입 — 남발 시 컨텍스트 재생성으로 느림).


## 3.2 MockMvc

- 진짜 HTTP 서버 X, **DispatcherServlet 시뮬레이션**(빠름). `perform(get/post...).andExpect(status()..., jsonPath("$.id").value(...)).andDo(print())`. JsonPath로 배열·중첩·조건 검증.
- Validation 실패(400)·`@RestControllerAdvice`(404 등) 검증. Security는 **`@WithMockUser(roles=)`**(빠르고 충분) / `@WithUserDetails` / 실제 JWT 헤더. `@Import(SecurityConfig.class)`로 슬라이스에 포함.


# 📚 PART 4 — 통합 테스트와 품질

> **목표**: 운영과 같은 환경에서 검증하고, 테스트 자체의 품질을 측정한다.

## 4.1 통합 테스트와 Testcontainers (★ 정점)

- H2는 빠르나 운영 DB와 호환성 한계(JSON 함수·락 동작 차이). **Testcontainers**는 실제 MySQL/Redis/Kafka를 Docker로 띄워 운영과 동일 — 현대 표준.
- 기본: `@Testcontainers` + `@Container` + `@DynamicPropertySource`. Spring Boot 3.1+는 **`@ServiceConnection`**으로 보일러플레이트 제거(여러 컨테이너 조합 가능). 성능은 `withReuse(true)`+`testcontainers.reuse.enable`.
- 격리: `@Transactional` 롤백(빠르나 REQUIRES_NEW·비동기엔 함정) / `@AfterEach` 정리 / `@Sql`. 비동기 검증은 **Awaitility `await()`**.


## 4.2 테스트 품질 도구

- **Coverage(JaCoCo)**: Line/Branch/Method. 100%는 환상(실행≠검증, assertion 없어도 증가). 현실 목표: Line 70~80%, 핵심 로직 90%+, DTO/Entity 제외.
- **Mutation Testing(PIT)**: 코드를 의도적으로 변형 → 테스트가 깨지면 Killed(좋음), 통과하면 Survived(부족). Coverage의 질적 보완(매우 느림 → 정기 실행).
- **ArchUnit**: 아키텍처 규칙을 코드로 강제(레이어 의존성, 명명 규칙, **순환 참조 금지**, 필드 주입 금지 등). 코드 리뷰의 자동화 영역.

---


---

## 🎓 졸업 점검

1. 테스트 피라미드에서 각 층이 담당하는 것과 비율의 근거는?
2. Dummy · Stub · Spy · Mock · Fake 를 각각 한 문장으로 구분하면?
3. `verify` 를 남용하면 왜 테스트가 깨지기 쉬워지는가?
4. `@SpringBootTest` 와 `@WebMvcTest` 중 느린 쪽은? 그 대가로 얻는 것은?
5. `@MockBean` 이 컨텍스트 캐시를 깨뜨리는 이유는?
6. H2 로 테스트하면 놓치는 것은? Testcontainers 가 푸는 것은?
7. JPA 테스트에서 `flush` 와 `clear` 를 해야 진짜 SELECT 가 나가는 이유는?
8. 커버리지 100% 가 품질을 보장하지 않는 이유는?

---

## ✅ 진도 체크리스트

```
[ ] 1  테스트 철학과 JUnit
[ ] 2  테스트 더블과 Mockito
[ ] 3  스프링 테스트
[ ] 4  통합 테스트와 품질
```

**실무 연결**: 테스트 속도는 직접 재봐야 안다.
`@SpringBootTest` 와 슬라이스 테스트의 실행 시간을 비교하고,
`@MockBean` 을 하나 추가했을 때 컨텍스트가 다시 뜨는지 로그로 확인할 것.
