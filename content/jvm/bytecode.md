---
title: 같은 .class 가 어디서나 도는 이유
summary: 바이트코드와 상수 풀, 그리고 컴파일러가 주소를 모르면서 호출 코드를 만드는 방법
versionNote: Java 21 기준
ord: 4
minutes: 26
edges:
  - { to: method-dispatch, type: prerequisite }
  - { to: memory-areas, type: prerequisite }
sources:
  - { label: JVM Specification - The class File Format, url: https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html }
  - { label: JVM Specification - Linking and Resolution, url: https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html }
  - { label: Oracle - javap, url: https://docs.oracle.com/en/java/javase/21/docs/specs/man/javap.html }
---

[[method-dispatch]] 끝에서 두 질문을 남겼다.

```
9: invokevirtual #7    // Account.deposit
```

**`#7` 이 무엇인가.** 그리고 컴파일러가 **주소를 모르는데** 어떻게 호출 코드를 만드나.

그리고 더 큰 질문이 있다.

```
같은 .class 파일이 윈도우에서도 리눅스에서도 ARM 맥에서도 돈다
```

C 는 플랫폼마다 다시 컴파일해야 한다. [[multi-arch]] 에서 본
`exec format error` 가 그 증거다. **자바는 왜 안 그런가.**

두 질문의 답이 같은 곳에 있다.

## 0. 들어가기 전에 — 핵심 용어

- **바이트코드**: `.class` 안의 명령어. **가상의 CPU** 를 위한 기계어다.
- **스택 머신**: 레지스터 대신 **오퍼랜드 스택**으로 계산하는 방식. JVM 이 그렇다.
- **상수 풀(Constant Pool)**: `.class` 안의 **이름과 상수 목록**. `#숫자` 가 그 인덱스다.
- **심볼 참조**: 주소가 아니라 **이름으로** 가리키는 것.
- **해석(resolution)**: 심볼 참조를 실제 위치로 바꾸는 것. **런타임에** 한다.
- **JIT**: 바이트코드를 실제 CPU 명령으로 번역하는 컴파일러.

한 줄 그림: **플랫폼에 의존하는 결정을 전부 런타임으로 미뤘다. 그 미루기의 수단이 심볼 참조다.**

비유하자면 **번지수 대신 이름을 적은 편지**다.
"서울 종로구 1번지"라고 적으면 그 집이 이사하면 못 간다(주소).
**"김철수 씨"**라고 적고 우체국이 현재 주소를 찾게 하면
이사해도 도착한다(심볼 참조).

대신 **우체국이 한 번 찾아야** 한다. 그 비용이 자바의 간접성이다.

## 1. 그전엔 어떻게 했나 — 플랫폼마다 다시 컴파일

C 는 **그 CPU 의 기계어**로 컴파일한다.

```bash file=terminal
$ gcc hello.c -o hello-x86      # x86 리눅스에서
$ ./hello                        # 돈다
$ scp hello arm-server:          # ARM 서버로 옮기면
$ ./hello
bash: ./hello: cannot execute binary file: Exec format error
```

[[multi-arch]] 에서 본 그 오류다. **CPU 가 그 명령어를 모른다.**

### 고통 1 — 조합마다 빌드해야 한다

```
x86 리눅스 · ARM 리눅스 · x86 윈도우 · ARM 맥 · x86 맥 ...
```

**조합마다 빌드 환경이 필요하다.** 크로스 컴파일 툴체인을 맞추고,
각 플랫폼의 라이브러리 버전을 관리하고, **테스트도 각각** 해야 한다.

배포할 때도 **어느 것을 줄지** 사용자가 고르거나 설치 스크립트가 판단해야 한다.

### 고통 2 — 링크 시점에 주소가 고정된다

```c file=staticLink.c
extern void helper();
void main() { helper(); }       // 링커가 helper 의 주소를 박아 넣는다
```

**라이브러리를 바꾸면 다시 링크해야 한다.** 동적 링크(`.so`, `.dll`)가
이것을 완화했는데, 그러면 **버전 지옥**이 생긴다.

```bash file=terminal
$ ./app
error while loading shared libraries: libfoo.so.2: cannot open shared object file
```

그리고 **ABI 가 조금만 바뀌면** 조용히 깨진다.
구조체 필드 순서가 바뀌면 컴파일은 되는데 **엉뚱한 값**을 읽는다.

### 고통 3 — 클래스를 런타임에 추가할 수 없다

```c file=noDynamicLoad.c
// 실행 중에 새 타입을 만들어 쓰는 방법이 없다
```

컴파일 시점에 **모든 타입이 확정**되어야 한다.
플러그인 구조를 만들려면 `dlopen` 같은 것으로 직접 해야 하고,
타입 정보가 없으므로 **함수 포인터 규약을 손으로 맞춰야** 한다.

### 고통 4 — 최적화를 미리 결정해야 한다

```bash file=terminal
$ gcc -O2 -march=native app.c    # 이 CPU 에 맞춰 최적화
```

**`-march=native` 로 빌드하면 그 CPU 에서만 빠르고 다른 데서는 안 돌 수도 있다.**
범용으로 빌드하면 **최신 CPU 의 명령어를 못 쓴다.**

그리고 **실행 중의 정보를 못 쓴다.** 어느 분기가 자주 타는지,
어느 타입이 실제로 들어오는지는 **돌려봐야** 아는데
컴파일은 이미 끝났다.

네 고통의 뿌리는 **하나**다. **플랫폼과 결합하는 결정을 너무 일찍 했다.**

## 2. 이렇게 피해봤다

### 시도 1 — 소스를 배포하고 각자 컴파일한다

유닉스 세계의 방식이다. `./configure && make`.

**컴파일러와 의존 라이브러리가 그 기계에 있어야** 한다.
그리고 빌드가 **몇 분에서 몇 시간** 걸린다.
사용자에게 컴파일 환경을 요구하는 것이 현실적이지 않다.

### 시도 2 — 인터프리터를 쓴다

소스를 그대로 읽어 한 줄씩 실행한다. 셸 스크립트나 초기 BASIC 이 그렇다.

**느리다.** 매번 파싱하고 매번 해석한다.
그리고 **문법 오류를 실행해봐야** 안다.

### 시도 3 — 모든 플랫폼 바이너리를 한 파일에 넣는다

맥의 유니버설 바이너리가 이 방식이다. 실제로 쓰인다.

**파일이 커지고** 새 플랫폼이 생기면 다시 빌드해야 한다.
[[multi-arch]] 의 매니페스트 리스트가 컨테이너에서 같은 접근이다.
**N개 플랫폼을 미리 아는** 경우에만 쓸 수 있다.

> 세 시도의 공통점: **컴파일 시점을 앞이나 뒤로 옮겼다.**
> 자바는 **둘로 쪼갰다.** 앞에서 할 것과 뒤에서 할 것을 나눈 것이다.

## 3. 그래서 나온 것 — 컴파일을 두 번 한다

```
.java  --javac-->  .class (바이트코드)  --JIT-->  기계어
       컴파일 시점                       런타임
```

**앞의 컴파일은 플랫폼을 모른다.** 문법 검사, 타입 검사,
그리고 **가상 CPU 를 위한 명령어** 생성까지만 한다.

**뒤의 컴파일이 플랫폼을 안다.** 실제 CPU 명령으로 번역하고,
그 CPU 의 특수 명령어를 쓰고, **실행 중 관찰한 정보로** 최적화한다.

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 조합마다 빌드 | `.class` 하나. **JVM 이 플랫폼을 흡수한다** |
| 링크 시점에 주소 고정 | **심볼 참조.** 런타임에 해석한다 |
| 런타임에 타입 추가 불가 | 클래스로더가 **실행 중에 로딩**한다 |
| 최적화를 미리 결정 | JIT 가 **실행 정보를 보고** 결정한다 |

고통 4 의 해결이 특히 중요하다. [[method-dispatch]] 에서 본
**역가상화와 인라인 캐시**가 가능한 이유가 이것이다.
C 의 AOT 컴파일러는 "실제로 어느 타입이 들어오나"를 알 수 없다.

## 4. 어떻게 동작하나 — `#7` 의 정체

```java file=Simple.java
class Simple {
    void run() {
        Account a = new SavingsAccount();
        a.deposit(1000);
    }
}
```

```bash file=terminal
$ javap -c Simple.class
  void run();
     0: new           #7     // class SavingsAccount
     3: dup
     4: invokespecial #9     // Method SavingsAccount."<init>":()V
     7: astore_1
     8: aload_1
     9: ldc2_w        #10    // long 1000l
    12: invokevirtual #12    // Method Account.deposit:(J)V
    15: return
```

**`#숫자` 가 전부 상수 풀 인덱스**다.

```bash file=terminal
$ javap -v Simple.class | head -20
Constant pool:
   #7 = Class              #8      // SavingsAccount
   #8 = Utf8               SavingsAccount
   #9 = Methodref          #7.#11  // SavingsAccount."<init>":()V
  #12 = Methodref         #13.#15  // Account.deposit:(J)V
```

**이름의 집합**이다. 주소가 하나도 없다.

```visual
id: bytecode-symbolic-reference
kind: step
title: 컴파일러가 주소를 모르면서 호출 코드를 만드는 방법
steps:
  - name: 문제 — 컴파일 시점에는 주소를 알 수 없다
    detail: Account 클래스가 아직 로딩되지 않았고, 어디에 로딩될지도 모른다. 심지어 실행할 때마 다른 위치일 수 있다
    code: 주소를 적을 수 없다
  - name: 해결 — 이름을 적어둔다
    detail: 클래스명, 메서드명, 시그니처를 문자열로 상수 풀에 넣고 그 인덱스를 명령에 적는다. 이것이 심볼 참조다
    code: invokevirtual #12
  - name: 상수 풀이 이름을 보관한다
    detail: #12 는 Methodref 이고 그것이 다시 클래스와 이름과 시그니처를 가리킨다. 중복된 문자열을 한 번만 저장하는 구조다
    code: "#12 → Account.deposit:(J)V"
  - name: 클래스 로딩 — 이름으로 클래스를 찾는다
    detail: 클래스로더가 Account 를 찾아 Method Area 에 올린다. 이 시점에 비로소 실제 위치가 생긴다
    code: 클래스로더가 Method Area 에 배치
  - name: 첫 호출 — 해석한다
    detail: #12 라는 이름을 실제 vtable 슬롯 번호로 바꾼다. method-dispatch 에서 본 그 슬롯이다
    code: "#12 → vtable 슬롯 0"
  - name: 해석 결과를 캐싱한다
    detail: 한 번만 해석하고 그 뒤로는 바로 쓴다. 지연 해석이라고 부른다. 그래서 첫 호출만 느리다
    code: 두 번째부터는 캐시
  - name: 그래서 플랫폼 독립이 가능하다
    detail: .class 안에 플랫폼에 의존하는 것이 하나도 없다. 주소도 레지스터 번호도 없다. 전부 이름과 가상 명령어뿐이다
    code: 플랫폼 결정을 런타임으로 미룸
  - name: 그리고 JIT 가 최적화할 여지가 남는다
    detail: 해석 시점에 실제로 무엇이 로딩됐는지 알 수 있다. 구현체가 하나뿐이면 직통 호출로 바꿀 수 있다
    code: 역가상화의 근거
```

**`#7` 은 "상수 풀 7번에 적힌 이름"**이다. 그 이상도 이하도 아니다.

### 스택 머신이라 레지스터가 없다

플랫폼 독립의 **또 다른 조건**이다.

```visual
id: bytecode-stack-machine
kind: structure
title: 왜 레지스터 대신 스택을 쓰나
nodes:
  - name: 바이트코드에 플랫폼 의존이 없어야 한다
    detail: 주소를 안 적는 것만으로는 부족하다. 레지스터 번호도 CPU 마다 다르므로 그것도 안 적어야 한다
    code: 주소도 레지스터도 없어야 한다
    children:
      - name: 실제 CPU — 레지스터 머신
        detail: x86 은 레지스터가 16개쯤, ARM 은 31개쯤이고 이름도 다르다. 어느 값을 어느 레지스터에 둘지가 기계어에 박힌다
        code: add rax, rbx
        children:
          - name: 그래서 이식이 안 된다
            detail: x86 의 rax 를 ARM 이 모른다. 레지스터 번호를 적는 순간 그 CPU 에 묶인다
            code: CPU 종속
      - name: JVM — 스택 머신
        detail: 레지스터를 안 쓰고 오퍼랜드 스택에 쌓아 계산한다. 명령어에 번호가 없으니 어느 CPU 에서도 해석할 수 있다
        code: iload_1 · iload_2 · iadd
        children:
          - name: a + b 를 어떻게 하나
            detail: a 를 스택에 올리고 b 를 올리고 iadd 를 부른다. iadd 는 스택 위 두 개를 꺼내 더하고 결과를 올린다. 어디에 있는지를 안 적는다
            code: 스택 위 두 개를 더한다
          - name: 명령어가 짧아진다
            detail: 오퍼랜드를 안 적으니 명령어가 1바이트로 끝나는 경우가 많다. class 파일이 작아지고 전송과 로딩이 빠르다
            code: 대부분 1~3바이트
          - name: 대신 명령 수가 많다
            detail: 레지스터 머신이 한 명령으로 하는 것을 셋으로 한다. 인터프리터로 돌리면 느린 이유다
            code: 인터프리터는 느리다
      - name: JIT 가 둘을 잇는다
        detail: 스택 머신 명령을 읽어 그 CPU 의 레지스터에 값을 배치한다. 이 번역이 런타임에 일어나므로 CPU 를 알고 최적화할 수 있다
        code: 스택 → 레지스터 할당
        children:
          - name: 그래서 느리지 않다
            detail: 뜨거운 코드는 결국 네이티브 기계어가 된다. 스택 머신이라는 사실이 최종 성능에 영향을 주지 않는다
            code: 최종 결과는 네이티브
          - name: 웜업이 필요한 이유
            detail: 그 번역이 일어나기 전에는 인터프리터로 돈다. memory-areas 와 method-dispatch 에서 본 첫 호출의 느림이 전부 이것이다
            code: 번역 전에는 느리다
```

### 바이트코드를 직접 읽어보기

```java file=Loop.java
int sum(int n) {
    int s = 0;
    for (int i = 0; i < n; i++) s += i;
    return s;
}
```

```bash file=terminal
$ javap -c Loop.class
  int sum(int);
     0: iconst_0          // 0 을 스택에 올린다
     1: istore_2          // 지역변수 2번(s)에 저장
     2: iconst_0
     3: istore_3          // i = 0
     4: iload_3           // i 를 올린다
     5: iload_1           // n 을 올린다
     6: if_icmpge 19      // i >= n 이면 19번으로 점프
     9: iload_2           // s
    10: iload_3           // i
    11: iadd              // 스택 위 둘을 더한다
    12: istore_2          // s 에 저장
    13: iinc 3, 1         // i++
    16: goto 4            // 루프
    19: iload_2
    20: ireturn
```

**지역변수가 번호로 나온다.** `istore_2`, `iload_3`.
[[memory-areas]] 에서 본 Stack 의 지역 변수 슬롯이 이것이다.
그리고 `0` 번은 `this` 다. `static` 메서드면 `0` 번이 첫 매개변수다.

**`this` 가 숨겨진 첫 인자**라는 [[polymorphism]] 의 설명이
바이트코드에서 **슬롯 번호로 확인**된다.

### 무엇을 볼 수 있나

```visual
id: bytecode-what-to-inspect
kind: playground
title: 이 궁금증은 바이트코드로 확인된다
inputs:
  - { name: 질문, label: 알고 싶은 것, options: [문자열 연결이 StringBuilder 로 바뀌나, 람다가 클래스로 만들어지나, 오토박싱이 어디서 일어나나, 왜 오버라이딩이 안 되나, 제네릭 타입이 어디로 갔나, switch 가 어떻게 컴파일되나] }
outcomes:
  - when: { 질문: 문자열 연결이 StringBuilder 로 바뀌나 }
    result: javap -c 로 보면 invokedynamic makeConcatWithConstants 가 보인다. Java 9 부터 StringBuilder 가 아니다
    note: 옛 자바는 StringBuilder 를 썼고 지금은 invokedynamic 으로 더 최적화한다. 루프 안 연결이 여전히 나쁜 이유는 매 반복마다 이것이 불리기 때문이다
  - when: { 질문: 람다가 클래스로 만들어지나 }
    result: invokedynamic 과 LambdaMetafactory 가 보인다. 클래스 파일이 미리 만들어지지 않는다
    note: 익명 클래스는 Outer$1.class 가 생기는데 람다는 안 생긴다. 이것이 람다가 가벼운 이유이고 method-dispatch 에서 본 invokedynamic 의 쓰임이다
  - when: { 질문: 오토박싱이 어디서 일어나나 }
    result: Integer.valueOf 호출이 보인다. 루프 안이면 매 반복마다 객체가 만들어진다
    note: 성능 문제를 추측하지 않고 확인하는 방법이다. 컬렉션에 int 를 담을 때 이것이 쌓인다
  - when: { 질문: 왜 오버라이딩이 안 되나 }
    result: invokestatic 이나 invokespecial 이면 정적으로 묶인 것이다
    note: method-dispatch 에서 본 네 명령이다. static 과 private 과 생성자가 왜 다형적이지 않은지 명령 이름이 바로 알려준다
  - when: { 질문: 제네릭 타입이 어디로 갔나 }
    result: 사라졌다. checkcast 만 보인다. 타입 소거라고 부른다
    note: List<String> 이 바이트코드에서는 List 다. 그래서 런타임에 제네릭 타입을 알 수 없고 new T[] 가 불가능하다. 자바 PART 5 의 주제다
  - when: { 질문: switch 가 어떻게 컴파일되나 }
    result: tableswitch 또는 lookupswitch 다. case 값이 촘촘하면 전자이고 흩어져 있으면 후자다
    note: tableswitch 는 배열 인덱싱이라 O(1) 이고 lookupswitch 는 이진 탐색이라 O(logN) 이다. case 값을 연속으로 두면 빨라지는 근거다
```

**제네릭의 타입 소거**가 특히 바이트코드로만 설명된다.
`List<String>` 과 `List<Integer>` 가 **같은 바이트코드**라는 사실에서
PART 5 의 와일드카드와 `new T[]` 불가가 전부 따라 나온다.

## 5. 이것도 끝이 아니다 — PART 2 가 여기서 끝난다

네 글을 묶으면 이렇게 된다.

```
memory-areas     수명과 공유 범위로 영역을 나눴다. 오류 이름이 영역을 알려준다
pass-by-value    복사되는 것은 참조값이고, Stack 과 Heap 의 분리가 그 모델이다
method-dispatch  무엇을 부를지는 컴파일 시점에, 누구의 것을 부를지는 런타임에
bytecode         플랫폼 의존 결정을 전부 런타임으로 미뤘고 그 수단이 심볼 참조다
```

전부 **"결정을 언제 할 것인가"**였다.
자바의 설계는 **가능한 것을 최대한 뒤로 미루는** 쪽이고,
그 대가가 간접성이고, 그 보상이 이식성과 런타임 최적화다.

그런데 **한 가지를 계속 미뤄두고 있었다.**

```java file=WhoCleansUp.java
Account a = new SavingsAccount();   // Heap 에 할당했다
a = null;                            // 참조를 끊었다
// 그 객체는 언제 사라지나
```

[[memory-areas]] 에서 "참조가 끊길 때까지"라고만 했다.
C 는 `free` 를 내가 불렀다. **자바는 아무도 안 부르는데** 어떻게 회수되나.

그리고 [[memory-areas]] 의 시도 2 에서 참조 카운팅을 언급하고
**"순환 참조를 못 푼다"**고 하고 넘어갔다. 그러면 무엇을 쓰나.

실무에서는 이렇게 만난다.

```
GC 가 돌 때 애플리케이션이 멈춘다 (Stop-The-World)
힙을 키웠더니 한 번의 멈춤이 더 길어졌다
```

**왜 멈추고, 어떻게 덜 멈추게 만들었나.**
PART 3 에서 GC 로 간다.

## 자기 점검

- 바이트코드의 `#7` 은 무엇이며 왜 주소가 아니라 이름인가?
- 같은 `.class` 가 여러 플랫폼에서 도는 조건 두 가지는?
- JVM 이 레지스터 대신 스택을 쓰는 이유는? 그 대가는?
- `javap -c` 에서 `invokestatic` 을 보면 그 메서드에 대해 무엇을 알 수 있나?
- 지역변수 슬롯 `0` 번이 인스턴스 메서드와 `static` 메서드에서 각각 무엇인가?

## 덧 — 흔한 오해

### "자바는 인터프리터 언어다"

**둘 다 한다.** 그리고 그 조합이 설계의 핵심이다.

```
처음         → 인터프리터로 바이트코드를 해석한다. 시작이 빠르다
수천 번 돌면  → C1 으로 컴파일한다. 적당히 빠르다
더 뜨거우면   → C2 로 컴파일한다. 공격적으로 최적화한다
가정이 깨지면 → 인터프리터로 되돌린다 (deoptimization)
```

**AOT 컴파일보다 유리한 지점**이 있다.
실행 중에 "이 분기는 99% 참이다", "이 호출은 한 타입만 온다"를
**관찰해서** 최적화한다. C 컴파일러는 그 정보가 없다.

반대로 **불리한 지점**은 웜업이다. 짧게 돌다 끝나는 프로그램은
최적화 혜택을 못 받는다. 그래서 CLI 도구나 서버리스 함수에서는
GraalVM 네이티브 이미지 같은 AOT 가 유리하다.

### "바이트코드는 난독화하면 안전하다"

**디컴파일이 매우 쉽다.** 상수 풀에 **이름이 그대로** 있기 때문이다.

```bash file=terminal
$ javap -p -c MyClass.class     # 메서드 이름, 필드 이름, 문자열 전부 보인다
```

이 글에서 본 **플랫폼 독립의 수단(심볼 참조)**이
그대로 **역공학의 수단**이다. 이름을 안 적으면 로딩이 안 되므로
근본적으로 숨길 수 없다.

난독화 도구는 이름을 `a`, `b` 로 바꾸지만 **로직은 그대로 읽힌다.**
그래서 **클라이언트에 비밀을 두지 않는다**는 원칙이 자바에서 특히 중요하다.
Docker 과목의 [[secrets]] 에서 본 것과 같은 결론이다.

### "`javap` 는 디버깅에나 쓰는 도구다"

**설명할 수 없는 동작을 만났을 때 가장 확실한 답**을 준다.

```java file=StringConcatPuzzle.java
String a = "hello";
String b = "hel" + "lo";
System.out.println(a == b);      // true. 왜?

String c = "hel";
String d = c + "lo";
System.out.println(a == d);      // false. 왜?
```

`javap -c` 를 보면 답이 바로 나온다.
`"hel" + "lo"` 는 **컴파일 시점에 합쳐져** 상수 풀의 같은 문자열이 되고,
`c + "lo"` 는 **런타임에 새 객체**를 만든다.

추측하거나 외우지 않고 **확인하는 습관**이 이 도구의 가치다.
PART 4 의 String Constant Pool 이 이 퍼즐의 주제다.
