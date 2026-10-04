---
title: 10년 산 객체를 매번 다시 따라간다
summary: 대부분의 객체가 금방 죽는다는 관찰, 그리고 그것으로 전체 탐색을 피하는 방법
versionNote: Java 21 · HotSpot 기준
ord: 2
minutes: 26
edges:
  - { to: reachability, type: prerequisite }
  - { to: gc-evolution, type: deepens }
sources:
  - { label: Oracle - Garbage Collector Implementation, url: https://docs.oracle.com/en/java/javase/21/gctuning/garbage-collector-implementation.html }
  - { label: Oracle - HotSpot GC Tuning Guide, url: https://docs.oracle.com/en/java/javase/21/gctuning/index.html }
  - { label: Oracle - Java HotSpot VM Options, url: https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html }
---

[[reachability]] 끝에서 본 낭비다.

```java file=MostDieYoung.java
for (int i = 0; i < 1_000_000; i++) {
    String s = "item" + i;      // 만들자마자 버려진다
    process(s);
}
```

이 객체들은 **거의 즉시 가비지**가 된다.
그런데 GC 는 **애플리케이션 캐시에 10년 산 객체까지 매번 다시 표시**한다.
그것이 죽을 가능성은 거의 없는데도.

**낭비가 어디 있는지 보이면 그것을 피하는 설계가 나온다.**
그 설계가 세대별 GC 다.

## 0. 들어가기 전에 — 핵심 용어

- **약한 세대 가설**: 대부분의 객체는 **금방 죽고**, 오래된 객체가 젊은 객체를 참조하는 일은 드물다.
- **Young / Old**: 수명으로 나눈 두 영역. Young 은 다시 Eden 과 Survivor 로 나뉜다.
- **Minor GC**: Young 만 수집. 짧고 자주 일어난다.
- **Full GC**: Young + Old + Metaspace 를 전부 수집. 길고 드물게 일어난다.
- **승격(Promotion)**: Young 에서 여러 번 살아남은 객체를 Old 로 옮기는 것.
- **카드 테이블(Card Table)**: Old → Young 참조를 기록해둔 표. 세대별 GC 의 필수 장치다.

한 줄 그림: **수명 분포에 규칙이 있으면 전체를 안 훑고도 대부분을 잡을 수 있다.**

비유하자면 **책상과 서류함**이다.
오늘 쓴 종이는 **대부분 오늘 버린다.** 책상 위만 치우면 쓰레기의 90% 가 치워진다.
서류함에 10년 보관한 문서는 **이번에도 안 버릴 것**이 거의 확실하다.

**책상만 자주 치우고 서류함은 드물게** 보는 것이 효율적이다.
다만 서류함 문서가 책상 위 종이를 **참조하고 있으면** 그 종이는 못 버린다.
그 참조 목록을 따로 적어두는 것이 카드 테이블이다.

## 1. 그전엔 어떻게 했나 — 매번 전체를 훑기

[[reachability]] 의 Mark-Sweep-Compact 를 **힙 전체에** 적용한다.

```
GC 한 번 = 루트에서 살아있는 객체 전부를 따라가며 표시 + 회수 + 이동
```

### 고통 1 — 멈춤이 힙 크기에 비례한다

```
힙 1GB, 살아있는 객체 100만 개  → STW 수십 ms
힙 16GB, 살아있는 객체 2000만 개 → STW 수 초
```

**힙을 키우면 멈춤이 길어진다.** [[memory-areas]] 의 덧에서 본 그 교환이다.

메모리가 남아서 힙을 키웠는데 **응답 시간이 나빠진다.**
그래서 "메모리를 더 주면 빨라진다"는 직관이 깨진다.

### 고통 2 — 거의 전부가 헛일이다

```
GC 한 번에 표시한 객체 2000만 개
그중 이번에 죽은 것 = 1900만 개 (대부분 방금 만든 것)
오래 산 객체 100만 개는 이번에도 안 죽었다
```

**100만 개를 매번 다시 따라간다.** 그리고 그 결과는 **항상 같다.**
"아직 살아있다"다.

측정하면 GC 시간의 상당 부분이 **결과가 뻔한 객체를 확인하는 데** 쓰인다.

### 고통 3 — 할당이 느려진다

Mark-Sweep 만 하면 빈 공간이 흩어진다([[reachability]] 의 단편화).
그러면 **할당할 때 맞는 크기의 구멍을 찾아야** 한다.

```
가용 목록을 훑어 16바이트 들어갈 구멍 찾기 → O(n)
```

Compact 를 하면 해결되는데 **Compact 가 비싸다.**
살아있는 객체를 전부 옮기고 참조를 전부 고쳐야 한다.

### 고통 4 — 큰 객체와 작은 객체가 섞인다

```
[100MB 배열][16바이트][16바이트][50MB 배열][16바이트]...
```

**이동 비용이 천차만별**이다. 100MB 배열을 옮기는 것과
16바이트 객체를 옮기는 것이 같은 전략으로 다뤄진다.

그리고 큰 객체가 중간에 있으면 **그 양쪽의 단편화**를 만든다.

네 고통의 뿌리는 **하나**다. **수명이 다른 것을 같은 전략으로 다뤘다.**
[[memory-areas]] 에서 영역을 나눈 것과 **같은 종류의 통찰**이
Heap 안에서 한 번 더 필요했다.

## 2. 이렇게 피해봤다

### 시도 1 — GC 를 덜 자주 돌린다

힙을 키워 GC 빈도를 낮춘다.

**총 GC 시간은 줄어든다.** 그런데 **한 번의 멈춤이 길어진다**(고통 1).
처리량은 좋아지고 **응답 시간의 꼬리가 나빠진다.**

사용자 경험 관점에서는 **더 나쁜 경우가 많다.**
평균 응답 50ms 인데 100번에 한 번 3초면 그 한 번이 문제다.

### 시도 2 — GC 를 여러 스레드로 돌린다

코어가 여럿이니 표시 작업을 나눈다.

**실제로 효과가 있고 지금도 쓰인다**(Parallel GC).
멈춤 시간이 코어 수에 반비례해 줄어든다.

그런데 **여전히 전체를 훑는다**(고통 2).
그리고 코어를 4배 늘려도 멈춤이 4분의 1이 안 된다.
스레드 간 작업 분배와 동기화 비용이 있다.

### 시도 3 — 애플리케이션 스레드와 동시에 돌린다

멈추지 말고 **같이 돌리면** 된다.

**어려운 문제가 생긴다.** 표시하는 동안 참조가 바뀐다.

```
GC 가 A 를 표시했다 → 애플리케이션이 A 의 참조를 B 로 바꿨다 → B 는 표시 안 됐다
```

**살아있는 객체를 회수**할 수 있다. 이것을 막으려면
참조 변경을 추적하는 **쓰기 배리어**가 필요하고 그 비용이 든다.

CMS 와 G1 이 이 길을 갔고, 그것이 다음 글의 주제다.

### 시도 4 — 객체 풀을 써서 할당을 줄인다

```java file=ObjectPool.java
Account a = pool.borrow();
pool.giveBack(a);
```

**옛날에는 권장됐고 지금은 대개 역효과다.**

Young GC 가 **아주 싸졌기 때문**이다. 금방 죽는 객체는
사실상 공짜로 회수된다(뒤에서 본다). 반면 풀은
**객체를 오래 살려서 Old 로 승격**시키고, 그러면 **비싼 GC 의 대상**이 된다.

그리고 풀 관리 자체가 동시성 문제를 만든다.

> 네 시도의 공통점: **힙을 한 덩어리로 보는 전제를 유지했다.**
> 수명으로 나누면 "매번 전체"가 "매번 일부"가 된다.

## 3. 그래서 나온 것 — 수명으로 나눈다

### 관찰 — 약한 세대 가설

측정해보면 객체의 수명 분포가 이렇다.

```
객체 수
 │█
 │█
 │█
 │█▄
 │███▄▄▄______________________   ← 거의 전부가 왼쪽에 몰려 있다
 └─────────────────────────────
  방금 생성                 오래 생존
```

**두 가지 관찰**이다.

1. **대부분의 객체는 금방 죽는다.** 임시 변수, 반환값, 중간 계산 결과.
2. **오래된 객체가 젊은 객체를 참조하는 일은 드물다.** 보통 그 반대다.

두 번째가 덜 알려졌는데 **세대 분리를 가능하게 하는 핵심**이다.
Old 에서 Young 으로 가는 참조가 드물어야 **Young 만 따로 수집**할 수 있다.

### 설계 — 영역을 나누고 다르게 다룬다

```
Young Generation                    Old Generation
┌──────┬────────┬────────┐         ┌─────────────────┐
│ Eden │ From   │  To    │         │  장수 객체       │
└──────┴────────┴────────┘         └─────────────────┘
  새 객체    Survivor 둘             여러 번 살아남은 것
```

| | Young | Old |
| --- | --- | --- |
| 수집 빈도 | **자주** | 드물게 |
| 수집 범위 | Young 만 | 전체 |
| 생존율 | 매우 낮다 (5% 미만) | 매우 높다 |
| 전략 | **복사(Copy)** | Mark-Sweep-Compact |
| 멈춤 시간 | 짧다 (ms) | 길다 (수십~수천 ms) |

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 멈춤이 힙 크기에 비례 | Young 만 보므로 **Young 크기에 비례**. 힙을 키워도 Minor GC 는 짧다 |
| 거의 전부가 헛일 | Old 를 **안 따라간다.** 결과가 뻔한 것을 건너뛴다 |
| 할당이 느리다 | Eden 에서 **포인터만 밀면** 끝난다 |
| 큰 객체와 작은 객체가 섞인다 | 큰 객체는 **Old 에 직접** 할당한다 |

## 4. 어떻게 동작하나 — 객체 하나의 일생

```visual
id: generations-object-lifecycle
kind: step
title: 객체 하나가 태어나 죽거나 승격하기까지
steps:
  - name: 1. Eden 에 할당된다
    detail: 포인터를 밀기만 하면 끝난다. Eden 이 연속 공간이므로 빈 구멍을 찾을 필요가 없다. 할당이 거의 공짜인 이유다
    code: 포인터 증가 (bump the pointer)
  - name: 2. Eden 이 찬다 — Minor GC 가 돈다
    detail: Eden 과 사용 중인 Survivor 를 살펴 살아있는 것만 찾는다. Old 는 따라가지 않는다. 고통 2 의 해결이다
    code: Young 만 탐색
  - name: 3. 살아있는 것을 빈 Survivor 로 복사한다
    detail: 생존율이 5% 미만이므로 복사할 것이 거의 없다. 살아있는 것만 옮기고 Eden 을 통째로 비운다
    code: 생존자만 복사 · Eden 통째로 비움
  - name: 4. 그래서 Minor GC 가 아주 싸다
    detail: 죽은 객체를 하나하나 회수하지 않는다. 살아있는 것만 옮기고 나머지 공간을 그냥 재사용한다. 죽은 객체 수와 무관한 비용이다
    code: 생존자 수에만 비례한다
  - name: 5. Survivor 를 번갈아 쓴다
    detail: From 과 To 가 있고 복사할 때마다 역할을 바꾼다. 항상 한쪽이 비어 있으므로 복사 대상이 연속 공간이고 단편화가 생기지 않는다
    code: From ↔ To 스위칭
  - name: 6. 나이를 센다
    detail: 복사될 때마다 객체 헤더의 age 가 올라간다. 기본적으로 15번쯤 살아남으면 오래 살 객체로 판단한다
    code: age 증가 · MaxTenuringThreshold
  - name: 7. Old 로 승격한다
    detail: 임계값을 넘으면 Old 로 옮긴다. 이제 이 객체는 Minor GC 에서 안 보게 되고 Full GC 때만 검사된다
    code: Promotion
  - name: 8. Old 가 차면 Full GC
    detail: 여기서 비싼 비용이 든다. Old 전체를 Mark-Sweep-Compact 한다. 수백 ms 에서 수초까지 멈춘다
    code: 전체 탐색 + Compact + 긴 STW
```

**4번이 핵심**이다. Minor GC 의 비용이 **죽은 객체 수와 무관**하다.
1000만 개를 만들어 999만 9천 개가 죽으면,
**죽은 것은 아무 비용도 안 든다.** 살아남은 1천 개만 복사한다.

그래서 시도 4 의 객체 풀이 역효과인 것이다.
**금방 죽는 객체는 사실상 공짜**인데, 풀로 살려두면 Old 로 올려
**비싼 쪽의 짐**으로 만든다.

### Survivor 가 둘인 이유

```visual
id: generations-why-two-survivors
kind: structure
title: Survivor 를 둘로 둔 이유
nodes:
  - name: 복사 방식에는 빈 공간이 필요하다
    detail: 살아있는 객체를 어딘가로 옮겨야 하고 그 목적지가 연속으로 비어 있어야 단편화가 안 생긴다. 그 요구에서 Survivor 둘이 나온다
    code: 목적지가 비어 있어야 한다
    children:
      - name: Survivor 가 하나뿐이라면
        detail: 같은 영역 안에서 살아있는 것을 앞으로 모아야 한다. 그러면 Compact 를 하는 셈이 되어 복사의 이점이 사라진다
        code: 같은 영역 안에서 이동
        children:
          - name: 생기는 문제
            detail: 이미 있던 생존자와 새로 온 생존자가 섞인다. 나이가 다른 객체가 뒤섞여 어느 것을 승격할지 판단이 복잡해진다
            code: 나이가 섞인다
      - name: Survivor 가 둘이면
        detail: 한쪽은 항상 비어 있다. Eden 과 사용 중인 Survivor 의 생존자를 빈 쪽으로 모두 옮기고 양쪽을 통째로 비운다
        code: From → To 로 한 방향 복사
        children:
          - name: 항상 연속 공간
            detail: 목적지가 비어 있으므로 앞에서부터 차곡차곡 쌓인다. 단편화가 원천적으로 안 생긴다
            code: 단편화 없음
          - name: 나이가 정리된다
            detail: 복사될 때마다 age 가 하나 오른다. 같은 Survivor 안의 객체들이 비슷한 나이가 되어 승격 판단이 단순해진다
            code: age 관리가 쉽다
          - name: 역할이 번갈아 바뀐다
            detail: 다음 Minor GC 에서는 방금 채운 쪽이 From 이 되고 비운 쪽이 To 가 된다. 그래서 둘만 있으면 충분하다
            code: From ↔ To 스위칭
      - name: Survivor 가 작으면 바로 Old 로 간다
        detail: 생존자가 Survivor 에 안 들어가면 나이와 무관하게 Old 로 직행한다. 이것이 조기 승격이고 Full GC 를 앞당긴다
        code: Premature Promotion
        children:
          - name: 증상
            detail: Old 가 빨리 차고 Full GC 가 자주 난다. Young 을 키우거나 SurvivorRatio 를 조정하면 완화된다
            code: Full GC 빈발
```

### 세대 간 참조를 어떻게 추적하나

**약한 세대 가설의 두 번째 관찰**이 필요한 이유다.

```java file=OldToYoung.java
class Cache {                      // Old 에 있다
    private Account recent;        // Young 의 객체를 가리킨다
}
```

Minor GC 는 **Old 를 안 따라간다.** 그런데 Old 의 객체가
Young 의 객체를 가리키고 있으면 **그 Young 객체는 살아있다.**

안 따라가면 **살아있는 객체를 회수**해버린다.

```visual
id: generations-card-table
kind: step
title: Old → Young 참조를 Minor GC 가 놓치지 않는 방법
steps:
  - name: 문제 — Minor GC 는 Old 를 안 따라간다
    detail: 효율을 위해 Old 를 탐색에서 뺐다. 그런데 Old 의 객체가 Young 을 가리키면 그 Young 객체는 루트에서 도달 가능하다
    code: Old 를 건너뛰면 놓친다
  - name: 순진한 해결 — 그럼 Old 도 훑는다
    detail: 정확하지만 고통 2 로 되돌아간다. 전체를 훑는 것과 같아져 세대 분리의 의미가 없어진다
    code: 효율이 사라진다
  - name: 관찰 — 그런 참조는 드물다
    detail: 약한 세대 가설의 두 번째 절반이다. 보통은 젊은 객체가 오래된 것을 가리키고 그 반대는 적다
    code: 드물면 기록할 만하다
  - name: 해결 — 참조가 생길 때 기록해둔다
    detail: Old 의 객체 필드에 참조를 쓸 때 그 영역을 더럽혀졌다고 표시한다. 힙을 512바이트 단위 카드로 나눠 비트 하나씩 둔다
    code: Card Table · 카드당 1바이트
  - name: 쓰기 배리어가 그 표시를 한다
    detail: 참조 대입마다 코드가 삽입된다. JIT 가 넣어주고 비용은 명령 몇 개다. 참조 카운팅의 원자적 증감보다 훨씬 싸다
    code: Write Barrier
  - name: Minor GC 가 더럽혀진 카드만 본다
    detail: Old 전체가 아니라 표시된 카드의 객체만 추가 루트로 쓴다. 드물게 더럽혀지므로 비용이 작다
    code: dirty card 만 추가 탐색
  - name: 그래서 세대 분리가 성립한다
    detail: 두 번째 관찰이 없으면 이 장치가 너무 비싸져 세대별 GC 자체가 성립하지 않는다. 가설의 두 절반이 둘 다 필요하다
    code: 가설 → 설계 → 장치
```

**[[reachability]] 의 "대입은 공짜"가 정확히는 "거의 공짜"**다.
참조 대입에 쓰기 배리어가 붙는다. 다만 참조 카운팅의
원자적 증감보다 **훨씬 싸다.** 비트 하나를 세팅하는 것뿐이다.

### 확인하고 조정하는 법

```bash file=terminal
$ java -Xlog:gc MyApp
[0.312s][info][gc] GC(0) Pause Young (Normal) 24M->3M(256M) 2.841ms
[1.204s][info][gc] GC(1) Pause Young (Normal) 27M->4M(256M) 3.102ms
[8.551s][info][gc] GC(9) Pause Full (Allocation Failure) 198M->41M(256M) 412.3ms
```

**읽는 법**이 있다.

```
Pause Young 2.841ms    → Minor GC. 짧다. 정상
24M->3M                → 24MB 중 3MB 만 살아남았다. 생존율 12%. 정상
Pause Full 412.3ms     → Full GC. 길다. 빈번하면 문제
```

```bash file=terminal
$ jstat -gcutil <pid> 1000
  S0     S1     E      O      M     YGC   YGCT    FGC    FGCT
  0.00  48.21  62.33  31.05  94.22   142   0.831     2   0.721
```

**`YGC` 와 `FGC` 의 비율**이 건강 지표다.
Full GC 가 Young GC 의 1% 를 넘으면 들여다볼 만하다.

```visual
id: generations-tuning-decision
kind: playground
title: 이 증상에는 무엇을 보고 무엇을 조정하나
inputs:
  - { name: 증상, label: 증상, options: [Minor GC 가 너무 자주, Full GC 가 자주, Minor GC 가 느리다, Old 가 계속 증가, 응답 시간이 간헐적으로 튄다] }
  - { name: 확인, label: 로그에서 본 것, options: [Young 생존율이 높다, Young 생존율이 낮다, Full GC 후에도 Old 가 안 줄어든다, Young 이 작다] }
outcomes:
  - when: { 증상: Minor GC 가 너무 자주, 확인: Young 이 작다 }
    result: Young 을 키운다. -Xmn 이나 NewRatio 를 조정한다
    note: Eden 이 작으면 금방 차서 자주 돈다. 다만 Young 을 키우면 한 번의 Minor GC 가 조금 길어진다. 빈도와 길이의 교환이다
  - when: { 증상: Full GC 가 자주, 확인: Young 생존율이 높다 }
    result: 조기 승격을 의심한다. Survivor 가 작아 생존자가 Old 로 직행하고 있다
    note: SurvivorRatio 를 낮춰 Survivor 를 키우거나 Young 전체를 키운다. 생존율이 높은 것 자체가 약한 세대 가설에서 벗어난 신호다
  - when: { 증상: Full GC 가 자주, 확인: Full GC 후에도 Old 가 안 줄어든다 }
    result: 누수다. 튜닝이 아니라 코드를 봐야 한다
    note: reachability 의 누수 패턴을 본다. 힙 덤프를 떠서 GC 루트까지의 경로를 확인하는 것이 유일한 해결이다
  - when: { 증상: Old 가 계속 증가, 확인: Full GC 후에도 Old 가 안 줄어든다 }
    result: 누수다. static 컬렉션, 리스너, 상한 없는 캐시, ThreadLocal 을 먼저 본다
    note: 힙을 키우는 것은 터지는 시점만 늦춘다. Docker 과목의 cgroups 에서 본 것과 같은 판단이다
  - when: { 증상: Minor GC 가 느리다, 확인: Young 생존율이 높다 }
    result: 복사할 것이 많다는 뜻이다. Minor GC 비용은 생존자 수에 비례한다
    note: 객체를 오래 살리는 패턴을 찾는다. 객체 풀이나 긴 수명 컬렉션에 임시 객체를 담는 경우다
  - when: { 증상: 응답 시간이 간헐적으로 튄다 }
    result: Full GC 의 STW 를 의심한다. GC 로그와 응답 시간 로그의 시각을 맞춰본다
    note: 평균은 괜찮은데 p99 가 나쁜 전형적 패턴이다. 세대 분리로도 Full GC 는 남는다. 다음 글의 주제다
  - when: { 확인: Young 생존율이 낮다 }
    result: 정상이다. 약한 세대 가설이 잘 성립하는 상태다
    note: 생존율 5% 미만이면 Minor GC 가 거의 공짜다. 이 경우 객체를 많이 만드는 것 자체는 문제가 아니다
```

## 5. 이것도 끝이 아니다 — Full GC 는 여전히 남는다

세대 분리로 **대부분의 가비지를 싸게** 잡게 됐다.
Minor GC 는 수 ms 고, 죽은 객체는 공짜다.

그런데 **Old 가 차면 여전히 비싸다.**

```
[8.551s] Pause Full 198M->41M(256M) 412.3ms
```

**412ms 멈춤**이다. 그리고 힙이 커지면 이것이 늘어난다.

```
힙 2GB   → Full GC 수백 ms
힙 32GB  → Full GC 수 초
힙 128GB → Full GC 수십 초
```

고통 1 이 **Old 안에서 그대로 재현**된다.
세대를 나눈 것이 Young 의 문제는 풀었지만 **Old 의 문제는 미뤘을 뿐**이다.

그리고 요즘 서버는 힙이 **수십 GB** 다. 수 초 멈춤은 받아들일 수 없다.

```
사용자 요청이 타임아웃된다
로드 밸런서가 헬스체크 실패로 판단해 노드를 빼버린다
클러스터 멤버십이 끊긴다
```

**멈추지 않고 수집하는 방법**이 필요해졌다.
시도 3 에서 "애플리케이션과 동시에 돌리면 어떤가"를 꺼내고
**"살아있는 객체를 회수할 수 있다"**는 문제로 접었다.

그 문제를 **실제로 푼** GC 들이 있다. Serial 에서 ZGC 까지의 진화가
전부 **"어떻게 덜 멈출까"** 한 가지 질문의 답들이다.

[[gc-evolution]] 에서 본다. PART 3 의 마지막이다.

## 자기 점검

- 약한 세대 가설의 두 가지 관찰은? 둘 다 왜 필요한가?
- Minor GC 의 비용이 죽은 객체 수와 무관한 이유는?
- Survivor 가 둘인 이유를 단편화와 나이 관리로 설명하면?
- 카드 테이블이 없으면 무슨 일이 생기는가?
- 객체 풀이 요즘 대개 역효과인 이유는?

## 덧 — 흔한 오해

### "큰 객체도 Eden 에 먼저 간다"

**일정 크기를 넘으면 Old 에 직접 할당**된다.

고통 4 의 해결이다. 큰 배열을 Eden 에 넣으면
**Survivor 로 복사하는 비용이 크고** Survivor 를 금방 채운다.

G1 은 다르게 처리한다. **거대 리전(Humongous Region)** 을 따로 둬서
리전 절반보다 큰 객체를 거기 넣고 Old 취급한다. 다음 글에서 본다.

그래서 **큰 배열을 자주 만들고 버리는 패턴**이 특히 나쁘다.
Young 의 저렴함을 못 쓰고 바로 Old 를 압박한다.

### "Full GC 는 Old 만 수집한다"

**Young 까지 전부 수집한다.** 이름이 혼란스럽다.

```
Minor GC  → Young 만
Full GC   → Young + Old + Metaspace 전부
```

그리고 **Metaspace 가 차도 Full GC 가 난다.**
[[memory-areas]] 에서 본 `OutOfMemoryError: Metaspace` 전에
Full GC 가 반복되는 현상이 그것이다.

GC 로그에서 원인을 보면 구분된다.

```
Pause Full (Allocation Failure)    → 힙이 찼다
Pause Full (Metadata GC Threshold) → Metaspace 가 찼다
Pause Full (System.gc())           → 누가 불렀다. reachability 의 덧 참조
```

### "세대별 GC 는 모든 애플리케이션에 유리하다"

**약한 세대 가설이 성립해야** 유리하다. 안 맞는 워크로드가 있다.

```
캐시 서버    → 거의 모든 객체가 오래 산다. 생존율이 높다
배치 처리    → 큰 객체를 오래 들고 있다
스트리밍     → 객체 수명이 중간 정도로 고르게 분포한다
```

생존율이 높으면 **Minor GC 의 복사 비용**이 커진다.
Minor GC 가 공짜인 전제가 "거의 다 죽는다"였기 때문이다.

그래서 **세대를 아예 없앤 GC** 도 나왔다.
ZGC 와 Shenandoah 가 세대 구분 없이 동작했고,
Java 21 의 Generational ZGC 가 다시 세대를 도입했다.

**가설이 맞는 정도에 따라 설계가 갈린다**는 것이 다음 글의 배경이다.
