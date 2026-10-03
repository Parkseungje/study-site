
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Track
 * 최상위 분류. 책 한 권에 해당한다.
 */
export type Track = $Result.DefaultSelection<Prisma.$TrackPayload>
/**
 * Model Chapter
 * 개념을 묶는 장. 이게 없으면 개념 60개가 평평하게 나열된다.
 */
export type Chapter = $Result.DefaultSelection<Prisma.$ChapterPayload>
/**
 * Model Concept
 * 학습 개념. [[id]] 로 참조되는 단위다.
 */
export type Concept = $Result.DefaultSelection<Prisma.$ConceptPayload>
/**
 * Model ConceptLevel
 * 개념별 3단계 본문.
 */
export type ConceptLevel = $Result.DefaultSelection<Prisma.$ConceptLevelPayload>
/**
 * Model ConceptSection
 * 본문에서 추출한 목차. import 가 재생성한다.
 */
export type ConceptSection = $Result.DefaultSelection<Prisma.$ConceptSectionPayload>
/**
 * Model Edge
 * 개념 간 관계.
 */
export type Edge = $Result.DefaultSelection<Prisma.$EdgePayload>
/**
 * Model ConceptVisual
 * 본문에 끼우는 조작 가능한 그림. import 가 재생성한다.
 */
export type ConceptVisual = $Result.DefaultSelection<Prisma.$ConceptVisualPayload>
/**
 * Model PromptTemplate
 * 개념 추가용 AI 프롬프트 템플릿.
 */
export type PromptTemplate = $Result.DefaultSelection<Prisma.$PromptTemplatePayload>
/**
 * Model Note
 * 개념별 개인 메모. 사이트에서 직접 쓰는 유일한 데이터다.
 */
export type Note = $Result.DefaultSelection<Prisma.$NotePayload>
/**
 * Model Source
 * 개념별 원문 링크.
 */
export type Source = $Result.DefaultSelection<Prisma.$SourcePayload>

/**
 * Enums
 */
export namespace $Enums {
  export const Level: {
  intro: 'intro',
  standard: 'standard',
  deep: 'deep'
};

export type Level = (typeof Level)[keyof typeof Level]


export const EdgeType: {
  prerequisite: 'prerequisite',
  deepens: 'deepens',
  related: 'related'
};

export type EdgeType = (typeof EdgeType)[keyof typeof EdgeType]


export const VisualKind: {
  step: 'step',
  sequence: 'sequence',
  structure: 'structure',
  playground: 'playground',
  custom: 'custom'
};

export type VisualKind = (typeof VisualKind)[keyof typeof VisualKind]

}

export type Level = $Enums.Level

export const Level: typeof $Enums.Level

export type EdgeType = $Enums.EdgeType

export const EdgeType: typeof $Enums.EdgeType

export type VisualKind = $Enums.VisualKind

export const VisualKind: typeof $Enums.VisualKind

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Tracks
 * const tracks = await prisma.track.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Tracks
   * const tracks = await prisma.track.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.PrismaClientConstructorArgs<ClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.track`: Exposes CRUD operations for the **Track** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Tracks
    * const tracks = await prisma.track.findMany()
    * ```
    */
  get track(): Prisma.TrackDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.chapter`: Exposes CRUD operations for the **Chapter** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Chapters
    * const chapters = await prisma.chapter.findMany()
    * ```
    */
  get chapter(): Prisma.ChapterDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.concept`: Exposes CRUD operations for the **Concept** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Concepts
    * const concepts = await prisma.concept.findMany()
    * ```
    */
  get concept(): Prisma.ConceptDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.conceptLevel`: Exposes CRUD operations for the **ConceptLevel** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ConceptLevels
    * const conceptLevels = await prisma.conceptLevel.findMany()
    * ```
    */
  get conceptLevel(): Prisma.ConceptLevelDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.conceptSection`: Exposes CRUD operations for the **ConceptSection** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ConceptSections
    * const conceptSections = await prisma.conceptSection.findMany()
    * ```
    */
  get conceptSection(): Prisma.ConceptSectionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.edge`: Exposes CRUD operations for the **Edge** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Edges
    * const edges = await prisma.edge.findMany()
    * ```
    */
  get edge(): Prisma.EdgeDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.conceptVisual`: Exposes CRUD operations for the **ConceptVisual** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ConceptVisuals
    * const conceptVisuals = await prisma.conceptVisual.findMany()
    * ```
    */
  get conceptVisual(): Prisma.ConceptVisualDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.promptTemplate`: Exposes CRUD operations for the **PromptTemplate** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PromptTemplates
    * const promptTemplates = await prisma.promptTemplate.findMany()
    * ```
    */
  get promptTemplate(): Prisma.PromptTemplateDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.note`: Exposes CRUD operations for the **Note** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Notes
    * const notes = await prisma.note.findMany()
    * ```
    */
  get note(): Prisma.NoteDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.source`: Exposes CRUD operations for the **Source** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sources
    * const sources = await prisma.source.findMany()
    * ```
    */
  get source(): Prisma.SourceDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.10.0
   * Query Engine version: 0edf323efd1d98336f3f0a68684b56f689b900d3
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * Resolved type of the argument passed to the `PrismaClient` constructor.
   *
   * When called without a narrower options type (the common case), this resolves
   * to `PrismaClientOptions` directly, which produces a clear TypeScript error
   * message (`not assignable to parameter of type 'PrismaClientOptions'`) when
   * the argument is missing or incomplete. When the user supplies a narrower
   * options type (e.g. via a literal), it falls back to `Subset` to keep
   * filtering out unknown properties.
   */
  export type PrismaClientConstructorArgs<Options extends PrismaClientOptions> =
    [PrismaClientOptions] extends [Options] ? PrismaClientOptions : Subset<Options, PrismaClientOptions>;

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      ((Without<T, U> & U) | (Without<U, T> & T)) & object
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Track: 'Track',
    Chapter: 'Chapter',
    Concept: 'Concept',
    ConceptLevel: 'ConceptLevel',
    ConceptSection: 'ConceptSection',
    Edge: 'Edge',
    ConceptVisual: 'ConceptVisual',
    PromptTemplate: 'PromptTemplate',
    Note: 'Note',
    Source: 'Source'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "track" | "chapter" | "concept" | "conceptLevel" | "conceptSection" | "edge" | "conceptVisual" | "promptTemplate" | "note" | "source"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Track: {
        payload: Prisma.$TrackPayload<ExtArgs>
        fields: Prisma.TrackFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TrackFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TrackFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPayload>
          }
          findFirst: {
            args: Prisma.TrackFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TrackFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPayload>
          }
          findMany: {
            args: Prisma.TrackFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPayload>[]
          }
          create: {
            args: Prisma.TrackCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPayload>
          }
          createMany: {
            args: Prisma.TrackCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.TrackDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPayload>
          }
          update: {
            args: Prisma.TrackUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPayload>
          }
          deleteMany: {
            args: Prisma.TrackDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TrackUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TrackUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPayload>
          }
          aggregate: {
            args: Prisma.TrackAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTrack>
          }
          groupBy: {
            args: Prisma.TrackGroupByArgs<ExtArgs>
            result: $Utils.Optional<TrackGroupByOutputType>[]
          }
          count: {
            args: Prisma.TrackCountArgs<ExtArgs>
            result: $Utils.Optional<TrackCountAggregateOutputType> | number
          }
        }
      }
      Chapter: {
        payload: Prisma.$ChapterPayload<ExtArgs>
        fields: Prisma.ChapterFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ChapterFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ChapterFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>
          }
          findFirst: {
            args: Prisma.ChapterFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ChapterFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>
          }
          findMany: {
            args: Prisma.ChapterFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>[]
          }
          create: {
            args: Prisma.ChapterCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>
          }
          createMany: {
            args: Prisma.ChapterCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.ChapterDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>
          }
          update: {
            args: Prisma.ChapterUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>
          }
          deleteMany: {
            args: Prisma.ChapterDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ChapterUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ChapterUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>
          }
          aggregate: {
            args: Prisma.ChapterAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateChapter>
          }
          groupBy: {
            args: Prisma.ChapterGroupByArgs<ExtArgs>
            result: $Utils.Optional<ChapterGroupByOutputType>[]
          }
          count: {
            args: Prisma.ChapterCountArgs<ExtArgs>
            result: $Utils.Optional<ChapterCountAggregateOutputType> | number
          }
        }
      }
      Concept: {
        payload: Prisma.$ConceptPayload<ExtArgs>
        fields: Prisma.ConceptFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ConceptFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ConceptFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptPayload>
          }
          findFirst: {
            args: Prisma.ConceptFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ConceptFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptPayload>
          }
          findMany: {
            args: Prisma.ConceptFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptPayload>[]
          }
          create: {
            args: Prisma.ConceptCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptPayload>
          }
          createMany: {
            args: Prisma.ConceptCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.ConceptDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptPayload>
          }
          update: {
            args: Prisma.ConceptUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptPayload>
          }
          deleteMany: {
            args: Prisma.ConceptDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ConceptUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ConceptUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptPayload>
          }
          aggregate: {
            args: Prisma.ConceptAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateConcept>
          }
          groupBy: {
            args: Prisma.ConceptGroupByArgs<ExtArgs>
            result: $Utils.Optional<ConceptGroupByOutputType>[]
          }
          count: {
            args: Prisma.ConceptCountArgs<ExtArgs>
            result: $Utils.Optional<ConceptCountAggregateOutputType> | number
          }
        }
      }
      ConceptLevel: {
        payload: Prisma.$ConceptLevelPayload<ExtArgs>
        fields: Prisma.ConceptLevelFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ConceptLevelFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptLevelPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ConceptLevelFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptLevelPayload>
          }
          findFirst: {
            args: Prisma.ConceptLevelFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptLevelPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ConceptLevelFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptLevelPayload>
          }
          findMany: {
            args: Prisma.ConceptLevelFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptLevelPayload>[]
          }
          create: {
            args: Prisma.ConceptLevelCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptLevelPayload>
          }
          createMany: {
            args: Prisma.ConceptLevelCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.ConceptLevelDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptLevelPayload>
          }
          update: {
            args: Prisma.ConceptLevelUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptLevelPayload>
          }
          deleteMany: {
            args: Prisma.ConceptLevelDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ConceptLevelUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ConceptLevelUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptLevelPayload>
          }
          aggregate: {
            args: Prisma.ConceptLevelAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateConceptLevel>
          }
          groupBy: {
            args: Prisma.ConceptLevelGroupByArgs<ExtArgs>
            result: $Utils.Optional<ConceptLevelGroupByOutputType>[]
          }
          count: {
            args: Prisma.ConceptLevelCountArgs<ExtArgs>
            result: $Utils.Optional<ConceptLevelCountAggregateOutputType> | number
          }
        }
      }
      ConceptSection: {
        payload: Prisma.$ConceptSectionPayload<ExtArgs>
        fields: Prisma.ConceptSectionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ConceptSectionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptSectionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ConceptSectionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptSectionPayload>
          }
          findFirst: {
            args: Prisma.ConceptSectionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptSectionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ConceptSectionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptSectionPayload>
          }
          findMany: {
            args: Prisma.ConceptSectionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptSectionPayload>[]
          }
          create: {
            args: Prisma.ConceptSectionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptSectionPayload>
          }
          createMany: {
            args: Prisma.ConceptSectionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.ConceptSectionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptSectionPayload>
          }
          update: {
            args: Prisma.ConceptSectionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptSectionPayload>
          }
          deleteMany: {
            args: Prisma.ConceptSectionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ConceptSectionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ConceptSectionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptSectionPayload>
          }
          aggregate: {
            args: Prisma.ConceptSectionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateConceptSection>
          }
          groupBy: {
            args: Prisma.ConceptSectionGroupByArgs<ExtArgs>
            result: $Utils.Optional<ConceptSectionGroupByOutputType>[]
          }
          count: {
            args: Prisma.ConceptSectionCountArgs<ExtArgs>
            result: $Utils.Optional<ConceptSectionCountAggregateOutputType> | number
          }
        }
      }
      Edge: {
        payload: Prisma.$EdgePayload<ExtArgs>
        fields: Prisma.EdgeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EdgeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EdgePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EdgeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EdgePayload>
          }
          findFirst: {
            args: Prisma.EdgeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EdgePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EdgeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EdgePayload>
          }
          findMany: {
            args: Prisma.EdgeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EdgePayload>[]
          }
          create: {
            args: Prisma.EdgeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EdgePayload>
          }
          createMany: {
            args: Prisma.EdgeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.EdgeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EdgePayload>
          }
          update: {
            args: Prisma.EdgeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EdgePayload>
          }
          deleteMany: {
            args: Prisma.EdgeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EdgeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.EdgeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EdgePayload>
          }
          aggregate: {
            args: Prisma.EdgeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEdge>
          }
          groupBy: {
            args: Prisma.EdgeGroupByArgs<ExtArgs>
            result: $Utils.Optional<EdgeGroupByOutputType>[]
          }
          count: {
            args: Prisma.EdgeCountArgs<ExtArgs>
            result: $Utils.Optional<EdgeCountAggregateOutputType> | number
          }
        }
      }
      ConceptVisual: {
        payload: Prisma.$ConceptVisualPayload<ExtArgs>
        fields: Prisma.ConceptVisualFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ConceptVisualFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptVisualPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ConceptVisualFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptVisualPayload>
          }
          findFirst: {
            args: Prisma.ConceptVisualFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptVisualPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ConceptVisualFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptVisualPayload>
          }
          findMany: {
            args: Prisma.ConceptVisualFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptVisualPayload>[]
          }
          create: {
            args: Prisma.ConceptVisualCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptVisualPayload>
          }
          createMany: {
            args: Prisma.ConceptVisualCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.ConceptVisualDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptVisualPayload>
          }
          update: {
            args: Prisma.ConceptVisualUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptVisualPayload>
          }
          deleteMany: {
            args: Prisma.ConceptVisualDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ConceptVisualUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ConceptVisualUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptVisualPayload>
          }
          aggregate: {
            args: Prisma.ConceptVisualAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateConceptVisual>
          }
          groupBy: {
            args: Prisma.ConceptVisualGroupByArgs<ExtArgs>
            result: $Utils.Optional<ConceptVisualGroupByOutputType>[]
          }
          count: {
            args: Prisma.ConceptVisualCountArgs<ExtArgs>
            result: $Utils.Optional<ConceptVisualCountAggregateOutputType> | number
          }
        }
      }
      PromptTemplate: {
        payload: Prisma.$PromptTemplatePayload<ExtArgs>
        fields: Prisma.PromptTemplateFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PromptTemplateFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromptTemplatePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PromptTemplateFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromptTemplatePayload>
          }
          findFirst: {
            args: Prisma.PromptTemplateFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromptTemplatePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PromptTemplateFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromptTemplatePayload>
          }
          findMany: {
            args: Prisma.PromptTemplateFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromptTemplatePayload>[]
          }
          create: {
            args: Prisma.PromptTemplateCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromptTemplatePayload>
          }
          createMany: {
            args: Prisma.PromptTemplateCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.PromptTemplateDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromptTemplatePayload>
          }
          update: {
            args: Prisma.PromptTemplateUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromptTemplatePayload>
          }
          deleteMany: {
            args: Prisma.PromptTemplateDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PromptTemplateUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PromptTemplateUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromptTemplatePayload>
          }
          aggregate: {
            args: Prisma.PromptTemplateAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePromptTemplate>
          }
          groupBy: {
            args: Prisma.PromptTemplateGroupByArgs<ExtArgs>
            result: $Utils.Optional<PromptTemplateGroupByOutputType>[]
          }
          count: {
            args: Prisma.PromptTemplateCountArgs<ExtArgs>
            result: $Utils.Optional<PromptTemplateCountAggregateOutputType> | number
          }
        }
      }
      Note: {
        payload: Prisma.$NotePayload<ExtArgs>
        fields: Prisma.NoteFieldRefs
        operations: {
          findUnique: {
            args: Prisma.NoteFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.NoteFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotePayload>
          }
          findFirst: {
            args: Prisma.NoteFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.NoteFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotePayload>
          }
          findMany: {
            args: Prisma.NoteFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotePayload>[]
          }
          create: {
            args: Prisma.NoteCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotePayload>
          }
          createMany: {
            args: Prisma.NoteCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.NoteDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotePayload>
          }
          update: {
            args: Prisma.NoteUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotePayload>
          }
          deleteMany: {
            args: Prisma.NoteDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.NoteUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.NoteUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotePayload>
          }
          aggregate: {
            args: Prisma.NoteAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateNote>
          }
          groupBy: {
            args: Prisma.NoteGroupByArgs<ExtArgs>
            result: $Utils.Optional<NoteGroupByOutputType>[]
          }
          count: {
            args: Prisma.NoteCountArgs<ExtArgs>
            result: $Utils.Optional<NoteCountAggregateOutputType> | number
          }
        }
      }
      Source: {
        payload: Prisma.$SourcePayload<ExtArgs>
        fields: Prisma.SourceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SourceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourcePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SourceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourcePayload>
          }
          findFirst: {
            args: Prisma.SourceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourcePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SourceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourcePayload>
          }
          findMany: {
            args: Prisma.SourceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourcePayload>[]
          }
          create: {
            args: Prisma.SourceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourcePayload>
          }
          createMany: {
            args: Prisma.SourceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.SourceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourcePayload>
          }
          update: {
            args: Prisma.SourceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourcePayload>
          }
          deleteMany: {
            args: Prisma.SourceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SourceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.SourceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourcePayload>
          }
          aggregate: {
            args: Prisma.SourceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSource>
          }
          groupBy: {
            args: Prisma.SourceGroupByArgs<ExtArgs>
            result: $Utils.Optional<SourceGroupByOutputType>[]
          }
          count: {
            args: Prisma.SourceCountArgs<ExtArgs>
            result: $Utils.Optional<SourceCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * A driver adapter that PrismaClient uses to connect to your database, such as the ones provided by `@prisma/adapter-pg`, `@prisma/adapter-libsql`, `@prisma/adapter-planetscale`, etc.
     * 
     * A driver adapter is **required** unless you connect to your database through Prisma Accelerate (in which case use `accelerateUrl` instead).
     * 
     * Learn more: https://pris.ly/d/driver-adapters
     * 
     * @example
     * ```ts
     * import { PrismaPg } from '@prisma/adapter-pg'
     * import { PrismaClient } from './generated/prisma/client'
     * 
     * const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
     * const prisma = new PrismaClient({ adapter })
     * ```
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * The Prisma Accelerate connection URL. Use this option to connect to your database through Prisma Accelerate instead of using a driver adapter to connect directly.
     * 
     * Learn more: https://pris.ly/d/accelerate
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    track?: TrackOmit
    chapter?: ChapterOmit
    concept?: ConceptOmit
    conceptLevel?: ConceptLevelOmit
    conceptSection?: ConceptSectionOmit
    edge?: EdgeOmit
    conceptVisual?: ConceptVisualOmit
    promptTemplate?: PromptTemplateOmit
    note?: NoteOmit
    source?: SourceOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type TrackCountOutputType
   */

  export type TrackCountOutputType = {
    chapters: number
  }

  export type TrackCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    chapters?: boolean | TrackCountOutputTypeCountChaptersArgs
  }

  // Custom InputTypes
  /**
   * TrackCountOutputType without action
   */
  export type TrackCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackCountOutputType
     */
    select?: TrackCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TrackCountOutputType without action
   */
  export type TrackCountOutputTypeCountChaptersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChapterWhereInput
  }


  /**
   * Count Type ChapterCountOutputType
   */

  export type ChapterCountOutputType = {
    concepts: number
  }

  export type ChapterCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    concepts?: boolean | ChapterCountOutputTypeCountConceptsArgs
  }

  // Custom InputTypes
  /**
   * ChapterCountOutputType without action
   */
  export type ChapterCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterCountOutputType
     */
    select?: ChapterCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ChapterCountOutputType without action
   */
  export type ChapterCountOutputTypeCountConceptsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConceptWhereInput
  }


  /**
   * Count Type ConceptCountOutputType
   */

  export type ConceptCountOutputType = {
    levels: number
    sections: number
    visuals: number
    sources: number
    edgesOut: number
    edgesIn: number
  }

  export type ConceptCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    levels?: boolean | ConceptCountOutputTypeCountLevelsArgs
    sections?: boolean | ConceptCountOutputTypeCountSectionsArgs
    visuals?: boolean | ConceptCountOutputTypeCountVisualsArgs
    sources?: boolean | ConceptCountOutputTypeCountSourcesArgs
    edgesOut?: boolean | ConceptCountOutputTypeCountEdgesOutArgs
    edgesIn?: boolean | ConceptCountOutputTypeCountEdgesInArgs
  }

  // Custom InputTypes
  /**
   * ConceptCountOutputType without action
   */
  export type ConceptCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptCountOutputType
     */
    select?: ConceptCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ConceptCountOutputType without action
   */
  export type ConceptCountOutputTypeCountLevelsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConceptLevelWhereInput
  }

  /**
   * ConceptCountOutputType without action
   */
  export type ConceptCountOutputTypeCountSectionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConceptSectionWhereInput
  }

  /**
   * ConceptCountOutputType without action
   */
  export type ConceptCountOutputTypeCountVisualsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConceptVisualWhereInput
  }

  /**
   * ConceptCountOutputType without action
   */
  export type ConceptCountOutputTypeCountSourcesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SourceWhereInput
  }

  /**
   * ConceptCountOutputType without action
   */
  export type ConceptCountOutputTypeCountEdgesOutArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EdgeWhereInput
  }

  /**
   * ConceptCountOutputType without action
   */
  export type ConceptCountOutputTypeCountEdgesInArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EdgeWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Track
   */

  export type AggregateTrack = {
    _count: TrackCountAggregateOutputType | null
    _avg: TrackAvgAggregateOutputType | null
    _sum: TrackSumAggregateOutputType | null
    _min: TrackMinAggregateOutputType | null
    _max: TrackMaxAggregateOutputType | null
  }

  export type TrackAvgAggregateOutputType = {
    ord: number | null
  }

  export type TrackSumAggregateOutputType = {
    ord: number | null
  }

  export type TrackMinAggregateOutputType = {
    id: string | null
    title: string | null
    ord: number | null
  }

  export type TrackMaxAggregateOutputType = {
    id: string | null
    title: string | null
    ord: number | null
  }

  export type TrackCountAggregateOutputType = {
    id: number
    title: number
    ord: number
    _all: number
  }


  export type TrackAvgAggregateInputType = {
    ord?: true
  }

  export type TrackSumAggregateInputType = {
    ord?: true
  }

  export type TrackMinAggregateInputType = {
    id?: true
    title?: true
    ord?: true
  }

  export type TrackMaxAggregateInputType = {
    id?: true
    title?: true
    ord?: true
  }

  export type TrackCountAggregateInputType = {
    id?: true
    title?: true
    ord?: true
    _all?: true
  }

  export type TrackAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Track to aggregate.
     */
    where?: TrackWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tracks to fetch.
     */
    orderBy?: TrackOrderByWithRelationInput | TrackOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TrackWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tracks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tracks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Tracks
    **/
    _count?: true | TrackCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TrackAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TrackSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TrackMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TrackMaxAggregateInputType
  }

  export type GetTrackAggregateType<T extends TrackAggregateArgs> = {
        [P in keyof T & keyof AggregateTrack]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTrack[P]>
      : GetScalarType<T[P], AggregateTrack[P]>
  }




  export type TrackGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TrackWhereInput
    orderBy?: TrackOrderByWithAggregationInput | TrackOrderByWithAggregationInput[]
    by: TrackScalarFieldEnum[] | TrackScalarFieldEnum
    having?: TrackScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TrackCountAggregateInputType | true
    _avg?: TrackAvgAggregateInputType
    _sum?: TrackSumAggregateInputType
    _min?: TrackMinAggregateInputType
    _max?: TrackMaxAggregateInputType
  }

  export type TrackGroupByOutputType = {
    id: string
    title: string
    ord: number
    _count: TrackCountAggregateOutputType | null
    _avg: TrackAvgAggregateOutputType | null
    _sum: TrackSumAggregateOutputType | null
    _min: TrackMinAggregateOutputType | null
    _max: TrackMaxAggregateOutputType | null
  }

  type GetTrackGroupByPayload<T extends TrackGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TrackGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TrackGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TrackGroupByOutputType[P]>
            : GetScalarType<T[P], TrackGroupByOutputType[P]>
        }
      >
    >


  export type TrackSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    ord?: boolean
    chapters?: boolean | Track$chaptersArgs<ExtArgs>
    _count?: boolean | TrackCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["track"]>



  export type TrackSelectScalar = {
    id?: boolean
    title?: boolean
    ord?: boolean
  }

  export type TrackOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "title" | "ord", ExtArgs["result"]["track"]>
  export type TrackInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    chapters?: boolean | Track$chaptersArgs<ExtArgs>
    _count?: boolean | TrackCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $TrackPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Track"
    objects: {
      chapters: Prisma.$ChapterPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      ord: number
    }, ExtArgs["result"]["track"]>
    composites: {}
  }

  type TrackGetPayload<S extends boolean | null | undefined | TrackDefaultArgs> = $Result.GetResult<Prisma.$TrackPayload, S>

  type TrackCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TrackFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TrackCountAggregateInputType | true
    }

  export interface TrackDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Track'], meta: { name: 'Track' } }
    /**
     * Find zero or one Track that matches the filter.
     * @param {TrackFindUniqueArgs} args - Arguments to find a Track
     * @example
     * // Get one Track
     * const track = await prisma.track.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TrackFindUniqueArgs>(args: SelectSubset<T, TrackFindUniqueArgs<ExtArgs>>): Prisma__TrackClient<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Track that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TrackFindUniqueOrThrowArgs} args - Arguments to find a Track
     * @example
     * // Get one Track
     * const track = await prisma.track.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TrackFindUniqueOrThrowArgs>(args: SelectSubset<T, TrackFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TrackClient<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Track that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackFindFirstArgs} args - Arguments to find a Track
     * @example
     * // Get one Track
     * const track = await prisma.track.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TrackFindFirstArgs>(args?: SelectSubset<T, TrackFindFirstArgs<ExtArgs>>): Prisma__TrackClient<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Track that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackFindFirstOrThrowArgs} args - Arguments to find a Track
     * @example
     * // Get one Track
     * const track = await prisma.track.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TrackFindFirstOrThrowArgs>(args?: SelectSubset<T, TrackFindFirstOrThrowArgs<ExtArgs>>): Prisma__TrackClient<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Tracks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Tracks
     * const tracks = await prisma.track.findMany()
     * 
     * // Get first 10 Tracks
     * const tracks = await prisma.track.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const trackWithIdOnly = await prisma.track.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TrackFindManyArgs>(args?: SelectSubset<T, TrackFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Track.
     * @param {TrackCreateArgs} args - Arguments to create a Track.
     * @example
     * // Create one Track
     * const Track = await prisma.track.create({
     *   data: {
     *     // ... data to create a Track
     *   }
     * })
     * 
     */
    create<T extends TrackCreateArgs>(args: SelectSubset<T, TrackCreateArgs<ExtArgs>>): Prisma__TrackClient<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Tracks.
     * @param {TrackCreateManyArgs} args - Arguments to create many Tracks.
     * @example
     * // Create many Tracks
     * const track = await prisma.track.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TrackCreateManyArgs>(args?: SelectSubset<T, TrackCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Track.
     * @param {TrackDeleteArgs} args - Arguments to delete one Track.
     * @example
     * // Delete one Track
     * const Track = await prisma.track.delete({
     *   where: {
     *     // ... filter to delete one Track
     *   }
     * })
     * 
     */
    delete<T extends TrackDeleteArgs>(args: SelectSubset<T, TrackDeleteArgs<ExtArgs>>): Prisma__TrackClient<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Track.
     * @param {TrackUpdateArgs} args - Arguments to update one Track.
     * @example
     * // Update one Track
     * const track = await prisma.track.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TrackUpdateArgs>(args: SelectSubset<T, TrackUpdateArgs<ExtArgs>>): Prisma__TrackClient<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Tracks.
     * @param {TrackDeleteManyArgs} args - Arguments to filter Tracks to delete.
     * @example
     * // Delete a few Tracks
     * const { count } = await prisma.track.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TrackDeleteManyArgs>(args?: SelectSubset<T, TrackDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tracks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Tracks
     * const track = await prisma.track.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TrackUpdateManyArgs>(args: SelectSubset<T, TrackUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Track.
     * @param {TrackUpsertArgs} args - Arguments to update or create a Track.
     * @example
     * // Update or create a Track
     * const track = await prisma.track.upsert({
     *   create: {
     *     // ... data to create a Track
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Track we want to update
     *   }
     * })
     */
    upsert<T extends TrackUpsertArgs>(args: SelectSubset<T, TrackUpsertArgs<ExtArgs>>): Prisma__TrackClient<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Tracks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackCountArgs} args - Arguments to filter Tracks to count.
     * @example
     * // Count the number of Tracks
     * const count = await prisma.track.count({
     *   where: {
     *     // ... the filter for the Tracks we want to count
     *   }
     * })
    **/
    count<T extends TrackCountArgs>(
      args?: Subset<T, TrackCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TrackCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Track.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TrackAggregateArgs>(args: Subset<T, TrackAggregateArgs>): Prisma.PrismaPromise<GetTrackAggregateType<T>>

    /**
     * Group by Track.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TrackGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TrackGroupByArgs['orderBy'] }
        : { orderBy?: TrackGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TrackGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTrackGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Track model
   */
  readonly fields: TrackFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Track.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TrackClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    chapters<T extends Track$chaptersArgs<ExtArgs> = {}>(args?: Subset<T, Track$chaptersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Track model
   */
  interface TrackFieldRefs {
    readonly id: FieldRef<"Track", 'String'>
    readonly title: FieldRef<"Track", 'String'>
    readonly ord: FieldRef<"Track", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * Track findUnique
   */
  export type TrackFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackInclude<ExtArgs> | null
    /**
     * Filter, which Track to fetch.
     */
    where: TrackWhereUniqueInput
  }

  /**
   * Track findUniqueOrThrow
   */
  export type TrackFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackInclude<ExtArgs> | null
    /**
     * Filter, which Track to fetch.
     */
    where: TrackWhereUniqueInput
  }

  /**
   * Track findFirst
   */
  export type TrackFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackInclude<ExtArgs> | null
    /**
     * Filter, which Track to fetch.
     */
    where?: TrackWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tracks to fetch.
     */
    orderBy?: TrackOrderByWithRelationInput | TrackOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tracks.
     */
    cursor?: TrackWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tracks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tracks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tracks.
     */
    distinct?: TrackScalarFieldEnum | TrackScalarFieldEnum[]
  }

  /**
   * Track findFirstOrThrow
   */
  export type TrackFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackInclude<ExtArgs> | null
    /**
     * Filter, which Track to fetch.
     */
    where?: TrackWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tracks to fetch.
     */
    orderBy?: TrackOrderByWithRelationInput | TrackOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tracks.
     */
    cursor?: TrackWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tracks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tracks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tracks.
     */
    distinct?: TrackScalarFieldEnum | TrackScalarFieldEnum[]
  }

  /**
   * Track findMany
   */
  export type TrackFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackInclude<ExtArgs> | null
    /**
     * Filter, which Tracks to fetch.
     */
    where?: TrackWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tracks to fetch.
     */
    orderBy?: TrackOrderByWithRelationInput | TrackOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Tracks.
     */
    cursor?: TrackWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tracks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tracks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tracks.
     */
    distinct?: TrackScalarFieldEnum | TrackScalarFieldEnum[]
  }

  /**
   * Track create
   */
  export type TrackCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackInclude<ExtArgs> | null
    /**
     * The data needed to create a Track.
     */
    data: XOR<TrackCreateInput, TrackUncheckedCreateInput>
  }

  /**
   * Track createMany
   */
  export type TrackCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Tracks.
     */
    data: TrackCreateManyInput | TrackCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Track update
   */
  export type TrackUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackInclude<ExtArgs> | null
    /**
     * The data needed to update a Track.
     */
    data: XOR<TrackUpdateInput, TrackUncheckedUpdateInput>
    /**
     * Choose, which Track to update.
     */
    where: TrackWhereUniqueInput
  }

  /**
   * Track updateMany
   */
  export type TrackUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Tracks.
     */
    data: XOR<TrackUpdateManyMutationInput, TrackUncheckedUpdateManyInput>
    /**
     * Filter which Tracks to update
     */
    where?: TrackWhereInput
    /**
     * Limit how many Tracks to update.
     */
    limit?: number
  }

  /**
   * Track upsert
   */
  export type TrackUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackInclude<ExtArgs> | null
    /**
     * The filter to search for the Track to update in case it exists.
     */
    where: TrackWhereUniqueInput
    /**
     * In case the Track found by the `where` argument doesn't exist, create a new Track with this data.
     */
    create: XOR<TrackCreateInput, TrackUncheckedCreateInput>
    /**
     * In case the Track was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TrackUpdateInput, TrackUncheckedUpdateInput>
  }

  /**
   * Track delete
   */
  export type TrackDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackInclude<ExtArgs> | null
    /**
     * Filter which Track to delete.
     */
    where: TrackWhereUniqueInput
  }

  /**
   * Track deleteMany
   */
  export type TrackDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Tracks to delete
     */
    where?: TrackWhereInput
    /**
     * Limit how many Tracks to delete.
     */
    limit?: number
  }

  /**
   * Track.chapters
   */
  export type Track$chaptersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    where?: ChapterWhereInput
    orderBy?: ChapterOrderByWithRelationInput | ChapterOrderByWithRelationInput[]
    cursor?: ChapterWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ChapterScalarFieldEnum | ChapterScalarFieldEnum[]
  }

  /**
   * Track without action
   */
  export type TrackDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackInclude<ExtArgs> | null
  }


  /**
   * Model Chapter
   */

  export type AggregateChapter = {
    _count: ChapterCountAggregateOutputType | null
    _avg: ChapterAvgAggregateOutputType | null
    _sum: ChapterSumAggregateOutputType | null
    _min: ChapterMinAggregateOutputType | null
    _max: ChapterMaxAggregateOutputType | null
  }

  export type ChapterAvgAggregateOutputType = {
    ord: number | null
  }

  export type ChapterSumAggregateOutputType = {
    ord: number | null
  }

  export type ChapterMinAggregateOutputType = {
    id: string | null
    trackId: string | null
    title: string | null
    summary: string | null
    ord: number | null
  }

  export type ChapterMaxAggregateOutputType = {
    id: string | null
    trackId: string | null
    title: string | null
    summary: string | null
    ord: number | null
  }

  export type ChapterCountAggregateOutputType = {
    id: number
    trackId: number
    title: number
    summary: number
    ord: number
    _all: number
  }


  export type ChapterAvgAggregateInputType = {
    ord?: true
  }

  export type ChapterSumAggregateInputType = {
    ord?: true
  }

  export type ChapterMinAggregateInputType = {
    id?: true
    trackId?: true
    title?: true
    summary?: true
    ord?: true
  }

  export type ChapterMaxAggregateInputType = {
    id?: true
    trackId?: true
    title?: true
    summary?: true
    ord?: true
  }

  export type ChapterCountAggregateInputType = {
    id?: true
    trackId?: true
    title?: true
    summary?: true
    ord?: true
    _all?: true
  }

  export type ChapterAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Chapter to aggregate.
     */
    where?: ChapterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Chapters to fetch.
     */
    orderBy?: ChapterOrderByWithRelationInput | ChapterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ChapterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Chapters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Chapters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Chapters
    **/
    _count?: true | ChapterCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ChapterAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ChapterSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ChapterMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ChapterMaxAggregateInputType
  }

  export type GetChapterAggregateType<T extends ChapterAggregateArgs> = {
        [P in keyof T & keyof AggregateChapter]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateChapter[P]>
      : GetScalarType<T[P], AggregateChapter[P]>
  }




  export type ChapterGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChapterWhereInput
    orderBy?: ChapterOrderByWithAggregationInput | ChapterOrderByWithAggregationInput[]
    by: ChapterScalarFieldEnum[] | ChapterScalarFieldEnum
    having?: ChapterScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ChapterCountAggregateInputType | true
    _avg?: ChapterAvgAggregateInputType
    _sum?: ChapterSumAggregateInputType
    _min?: ChapterMinAggregateInputType
    _max?: ChapterMaxAggregateInputType
  }

  export type ChapterGroupByOutputType = {
    id: string
    trackId: string
    title: string
    summary: string
    ord: number
    _count: ChapterCountAggregateOutputType | null
    _avg: ChapterAvgAggregateOutputType | null
    _sum: ChapterSumAggregateOutputType | null
    _min: ChapterMinAggregateOutputType | null
    _max: ChapterMaxAggregateOutputType | null
  }

  type GetChapterGroupByPayload<T extends ChapterGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ChapterGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ChapterGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ChapterGroupByOutputType[P]>
            : GetScalarType<T[P], ChapterGroupByOutputType[P]>
        }
      >
    >


  export type ChapterSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    trackId?: boolean
    title?: boolean
    summary?: boolean
    ord?: boolean
    track?: boolean | TrackDefaultArgs<ExtArgs>
    concepts?: boolean | Chapter$conceptsArgs<ExtArgs>
    _count?: boolean | ChapterCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chapter"]>



  export type ChapterSelectScalar = {
    id?: boolean
    trackId?: boolean
    title?: boolean
    summary?: boolean
    ord?: boolean
  }

  export type ChapterOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "trackId" | "title" | "summary" | "ord", ExtArgs["result"]["chapter"]>
  export type ChapterInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    track?: boolean | TrackDefaultArgs<ExtArgs>
    concepts?: boolean | Chapter$conceptsArgs<ExtArgs>
    _count?: boolean | ChapterCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $ChapterPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Chapter"
    objects: {
      track: Prisma.$TrackPayload<ExtArgs>
      concepts: Prisma.$ConceptPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      trackId: string
      title: string
      summary: string
      ord: number
    }, ExtArgs["result"]["chapter"]>
    composites: {}
  }

  type ChapterGetPayload<S extends boolean | null | undefined | ChapterDefaultArgs> = $Result.GetResult<Prisma.$ChapterPayload, S>

  type ChapterCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ChapterFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ChapterCountAggregateInputType | true
    }

  export interface ChapterDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Chapter'], meta: { name: 'Chapter' } }
    /**
     * Find zero or one Chapter that matches the filter.
     * @param {ChapterFindUniqueArgs} args - Arguments to find a Chapter
     * @example
     * // Get one Chapter
     * const chapter = await prisma.chapter.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ChapterFindUniqueArgs>(args: SelectSubset<T, ChapterFindUniqueArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Chapter that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ChapterFindUniqueOrThrowArgs} args - Arguments to find a Chapter
     * @example
     * // Get one Chapter
     * const chapter = await prisma.chapter.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ChapterFindUniqueOrThrowArgs>(args: SelectSubset<T, ChapterFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Chapter that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterFindFirstArgs} args - Arguments to find a Chapter
     * @example
     * // Get one Chapter
     * const chapter = await prisma.chapter.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ChapterFindFirstArgs>(args?: SelectSubset<T, ChapterFindFirstArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Chapter that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterFindFirstOrThrowArgs} args - Arguments to find a Chapter
     * @example
     * // Get one Chapter
     * const chapter = await prisma.chapter.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ChapterFindFirstOrThrowArgs>(args?: SelectSubset<T, ChapterFindFirstOrThrowArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Chapters that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Chapters
     * const chapters = await prisma.chapter.findMany()
     * 
     * // Get first 10 Chapters
     * const chapters = await prisma.chapter.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const chapterWithIdOnly = await prisma.chapter.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ChapterFindManyArgs>(args?: SelectSubset<T, ChapterFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Chapter.
     * @param {ChapterCreateArgs} args - Arguments to create a Chapter.
     * @example
     * // Create one Chapter
     * const Chapter = await prisma.chapter.create({
     *   data: {
     *     // ... data to create a Chapter
     *   }
     * })
     * 
     */
    create<T extends ChapterCreateArgs>(args: SelectSubset<T, ChapterCreateArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Chapters.
     * @param {ChapterCreateManyArgs} args - Arguments to create many Chapters.
     * @example
     * // Create many Chapters
     * const chapter = await prisma.chapter.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ChapterCreateManyArgs>(args?: SelectSubset<T, ChapterCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Chapter.
     * @param {ChapterDeleteArgs} args - Arguments to delete one Chapter.
     * @example
     * // Delete one Chapter
     * const Chapter = await prisma.chapter.delete({
     *   where: {
     *     // ... filter to delete one Chapter
     *   }
     * })
     * 
     */
    delete<T extends ChapterDeleteArgs>(args: SelectSubset<T, ChapterDeleteArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Chapter.
     * @param {ChapterUpdateArgs} args - Arguments to update one Chapter.
     * @example
     * // Update one Chapter
     * const chapter = await prisma.chapter.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ChapterUpdateArgs>(args: SelectSubset<T, ChapterUpdateArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Chapters.
     * @param {ChapterDeleteManyArgs} args - Arguments to filter Chapters to delete.
     * @example
     * // Delete a few Chapters
     * const { count } = await prisma.chapter.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ChapterDeleteManyArgs>(args?: SelectSubset<T, ChapterDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Chapters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Chapters
     * const chapter = await prisma.chapter.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ChapterUpdateManyArgs>(args: SelectSubset<T, ChapterUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Chapter.
     * @param {ChapterUpsertArgs} args - Arguments to update or create a Chapter.
     * @example
     * // Update or create a Chapter
     * const chapter = await prisma.chapter.upsert({
     *   create: {
     *     // ... data to create a Chapter
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Chapter we want to update
     *   }
     * })
     */
    upsert<T extends ChapterUpsertArgs>(args: SelectSubset<T, ChapterUpsertArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Chapters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterCountArgs} args - Arguments to filter Chapters to count.
     * @example
     * // Count the number of Chapters
     * const count = await prisma.chapter.count({
     *   where: {
     *     // ... the filter for the Chapters we want to count
     *   }
     * })
    **/
    count<T extends ChapterCountArgs>(
      args?: Subset<T, ChapterCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ChapterCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Chapter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ChapterAggregateArgs>(args: Subset<T, ChapterAggregateArgs>): Prisma.PrismaPromise<GetChapterAggregateType<T>>

    /**
     * Group by Chapter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ChapterGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ChapterGroupByArgs['orderBy'] }
        : { orderBy?: ChapterGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ChapterGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetChapterGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Chapter model
   */
  readonly fields: ChapterFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Chapter.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ChapterClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    track<T extends TrackDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TrackDefaultArgs<ExtArgs>>): Prisma__TrackClient<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    concepts<T extends Chapter$conceptsArgs<ExtArgs> = {}>(args?: Subset<T, Chapter$conceptsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Chapter model
   */
  interface ChapterFieldRefs {
    readonly id: FieldRef<"Chapter", 'String'>
    readonly trackId: FieldRef<"Chapter", 'String'>
    readonly title: FieldRef<"Chapter", 'String'>
    readonly summary: FieldRef<"Chapter", 'String'>
    readonly ord: FieldRef<"Chapter", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * Chapter findUnique
   */
  export type ChapterFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * Filter, which Chapter to fetch.
     */
    where: ChapterWhereUniqueInput
  }

  /**
   * Chapter findUniqueOrThrow
   */
  export type ChapterFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * Filter, which Chapter to fetch.
     */
    where: ChapterWhereUniqueInput
  }

  /**
   * Chapter findFirst
   */
  export type ChapterFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * Filter, which Chapter to fetch.
     */
    where?: ChapterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Chapters to fetch.
     */
    orderBy?: ChapterOrderByWithRelationInput | ChapterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Chapters.
     */
    cursor?: ChapterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Chapters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Chapters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Chapters.
     */
    distinct?: ChapterScalarFieldEnum | ChapterScalarFieldEnum[]
  }

  /**
   * Chapter findFirstOrThrow
   */
  export type ChapterFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * Filter, which Chapter to fetch.
     */
    where?: ChapterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Chapters to fetch.
     */
    orderBy?: ChapterOrderByWithRelationInput | ChapterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Chapters.
     */
    cursor?: ChapterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Chapters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Chapters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Chapters.
     */
    distinct?: ChapterScalarFieldEnum | ChapterScalarFieldEnum[]
  }

  /**
   * Chapter findMany
   */
  export type ChapterFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * Filter, which Chapters to fetch.
     */
    where?: ChapterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Chapters to fetch.
     */
    orderBy?: ChapterOrderByWithRelationInput | ChapterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Chapters.
     */
    cursor?: ChapterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Chapters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Chapters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Chapters.
     */
    distinct?: ChapterScalarFieldEnum | ChapterScalarFieldEnum[]
  }

  /**
   * Chapter create
   */
  export type ChapterCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * The data needed to create a Chapter.
     */
    data: XOR<ChapterCreateInput, ChapterUncheckedCreateInput>
  }

  /**
   * Chapter createMany
   */
  export type ChapterCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Chapters.
     */
    data: ChapterCreateManyInput | ChapterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Chapter update
   */
  export type ChapterUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * The data needed to update a Chapter.
     */
    data: XOR<ChapterUpdateInput, ChapterUncheckedUpdateInput>
    /**
     * Choose, which Chapter to update.
     */
    where: ChapterWhereUniqueInput
  }

  /**
   * Chapter updateMany
   */
  export type ChapterUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Chapters.
     */
    data: XOR<ChapterUpdateManyMutationInput, ChapterUncheckedUpdateManyInput>
    /**
     * Filter which Chapters to update
     */
    where?: ChapterWhereInput
    /**
     * Limit how many Chapters to update.
     */
    limit?: number
  }

  /**
   * Chapter upsert
   */
  export type ChapterUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * The filter to search for the Chapter to update in case it exists.
     */
    where: ChapterWhereUniqueInput
    /**
     * In case the Chapter found by the `where` argument doesn't exist, create a new Chapter with this data.
     */
    create: XOR<ChapterCreateInput, ChapterUncheckedCreateInput>
    /**
     * In case the Chapter was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ChapterUpdateInput, ChapterUncheckedUpdateInput>
  }

  /**
   * Chapter delete
   */
  export type ChapterDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * Filter which Chapter to delete.
     */
    where: ChapterWhereUniqueInput
  }

  /**
   * Chapter deleteMany
   */
  export type ChapterDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Chapters to delete
     */
    where?: ChapterWhereInput
    /**
     * Limit how many Chapters to delete.
     */
    limit?: number
  }

  /**
   * Chapter.concepts
   */
  export type Chapter$conceptsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptInclude<ExtArgs> | null
    where?: ConceptWhereInput
    orderBy?: ConceptOrderByWithRelationInput | ConceptOrderByWithRelationInput[]
    cursor?: ConceptWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ConceptScalarFieldEnum | ConceptScalarFieldEnum[]
  }

  /**
   * Chapter without action
   */
  export type ChapterDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
  }


  /**
   * Model Concept
   */

  export type AggregateConcept = {
    _count: ConceptCountAggregateOutputType | null
    _avg: ConceptAvgAggregateOutputType | null
    _sum: ConceptSumAggregateOutputType | null
    _min: ConceptMinAggregateOutputType | null
    _max: ConceptMaxAggregateOutputType | null
  }

  export type ConceptAvgAggregateOutputType = {
    ord: number | null
  }

  export type ConceptSumAggregateOutputType = {
    ord: number | null
  }

  export type ConceptMinAggregateOutputType = {
    id: string | null
    chapterId: string | null
    title: string | null
    summary: string | null
    versionNote: string | null
    ord: number | null
    updatedAt: Date | null
  }

  export type ConceptMaxAggregateOutputType = {
    id: string | null
    chapterId: string | null
    title: string | null
    summary: string | null
    versionNote: string | null
    ord: number | null
    updatedAt: Date | null
  }

  export type ConceptCountAggregateOutputType = {
    id: number
    chapterId: number
    title: number
    summary: number
    versionNote: number
    ord: number
    updatedAt: number
    _all: number
  }


  export type ConceptAvgAggregateInputType = {
    ord?: true
  }

  export type ConceptSumAggregateInputType = {
    ord?: true
  }

  export type ConceptMinAggregateInputType = {
    id?: true
    chapterId?: true
    title?: true
    summary?: true
    versionNote?: true
    ord?: true
    updatedAt?: true
  }

  export type ConceptMaxAggregateInputType = {
    id?: true
    chapterId?: true
    title?: true
    summary?: true
    versionNote?: true
    ord?: true
    updatedAt?: true
  }

  export type ConceptCountAggregateInputType = {
    id?: true
    chapterId?: true
    title?: true
    summary?: true
    versionNote?: true
    ord?: true
    updatedAt?: true
    _all?: true
  }

  export type ConceptAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Concept to aggregate.
     */
    where?: ConceptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Concepts to fetch.
     */
    orderBy?: ConceptOrderByWithRelationInput | ConceptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ConceptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Concepts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Concepts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Concepts
    **/
    _count?: true | ConceptCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ConceptAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ConceptSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ConceptMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ConceptMaxAggregateInputType
  }

  export type GetConceptAggregateType<T extends ConceptAggregateArgs> = {
        [P in keyof T & keyof AggregateConcept]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateConcept[P]>
      : GetScalarType<T[P], AggregateConcept[P]>
  }




  export type ConceptGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConceptWhereInput
    orderBy?: ConceptOrderByWithAggregationInput | ConceptOrderByWithAggregationInput[]
    by: ConceptScalarFieldEnum[] | ConceptScalarFieldEnum
    having?: ConceptScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ConceptCountAggregateInputType | true
    _avg?: ConceptAvgAggregateInputType
    _sum?: ConceptSumAggregateInputType
    _min?: ConceptMinAggregateInputType
    _max?: ConceptMaxAggregateInputType
  }

  export type ConceptGroupByOutputType = {
    id: string
    chapterId: string
    title: string
    summary: string
    versionNote: string | null
    ord: number
    updatedAt: Date
    _count: ConceptCountAggregateOutputType | null
    _avg: ConceptAvgAggregateOutputType | null
    _sum: ConceptSumAggregateOutputType | null
    _min: ConceptMinAggregateOutputType | null
    _max: ConceptMaxAggregateOutputType | null
  }

  type GetConceptGroupByPayload<T extends ConceptGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ConceptGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ConceptGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ConceptGroupByOutputType[P]>
            : GetScalarType<T[P], ConceptGroupByOutputType[P]>
        }
      >
    >


  export type ConceptSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    chapterId?: boolean
    title?: boolean
    summary?: boolean
    versionNote?: boolean
    ord?: boolean
    updatedAt?: boolean
    chapter?: boolean | ChapterDefaultArgs<ExtArgs>
    levels?: boolean | Concept$levelsArgs<ExtArgs>
    sections?: boolean | Concept$sectionsArgs<ExtArgs>
    visuals?: boolean | Concept$visualsArgs<ExtArgs>
    sources?: boolean | Concept$sourcesArgs<ExtArgs>
    note?: boolean | Concept$noteArgs<ExtArgs>
    edgesOut?: boolean | Concept$edgesOutArgs<ExtArgs>
    edgesIn?: boolean | Concept$edgesInArgs<ExtArgs>
    _count?: boolean | ConceptCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["concept"]>



  export type ConceptSelectScalar = {
    id?: boolean
    chapterId?: boolean
    title?: boolean
    summary?: boolean
    versionNote?: boolean
    ord?: boolean
    updatedAt?: boolean
  }

  export type ConceptOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "chapterId" | "title" | "summary" | "versionNote" | "ord" | "updatedAt", ExtArgs["result"]["concept"]>
  export type ConceptInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    chapter?: boolean | ChapterDefaultArgs<ExtArgs>
    levels?: boolean | Concept$levelsArgs<ExtArgs>
    sections?: boolean | Concept$sectionsArgs<ExtArgs>
    visuals?: boolean | Concept$visualsArgs<ExtArgs>
    sources?: boolean | Concept$sourcesArgs<ExtArgs>
    note?: boolean | Concept$noteArgs<ExtArgs>
    edgesOut?: boolean | Concept$edgesOutArgs<ExtArgs>
    edgesIn?: boolean | Concept$edgesInArgs<ExtArgs>
    _count?: boolean | ConceptCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $ConceptPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Concept"
    objects: {
      chapter: Prisma.$ChapterPayload<ExtArgs>
      levels: Prisma.$ConceptLevelPayload<ExtArgs>[]
      sections: Prisma.$ConceptSectionPayload<ExtArgs>[]
      visuals: Prisma.$ConceptVisualPayload<ExtArgs>[]
      sources: Prisma.$SourcePayload<ExtArgs>[]
      note: Prisma.$NotePayload<ExtArgs> | null
      edgesOut: Prisma.$EdgePayload<ExtArgs>[]
      edgesIn: Prisma.$EdgePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      chapterId: string
      title: string
      /**
       * 한 문장 요약. 링크 미리보기에 그대로 쓰인다.
       */
      summary: string
      /**
       * 기준 버전. 1년 뒤 "이게 어느 버전이지"를 막는다.
       */
      versionNote: string | null
      ord: number
      updatedAt: Date
    }, ExtArgs["result"]["concept"]>
    composites: {}
  }

  type ConceptGetPayload<S extends boolean | null | undefined | ConceptDefaultArgs> = $Result.GetResult<Prisma.$ConceptPayload, S>

  type ConceptCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ConceptFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ConceptCountAggregateInputType | true
    }

  export interface ConceptDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Concept'], meta: { name: 'Concept' } }
    /**
     * Find zero or one Concept that matches the filter.
     * @param {ConceptFindUniqueArgs} args - Arguments to find a Concept
     * @example
     * // Get one Concept
     * const concept = await prisma.concept.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ConceptFindUniqueArgs>(args: SelectSubset<T, ConceptFindUniqueArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Concept that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ConceptFindUniqueOrThrowArgs} args - Arguments to find a Concept
     * @example
     * // Get one Concept
     * const concept = await prisma.concept.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ConceptFindUniqueOrThrowArgs>(args: SelectSubset<T, ConceptFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Concept that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptFindFirstArgs} args - Arguments to find a Concept
     * @example
     * // Get one Concept
     * const concept = await prisma.concept.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ConceptFindFirstArgs>(args?: SelectSubset<T, ConceptFindFirstArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Concept that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptFindFirstOrThrowArgs} args - Arguments to find a Concept
     * @example
     * // Get one Concept
     * const concept = await prisma.concept.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ConceptFindFirstOrThrowArgs>(args?: SelectSubset<T, ConceptFindFirstOrThrowArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Concepts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Concepts
     * const concepts = await prisma.concept.findMany()
     * 
     * // Get first 10 Concepts
     * const concepts = await prisma.concept.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const conceptWithIdOnly = await prisma.concept.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ConceptFindManyArgs>(args?: SelectSubset<T, ConceptFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Concept.
     * @param {ConceptCreateArgs} args - Arguments to create a Concept.
     * @example
     * // Create one Concept
     * const Concept = await prisma.concept.create({
     *   data: {
     *     // ... data to create a Concept
     *   }
     * })
     * 
     */
    create<T extends ConceptCreateArgs>(args: SelectSubset<T, ConceptCreateArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Concepts.
     * @param {ConceptCreateManyArgs} args - Arguments to create many Concepts.
     * @example
     * // Create many Concepts
     * const concept = await prisma.concept.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ConceptCreateManyArgs>(args?: SelectSubset<T, ConceptCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Concept.
     * @param {ConceptDeleteArgs} args - Arguments to delete one Concept.
     * @example
     * // Delete one Concept
     * const Concept = await prisma.concept.delete({
     *   where: {
     *     // ... filter to delete one Concept
     *   }
     * })
     * 
     */
    delete<T extends ConceptDeleteArgs>(args: SelectSubset<T, ConceptDeleteArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Concept.
     * @param {ConceptUpdateArgs} args - Arguments to update one Concept.
     * @example
     * // Update one Concept
     * const concept = await prisma.concept.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ConceptUpdateArgs>(args: SelectSubset<T, ConceptUpdateArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Concepts.
     * @param {ConceptDeleteManyArgs} args - Arguments to filter Concepts to delete.
     * @example
     * // Delete a few Concepts
     * const { count } = await prisma.concept.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ConceptDeleteManyArgs>(args?: SelectSubset<T, ConceptDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Concepts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Concepts
     * const concept = await prisma.concept.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ConceptUpdateManyArgs>(args: SelectSubset<T, ConceptUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Concept.
     * @param {ConceptUpsertArgs} args - Arguments to update or create a Concept.
     * @example
     * // Update or create a Concept
     * const concept = await prisma.concept.upsert({
     *   create: {
     *     // ... data to create a Concept
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Concept we want to update
     *   }
     * })
     */
    upsert<T extends ConceptUpsertArgs>(args: SelectSubset<T, ConceptUpsertArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Concepts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptCountArgs} args - Arguments to filter Concepts to count.
     * @example
     * // Count the number of Concepts
     * const count = await prisma.concept.count({
     *   where: {
     *     // ... the filter for the Concepts we want to count
     *   }
     * })
    **/
    count<T extends ConceptCountArgs>(
      args?: Subset<T, ConceptCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ConceptCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Concept.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ConceptAggregateArgs>(args: Subset<T, ConceptAggregateArgs>): Prisma.PrismaPromise<GetConceptAggregateType<T>>

    /**
     * Group by Concept.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ConceptGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ConceptGroupByArgs['orderBy'] }
        : { orderBy?: ConceptGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ConceptGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetConceptGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Concept model
   */
  readonly fields: ConceptFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Concept.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ConceptClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    chapter<T extends ChapterDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ChapterDefaultArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    levels<T extends Concept$levelsArgs<ExtArgs> = {}>(args?: Subset<T, Concept$levelsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConceptLevelPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    sections<T extends Concept$sectionsArgs<ExtArgs> = {}>(args?: Subset<T, Concept$sectionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConceptSectionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    visuals<T extends Concept$visualsArgs<ExtArgs> = {}>(args?: Subset<T, Concept$visualsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConceptVisualPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    sources<T extends Concept$sourcesArgs<ExtArgs> = {}>(args?: Subset<T, Concept$sourcesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    note<T extends Concept$noteArgs<ExtArgs> = {}>(args?: Subset<T, Concept$noteArgs<ExtArgs>>): Prisma__NoteClient<$Result.GetResult<Prisma.$NotePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    edgesOut<T extends Concept$edgesOutArgs<ExtArgs> = {}>(args?: Subset<T, Concept$edgesOutArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EdgePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    edgesIn<T extends Concept$edgesInArgs<ExtArgs> = {}>(args?: Subset<T, Concept$edgesInArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EdgePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Concept model
   */
  interface ConceptFieldRefs {
    readonly id: FieldRef<"Concept", 'String'>
    readonly chapterId: FieldRef<"Concept", 'String'>
    readonly title: FieldRef<"Concept", 'String'>
    readonly summary: FieldRef<"Concept", 'String'>
    readonly versionNote: FieldRef<"Concept", 'String'>
    readonly ord: FieldRef<"Concept", 'Int'>
    readonly updatedAt: FieldRef<"Concept", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Concept findUnique
   */
  export type ConceptFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptInclude<ExtArgs> | null
    /**
     * Filter, which Concept to fetch.
     */
    where: ConceptWhereUniqueInput
  }

  /**
   * Concept findUniqueOrThrow
   */
  export type ConceptFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptInclude<ExtArgs> | null
    /**
     * Filter, which Concept to fetch.
     */
    where: ConceptWhereUniqueInput
  }

  /**
   * Concept findFirst
   */
  export type ConceptFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptInclude<ExtArgs> | null
    /**
     * Filter, which Concept to fetch.
     */
    where?: ConceptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Concepts to fetch.
     */
    orderBy?: ConceptOrderByWithRelationInput | ConceptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Concepts.
     */
    cursor?: ConceptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Concepts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Concepts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Concepts.
     */
    distinct?: ConceptScalarFieldEnum | ConceptScalarFieldEnum[]
  }

  /**
   * Concept findFirstOrThrow
   */
  export type ConceptFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptInclude<ExtArgs> | null
    /**
     * Filter, which Concept to fetch.
     */
    where?: ConceptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Concepts to fetch.
     */
    orderBy?: ConceptOrderByWithRelationInput | ConceptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Concepts.
     */
    cursor?: ConceptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Concepts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Concepts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Concepts.
     */
    distinct?: ConceptScalarFieldEnum | ConceptScalarFieldEnum[]
  }

  /**
   * Concept findMany
   */
  export type ConceptFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptInclude<ExtArgs> | null
    /**
     * Filter, which Concepts to fetch.
     */
    where?: ConceptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Concepts to fetch.
     */
    orderBy?: ConceptOrderByWithRelationInput | ConceptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Concepts.
     */
    cursor?: ConceptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Concepts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Concepts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Concepts.
     */
    distinct?: ConceptScalarFieldEnum | ConceptScalarFieldEnum[]
  }

  /**
   * Concept create
   */
  export type ConceptCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptInclude<ExtArgs> | null
    /**
     * The data needed to create a Concept.
     */
    data: XOR<ConceptCreateInput, ConceptUncheckedCreateInput>
  }

  /**
   * Concept createMany
   */
  export type ConceptCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Concepts.
     */
    data: ConceptCreateManyInput | ConceptCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Concept update
   */
  export type ConceptUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptInclude<ExtArgs> | null
    /**
     * The data needed to update a Concept.
     */
    data: XOR<ConceptUpdateInput, ConceptUncheckedUpdateInput>
    /**
     * Choose, which Concept to update.
     */
    where: ConceptWhereUniqueInput
  }

  /**
   * Concept updateMany
   */
  export type ConceptUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Concepts.
     */
    data: XOR<ConceptUpdateManyMutationInput, ConceptUncheckedUpdateManyInput>
    /**
     * Filter which Concepts to update
     */
    where?: ConceptWhereInput
    /**
     * Limit how many Concepts to update.
     */
    limit?: number
  }

  /**
   * Concept upsert
   */
  export type ConceptUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptInclude<ExtArgs> | null
    /**
     * The filter to search for the Concept to update in case it exists.
     */
    where: ConceptWhereUniqueInput
    /**
     * In case the Concept found by the `where` argument doesn't exist, create a new Concept with this data.
     */
    create: XOR<ConceptCreateInput, ConceptUncheckedCreateInput>
    /**
     * In case the Concept was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ConceptUpdateInput, ConceptUncheckedUpdateInput>
  }

  /**
   * Concept delete
   */
  export type ConceptDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptInclude<ExtArgs> | null
    /**
     * Filter which Concept to delete.
     */
    where: ConceptWhereUniqueInput
  }

  /**
   * Concept deleteMany
   */
  export type ConceptDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Concepts to delete
     */
    where?: ConceptWhereInput
    /**
     * Limit how many Concepts to delete.
     */
    limit?: number
  }

  /**
   * Concept.levels
   */
  export type Concept$levelsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptLevel
     */
    select?: ConceptLevelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptLevel
     */
    omit?: ConceptLevelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptLevelInclude<ExtArgs> | null
    where?: ConceptLevelWhereInput
    orderBy?: ConceptLevelOrderByWithRelationInput | ConceptLevelOrderByWithRelationInput[]
    cursor?: ConceptLevelWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ConceptLevelScalarFieldEnum | ConceptLevelScalarFieldEnum[]
  }

  /**
   * Concept.sections
   */
  export type Concept$sectionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptSection
     */
    select?: ConceptSectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptSection
     */
    omit?: ConceptSectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptSectionInclude<ExtArgs> | null
    where?: ConceptSectionWhereInput
    orderBy?: ConceptSectionOrderByWithRelationInput | ConceptSectionOrderByWithRelationInput[]
    cursor?: ConceptSectionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ConceptSectionScalarFieldEnum | ConceptSectionScalarFieldEnum[]
  }

  /**
   * Concept.visuals
   */
  export type Concept$visualsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptVisual
     */
    select?: ConceptVisualSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptVisual
     */
    omit?: ConceptVisualOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptVisualInclude<ExtArgs> | null
    where?: ConceptVisualWhereInput
    orderBy?: ConceptVisualOrderByWithRelationInput | ConceptVisualOrderByWithRelationInput[]
    cursor?: ConceptVisualWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ConceptVisualScalarFieldEnum | ConceptVisualScalarFieldEnum[]
  }

  /**
   * Concept.sources
   */
  export type Concept$sourcesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
    where?: SourceWhereInput
    orderBy?: SourceOrderByWithRelationInput | SourceOrderByWithRelationInput[]
    cursor?: SourceWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SourceScalarFieldEnum | SourceScalarFieldEnum[]
  }

  /**
   * Concept.note
   */
  export type Concept$noteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Note
     */
    select?: NoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Note
     */
    omit?: NoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NoteInclude<ExtArgs> | null
    where?: NoteWhereInput
  }

  /**
   * Concept.edgesOut
   */
  export type Concept$edgesOutArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Edge
     */
    select?: EdgeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Edge
     */
    omit?: EdgeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EdgeInclude<ExtArgs> | null
    where?: EdgeWhereInput
    orderBy?: EdgeOrderByWithRelationInput | EdgeOrderByWithRelationInput[]
    cursor?: EdgeWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EdgeScalarFieldEnum | EdgeScalarFieldEnum[]
  }

  /**
   * Concept.edgesIn
   */
  export type Concept$edgesInArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Edge
     */
    select?: EdgeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Edge
     */
    omit?: EdgeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EdgeInclude<ExtArgs> | null
    where?: EdgeWhereInput
    orderBy?: EdgeOrderByWithRelationInput | EdgeOrderByWithRelationInput[]
    cursor?: EdgeWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EdgeScalarFieldEnum | EdgeScalarFieldEnum[]
  }

  /**
   * Concept without action
   */
  export type ConceptDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptInclude<ExtArgs> | null
  }


  /**
   * Model ConceptLevel
   */

  export type AggregateConceptLevel = {
    _count: ConceptLevelCountAggregateOutputType | null
    _avg: ConceptLevelAvgAggregateOutputType | null
    _sum: ConceptLevelSumAggregateOutputType | null
    _min: ConceptLevelMinAggregateOutputType | null
    _max: ConceptLevelMaxAggregateOutputType | null
  }

  export type ConceptLevelAvgAggregateOutputType = {
    minutes: number | null
  }

  export type ConceptLevelSumAggregateOutputType = {
    minutes: number | null
  }

  export type ConceptLevelMinAggregateOutputType = {
    conceptId: string | null
    level: $Enums.Level | null
    body: string | null
    minutes: number | null
  }

  export type ConceptLevelMaxAggregateOutputType = {
    conceptId: string | null
    level: $Enums.Level | null
    body: string | null
    minutes: number | null
  }

  export type ConceptLevelCountAggregateOutputType = {
    conceptId: number
    level: number
    body: number
    minutes: number
    _all: number
  }


  export type ConceptLevelAvgAggregateInputType = {
    minutes?: true
  }

  export type ConceptLevelSumAggregateInputType = {
    minutes?: true
  }

  export type ConceptLevelMinAggregateInputType = {
    conceptId?: true
    level?: true
    body?: true
    minutes?: true
  }

  export type ConceptLevelMaxAggregateInputType = {
    conceptId?: true
    level?: true
    body?: true
    minutes?: true
  }

  export type ConceptLevelCountAggregateInputType = {
    conceptId?: true
    level?: true
    body?: true
    minutes?: true
    _all?: true
  }

  export type ConceptLevelAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ConceptLevel to aggregate.
     */
    where?: ConceptLevelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConceptLevels to fetch.
     */
    orderBy?: ConceptLevelOrderByWithRelationInput | ConceptLevelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ConceptLevelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConceptLevels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConceptLevels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ConceptLevels
    **/
    _count?: true | ConceptLevelCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ConceptLevelAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ConceptLevelSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ConceptLevelMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ConceptLevelMaxAggregateInputType
  }

  export type GetConceptLevelAggregateType<T extends ConceptLevelAggregateArgs> = {
        [P in keyof T & keyof AggregateConceptLevel]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateConceptLevel[P]>
      : GetScalarType<T[P], AggregateConceptLevel[P]>
  }




  export type ConceptLevelGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConceptLevelWhereInput
    orderBy?: ConceptLevelOrderByWithAggregationInput | ConceptLevelOrderByWithAggregationInput[]
    by: ConceptLevelScalarFieldEnum[] | ConceptLevelScalarFieldEnum
    having?: ConceptLevelScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ConceptLevelCountAggregateInputType | true
    _avg?: ConceptLevelAvgAggregateInputType
    _sum?: ConceptLevelSumAggregateInputType
    _min?: ConceptLevelMinAggregateInputType
    _max?: ConceptLevelMaxAggregateInputType
  }

  export type ConceptLevelGroupByOutputType = {
    conceptId: string
    level: $Enums.Level
    body: string
    minutes: number
    _count: ConceptLevelCountAggregateOutputType | null
    _avg: ConceptLevelAvgAggregateOutputType | null
    _sum: ConceptLevelSumAggregateOutputType | null
    _min: ConceptLevelMinAggregateOutputType | null
    _max: ConceptLevelMaxAggregateOutputType | null
  }

  type GetConceptLevelGroupByPayload<T extends ConceptLevelGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ConceptLevelGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ConceptLevelGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ConceptLevelGroupByOutputType[P]>
            : GetScalarType<T[P], ConceptLevelGroupByOutputType[P]>
        }
      >
    >


  export type ConceptLevelSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    conceptId?: boolean
    level?: boolean
    body?: boolean
    minutes?: boolean
    concept?: boolean | ConceptDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["conceptLevel"]>



  export type ConceptLevelSelectScalar = {
    conceptId?: boolean
    level?: boolean
    body?: boolean
    minutes?: boolean
  }

  export type ConceptLevelOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"conceptId" | "level" | "body" | "minutes", ExtArgs["result"]["conceptLevel"]>
  export type ConceptLevelInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    concept?: boolean | ConceptDefaultArgs<ExtArgs>
  }

  export type $ConceptLevelPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ConceptLevel"
    objects: {
      concept: Prisma.$ConceptPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      conceptId: string
      level: $Enums.Level
      /**
       * 마크다운 본문. [[id]] 링크와 visual 펜스를 포함한다.
       */
      body: string
      /**
       * 예상 읽기 시간(분)
       */
      minutes: number
    }, ExtArgs["result"]["conceptLevel"]>
    composites: {}
  }

  type ConceptLevelGetPayload<S extends boolean | null | undefined | ConceptLevelDefaultArgs> = $Result.GetResult<Prisma.$ConceptLevelPayload, S>

  type ConceptLevelCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ConceptLevelFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ConceptLevelCountAggregateInputType | true
    }

  export interface ConceptLevelDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ConceptLevel'], meta: { name: 'ConceptLevel' } }
    /**
     * Find zero or one ConceptLevel that matches the filter.
     * @param {ConceptLevelFindUniqueArgs} args - Arguments to find a ConceptLevel
     * @example
     * // Get one ConceptLevel
     * const conceptLevel = await prisma.conceptLevel.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ConceptLevelFindUniqueArgs>(args: SelectSubset<T, ConceptLevelFindUniqueArgs<ExtArgs>>): Prisma__ConceptLevelClient<$Result.GetResult<Prisma.$ConceptLevelPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ConceptLevel that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ConceptLevelFindUniqueOrThrowArgs} args - Arguments to find a ConceptLevel
     * @example
     * // Get one ConceptLevel
     * const conceptLevel = await prisma.conceptLevel.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ConceptLevelFindUniqueOrThrowArgs>(args: SelectSubset<T, ConceptLevelFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ConceptLevelClient<$Result.GetResult<Prisma.$ConceptLevelPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ConceptLevel that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptLevelFindFirstArgs} args - Arguments to find a ConceptLevel
     * @example
     * // Get one ConceptLevel
     * const conceptLevel = await prisma.conceptLevel.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ConceptLevelFindFirstArgs>(args?: SelectSubset<T, ConceptLevelFindFirstArgs<ExtArgs>>): Prisma__ConceptLevelClient<$Result.GetResult<Prisma.$ConceptLevelPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ConceptLevel that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptLevelFindFirstOrThrowArgs} args - Arguments to find a ConceptLevel
     * @example
     * // Get one ConceptLevel
     * const conceptLevel = await prisma.conceptLevel.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ConceptLevelFindFirstOrThrowArgs>(args?: SelectSubset<T, ConceptLevelFindFirstOrThrowArgs<ExtArgs>>): Prisma__ConceptLevelClient<$Result.GetResult<Prisma.$ConceptLevelPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ConceptLevels that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptLevelFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ConceptLevels
     * const conceptLevels = await prisma.conceptLevel.findMany()
     * 
     * // Get first 10 ConceptLevels
     * const conceptLevels = await prisma.conceptLevel.findMany({ take: 10 })
     * 
     * // Only select the `conceptId`
     * const conceptLevelWithConceptIdOnly = await prisma.conceptLevel.findMany({ select: { conceptId: true } })
     * 
     */
    findMany<T extends ConceptLevelFindManyArgs>(args?: SelectSubset<T, ConceptLevelFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConceptLevelPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ConceptLevel.
     * @param {ConceptLevelCreateArgs} args - Arguments to create a ConceptLevel.
     * @example
     * // Create one ConceptLevel
     * const ConceptLevel = await prisma.conceptLevel.create({
     *   data: {
     *     // ... data to create a ConceptLevel
     *   }
     * })
     * 
     */
    create<T extends ConceptLevelCreateArgs>(args: SelectSubset<T, ConceptLevelCreateArgs<ExtArgs>>): Prisma__ConceptLevelClient<$Result.GetResult<Prisma.$ConceptLevelPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ConceptLevels.
     * @param {ConceptLevelCreateManyArgs} args - Arguments to create many ConceptLevels.
     * @example
     * // Create many ConceptLevels
     * const conceptLevel = await prisma.conceptLevel.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ConceptLevelCreateManyArgs>(args?: SelectSubset<T, ConceptLevelCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a ConceptLevel.
     * @param {ConceptLevelDeleteArgs} args - Arguments to delete one ConceptLevel.
     * @example
     * // Delete one ConceptLevel
     * const ConceptLevel = await prisma.conceptLevel.delete({
     *   where: {
     *     // ... filter to delete one ConceptLevel
     *   }
     * })
     * 
     */
    delete<T extends ConceptLevelDeleteArgs>(args: SelectSubset<T, ConceptLevelDeleteArgs<ExtArgs>>): Prisma__ConceptLevelClient<$Result.GetResult<Prisma.$ConceptLevelPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ConceptLevel.
     * @param {ConceptLevelUpdateArgs} args - Arguments to update one ConceptLevel.
     * @example
     * // Update one ConceptLevel
     * const conceptLevel = await prisma.conceptLevel.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ConceptLevelUpdateArgs>(args: SelectSubset<T, ConceptLevelUpdateArgs<ExtArgs>>): Prisma__ConceptLevelClient<$Result.GetResult<Prisma.$ConceptLevelPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ConceptLevels.
     * @param {ConceptLevelDeleteManyArgs} args - Arguments to filter ConceptLevels to delete.
     * @example
     * // Delete a few ConceptLevels
     * const { count } = await prisma.conceptLevel.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ConceptLevelDeleteManyArgs>(args?: SelectSubset<T, ConceptLevelDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ConceptLevels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptLevelUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ConceptLevels
     * const conceptLevel = await prisma.conceptLevel.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ConceptLevelUpdateManyArgs>(args: SelectSubset<T, ConceptLevelUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ConceptLevel.
     * @param {ConceptLevelUpsertArgs} args - Arguments to update or create a ConceptLevel.
     * @example
     * // Update or create a ConceptLevel
     * const conceptLevel = await prisma.conceptLevel.upsert({
     *   create: {
     *     // ... data to create a ConceptLevel
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ConceptLevel we want to update
     *   }
     * })
     */
    upsert<T extends ConceptLevelUpsertArgs>(args: SelectSubset<T, ConceptLevelUpsertArgs<ExtArgs>>): Prisma__ConceptLevelClient<$Result.GetResult<Prisma.$ConceptLevelPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ConceptLevels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptLevelCountArgs} args - Arguments to filter ConceptLevels to count.
     * @example
     * // Count the number of ConceptLevels
     * const count = await prisma.conceptLevel.count({
     *   where: {
     *     // ... the filter for the ConceptLevels we want to count
     *   }
     * })
    **/
    count<T extends ConceptLevelCountArgs>(
      args?: Subset<T, ConceptLevelCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ConceptLevelCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ConceptLevel.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptLevelAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ConceptLevelAggregateArgs>(args: Subset<T, ConceptLevelAggregateArgs>): Prisma.PrismaPromise<GetConceptLevelAggregateType<T>>

    /**
     * Group by ConceptLevel.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptLevelGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ConceptLevelGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ConceptLevelGroupByArgs['orderBy'] }
        : { orderBy?: ConceptLevelGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ConceptLevelGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetConceptLevelGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ConceptLevel model
   */
  readonly fields: ConceptLevelFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ConceptLevel.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ConceptLevelClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    concept<T extends ConceptDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ConceptDefaultArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ConceptLevel model
   */
  interface ConceptLevelFieldRefs {
    readonly conceptId: FieldRef<"ConceptLevel", 'String'>
    readonly level: FieldRef<"ConceptLevel", 'Level'>
    readonly body: FieldRef<"ConceptLevel", 'String'>
    readonly minutes: FieldRef<"ConceptLevel", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * ConceptLevel findUnique
   */
  export type ConceptLevelFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptLevel
     */
    select?: ConceptLevelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptLevel
     */
    omit?: ConceptLevelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptLevelInclude<ExtArgs> | null
    /**
     * Filter, which ConceptLevel to fetch.
     */
    where: ConceptLevelWhereUniqueInput
  }

  /**
   * ConceptLevel findUniqueOrThrow
   */
  export type ConceptLevelFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptLevel
     */
    select?: ConceptLevelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptLevel
     */
    omit?: ConceptLevelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptLevelInclude<ExtArgs> | null
    /**
     * Filter, which ConceptLevel to fetch.
     */
    where: ConceptLevelWhereUniqueInput
  }

  /**
   * ConceptLevel findFirst
   */
  export type ConceptLevelFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptLevel
     */
    select?: ConceptLevelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptLevel
     */
    omit?: ConceptLevelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptLevelInclude<ExtArgs> | null
    /**
     * Filter, which ConceptLevel to fetch.
     */
    where?: ConceptLevelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConceptLevels to fetch.
     */
    orderBy?: ConceptLevelOrderByWithRelationInput | ConceptLevelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ConceptLevels.
     */
    cursor?: ConceptLevelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConceptLevels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConceptLevels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ConceptLevels.
     */
    distinct?: ConceptLevelScalarFieldEnum | ConceptLevelScalarFieldEnum[]
  }

  /**
   * ConceptLevel findFirstOrThrow
   */
  export type ConceptLevelFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptLevel
     */
    select?: ConceptLevelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptLevel
     */
    omit?: ConceptLevelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptLevelInclude<ExtArgs> | null
    /**
     * Filter, which ConceptLevel to fetch.
     */
    where?: ConceptLevelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConceptLevels to fetch.
     */
    orderBy?: ConceptLevelOrderByWithRelationInput | ConceptLevelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ConceptLevels.
     */
    cursor?: ConceptLevelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConceptLevels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConceptLevels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ConceptLevels.
     */
    distinct?: ConceptLevelScalarFieldEnum | ConceptLevelScalarFieldEnum[]
  }

  /**
   * ConceptLevel findMany
   */
  export type ConceptLevelFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptLevel
     */
    select?: ConceptLevelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptLevel
     */
    omit?: ConceptLevelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptLevelInclude<ExtArgs> | null
    /**
     * Filter, which ConceptLevels to fetch.
     */
    where?: ConceptLevelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConceptLevels to fetch.
     */
    orderBy?: ConceptLevelOrderByWithRelationInput | ConceptLevelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ConceptLevels.
     */
    cursor?: ConceptLevelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConceptLevels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConceptLevels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ConceptLevels.
     */
    distinct?: ConceptLevelScalarFieldEnum | ConceptLevelScalarFieldEnum[]
  }

  /**
   * ConceptLevel create
   */
  export type ConceptLevelCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptLevel
     */
    select?: ConceptLevelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptLevel
     */
    omit?: ConceptLevelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptLevelInclude<ExtArgs> | null
    /**
     * The data needed to create a ConceptLevel.
     */
    data: XOR<ConceptLevelCreateInput, ConceptLevelUncheckedCreateInput>
  }

  /**
   * ConceptLevel createMany
   */
  export type ConceptLevelCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ConceptLevels.
     */
    data: ConceptLevelCreateManyInput | ConceptLevelCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ConceptLevel update
   */
  export type ConceptLevelUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptLevel
     */
    select?: ConceptLevelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptLevel
     */
    omit?: ConceptLevelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptLevelInclude<ExtArgs> | null
    /**
     * The data needed to update a ConceptLevel.
     */
    data: XOR<ConceptLevelUpdateInput, ConceptLevelUncheckedUpdateInput>
    /**
     * Choose, which ConceptLevel to update.
     */
    where: ConceptLevelWhereUniqueInput
  }

  /**
   * ConceptLevel updateMany
   */
  export type ConceptLevelUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ConceptLevels.
     */
    data: XOR<ConceptLevelUpdateManyMutationInput, ConceptLevelUncheckedUpdateManyInput>
    /**
     * Filter which ConceptLevels to update
     */
    where?: ConceptLevelWhereInput
    /**
     * Limit how many ConceptLevels to update.
     */
    limit?: number
  }

  /**
   * ConceptLevel upsert
   */
  export type ConceptLevelUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptLevel
     */
    select?: ConceptLevelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptLevel
     */
    omit?: ConceptLevelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptLevelInclude<ExtArgs> | null
    /**
     * The filter to search for the ConceptLevel to update in case it exists.
     */
    where: ConceptLevelWhereUniqueInput
    /**
     * In case the ConceptLevel found by the `where` argument doesn't exist, create a new ConceptLevel with this data.
     */
    create: XOR<ConceptLevelCreateInput, ConceptLevelUncheckedCreateInput>
    /**
     * In case the ConceptLevel was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ConceptLevelUpdateInput, ConceptLevelUncheckedUpdateInput>
  }

  /**
   * ConceptLevel delete
   */
  export type ConceptLevelDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptLevel
     */
    select?: ConceptLevelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptLevel
     */
    omit?: ConceptLevelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptLevelInclude<ExtArgs> | null
    /**
     * Filter which ConceptLevel to delete.
     */
    where: ConceptLevelWhereUniqueInput
  }

  /**
   * ConceptLevel deleteMany
   */
  export type ConceptLevelDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ConceptLevels to delete
     */
    where?: ConceptLevelWhereInput
    /**
     * Limit how many ConceptLevels to delete.
     */
    limit?: number
  }

  /**
   * ConceptLevel without action
   */
  export type ConceptLevelDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptLevel
     */
    select?: ConceptLevelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptLevel
     */
    omit?: ConceptLevelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptLevelInclude<ExtArgs> | null
  }


  /**
   * Model ConceptSection
   */

  export type AggregateConceptSection = {
    _count: ConceptSectionCountAggregateOutputType | null
    _avg: ConceptSectionAvgAggregateOutputType | null
    _sum: ConceptSectionSumAggregateOutputType | null
    _min: ConceptSectionMinAggregateOutputType | null
    _max: ConceptSectionMaxAggregateOutputType | null
  }

  export type ConceptSectionAvgAggregateOutputType = {
    ord: number | null
  }

  export type ConceptSectionSumAggregateOutputType = {
    ord: number | null
  }

  export type ConceptSectionMinAggregateOutputType = {
    conceptId: string | null
    level: $Enums.Level | null
    ord: number | null
    heading: string | null
    anchor: string | null
  }

  export type ConceptSectionMaxAggregateOutputType = {
    conceptId: string | null
    level: $Enums.Level | null
    ord: number | null
    heading: string | null
    anchor: string | null
  }

  export type ConceptSectionCountAggregateOutputType = {
    conceptId: number
    level: number
    ord: number
    heading: number
    anchor: number
    _all: number
  }


  export type ConceptSectionAvgAggregateInputType = {
    ord?: true
  }

  export type ConceptSectionSumAggregateInputType = {
    ord?: true
  }

  export type ConceptSectionMinAggregateInputType = {
    conceptId?: true
    level?: true
    ord?: true
    heading?: true
    anchor?: true
  }

  export type ConceptSectionMaxAggregateInputType = {
    conceptId?: true
    level?: true
    ord?: true
    heading?: true
    anchor?: true
  }

  export type ConceptSectionCountAggregateInputType = {
    conceptId?: true
    level?: true
    ord?: true
    heading?: true
    anchor?: true
    _all?: true
  }

  export type ConceptSectionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ConceptSection to aggregate.
     */
    where?: ConceptSectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConceptSections to fetch.
     */
    orderBy?: ConceptSectionOrderByWithRelationInput | ConceptSectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ConceptSectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConceptSections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConceptSections.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ConceptSections
    **/
    _count?: true | ConceptSectionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ConceptSectionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ConceptSectionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ConceptSectionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ConceptSectionMaxAggregateInputType
  }

  export type GetConceptSectionAggregateType<T extends ConceptSectionAggregateArgs> = {
        [P in keyof T & keyof AggregateConceptSection]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateConceptSection[P]>
      : GetScalarType<T[P], AggregateConceptSection[P]>
  }




  export type ConceptSectionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConceptSectionWhereInput
    orderBy?: ConceptSectionOrderByWithAggregationInput | ConceptSectionOrderByWithAggregationInput[]
    by: ConceptSectionScalarFieldEnum[] | ConceptSectionScalarFieldEnum
    having?: ConceptSectionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ConceptSectionCountAggregateInputType | true
    _avg?: ConceptSectionAvgAggregateInputType
    _sum?: ConceptSectionSumAggregateInputType
    _min?: ConceptSectionMinAggregateInputType
    _max?: ConceptSectionMaxAggregateInputType
  }

  export type ConceptSectionGroupByOutputType = {
    conceptId: string
    level: $Enums.Level
    ord: number
    heading: string
    anchor: string
    _count: ConceptSectionCountAggregateOutputType | null
    _avg: ConceptSectionAvgAggregateOutputType | null
    _sum: ConceptSectionSumAggregateOutputType | null
    _min: ConceptSectionMinAggregateOutputType | null
    _max: ConceptSectionMaxAggregateOutputType | null
  }

  type GetConceptSectionGroupByPayload<T extends ConceptSectionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ConceptSectionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ConceptSectionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ConceptSectionGroupByOutputType[P]>
            : GetScalarType<T[P], ConceptSectionGroupByOutputType[P]>
        }
      >
    >


  export type ConceptSectionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    conceptId?: boolean
    level?: boolean
    ord?: boolean
    heading?: boolean
    anchor?: boolean
    concept?: boolean | ConceptDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["conceptSection"]>



  export type ConceptSectionSelectScalar = {
    conceptId?: boolean
    level?: boolean
    ord?: boolean
    heading?: boolean
    anchor?: boolean
  }

  export type ConceptSectionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"conceptId" | "level" | "ord" | "heading" | "anchor", ExtArgs["result"]["conceptSection"]>
  export type ConceptSectionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    concept?: boolean | ConceptDefaultArgs<ExtArgs>
  }

  export type $ConceptSectionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ConceptSection"
    objects: {
      concept: Prisma.$ConceptPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      conceptId: string
      level: $Enums.Level
      ord: number
      /**
       * 절 제목. 목차에 그대로 표시된다.
       */
      heading: string
      /**
       * URL 앵커. 절로 바로 이동할 때 쓰인다.
       */
      anchor: string
    }, ExtArgs["result"]["conceptSection"]>
    composites: {}
  }

  type ConceptSectionGetPayload<S extends boolean | null | undefined | ConceptSectionDefaultArgs> = $Result.GetResult<Prisma.$ConceptSectionPayload, S>

  type ConceptSectionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ConceptSectionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ConceptSectionCountAggregateInputType | true
    }

  export interface ConceptSectionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ConceptSection'], meta: { name: 'ConceptSection' } }
    /**
     * Find zero or one ConceptSection that matches the filter.
     * @param {ConceptSectionFindUniqueArgs} args - Arguments to find a ConceptSection
     * @example
     * // Get one ConceptSection
     * const conceptSection = await prisma.conceptSection.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ConceptSectionFindUniqueArgs>(args: SelectSubset<T, ConceptSectionFindUniqueArgs<ExtArgs>>): Prisma__ConceptSectionClient<$Result.GetResult<Prisma.$ConceptSectionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ConceptSection that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ConceptSectionFindUniqueOrThrowArgs} args - Arguments to find a ConceptSection
     * @example
     * // Get one ConceptSection
     * const conceptSection = await prisma.conceptSection.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ConceptSectionFindUniqueOrThrowArgs>(args: SelectSubset<T, ConceptSectionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ConceptSectionClient<$Result.GetResult<Prisma.$ConceptSectionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ConceptSection that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptSectionFindFirstArgs} args - Arguments to find a ConceptSection
     * @example
     * // Get one ConceptSection
     * const conceptSection = await prisma.conceptSection.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ConceptSectionFindFirstArgs>(args?: SelectSubset<T, ConceptSectionFindFirstArgs<ExtArgs>>): Prisma__ConceptSectionClient<$Result.GetResult<Prisma.$ConceptSectionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ConceptSection that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptSectionFindFirstOrThrowArgs} args - Arguments to find a ConceptSection
     * @example
     * // Get one ConceptSection
     * const conceptSection = await prisma.conceptSection.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ConceptSectionFindFirstOrThrowArgs>(args?: SelectSubset<T, ConceptSectionFindFirstOrThrowArgs<ExtArgs>>): Prisma__ConceptSectionClient<$Result.GetResult<Prisma.$ConceptSectionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ConceptSections that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptSectionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ConceptSections
     * const conceptSections = await prisma.conceptSection.findMany()
     * 
     * // Get first 10 ConceptSections
     * const conceptSections = await prisma.conceptSection.findMany({ take: 10 })
     * 
     * // Only select the `conceptId`
     * const conceptSectionWithConceptIdOnly = await prisma.conceptSection.findMany({ select: { conceptId: true } })
     * 
     */
    findMany<T extends ConceptSectionFindManyArgs>(args?: SelectSubset<T, ConceptSectionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConceptSectionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ConceptSection.
     * @param {ConceptSectionCreateArgs} args - Arguments to create a ConceptSection.
     * @example
     * // Create one ConceptSection
     * const ConceptSection = await prisma.conceptSection.create({
     *   data: {
     *     // ... data to create a ConceptSection
     *   }
     * })
     * 
     */
    create<T extends ConceptSectionCreateArgs>(args: SelectSubset<T, ConceptSectionCreateArgs<ExtArgs>>): Prisma__ConceptSectionClient<$Result.GetResult<Prisma.$ConceptSectionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ConceptSections.
     * @param {ConceptSectionCreateManyArgs} args - Arguments to create many ConceptSections.
     * @example
     * // Create many ConceptSections
     * const conceptSection = await prisma.conceptSection.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ConceptSectionCreateManyArgs>(args?: SelectSubset<T, ConceptSectionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a ConceptSection.
     * @param {ConceptSectionDeleteArgs} args - Arguments to delete one ConceptSection.
     * @example
     * // Delete one ConceptSection
     * const ConceptSection = await prisma.conceptSection.delete({
     *   where: {
     *     // ... filter to delete one ConceptSection
     *   }
     * })
     * 
     */
    delete<T extends ConceptSectionDeleteArgs>(args: SelectSubset<T, ConceptSectionDeleteArgs<ExtArgs>>): Prisma__ConceptSectionClient<$Result.GetResult<Prisma.$ConceptSectionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ConceptSection.
     * @param {ConceptSectionUpdateArgs} args - Arguments to update one ConceptSection.
     * @example
     * // Update one ConceptSection
     * const conceptSection = await prisma.conceptSection.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ConceptSectionUpdateArgs>(args: SelectSubset<T, ConceptSectionUpdateArgs<ExtArgs>>): Prisma__ConceptSectionClient<$Result.GetResult<Prisma.$ConceptSectionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ConceptSections.
     * @param {ConceptSectionDeleteManyArgs} args - Arguments to filter ConceptSections to delete.
     * @example
     * // Delete a few ConceptSections
     * const { count } = await prisma.conceptSection.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ConceptSectionDeleteManyArgs>(args?: SelectSubset<T, ConceptSectionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ConceptSections.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptSectionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ConceptSections
     * const conceptSection = await prisma.conceptSection.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ConceptSectionUpdateManyArgs>(args: SelectSubset<T, ConceptSectionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ConceptSection.
     * @param {ConceptSectionUpsertArgs} args - Arguments to update or create a ConceptSection.
     * @example
     * // Update or create a ConceptSection
     * const conceptSection = await prisma.conceptSection.upsert({
     *   create: {
     *     // ... data to create a ConceptSection
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ConceptSection we want to update
     *   }
     * })
     */
    upsert<T extends ConceptSectionUpsertArgs>(args: SelectSubset<T, ConceptSectionUpsertArgs<ExtArgs>>): Prisma__ConceptSectionClient<$Result.GetResult<Prisma.$ConceptSectionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ConceptSections.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptSectionCountArgs} args - Arguments to filter ConceptSections to count.
     * @example
     * // Count the number of ConceptSections
     * const count = await prisma.conceptSection.count({
     *   where: {
     *     // ... the filter for the ConceptSections we want to count
     *   }
     * })
    **/
    count<T extends ConceptSectionCountArgs>(
      args?: Subset<T, ConceptSectionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ConceptSectionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ConceptSection.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptSectionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ConceptSectionAggregateArgs>(args: Subset<T, ConceptSectionAggregateArgs>): Prisma.PrismaPromise<GetConceptSectionAggregateType<T>>

    /**
     * Group by ConceptSection.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptSectionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ConceptSectionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ConceptSectionGroupByArgs['orderBy'] }
        : { orderBy?: ConceptSectionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ConceptSectionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetConceptSectionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ConceptSection model
   */
  readonly fields: ConceptSectionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ConceptSection.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ConceptSectionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    concept<T extends ConceptDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ConceptDefaultArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ConceptSection model
   */
  interface ConceptSectionFieldRefs {
    readonly conceptId: FieldRef<"ConceptSection", 'String'>
    readonly level: FieldRef<"ConceptSection", 'Level'>
    readonly ord: FieldRef<"ConceptSection", 'Int'>
    readonly heading: FieldRef<"ConceptSection", 'String'>
    readonly anchor: FieldRef<"ConceptSection", 'String'>
  }
    

  // Custom InputTypes
  /**
   * ConceptSection findUnique
   */
  export type ConceptSectionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptSection
     */
    select?: ConceptSectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptSection
     */
    omit?: ConceptSectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptSectionInclude<ExtArgs> | null
    /**
     * Filter, which ConceptSection to fetch.
     */
    where: ConceptSectionWhereUniqueInput
  }

  /**
   * ConceptSection findUniqueOrThrow
   */
  export type ConceptSectionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptSection
     */
    select?: ConceptSectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptSection
     */
    omit?: ConceptSectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptSectionInclude<ExtArgs> | null
    /**
     * Filter, which ConceptSection to fetch.
     */
    where: ConceptSectionWhereUniqueInput
  }

  /**
   * ConceptSection findFirst
   */
  export type ConceptSectionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptSection
     */
    select?: ConceptSectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptSection
     */
    omit?: ConceptSectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptSectionInclude<ExtArgs> | null
    /**
     * Filter, which ConceptSection to fetch.
     */
    where?: ConceptSectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConceptSections to fetch.
     */
    orderBy?: ConceptSectionOrderByWithRelationInput | ConceptSectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ConceptSections.
     */
    cursor?: ConceptSectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConceptSections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConceptSections.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ConceptSections.
     */
    distinct?: ConceptSectionScalarFieldEnum | ConceptSectionScalarFieldEnum[]
  }

  /**
   * ConceptSection findFirstOrThrow
   */
  export type ConceptSectionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptSection
     */
    select?: ConceptSectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptSection
     */
    omit?: ConceptSectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptSectionInclude<ExtArgs> | null
    /**
     * Filter, which ConceptSection to fetch.
     */
    where?: ConceptSectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConceptSections to fetch.
     */
    orderBy?: ConceptSectionOrderByWithRelationInput | ConceptSectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ConceptSections.
     */
    cursor?: ConceptSectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConceptSections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConceptSections.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ConceptSections.
     */
    distinct?: ConceptSectionScalarFieldEnum | ConceptSectionScalarFieldEnum[]
  }

  /**
   * ConceptSection findMany
   */
  export type ConceptSectionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptSection
     */
    select?: ConceptSectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptSection
     */
    omit?: ConceptSectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptSectionInclude<ExtArgs> | null
    /**
     * Filter, which ConceptSections to fetch.
     */
    where?: ConceptSectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConceptSections to fetch.
     */
    orderBy?: ConceptSectionOrderByWithRelationInput | ConceptSectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ConceptSections.
     */
    cursor?: ConceptSectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConceptSections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConceptSections.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ConceptSections.
     */
    distinct?: ConceptSectionScalarFieldEnum | ConceptSectionScalarFieldEnum[]
  }

  /**
   * ConceptSection create
   */
  export type ConceptSectionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptSection
     */
    select?: ConceptSectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptSection
     */
    omit?: ConceptSectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptSectionInclude<ExtArgs> | null
    /**
     * The data needed to create a ConceptSection.
     */
    data: XOR<ConceptSectionCreateInput, ConceptSectionUncheckedCreateInput>
  }

  /**
   * ConceptSection createMany
   */
  export type ConceptSectionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ConceptSections.
     */
    data: ConceptSectionCreateManyInput | ConceptSectionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ConceptSection update
   */
  export type ConceptSectionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptSection
     */
    select?: ConceptSectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptSection
     */
    omit?: ConceptSectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptSectionInclude<ExtArgs> | null
    /**
     * The data needed to update a ConceptSection.
     */
    data: XOR<ConceptSectionUpdateInput, ConceptSectionUncheckedUpdateInput>
    /**
     * Choose, which ConceptSection to update.
     */
    where: ConceptSectionWhereUniqueInput
  }

  /**
   * ConceptSection updateMany
   */
  export type ConceptSectionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ConceptSections.
     */
    data: XOR<ConceptSectionUpdateManyMutationInput, ConceptSectionUncheckedUpdateManyInput>
    /**
     * Filter which ConceptSections to update
     */
    where?: ConceptSectionWhereInput
    /**
     * Limit how many ConceptSections to update.
     */
    limit?: number
  }

  /**
   * ConceptSection upsert
   */
  export type ConceptSectionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptSection
     */
    select?: ConceptSectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptSection
     */
    omit?: ConceptSectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptSectionInclude<ExtArgs> | null
    /**
     * The filter to search for the ConceptSection to update in case it exists.
     */
    where: ConceptSectionWhereUniqueInput
    /**
     * In case the ConceptSection found by the `where` argument doesn't exist, create a new ConceptSection with this data.
     */
    create: XOR<ConceptSectionCreateInput, ConceptSectionUncheckedCreateInput>
    /**
     * In case the ConceptSection was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ConceptSectionUpdateInput, ConceptSectionUncheckedUpdateInput>
  }

  /**
   * ConceptSection delete
   */
  export type ConceptSectionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptSection
     */
    select?: ConceptSectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptSection
     */
    omit?: ConceptSectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptSectionInclude<ExtArgs> | null
    /**
     * Filter which ConceptSection to delete.
     */
    where: ConceptSectionWhereUniqueInput
  }

  /**
   * ConceptSection deleteMany
   */
  export type ConceptSectionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ConceptSections to delete
     */
    where?: ConceptSectionWhereInput
    /**
     * Limit how many ConceptSections to delete.
     */
    limit?: number
  }

  /**
   * ConceptSection without action
   */
  export type ConceptSectionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptSection
     */
    select?: ConceptSectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptSection
     */
    omit?: ConceptSectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptSectionInclude<ExtArgs> | null
  }


  /**
   * Model Edge
   */

  export type AggregateEdge = {
    _count: EdgeCountAggregateOutputType | null
    _min: EdgeMinAggregateOutputType | null
    _max: EdgeMaxAggregateOutputType | null
  }

  export type EdgeMinAggregateOutputType = {
    fromId: string | null
    toId: string | null
    type: $Enums.EdgeType | null
  }

  export type EdgeMaxAggregateOutputType = {
    fromId: string | null
    toId: string | null
    type: $Enums.EdgeType | null
  }

  export type EdgeCountAggregateOutputType = {
    fromId: number
    toId: number
    type: number
    _all: number
  }


  export type EdgeMinAggregateInputType = {
    fromId?: true
    toId?: true
    type?: true
  }

  export type EdgeMaxAggregateInputType = {
    fromId?: true
    toId?: true
    type?: true
  }

  export type EdgeCountAggregateInputType = {
    fromId?: true
    toId?: true
    type?: true
    _all?: true
  }

  export type EdgeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Edge to aggregate.
     */
    where?: EdgeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Edges to fetch.
     */
    orderBy?: EdgeOrderByWithRelationInput | EdgeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EdgeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Edges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Edges.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Edges
    **/
    _count?: true | EdgeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EdgeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EdgeMaxAggregateInputType
  }

  export type GetEdgeAggregateType<T extends EdgeAggregateArgs> = {
        [P in keyof T & keyof AggregateEdge]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEdge[P]>
      : GetScalarType<T[P], AggregateEdge[P]>
  }




  export type EdgeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EdgeWhereInput
    orderBy?: EdgeOrderByWithAggregationInput | EdgeOrderByWithAggregationInput[]
    by: EdgeScalarFieldEnum[] | EdgeScalarFieldEnum
    having?: EdgeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EdgeCountAggregateInputType | true
    _min?: EdgeMinAggregateInputType
    _max?: EdgeMaxAggregateInputType
  }

  export type EdgeGroupByOutputType = {
    fromId: string
    toId: string
    type: $Enums.EdgeType
    _count: EdgeCountAggregateOutputType | null
    _min: EdgeMinAggregateOutputType | null
    _max: EdgeMaxAggregateOutputType | null
  }

  type GetEdgeGroupByPayload<T extends EdgeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EdgeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EdgeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EdgeGroupByOutputType[P]>
            : GetScalarType<T[P], EdgeGroupByOutputType[P]>
        }
      >
    >


  export type EdgeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    fromId?: boolean
    toId?: boolean
    type?: boolean
    from?: boolean | ConceptDefaultArgs<ExtArgs>
    to?: boolean | ConceptDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["edge"]>



  export type EdgeSelectScalar = {
    fromId?: boolean
    toId?: boolean
    type?: boolean
  }

  export type EdgeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"fromId" | "toId" | "type", ExtArgs["result"]["edge"]>
  export type EdgeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    from?: boolean | ConceptDefaultArgs<ExtArgs>
    to?: boolean | ConceptDefaultArgs<ExtArgs>
  }

  export type $EdgePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Edge"
    objects: {
      from: Prisma.$ConceptPayload<ExtArgs>
      to: Prisma.$ConceptPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      fromId: string
      toId: string
      type: $Enums.EdgeType
    }, ExtArgs["result"]["edge"]>
    composites: {}
  }

  type EdgeGetPayload<S extends boolean | null | undefined | EdgeDefaultArgs> = $Result.GetResult<Prisma.$EdgePayload, S>

  type EdgeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EdgeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EdgeCountAggregateInputType | true
    }

  export interface EdgeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Edge'], meta: { name: 'Edge' } }
    /**
     * Find zero or one Edge that matches the filter.
     * @param {EdgeFindUniqueArgs} args - Arguments to find a Edge
     * @example
     * // Get one Edge
     * const edge = await prisma.edge.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EdgeFindUniqueArgs>(args: SelectSubset<T, EdgeFindUniqueArgs<ExtArgs>>): Prisma__EdgeClient<$Result.GetResult<Prisma.$EdgePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Edge that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EdgeFindUniqueOrThrowArgs} args - Arguments to find a Edge
     * @example
     * // Get one Edge
     * const edge = await prisma.edge.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EdgeFindUniqueOrThrowArgs>(args: SelectSubset<T, EdgeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EdgeClient<$Result.GetResult<Prisma.$EdgePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Edge that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EdgeFindFirstArgs} args - Arguments to find a Edge
     * @example
     * // Get one Edge
     * const edge = await prisma.edge.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EdgeFindFirstArgs>(args?: SelectSubset<T, EdgeFindFirstArgs<ExtArgs>>): Prisma__EdgeClient<$Result.GetResult<Prisma.$EdgePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Edge that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EdgeFindFirstOrThrowArgs} args - Arguments to find a Edge
     * @example
     * // Get one Edge
     * const edge = await prisma.edge.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EdgeFindFirstOrThrowArgs>(args?: SelectSubset<T, EdgeFindFirstOrThrowArgs<ExtArgs>>): Prisma__EdgeClient<$Result.GetResult<Prisma.$EdgePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Edges that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EdgeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Edges
     * const edges = await prisma.edge.findMany()
     * 
     * // Get first 10 Edges
     * const edges = await prisma.edge.findMany({ take: 10 })
     * 
     * // Only select the `fromId`
     * const edgeWithFromIdOnly = await prisma.edge.findMany({ select: { fromId: true } })
     * 
     */
    findMany<T extends EdgeFindManyArgs>(args?: SelectSubset<T, EdgeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EdgePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Edge.
     * @param {EdgeCreateArgs} args - Arguments to create a Edge.
     * @example
     * // Create one Edge
     * const Edge = await prisma.edge.create({
     *   data: {
     *     // ... data to create a Edge
     *   }
     * })
     * 
     */
    create<T extends EdgeCreateArgs>(args: SelectSubset<T, EdgeCreateArgs<ExtArgs>>): Prisma__EdgeClient<$Result.GetResult<Prisma.$EdgePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Edges.
     * @param {EdgeCreateManyArgs} args - Arguments to create many Edges.
     * @example
     * // Create many Edges
     * const edge = await prisma.edge.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EdgeCreateManyArgs>(args?: SelectSubset<T, EdgeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Edge.
     * @param {EdgeDeleteArgs} args - Arguments to delete one Edge.
     * @example
     * // Delete one Edge
     * const Edge = await prisma.edge.delete({
     *   where: {
     *     // ... filter to delete one Edge
     *   }
     * })
     * 
     */
    delete<T extends EdgeDeleteArgs>(args: SelectSubset<T, EdgeDeleteArgs<ExtArgs>>): Prisma__EdgeClient<$Result.GetResult<Prisma.$EdgePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Edge.
     * @param {EdgeUpdateArgs} args - Arguments to update one Edge.
     * @example
     * // Update one Edge
     * const edge = await prisma.edge.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EdgeUpdateArgs>(args: SelectSubset<T, EdgeUpdateArgs<ExtArgs>>): Prisma__EdgeClient<$Result.GetResult<Prisma.$EdgePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Edges.
     * @param {EdgeDeleteManyArgs} args - Arguments to filter Edges to delete.
     * @example
     * // Delete a few Edges
     * const { count } = await prisma.edge.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EdgeDeleteManyArgs>(args?: SelectSubset<T, EdgeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Edges.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EdgeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Edges
     * const edge = await prisma.edge.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EdgeUpdateManyArgs>(args: SelectSubset<T, EdgeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Edge.
     * @param {EdgeUpsertArgs} args - Arguments to update or create a Edge.
     * @example
     * // Update or create a Edge
     * const edge = await prisma.edge.upsert({
     *   create: {
     *     // ... data to create a Edge
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Edge we want to update
     *   }
     * })
     */
    upsert<T extends EdgeUpsertArgs>(args: SelectSubset<T, EdgeUpsertArgs<ExtArgs>>): Prisma__EdgeClient<$Result.GetResult<Prisma.$EdgePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Edges.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EdgeCountArgs} args - Arguments to filter Edges to count.
     * @example
     * // Count the number of Edges
     * const count = await prisma.edge.count({
     *   where: {
     *     // ... the filter for the Edges we want to count
     *   }
     * })
    **/
    count<T extends EdgeCountArgs>(
      args?: Subset<T, EdgeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EdgeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Edge.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EdgeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EdgeAggregateArgs>(args: Subset<T, EdgeAggregateArgs>): Prisma.PrismaPromise<GetEdgeAggregateType<T>>

    /**
     * Group by Edge.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EdgeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EdgeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EdgeGroupByArgs['orderBy'] }
        : { orderBy?: EdgeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EdgeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEdgeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Edge model
   */
  readonly fields: EdgeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Edge.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EdgeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    from<T extends ConceptDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ConceptDefaultArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    to<T extends ConceptDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ConceptDefaultArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Edge model
   */
  interface EdgeFieldRefs {
    readonly fromId: FieldRef<"Edge", 'String'>
    readonly toId: FieldRef<"Edge", 'String'>
    readonly type: FieldRef<"Edge", 'EdgeType'>
  }
    

  // Custom InputTypes
  /**
   * Edge findUnique
   */
  export type EdgeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Edge
     */
    select?: EdgeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Edge
     */
    omit?: EdgeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EdgeInclude<ExtArgs> | null
    /**
     * Filter, which Edge to fetch.
     */
    where: EdgeWhereUniqueInput
  }

  /**
   * Edge findUniqueOrThrow
   */
  export type EdgeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Edge
     */
    select?: EdgeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Edge
     */
    omit?: EdgeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EdgeInclude<ExtArgs> | null
    /**
     * Filter, which Edge to fetch.
     */
    where: EdgeWhereUniqueInput
  }

  /**
   * Edge findFirst
   */
  export type EdgeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Edge
     */
    select?: EdgeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Edge
     */
    omit?: EdgeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EdgeInclude<ExtArgs> | null
    /**
     * Filter, which Edge to fetch.
     */
    where?: EdgeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Edges to fetch.
     */
    orderBy?: EdgeOrderByWithRelationInput | EdgeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Edges.
     */
    cursor?: EdgeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Edges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Edges.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Edges.
     */
    distinct?: EdgeScalarFieldEnum | EdgeScalarFieldEnum[]
  }

  /**
   * Edge findFirstOrThrow
   */
  export type EdgeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Edge
     */
    select?: EdgeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Edge
     */
    omit?: EdgeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EdgeInclude<ExtArgs> | null
    /**
     * Filter, which Edge to fetch.
     */
    where?: EdgeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Edges to fetch.
     */
    orderBy?: EdgeOrderByWithRelationInput | EdgeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Edges.
     */
    cursor?: EdgeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Edges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Edges.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Edges.
     */
    distinct?: EdgeScalarFieldEnum | EdgeScalarFieldEnum[]
  }

  /**
   * Edge findMany
   */
  export type EdgeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Edge
     */
    select?: EdgeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Edge
     */
    omit?: EdgeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EdgeInclude<ExtArgs> | null
    /**
     * Filter, which Edges to fetch.
     */
    where?: EdgeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Edges to fetch.
     */
    orderBy?: EdgeOrderByWithRelationInput | EdgeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Edges.
     */
    cursor?: EdgeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Edges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Edges.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Edges.
     */
    distinct?: EdgeScalarFieldEnum | EdgeScalarFieldEnum[]
  }

  /**
   * Edge create
   */
  export type EdgeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Edge
     */
    select?: EdgeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Edge
     */
    omit?: EdgeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EdgeInclude<ExtArgs> | null
    /**
     * The data needed to create a Edge.
     */
    data: XOR<EdgeCreateInput, EdgeUncheckedCreateInput>
  }

  /**
   * Edge createMany
   */
  export type EdgeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Edges.
     */
    data: EdgeCreateManyInput | EdgeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Edge update
   */
  export type EdgeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Edge
     */
    select?: EdgeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Edge
     */
    omit?: EdgeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EdgeInclude<ExtArgs> | null
    /**
     * The data needed to update a Edge.
     */
    data: XOR<EdgeUpdateInput, EdgeUncheckedUpdateInput>
    /**
     * Choose, which Edge to update.
     */
    where: EdgeWhereUniqueInput
  }

  /**
   * Edge updateMany
   */
  export type EdgeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Edges.
     */
    data: XOR<EdgeUpdateManyMutationInput, EdgeUncheckedUpdateManyInput>
    /**
     * Filter which Edges to update
     */
    where?: EdgeWhereInput
    /**
     * Limit how many Edges to update.
     */
    limit?: number
  }

  /**
   * Edge upsert
   */
  export type EdgeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Edge
     */
    select?: EdgeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Edge
     */
    omit?: EdgeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EdgeInclude<ExtArgs> | null
    /**
     * The filter to search for the Edge to update in case it exists.
     */
    where: EdgeWhereUniqueInput
    /**
     * In case the Edge found by the `where` argument doesn't exist, create a new Edge with this data.
     */
    create: XOR<EdgeCreateInput, EdgeUncheckedCreateInput>
    /**
     * In case the Edge was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EdgeUpdateInput, EdgeUncheckedUpdateInput>
  }

  /**
   * Edge delete
   */
  export type EdgeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Edge
     */
    select?: EdgeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Edge
     */
    omit?: EdgeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EdgeInclude<ExtArgs> | null
    /**
     * Filter which Edge to delete.
     */
    where: EdgeWhereUniqueInput
  }

  /**
   * Edge deleteMany
   */
  export type EdgeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Edges to delete
     */
    where?: EdgeWhereInput
    /**
     * Limit how many Edges to delete.
     */
    limit?: number
  }

  /**
   * Edge without action
   */
  export type EdgeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Edge
     */
    select?: EdgeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Edge
     */
    omit?: EdgeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EdgeInclude<ExtArgs> | null
  }


  /**
   * Model ConceptVisual
   */

  export type AggregateConceptVisual = {
    _count: ConceptVisualCountAggregateOutputType | null
    _avg: ConceptVisualAvgAggregateOutputType | null
    _sum: ConceptVisualSumAggregateOutputType | null
    _min: ConceptVisualMinAggregateOutputType | null
    _max: ConceptVisualMaxAggregateOutputType | null
  }

  export type ConceptVisualAvgAggregateOutputType = {
    ord: number | null
  }

  export type ConceptVisualSumAggregateOutputType = {
    ord: number | null
  }

  export type ConceptVisualMinAggregateOutputType = {
    id: string | null
    conceptId: string | null
    level: $Enums.Level | null
    title: string | null
    kind: $Enums.VisualKind | null
    ord: number | null
  }

  export type ConceptVisualMaxAggregateOutputType = {
    id: string | null
    conceptId: string | null
    level: $Enums.Level | null
    title: string | null
    kind: $Enums.VisualKind | null
    ord: number | null
  }

  export type ConceptVisualCountAggregateOutputType = {
    id: number
    conceptId: number
    level: number
    title: number
    kind: number
    spec: number
    ord: number
    _all: number
  }


  export type ConceptVisualAvgAggregateInputType = {
    ord?: true
  }

  export type ConceptVisualSumAggregateInputType = {
    ord?: true
  }

  export type ConceptVisualMinAggregateInputType = {
    id?: true
    conceptId?: true
    level?: true
    title?: true
    kind?: true
    ord?: true
  }

  export type ConceptVisualMaxAggregateInputType = {
    id?: true
    conceptId?: true
    level?: true
    title?: true
    kind?: true
    ord?: true
  }

  export type ConceptVisualCountAggregateInputType = {
    id?: true
    conceptId?: true
    level?: true
    title?: true
    kind?: true
    spec?: true
    ord?: true
    _all?: true
  }

  export type ConceptVisualAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ConceptVisual to aggregate.
     */
    where?: ConceptVisualWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConceptVisuals to fetch.
     */
    orderBy?: ConceptVisualOrderByWithRelationInput | ConceptVisualOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ConceptVisualWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConceptVisuals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConceptVisuals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ConceptVisuals
    **/
    _count?: true | ConceptVisualCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ConceptVisualAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ConceptVisualSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ConceptVisualMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ConceptVisualMaxAggregateInputType
  }

  export type GetConceptVisualAggregateType<T extends ConceptVisualAggregateArgs> = {
        [P in keyof T & keyof AggregateConceptVisual]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateConceptVisual[P]>
      : GetScalarType<T[P], AggregateConceptVisual[P]>
  }




  export type ConceptVisualGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConceptVisualWhereInput
    orderBy?: ConceptVisualOrderByWithAggregationInput | ConceptVisualOrderByWithAggregationInput[]
    by: ConceptVisualScalarFieldEnum[] | ConceptVisualScalarFieldEnum
    having?: ConceptVisualScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ConceptVisualCountAggregateInputType | true
    _avg?: ConceptVisualAvgAggregateInputType
    _sum?: ConceptVisualSumAggregateInputType
    _min?: ConceptVisualMinAggregateInputType
    _max?: ConceptVisualMaxAggregateInputType
  }

  export type ConceptVisualGroupByOutputType = {
    id: string
    conceptId: string
    level: $Enums.Level
    title: string
    kind: $Enums.VisualKind
    spec: JsonValue
    ord: number
    _count: ConceptVisualCountAggregateOutputType | null
    _avg: ConceptVisualAvgAggregateOutputType | null
    _sum: ConceptVisualSumAggregateOutputType | null
    _min: ConceptVisualMinAggregateOutputType | null
    _max: ConceptVisualMaxAggregateOutputType | null
  }

  type GetConceptVisualGroupByPayload<T extends ConceptVisualGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ConceptVisualGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ConceptVisualGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ConceptVisualGroupByOutputType[P]>
            : GetScalarType<T[P], ConceptVisualGroupByOutputType[P]>
        }
      >
    >


  export type ConceptVisualSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    conceptId?: boolean
    level?: boolean
    title?: boolean
    kind?: boolean
    spec?: boolean
    ord?: boolean
    concept?: boolean | ConceptDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["conceptVisual"]>



  export type ConceptVisualSelectScalar = {
    id?: boolean
    conceptId?: boolean
    level?: boolean
    title?: boolean
    kind?: boolean
    spec?: boolean
    ord?: boolean
  }

  export type ConceptVisualOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "conceptId" | "level" | "title" | "kind" | "spec" | "ord", ExtArgs["result"]["conceptVisual"]>
  export type ConceptVisualInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    concept?: boolean | ConceptDefaultArgs<ExtArgs>
  }

  export type $ConceptVisualPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ConceptVisual"
    objects: {
      concept: Prisma.$ConceptPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      conceptId: string
      /**
       * 어느 난이도 본문에 들어가는지
       */
      level: $Enums.Level
      title: string
      kind: $Enums.VisualKind
      /**
       * 마크다운 visual 블록의 YAML 을 파싱한 값
       */
      spec: Prisma.JsonValue
      ord: number
    }, ExtArgs["result"]["conceptVisual"]>
    composites: {}
  }

  type ConceptVisualGetPayload<S extends boolean | null | undefined | ConceptVisualDefaultArgs> = $Result.GetResult<Prisma.$ConceptVisualPayload, S>

  type ConceptVisualCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ConceptVisualFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ConceptVisualCountAggregateInputType | true
    }

  export interface ConceptVisualDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ConceptVisual'], meta: { name: 'ConceptVisual' } }
    /**
     * Find zero or one ConceptVisual that matches the filter.
     * @param {ConceptVisualFindUniqueArgs} args - Arguments to find a ConceptVisual
     * @example
     * // Get one ConceptVisual
     * const conceptVisual = await prisma.conceptVisual.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ConceptVisualFindUniqueArgs>(args: SelectSubset<T, ConceptVisualFindUniqueArgs<ExtArgs>>): Prisma__ConceptVisualClient<$Result.GetResult<Prisma.$ConceptVisualPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ConceptVisual that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ConceptVisualFindUniqueOrThrowArgs} args - Arguments to find a ConceptVisual
     * @example
     * // Get one ConceptVisual
     * const conceptVisual = await prisma.conceptVisual.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ConceptVisualFindUniqueOrThrowArgs>(args: SelectSubset<T, ConceptVisualFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ConceptVisualClient<$Result.GetResult<Prisma.$ConceptVisualPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ConceptVisual that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptVisualFindFirstArgs} args - Arguments to find a ConceptVisual
     * @example
     * // Get one ConceptVisual
     * const conceptVisual = await prisma.conceptVisual.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ConceptVisualFindFirstArgs>(args?: SelectSubset<T, ConceptVisualFindFirstArgs<ExtArgs>>): Prisma__ConceptVisualClient<$Result.GetResult<Prisma.$ConceptVisualPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ConceptVisual that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptVisualFindFirstOrThrowArgs} args - Arguments to find a ConceptVisual
     * @example
     * // Get one ConceptVisual
     * const conceptVisual = await prisma.conceptVisual.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ConceptVisualFindFirstOrThrowArgs>(args?: SelectSubset<T, ConceptVisualFindFirstOrThrowArgs<ExtArgs>>): Prisma__ConceptVisualClient<$Result.GetResult<Prisma.$ConceptVisualPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ConceptVisuals that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptVisualFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ConceptVisuals
     * const conceptVisuals = await prisma.conceptVisual.findMany()
     * 
     * // Get first 10 ConceptVisuals
     * const conceptVisuals = await prisma.conceptVisual.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const conceptVisualWithIdOnly = await prisma.conceptVisual.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ConceptVisualFindManyArgs>(args?: SelectSubset<T, ConceptVisualFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConceptVisualPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ConceptVisual.
     * @param {ConceptVisualCreateArgs} args - Arguments to create a ConceptVisual.
     * @example
     * // Create one ConceptVisual
     * const ConceptVisual = await prisma.conceptVisual.create({
     *   data: {
     *     // ... data to create a ConceptVisual
     *   }
     * })
     * 
     */
    create<T extends ConceptVisualCreateArgs>(args: SelectSubset<T, ConceptVisualCreateArgs<ExtArgs>>): Prisma__ConceptVisualClient<$Result.GetResult<Prisma.$ConceptVisualPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ConceptVisuals.
     * @param {ConceptVisualCreateManyArgs} args - Arguments to create many ConceptVisuals.
     * @example
     * // Create many ConceptVisuals
     * const conceptVisual = await prisma.conceptVisual.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ConceptVisualCreateManyArgs>(args?: SelectSubset<T, ConceptVisualCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a ConceptVisual.
     * @param {ConceptVisualDeleteArgs} args - Arguments to delete one ConceptVisual.
     * @example
     * // Delete one ConceptVisual
     * const ConceptVisual = await prisma.conceptVisual.delete({
     *   where: {
     *     // ... filter to delete one ConceptVisual
     *   }
     * })
     * 
     */
    delete<T extends ConceptVisualDeleteArgs>(args: SelectSubset<T, ConceptVisualDeleteArgs<ExtArgs>>): Prisma__ConceptVisualClient<$Result.GetResult<Prisma.$ConceptVisualPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ConceptVisual.
     * @param {ConceptVisualUpdateArgs} args - Arguments to update one ConceptVisual.
     * @example
     * // Update one ConceptVisual
     * const conceptVisual = await prisma.conceptVisual.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ConceptVisualUpdateArgs>(args: SelectSubset<T, ConceptVisualUpdateArgs<ExtArgs>>): Prisma__ConceptVisualClient<$Result.GetResult<Prisma.$ConceptVisualPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ConceptVisuals.
     * @param {ConceptVisualDeleteManyArgs} args - Arguments to filter ConceptVisuals to delete.
     * @example
     * // Delete a few ConceptVisuals
     * const { count } = await prisma.conceptVisual.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ConceptVisualDeleteManyArgs>(args?: SelectSubset<T, ConceptVisualDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ConceptVisuals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptVisualUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ConceptVisuals
     * const conceptVisual = await prisma.conceptVisual.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ConceptVisualUpdateManyArgs>(args: SelectSubset<T, ConceptVisualUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ConceptVisual.
     * @param {ConceptVisualUpsertArgs} args - Arguments to update or create a ConceptVisual.
     * @example
     * // Update or create a ConceptVisual
     * const conceptVisual = await prisma.conceptVisual.upsert({
     *   create: {
     *     // ... data to create a ConceptVisual
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ConceptVisual we want to update
     *   }
     * })
     */
    upsert<T extends ConceptVisualUpsertArgs>(args: SelectSubset<T, ConceptVisualUpsertArgs<ExtArgs>>): Prisma__ConceptVisualClient<$Result.GetResult<Prisma.$ConceptVisualPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ConceptVisuals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptVisualCountArgs} args - Arguments to filter ConceptVisuals to count.
     * @example
     * // Count the number of ConceptVisuals
     * const count = await prisma.conceptVisual.count({
     *   where: {
     *     // ... the filter for the ConceptVisuals we want to count
     *   }
     * })
    **/
    count<T extends ConceptVisualCountArgs>(
      args?: Subset<T, ConceptVisualCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ConceptVisualCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ConceptVisual.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptVisualAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ConceptVisualAggregateArgs>(args: Subset<T, ConceptVisualAggregateArgs>): Prisma.PrismaPromise<GetConceptVisualAggregateType<T>>

    /**
     * Group by ConceptVisual.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptVisualGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ConceptVisualGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ConceptVisualGroupByArgs['orderBy'] }
        : { orderBy?: ConceptVisualGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ConceptVisualGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetConceptVisualGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ConceptVisual model
   */
  readonly fields: ConceptVisualFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ConceptVisual.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ConceptVisualClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    concept<T extends ConceptDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ConceptDefaultArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ConceptVisual model
   */
  interface ConceptVisualFieldRefs {
    readonly id: FieldRef<"ConceptVisual", 'String'>
    readonly conceptId: FieldRef<"ConceptVisual", 'String'>
    readonly level: FieldRef<"ConceptVisual", 'Level'>
    readonly title: FieldRef<"ConceptVisual", 'String'>
    readonly kind: FieldRef<"ConceptVisual", 'VisualKind'>
    readonly spec: FieldRef<"ConceptVisual", 'Json'>
    readonly ord: FieldRef<"ConceptVisual", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * ConceptVisual findUnique
   */
  export type ConceptVisualFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptVisual
     */
    select?: ConceptVisualSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptVisual
     */
    omit?: ConceptVisualOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptVisualInclude<ExtArgs> | null
    /**
     * Filter, which ConceptVisual to fetch.
     */
    where: ConceptVisualWhereUniqueInput
  }

  /**
   * ConceptVisual findUniqueOrThrow
   */
  export type ConceptVisualFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptVisual
     */
    select?: ConceptVisualSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptVisual
     */
    omit?: ConceptVisualOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptVisualInclude<ExtArgs> | null
    /**
     * Filter, which ConceptVisual to fetch.
     */
    where: ConceptVisualWhereUniqueInput
  }

  /**
   * ConceptVisual findFirst
   */
  export type ConceptVisualFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptVisual
     */
    select?: ConceptVisualSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptVisual
     */
    omit?: ConceptVisualOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptVisualInclude<ExtArgs> | null
    /**
     * Filter, which ConceptVisual to fetch.
     */
    where?: ConceptVisualWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConceptVisuals to fetch.
     */
    orderBy?: ConceptVisualOrderByWithRelationInput | ConceptVisualOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ConceptVisuals.
     */
    cursor?: ConceptVisualWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConceptVisuals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConceptVisuals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ConceptVisuals.
     */
    distinct?: ConceptVisualScalarFieldEnum | ConceptVisualScalarFieldEnum[]
  }

  /**
   * ConceptVisual findFirstOrThrow
   */
  export type ConceptVisualFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptVisual
     */
    select?: ConceptVisualSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptVisual
     */
    omit?: ConceptVisualOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptVisualInclude<ExtArgs> | null
    /**
     * Filter, which ConceptVisual to fetch.
     */
    where?: ConceptVisualWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConceptVisuals to fetch.
     */
    orderBy?: ConceptVisualOrderByWithRelationInput | ConceptVisualOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ConceptVisuals.
     */
    cursor?: ConceptVisualWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConceptVisuals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConceptVisuals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ConceptVisuals.
     */
    distinct?: ConceptVisualScalarFieldEnum | ConceptVisualScalarFieldEnum[]
  }

  /**
   * ConceptVisual findMany
   */
  export type ConceptVisualFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptVisual
     */
    select?: ConceptVisualSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptVisual
     */
    omit?: ConceptVisualOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptVisualInclude<ExtArgs> | null
    /**
     * Filter, which ConceptVisuals to fetch.
     */
    where?: ConceptVisualWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConceptVisuals to fetch.
     */
    orderBy?: ConceptVisualOrderByWithRelationInput | ConceptVisualOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ConceptVisuals.
     */
    cursor?: ConceptVisualWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConceptVisuals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConceptVisuals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ConceptVisuals.
     */
    distinct?: ConceptVisualScalarFieldEnum | ConceptVisualScalarFieldEnum[]
  }

  /**
   * ConceptVisual create
   */
  export type ConceptVisualCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptVisual
     */
    select?: ConceptVisualSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptVisual
     */
    omit?: ConceptVisualOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptVisualInclude<ExtArgs> | null
    /**
     * The data needed to create a ConceptVisual.
     */
    data: XOR<ConceptVisualCreateInput, ConceptVisualUncheckedCreateInput>
  }

  /**
   * ConceptVisual createMany
   */
  export type ConceptVisualCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ConceptVisuals.
     */
    data: ConceptVisualCreateManyInput | ConceptVisualCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ConceptVisual update
   */
  export type ConceptVisualUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptVisual
     */
    select?: ConceptVisualSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptVisual
     */
    omit?: ConceptVisualOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptVisualInclude<ExtArgs> | null
    /**
     * The data needed to update a ConceptVisual.
     */
    data: XOR<ConceptVisualUpdateInput, ConceptVisualUncheckedUpdateInput>
    /**
     * Choose, which ConceptVisual to update.
     */
    where: ConceptVisualWhereUniqueInput
  }

  /**
   * ConceptVisual updateMany
   */
  export type ConceptVisualUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ConceptVisuals.
     */
    data: XOR<ConceptVisualUpdateManyMutationInput, ConceptVisualUncheckedUpdateManyInput>
    /**
     * Filter which ConceptVisuals to update
     */
    where?: ConceptVisualWhereInput
    /**
     * Limit how many ConceptVisuals to update.
     */
    limit?: number
  }

  /**
   * ConceptVisual upsert
   */
  export type ConceptVisualUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptVisual
     */
    select?: ConceptVisualSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptVisual
     */
    omit?: ConceptVisualOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptVisualInclude<ExtArgs> | null
    /**
     * The filter to search for the ConceptVisual to update in case it exists.
     */
    where: ConceptVisualWhereUniqueInput
    /**
     * In case the ConceptVisual found by the `where` argument doesn't exist, create a new ConceptVisual with this data.
     */
    create: XOR<ConceptVisualCreateInput, ConceptVisualUncheckedCreateInput>
    /**
     * In case the ConceptVisual was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ConceptVisualUpdateInput, ConceptVisualUncheckedUpdateInput>
  }

  /**
   * ConceptVisual delete
   */
  export type ConceptVisualDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptVisual
     */
    select?: ConceptVisualSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptVisual
     */
    omit?: ConceptVisualOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptVisualInclude<ExtArgs> | null
    /**
     * Filter which ConceptVisual to delete.
     */
    where: ConceptVisualWhereUniqueInput
  }

  /**
   * ConceptVisual deleteMany
   */
  export type ConceptVisualDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ConceptVisuals to delete
     */
    where?: ConceptVisualWhereInput
    /**
     * Limit how many ConceptVisuals to delete.
     */
    limit?: number
  }

  /**
   * ConceptVisual without action
   */
  export type ConceptVisualDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptVisual
     */
    select?: ConceptVisualSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConceptVisual
     */
    omit?: ConceptVisualOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptVisualInclude<ExtArgs> | null
  }


  /**
   * Model PromptTemplate
   */

  export type AggregatePromptTemplate = {
    _count: PromptTemplateCountAggregateOutputType | null
    _min: PromptTemplateMinAggregateOutputType | null
    _max: PromptTemplateMaxAggregateOutputType | null
  }

  export type PromptTemplateMinAggregateOutputType = {
    id: string | null
    name: string | null
    body: string | null
    updatedAt: Date | null
  }

  export type PromptTemplateMaxAggregateOutputType = {
    id: string | null
    name: string | null
    body: string | null
    updatedAt: Date | null
  }

  export type PromptTemplateCountAggregateOutputType = {
    id: number
    name: number
    body: number
    updatedAt: number
    _all: number
  }


  export type PromptTemplateMinAggregateInputType = {
    id?: true
    name?: true
    body?: true
    updatedAt?: true
  }

  export type PromptTemplateMaxAggregateInputType = {
    id?: true
    name?: true
    body?: true
    updatedAt?: true
  }

  export type PromptTemplateCountAggregateInputType = {
    id?: true
    name?: true
    body?: true
    updatedAt?: true
    _all?: true
  }

  export type PromptTemplateAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PromptTemplate to aggregate.
     */
    where?: PromptTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PromptTemplates to fetch.
     */
    orderBy?: PromptTemplateOrderByWithRelationInput | PromptTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PromptTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PromptTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PromptTemplates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PromptTemplates
    **/
    _count?: true | PromptTemplateCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PromptTemplateMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PromptTemplateMaxAggregateInputType
  }

  export type GetPromptTemplateAggregateType<T extends PromptTemplateAggregateArgs> = {
        [P in keyof T & keyof AggregatePromptTemplate]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePromptTemplate[P]>
      : GetScalarType<T[P], AggregatePromptTemplate[P]>
  }




  export type PromptTemplateGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PromptTemplateWhereInput
    orderBy?: PromptTemplateOrderByWithAggregationInput | PromptTemplateOrderByWithAggregationInput[]
    by: PromptTemplateScalarFieldEnum[] | PromptTemplateScalarFieldEnum
    having?: PromptTemplateScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PromptTemplateCountAggregateInputType | true
    _min?: PromptTemplateMinAggregateInputType
    _max?: PromptTemplateMaxAggregateInputType
  }

  export type PromptTemplateGroupByOutputType = {
    id: string
    name: string
    body: string
    updatedAt: Date
    _count: PromptTemplateCountAggregateOutputType | null
    _min: PromptTemplateMinAggregateOutputType | null
    _max: PromptTemplateMaxAggregateOutputType | null
  }

  type GetPromptTemplateGroupByPayload<T extends PromptTemplateGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PromptTemplateGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PromptTemplateGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PromptTemplateGroupByOutputType[P]>
            : GetScalarType<T[P], PromptTemplateGroupByOutputType[P]>
        }
      >
    >


  export type PromptTemplateSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    body?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["promptTemplate"]>



  export type PromptTemplateSelectScalar = {
    id?: boolean
    name?: boolean
    body?: boolean
    updatedAt?: boolean
  }

  export type PromptTemplateOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "body" | "updatedAt", ExtArgs["result"]["promptTemplate"]>

  export type $PromptTemplatePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PromptTemplate"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      /**
       * 프롬프트 본문. {{title}} 같은 변수를 포함한다.
       */
      body: string
      updatedAt: Date
    }, ExtArgs["result"]["promptTemplate"]>
    composites: {}
  }

  type PromptTemplateGetPayload<S extends boolean | null | undefined | PromptTemplateDefaultArgs> = $Result.GetResult<Prisma.$PromptTemplatePayload, S>

  type PromptTemplateCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PromptTemplateFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PromptTemplateCountAggregateInputType | true
    }

  export interface PromptTemplateDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PromptTemplate'], meta: { name: 'PromptTemplate' } }
    /**
     * Find zero or one PromptTemplate that matches the filter.
     * @param {PromptTemplateFindUniqueArgs} args - Arguments to find a PromptTemplate
     * @example
     * // Get one PromptTemplate
     * const promptTemplate = await prisma.promptTemplate.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PromptTemplateFindUniqueArgs>(args: SelectSubset<T, PromptTemplateFindUniqueArgs<ExtArgs>>): Prisma__PromptTemplateClient<$Result.GetResult<Prisma.$PromptTemplatePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PromptTemplate that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PromptTemplateFindUniqueOrThrowArgs} args - Arguments to find a PromptTemplate
     * @example
     * // Get one PromptTemplate
     * const promptTemplate = await prisma.promptTemplate.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PromptTemplateFindUniqueOrThrowArgs>(args: SelectSubset<T, PromptTemplateFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PromptTemplateClient<$Result.GetResult<Prisma.$PromptTemplatePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PromptTemplate that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PromptTemplateFindFirstArgs} args - Arguments to find a PromptTemplate
     * @example
     * // Get one PromptTemplate
     * const promptTemplate = await prisma.promptTemplate.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PromptTemplateFindFirstArgs>(args?: SelectSubset<T, PromptTemplateFindFirstArgs<ExtArgs>>): Prisma__PromptTemplateClient<$Result.GetResult<Prisma.$PromptTemplatePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PromptTemplate that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PromptTemplateFindFirstOrThrowArgs} args - Arguments to find a PromptTemplate
     * @example
     * // Get one PromptTemplate
     * const promptTemplate = await prisma.promptTemplate.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PromptTemplateFindFirstOrThrowArgs>(args?: SelectSubset<T, PromptTemplateFindFirstOrThrowArgs<ExtArgs>>): Prisma__PromptTemplateClient<$Result.GetResult<Prisma.$PromptTemplatePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PromptTemplates that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PromptTemplateFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PromptTemplates
     * const promptTemplates = await prisma.promptTemplate.findMany()
     * 
     * // Get first 10 PromptTemplates
     * const promptTemplates = await prisma.promptTemplate.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const promptTemplateWithIdOnly = await prisma.promptTemplate.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PromptTemplateFindManyArgs>(args?: SelectSubset<T, PromptTemplateFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PromptTemplatePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PromptTemplate.
     * @param {PromptTemplateCreateArgs} args - Arguments to create a PromptTemplate.
     * @example
     * // Create one PromptTemplate
     * const PromptTemplate = await prisma.promptTemplate.create({
     *   data: {
     *     // ... data to create a PromptTemplate
     *   }
     * })
     * 
     */
    create<T extends PromptTemplateCreateArgs>(args: SelectSubset<T, PromptTemplateCreateArgs<ExtArgs>>): Prisma__PromptTemplateClient<$Result.GetResult<Prisma.$PromptTemplatePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PromptTemplates.
     * @param {PromptTemplateCreateManyArgs} args - Arguments to create many PromptTemplates.
     * @example
     * // Create many PromptTemplates
     * const promptTemplate = await prisma.promptTemplate.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PromptTemplateCreateManyArgs>(args?: SelectSubset<T, PromptTemplateCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a PromptTemplate.
     * @param {PromptTemplateDeleteArgs} args - Arguments to delete one PromptTemplate.
     * @example
     * // Delete one PromptTemplate
     * const PromptTemplate = await prisma.promptTemplate.delete({
     *   where: {
     *     // ... filter to delete one PromptTemplate
     *   }
     * })
     * 
     */
    delete<T extends PromptTemplateDeleteArgs>(args: SelectSubset<T, PromptTemplateDeleteArgs<ExtArgs>>): Prisma__PromptTemplateClient<$Result.GetResult<Prisma.$PromptTemplatePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PromptTemplate.
     * @param {PromptTemplateUpdateArgs} args - Arguments to update one PromptTemplate.
     * @example
     * // Update one PromptTemplate
     * const promptTemplate = await prisma.promptTemplate.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PromptTemplateUpdateArgs>(args: SelectSubset<T, PromptTemplateUpdateArgs<ExtArgs>>): Prisma__PromptTemplateClient<$Result.GetResult<Prisma.$PromptTemplatePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PromptTemplates.
     * @param {PromptTemplateDeleteManyArgs} args - Arguments to filter PromptTemplates to delete.
     * @example
     * // Delete a few PromptTemplates
     * const { count } = await prisma.promptTemplate.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PromptTemplateDeleteManyArgs>(args?: SelectSubset<T, PromptTemplateDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PromptTemplates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PromptTemplateUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PromptTemplates
     * const promptTemplate = await prisma.promptTemplate.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PromptTemplateUpdateManyArgs>(args: SelectSubset<T, PromptTemplateUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one PromptTemplate.
     * @param {PromptTemplateUpsertArgs} args - Arguments to update or create a PromptTemplate.
     * @example
     * // Update or create a PromptTemplate
     * const promptTemplate = await prisma.promptTemplate.upsert({
     *   create: {
     *     // ... data to create a PromptTemplate
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PromptTemplate we want to update
     *   }
     * })
     */
    upsert<T extends PromptTemplateUpsertArgs>(args: SelectSubset<T, PromptTemplateUpsertArgs<ExtArgs>>): Prisma__PromptTemplateClient<$Result.GetResult<Prisma.$PromptTemplatePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PromptTemplates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PromptTemplateCountArgs} args - Arguments to filter PromptTemplates to count.
     * @example
     * // Count the number of PromptTemplates
     * const count = await prisma.promptTemplate.count({
     *   where: {
     *     // ... the filter for the PromptTemplates we want to count
     *   }
     * })
    **/
    count<T extends PromptTemplateCountArgs>(
      args?: Subset<T, PromptTemplateCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PromptTemplateCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PromptTemplate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PromptTemplateAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PromptTemplateAggregateArgs>(args: Subset<T, PromptTemplateAggregateArgs>): Prisma.PrismaPromise<GetPromptTemplateAggregateType<T>>

    /**
     * Group by PromptTemplate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PromptTemplateGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PromptTemplateGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PromptTemplateGroupByArgs['orderBy'] }
        : { orderBy?: PromptTemplateGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PromptTemplateGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPromptTemplateGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PromptTemplate model
   */
  readonly fields: PromptTemplateFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PromptTemplate.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PromptTemplateClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PromptTemplate model
   */
  interface PromptTemplateFieldRefs {
    readonly id: FieldRef<"PromptTemplate", 'String'>
    readonly name: FieldRef<"PromptTemplate", 'String'>
    readonly body: FieldRef<"PromptTemplate", 'String'>
    readonly updatedAt: FieldRef<"PromptTemplate", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PromptTemplate findUnique
   */
  export type PromptTemplateFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromptTemplate
     */
    select?: PromptTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PromptTemplate
     */
    omit?: PromptTemplateOmit<ExtArgs> | null
    /**
     * Filter, which PromptTemplate to fetch.
     */
    where: PromptTemplateWhereUniqueInput
  }

  /**
   * PromptTemplate findUniqueOrThrow
   */
  export type PromptTemplateFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromptTemplate
     */
    select?: PromptTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PromptTemplate
     */
    omit?: PromptTemplateOmit<ExtArgs> | null
    /**
     * Filter, which PromptTemplate to fetch.
     */
    where: PromptTemplateWhereUniqueInput
  }

  /**
   * PromptTemplate findFirst
   */
  export type PromptTemplateFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromptTemplate
     */
    select?: PromptTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PromptTemplate
     */
    omit?: PromptTemplateOmit<ExtArgs> | null
    /**
     * Filter, which PromptTemplate to fetch.
     */
    where?: PromptTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PromptTemplates to fetch.
     */
    orderBy?: PromptTemplateOrderByWithRelationInput | PromptTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PromptTemplates.
     */
    cursor?: PromptTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PromptTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PromptTemplates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PromptTemplates.
     */
    distinct?: PromptTemplateScalarFieldEnum | PromptTemplateScalarFieldEnum[]
  }

  /**
   * PromptTemplate findFirstOrThrow
   */
  export type PromptTemplateFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromptTemplate
     */
    select?: PromptTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PromptTemplate
     */
    omit?: PromptTemplateOmit<ExtArgs> | null
    /**
     * Filter, which PromptTemplate to fetch.
     */
    where?: PromptTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PromptTemplates to fetch.
     */
    orderBy?: PromptTemplateOrderByWithRelationInput | PromptTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PromptTemplates.
     */
    cursor?: PromptTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PromptTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PromptTemplates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PromptTemplates.
     */
    distinct?: PromptTemplateScalarFieldEnum | PromptTemplateScalarFieldEnum[]
  }

  /**
   * PromptTemplate findMany
   */
  export type PromptTemplateFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromptTemplate
     */
    select?: PromptTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PromptTemplate
     */
    omit?: PromptTemplateOmit<ExtArgs> | null
    /**
     * Filter, which PromptTemplates to fetch.
     */
    where?: PromptTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PromptTemplates to fetch.
     */
    orderBy?: PromptTemplateOrderByWithRelationInput | PromptTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PromptTemplates.
     */
    cursor?: PromptTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PromptTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PromptTemplates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PromptTemplates.
     */
    distinct?: PromptTemplateScalarFieldEnum | PromptTemplateScalarFieldEnum[]
  }

  /**
   * PromptTemplate create
   */
  export type PromptTemplateCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromptTemplate
     */
    select?: PromptTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PromptTemplate
     */
    omit?: PromptTemplateOmit<ExtArgs> | null
    /**
     * The data needed to create a PromptTemplate.
     */
    data: XOR<PromptTemplateCreateInput, PromptTemplateUncheckedCreateInput>
  }

  /**
   * PromptTemplate createMany
   */
  export type PromptTemplateCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PromptTemplates.
     */
    data: PromptTemplateCreateManyInput | PromptTemplateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PromptTemplate update
   */
  export type PromptTemplateUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromptTemplate
     */
    select?: PromptTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PromptTemplate
     */
    omit?: PromptTemplateOmit<ExtArgs> | null
    /**
     * The data needed to update a PromptTemplate.
     */
    data: XOR<PromptTemplateUpdateInput, PromptTemplateUncheckedUpdateInput>
    /**
     * Choose, which PromptTemplate to update.
     */
    where: PromptTemplateWhereUniqueInput
  }

  /**
   * PromptTemplate updateMany
   */
  export type PromptTemplateUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PromptTemplates.
     */
    data: XOR<PromptTemplateUpdateManyMutationInput, PromptTemplateUncheckedUpdateManyInput>
    /**
     * Filter which PromptTemplates to update
     */
    where?: PromptTemplateWhereInput
    /**
     * Limit how many PromptTemplates to update.
     */
    limit?: number
  }

  /**
   * PromptTemplate upsert
   */
  export type PromptTemplateUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromptTemplate
     */
    select?: PromptTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PromptTemplate
     */
    omit?: PromptTemplateOmit<ExtArgs> | null
    /**
     * The filter to search for the PromptTemplate to update in case it exists.
     */
    where: PromptTemplateWhereUniqueInput
    /**
     * In case the PromptTemplate found by the `where` argument doesn't exist, create a new PromptTemplate with this data.
     */
    create: XOR<PromptTemplateCreateInput, PromptTemplateUncheckedCreateInput>
    /**
     * In case the PromptTemplate was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PromptTemplateUpdateInput, PromptTemplateUncheckedUpdateInput>
  }

  /**
   * PromptTemplate delete
   */
  export type PromptTemplateDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromptTemplate
     */
    select?: PromptTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PromptTemplate
     */
    omit?: PromptTemplateOmit<ExtArgs> | null
    /**
     * Filter which PromptTemplate to delete.
     */
    where: PromptTemplateWhereUniqueInput
  }

  /**
   * PromptTemplate deleteMany
   */
  export type PromptTemplateDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PromptTemplates to delete
     */
    where?: PromptTemplateWhereInput
    /**
     * Limit how many PromptTemplates to delete.
     */
    limit?: number
  }

  /**
   * PromptTemplate without action
   */
  export type PromptTemplateDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromptTemplate
     */
    select?: PromptTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PromptTemplate
     */
    omit?: PromptTemplateOmit<ExtArgs> | null
  }


  /**
   * Model Note
   */

  export type AggregateNote = {
    _count: NoteCountAggregateOutputType | null
    _min: NoteMinAggregateOutputType | null
    _max: NoteMaxAggregateOutputType | null
  }

  export type NoteMinAggregateOutputType = {
    conceptId: string | null
    body: string | null
    updatedAt: Date | null
  }

  export type NoteMaxAggregateOutputType = {
    conceptId: string | null
    body: string | null
    updatedAt: Date | null
  }

  export type NoteCountAggregateOutputType = {
    conceptId: number
    body: number
    updatedAt: number
    _all: number
  }


  export type NoteMinAggregateInputType = {
    conceptId?: true
    body?: true
    updatedAt?: true
  }

  export type NoteMaxAggregateInputType = {
    conceptId?: true
    body?: true
    updatedAt?: true
  }

  export type NoteCountAggregateInputType = {
    conceptId?: true
    body?: true
    updatedAt?: true
    _all?: true
  }

  export type NoteAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Note to aggregate.
     */
    where?: NoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notes to fetch.
     */
    orderBy?: NoteOrderByWithRelationInput | NoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: NoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Notes
    **/
    _count?: true | NoteCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: NoteMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: NoteMaxAggregateInputType
  }

  export type GetNoteAggregateType<T extends NoteAggregateArgs> = {
        [P in keyof T & keyof AggregateNote]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateNote[P]>
      : GetScalarType<T[P], AggregateNote[P]>
  }




  export type NoteGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NoteWhereInput
    orderBy?: NoteOrderByWithAggregationInput | NoteOrderByWithAggregationInput[]
    by: NoteScalarFieldEnum[] | NoteScalarFieldEnum
    having?: NoteScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: NoteCountAggregateInputType | true
    _min?: NoteMinAggregateInputType
    _max?: NoteMaxAggregateInputType
  }

  export type NoteGroupByOutputType = {
    conceptId: string
    body: string
    updatedAt: Date
    _count: NoteCountAggregateOutputType | null
    _min: NoteMinAggregateOutputType | null
    _max: NoteMaxAggregateOutputType | null
  }

  type GetNoteGroupByPayload<T extends NoteGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<NoteGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof NoteGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], NoteGroupByOutputType[P]>
            : GetScalarType<T[P], NoteGroupByOutputType[P]>
        }
      >
    >


  export type NoteSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    conceptId?: boolean
    body?: boolean
    updatedAt?: boolean
    concept?: boolean | ConceptDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["note"]>



  export type NoteSelectScalar = {
    conceptId?: boolean
    body?: boolean
    updatedAt?: boolean
  }

  export type NoteOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"conceptId" | "body" | "updatedAt", ExtArgs["result"]["note"]>
  export type NoteInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    concept?: boolean | ConceptDefaultArgs<ExtArgs>
  }

  export type $NotePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Note"
    objects: {
      concept: Prisma.$ConceptPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      conceptId: string
      body: string
      updatedAt: Date
    }, ExtArgs["result"]["note"]>
    composites: {}
  }

  type NoteGetPayload<S extends boolean | null | undefined | NoteDefaultArgs> = $Result.GetResult<Prisma.$NotePayload, S>

  type NoteCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<NoteFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: NoteCountAggregateInputType | true
    }

  export interface NoteDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Note'], meta: { name: 'Note' } }
    /**
     * Find zero or one Note that matches the filter.
     * @param {NoteFindUniqueArgs} args - Arguments to find a Note
     * @example
     * // Get one Note
     * const note = await prisma.note.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends NoteFindUniqueArgs>(args: SelectSubset<T, NoteFindUniqueArgs<ExtArgs>>): Prisma__NoteClient<$Result.GetResult<Prisma.$NotePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Note that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {NoteFindUniqueOrThrowArgs} args - Arguments to find a Note
     * @example
     * // Get one Note
     * const note = await prisma.note.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends NoteFindUniqueOrThrowArgs>(args: SelectSubset<T, NoteFindUniqueOrThrowArgs<ExtArgs>>): Prisma__NoteClient<$Result.GetResult<Prisma.$NotePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Note that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NoteFindFirstArgs} args - Arguments to find a Note
     * @example
     * // Get one Note
     * const note = await prisma.note.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends NoteFindFirstArgs>(args?: SelectSubset<T, NoteFindFirstArgs<ExtArgs>>): Prisma__NoteClient<$Result.GetResult<Prisma.$NotePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Note that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NoteFindFirstOrThrowArgs} args - Arguments to find a Note
     * @example
     * // Get one Note
     * const note = await prisma.note.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends NoteFindFirstOrThrowArgs>(args?: SelectSubset<T, NoteFindFirstOrThrowArgs<ExtArgs>>): Prisma__NoteClient<$Result.GetResult<Prisma.$NotePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Notes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NoteFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Notes
     * const notes = await prisma.note.findMany()
     * 
     * // Get first 10 Notes
     * const notes = await prisma.note.findMany({ take: 10 })
     * 
     * // Only select the `conceptId`
     * const noteWithConceptIdOnly = await prisma.note.findMany({ select: { conceptId: true } })
     * 
     */
    findMany<T extends NoteFindManyArgs>(args?: SelectSubset<T, NoteFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Note.
     * @param {NoteCreateArgs} args - Arguments to create a Note.
     * @example
     * // Create one Note
     * const Note = await prisma.note.create({
     *   data: {
     *     // ... data to create a Note
     *   }
     * })
     * 
     */
    create<T extends NoteCreateArgs>(args: SelectSubset<T, NoteCreateArgs<ExtArgs>>): Prisma__NoteClient<$Result.GetResult<Prisma.$NotePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Notes.
     * @param {NoteCreateManyArgs} args - Arguments to create many Notes.
     * @example
     * // Create many Notes
     * const note = await prisma.note.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends NoteCreateManyArgs>(args?: SelectSubset<T, NoteCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Note.
     * @param {NoteDeleteArgs} args - Arguments to delete one Note.
     * @example
     * // Delete one Note
     * const Note = await prisma.note.delete({
     *   where: {
     *     // ... filter to delete one Note
     *   }
     * })
     * 
     */
    delete<T extends NoteDeleteArgs>(args: SelectSubset<T, NoteDeleteArgs<ExtArgs>>): Prisma__NoteClient<$Result.GetResult<Prisma.$NotePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Note.
     * @param {NoteUpdateArgs} args - Arguments to update one Note.
     * @example
     * // Update one Note
     * const note = await prisma.note.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends NoteUpdateArgs>(args: SelectSubset<T, NoteUpdateArgs<ExtArgs>>): Prisma__NoteClient<$Result.GetResult<Prisma.$NotePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Notes.
     * @param {NoteDeleteManyArgs} args - Arguments to filter Notes to delete.
     * @example
     * // Delete a few Notes
     * const { count } = await prisma.note.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends NoteDeleteManyArgs>(args?: SelectSubset<T, NoteDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Notes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NoteUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Notes
     * const note = await prisma.note.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends NoteUpdateManyArgs>(args: SelectSubset<T, NoteUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Note.
     * @param {NoteUpsertArgs} args - Arguments to update or create a Note.
     * @example
     * // Update or create a Note
     * const note = await prisma.note.upsert({
     *   create: {
     *     // ... data to create a Note
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Note we want to update
     *   }
     * })
     */
    upsert<T extends NoteUpsertArgs>(args: SelectSubset<T, NoteUpsertArgs<ExtArgs>>): Prisma__NoteClient<$Result.GetResult<Prisma.$NotePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Notes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NoteCountArgs} args - Arguments to filter Notes to count.
     * @example
     * // Count the number of Notes
     * const count = await prisma.note.count({
     *   where: {
     *     // ... the filter for the Notes we want to count
     *   }
     * })
    **/
    count<T extends NoteCountArgs>(
      args?: Subset<T, NoteCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], NoteCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Note.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NoteAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends NoteAggregateArgs>(args: Subset<T, NoteAggregateArgs>): Prisma.PrismaPromise<GetNoteAggregateType<T>>

    /**
     * Group by Note.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NoteGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends NoteGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: NoteGroupByArgs['orderBy'] }
        : { orderBy?: NoteGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, NoteGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNoteGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Note model
   */
  readonly fields: NoteFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Note.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__NoteClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    concept<T extends ConceptDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ConceptDefaultArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Note model
   */
  interface NoteFieldRefs {
    readonly conceptId: FieldRef<"Note", 'String'>
    readonly body: FieldRef<"Note", 'String'>
    readonly updatedAt: FieldRef<"Note", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Note findUnique
   */
  export type NoteFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Note
     */
    select?: NoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Note
     */
    omit?: NoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NoteInclude<ExtArgs> | null
    /**
     * Filter, which Note to fetch.
     */
    where: NoteWhereUniqueInput
  }

  /**
   * Note findUniqueOrThrow
   */
  export type NoteFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Note
     */
    select?: NoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Note
     */
    omit?: NoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NoteInclude<ExtArgs> | null
    /**
     * Filter, which Note to fetch.
     */
    where: NoteWhereUniqueInput
  }

  /**
   * Note findFirst
   */
  export type NoteFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Note
     */
    select?: NoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Note
     */
    omit?: NoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NoteInclude<ExtArgs> | null
    /**
     * Filter, which Note to fetch.
     */
    where?: NoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notes to fetch.
     */
    orderBy?: NoteOrderByWithRelationInput | NoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Notes.
     */
    cursor?: NoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Notes.
     */
    distinct?: NoteScalarFieldEnum | NoteScalarFieldEnum[]
  }

  /**
   * Note findFirstOrThrow
   */
  export type NoteFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Note
     */
    select?: NoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Note
     */
    omit?: NoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NoteInclude<ExtArgs> | null
    /**
     * Filter, which Note to fetch.
     */
    where?: NoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notes to fetch.
     */
    orderBy?: NoteOrderByWithRelationInput | NoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Notes.
     */
    cursor?: NoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Notes.
     */
    distinct?: NoteScalarFieldEnum | NoteScalarFieldEnum[]
  }

  /**
   * Note findMany
   */
  export type NoteFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Note
     */
    select?: NoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Note
     */
    omit?: NoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NoteInclude<ExtArgs> | null
    /**
     * Filter, which Notes to fetch.
     */
    where?: NoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notes to fetch.
     */
    orderBy?: NoteOrderByWithRelationInput | NoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Notes.
     */
    cursor?: NoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Notes.
     */
    distinct?: NoteScalarFieldEnum | NoteScalarFieldEnum[]
  }

  /**
   * Note create
   */
  export type NoteCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Note
     */
    select?: NoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Note
     */
    omit?: NoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NoteInclude<ExtArgs> | null
    /**
     * The data needed to create a Note.
     */
    data: XOR<NoteCreateInput, NoteUncheckedCreateInput>
  }

  /**
   * Note createMany
   */
  export type NoteCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Notes.
     */
    data: NoteCreateManyInput | NoteCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Note update
   */
  export type NoteUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Note
     */
    select?: NoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Note
     */
    omit?: NoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NoteInclude<ExtArgs> | null
    /**
     * The data needed to update a Note.
     */
    data: XOR<NoteUpdateInput, NoteUncheckedUpdateInput>
    /**
     * Choose, which Note to update.
     */
    where: NoteWhereUniqueInput
  }

  /**
   * Note updateMany
   */
  export type NoteUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Notes.
     */
    data: XOR<NoteUpdateManyMutationInput, NoteUncheckedUpdateManyInput>
    /**
     * Filter which Notes to update
     */
    where?: NoteWhereInput
    /**
     * Limit how many Notes to update.
     */
    limit?: number
  }

  /**
   * Note upsert
   */
  export type NoteUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Note
     */
    select?: NoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Note
     */
    omit?: NoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NoteInclude<ExtArgs> | null
    /**
     * The filter to search for the Note to update in case it exists.
     */
    where: NoteWhereUniqueInput
    /**
     * In case the Note found by the `where` argument doesn't exist, create a new Note with this data.
     */
    create: XOR<NoteCreateInput, NoteUncheckedCreateInput>
    /**
     * In case the Note was found with the provided `where` argument, update it with this data.
     */
    update: XOR<NoteUpdateInput, NoteUncheckedUpdateInput>
  }

  /**
   * Note delete
   */
  export type NoteDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Note
     */
    select?: NoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Note
     */
    omit?: NoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NoteInclude<ExtArgs> | null
    /**
     * Filter which Note to delete.
     */
    where: NoteWhereUniqueInput
  }

  /**
   * Note deleteMany
   */
  export type NoteDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Notes to delete
     */
    where?: NoteWhereInput
    /**
     * Limit how many Notes to delete.
     */
    limit?: number
  }

  /**
   * Note without action
   */
  export type NoteDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Note
     */
    select?: NoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Note
     */
    omit?: NoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NoteInclude<ExtArgs> | null
  }


  /**
   * Model Source
   */

  export type AggregateSource = {
    _count: SourceCountAggregateOutputType | null
    _avg: SourceAvgAggregateOutputType | null
    _sum: SourceSumAggregateOutputType | null
    _min: SourceMinAggregateOutputType | null
    _max: SourceMaxAggregateOutputType | null
  }

  export type SourceAvgAggregateOutputType = {
    id: number | null
  }

  export type SourceSumAggregateOutputType = {
    id: bigint | null
  }

  export type SourceMinAggregateOutputType = {
    id: bigint | null
    conceptId: string | null
    label: string | null
    url: string | null
  }

  export type SourceMaxAggregateOutputType = {
    id: bigint | null
    conceptId: string | null
    label: string | null
    url: string | null
  }

  export type SourceCountAggregateOutputType = {
    id: number
    conceptId: number
    label: number
    url: number
    _all: number
  }


  export type SourceAvgAggregateInputType = {
    id?: true
  }

  export type SourceSumAggregateInputType = {
    id?: true
  }

  export type SourceMinAggregateInputType = {
    id?: true
    conceptId?: true
    label?: true
    url?: true
  }

  export type SourceMaxAggregateInputType = {
    id?: true
    conceptId?: true
    label?: true
    url?: true
  }

  export type SourceCountAggregateInputType = {
    id?: true
    conceptId?: true
    label?: true
    url?: true
    _all?: true
  }

  export type SourceAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Source to aggregate.
     */
    where?: SourceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sources to fetch.
     */
    orderBy?: SourceOrderByWithRelationInput | SourceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SourceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sources from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sources.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Sources
    **/
    _count?: true | SourceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SourceAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SourceSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SourceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SourceMaxAggregateInputType
  }

  export type GetSourceAggregateType<T extends SourceAggregateArgs> = {
        [P in keyof T & keyof AggregateSource]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSource[P]>
      : GetScalarType<T[P], AggregateSource[P]>
  }




  export type SourceGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SourceWhereInput
    orderBy?: SourceOrderByWithAggregationInput | SourceOrderByWithAggregationInput[]
    by: SourceScalarFieldEnum[] | SourceScalarFieldEnum
    having?: SourceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SourceCountAggregateInputType | true
    _avg?: SourceAvgAggregateInputType
    _sum?: SourceSumAggregateInputType
    _min?: SourceMinAggregateInputType
    _max?: SourceMaxAggregateInputType
  }

  export type SourceGroupByOutputType = {
    id: bigint
    conceptId: string
    label: string
    url: string
    _count: SourceCountAggregateOutputType | null
    _avg: SourceAvgAggregateOutputType | null
    _sum: SourceSumAggregateOutputType | null
    _min: SourceMinAggregateOutputType | null
    _max: SourceMaxAggregateOutputType | null
  }

  type GetSourceGroupByPayload<T extends SourceGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SourceGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SourceGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SourceGroupByOutputType[P]>
            : GetScalarType<T[P], SourceGroupByOutputType[P]>
        }
      >
    >


  export type SourceSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    conceptId?: boolean
    label?: boolean
    url?: boolean
    concept?: boolean | ConceptDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["source"]>



  export type SourceSelectScalar = {
    id?: boolean
    conceptId?: boolean
    label?: boolean
    url?: boolean
  }

  export type SourceOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "conceptId" | "label" | "url", ExtArgs["result"]["source"]>
  export type SourceInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    concept?: boolean | ConceptDefaultArgs<ExtArgs>
  }

  export type $SourcePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Source"
    objects: {
      concept: Prisma.$ConceptPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: bigint
      conceptId: string
      label: string
      url: string
    }, ExtArgs["result"]["source"]>
    composites: {}
  }

  type SourceGetPayload<S extends boolean | null | undefined | SourceDefaultArgs> = $Result.GetResult<Prisma.$SourcePayload, S>

  type SourceCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SourceFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SourceCountAggregateInputType | true
    }

  export interface SourceDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Source'], meta: { name: 'Source' } }
    /**
     * Find zero or one Source that matches the filter.
     * @param {SourceFindUniqueArgs} args - Arguments to find a Source
     * @example
     * // Get one Source
     * const source = await prisma.source.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SourceFindUniqueArgs>(args: SelectSubset<T, SourceFindUniqueArgs<ExtArgs>>): Prisma__SourceClient<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Source that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SourceFindUniqueOrThrowArgs} args - Arguments to find a Source
     * @example
     * // Get one Source
     * const source = await prisma.source.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SourceFindUniqueOrThrowArgs>(args: SelectSubset<T, SourceFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SourceClient<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Source that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SourceFindFirstArgs} args - Arguments to find a Source
     * @example
     * // Get one Source
     * const source = await prisma.source.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SourceFindFirstArgs>(args?: SelectSubset<T, SourceFindFirstArgs<ExtArgs>>): Prisma__SourceClient<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Source that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SourceFindFirstOrThrowArgs} args - Arguments to find a Source
     * @example
     * // Get one Source
     * const source = await prisma.source.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SourceFindFirstOrThrowArgs>(args?: SelectSubset<T, SourceFindFirstOrThrowArgs<ExtArgs>>): Prisma__SourceClient<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sources that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SourceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sources
     * const sources = await prisma.source.findMany()
     * 
     * // Get first 10 Sources
     * const sources = await prisma.source.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const sourceWithIdOnly = await prisma.source.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SourceFindManyArgs>(args?: SelectSubset<T, SourceFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Source.
     * @param {SourceCreateArgs} args - Arguments to create a Source.
     * @example
     * // Create one Source
     * const Source = await prisma.source.create({
     *   data: {
     *     // ... data to create a Source
     *   }
     * })
     * 
     */
    create<T extends SourceCreateArgs>(args: SelectSubset<T, SourceCreateArgs<ExtArgs>>): Prisma__SourceClient<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sources.
     * @param {SourceCreateManyArgs} args - Arguments to create many Sources.
     * @example
     * // Create many Sources
     * const source = await prisma.source.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SourceCreateManyArgs>(args?: SelectSubset<T, SourceCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Source.
     * @param {SourceDeleteArgs} args - Arguments to delete one Source.
     * @example
     * // Delete one Source
     * const Source = await prisma.source.delete({
     *   where: {
     *     // ... filter to delete one Source
     *   }
     * })
     * 
     */
    delete<T extends SourceDeleteArgs>(args: SelectSubset<T, SourceDeleteArgs<ExtArgs>>): Prisma__SourceClient<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Source.
     * @param {SourceUpdateArgs} args - Arguments to update one Source.
     * @example
     * // Update one Source
     * const source = await prisma.source.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SourceUpdateArgs>(args: SelectSubset<T, SourceUpdateArgs<ExtArgs>>): Prisma__SourceClient<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sources.
     * @param {SourceDeleteManyArgs} args - Arguments to filter Sources to delete.
     * @example
     * // Delete a few Sources
     * const { count } = await prisma.source.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SourceDeleteManyArgs>(args?: SelectSubset<T, SourceDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sources.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SourceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sources
     * const source = await prisma.source.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SourceUpdateManyArgs>(args: SelectSubset<T, SourceUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Source.
     * @param {SourceUpsertArgs} args - Arguments to update or create a Source.
     * @example
     * // Update or create a Source
     * const source = await prisma.source.upsert({
     *   create: {
     *     // ... data to create a Source
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Source we want to update
     *   }
     * })
     */
    upsert<T extends SourceUpsertArgs>(args: SelectSubset<T, SourceUpsertArgs<ExtArgs>>): Prisma__SourceClient<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sources.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SourceCountArgs} args - Arguments to filter Sources to count.
     * @example
     * // Count the number of Sources
     * const count = await prisma.source.count({
     *   where: {
     *     // ... the filter for the Sources we want to count
     *   }
     * })
    **/
    count<T extends SourceCountArgs>(
      args?: Subset<T, SourceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SourceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Source.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SourceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SourceAggregateArgs>(args: Subset<T, SourceAggregateArgs>): Prisma.PrismaPromise<GetSourceAggregateType<T>>

    /**
     * Group by Source.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SourceGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SourceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SourceGroupByArgs['orderBy'] }
        : { orderBy?: SourceGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SourceGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSourceGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Source model
   */
  readonly fields: SourceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Source.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SourceClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    concept<T extends ConceptDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ConceptDefaultArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Source model
   */
  interface SourceFieldRefs {
    readonly id: FieldRef<"Source", 'BigInt'>
    readonly conceptId: FieldRef<"Source", 'String'>
    readonly label: FieldRef<"Source", 'String'>
    readonly url: FieldRef<"Source", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Source findUnique
   */
  export type SourceFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
    /**
     * Filter, which Source to fetch.
     */
    where: SourceWhereUniqueInput
  }

  /**
   * Source findUniqueOrThrow
   */
  export type SourceFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
    /**
     * Filter, which Source to fetch.
     */
    where: SourceWhereUniqueInput
  }

  /**
   * Source findFirst
   */
  export type SourceFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
    /**
     * Filter, which Source to fetch.
     */
    where?: SourceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sources to fetch.
     */
    orderBy?: SourceOrderByWithRelationInput | SourceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Sources.
     */
    cursor?: SourceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sources from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sources.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Sources.
     */
    distinct?: SourceScalarFieldEnum | SourceScalarFieldEnum[]
  }

  /**
   * Source findFirstOrThrow
   */
  export type SourceFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
    /**
     * Filter, which Source to fetch.
     */
    where?: SourceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sources to fetch.
     */
    orderBy?: SourceOrderByWithRelationInput | SourceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Sources.
     */
    cursor?: SourceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sources from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sources.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Sources.
     */
    distinct?: SourceScalarFieldEnum | SourceScalarFieldEnum[]
  }

  /**
   * Source findMany
   */
  export type SourceFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
    /**
     * Filter, which Sources to fetch.
     */
    where?: SourceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sources to fetch.
     */
    orderBy?: SourceOrderByWithRelationInput | SourceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Sources.
     */
    cursor?: SourceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sources from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sources.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Sources.
     */
    distinct?: SourceScalarFieldEnum | SourceScalarFieldEnum[]
  }

  /**
   * Source create
   */
  export type SourceCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
    /**
     * The data needed to create a Source.
     */
    data: XOR<SourceCreateInput, SourceUncheckedCreateInput>
  }

  /**
   * Source createMany
   */
  export type SourceCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Sources.
     */
    data: SourceCreateManyInput | SourceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Source update
   */
  export type SourceUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
    /**
     * The data needed to update a Source.
     */
    data: XOR<SourceUpdateInput, SourceUncheckedUpdateInput>
    /**
     * Choose, which Source to update.
     */
    where: SourceWhereUniqueInput
  }

  /**
   * Source updateMany
   */
  export type SourceUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Sources.
     */
    data: XOR<SourceUpdateManyMutationInput, SourceUncheckedUpdateManyInput>
    /**
     * Filter which Sources to update
     */
    where?: SourceWhereInput
    /**
     * Limit how many Sources to update.
     */
    limit?: number
  }

  /**
   * Source upsert
   */
  export type SourceUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
    /**
     * The filter to search for the Source to update in case it exists.
     */
    where: SourceWhereUniqueInput
    /**
     * In case the Source found by the `where` argument doesn't exist, create a new Source with this data.
     */
    create: XOR<SourceCreateInput, SourceUncheckedCreateInput>
    /**
     * In case the Source was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SourceUpdateInput, SourceUncheckedUpdateInput>
  }

  /**
   * Source delete
   */
  export type SourceDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
    /**
     * Filter which Source to delete.
     */
    where: SourceWhereUniqueInput
  }

  /**
   * Source deleteMany
   */
  export type SourceDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Sources to delete
     */
    where?: SourceWhereInput
    /**
     * Limit how many Sources to delete.
     */
    limit?: number
  }

  /**
   * Source without action
   */
  export type SourceDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const TrackScalarFieldEnum: {
    id: 'id',
    title: 'title',
    ord: 'ord'
  };

  export type TrackScalarFieldEnum = (typeof TrackScalarFieldEnum)[keyof typeof TrackScalarFieldEnum]


  export const ChapterScalarFieldEnum: {
    id: 'id',
    trackId: 'trackId',
    title: 'title',
    summary: 'summary',
    ord: 'ord'
  };

  export type ChapterScalarFieldEnum = (typeof ChapterScalarFieldEnum)[keyof typeof ChapterScalarFieldEnum]


  export const ConceptScalarFieldEnum: {
    id: 'id',
    chapterId: 'chapterId',
    title: 'title',
    summary: 'summary',
    versionNote: 'versionNote',
    ord: 'ord',
    updatedAt: 'updatedAt'
  };

  export type ConceptScalarFieldEnum = (typeof ConceptScalarFieldEnum)[keyof typeof ConceptScalarFieldEnum]


  export const ConceptLevelScalarFieldEnum: {
    conceptId: 'conceptId',
    level: 'level',
    body: 'body',
    minutes: 'minutes'
  };

  export type ConceptLevelScalarFieldEnum = (typeof ConceptLevelScalarFieldEnum)[keyof typeof ConceptLevelScalarFieldEnum]


  export const ConceptSectionScalarFieldEnum: {
    conceptId: 'conceptId',
    level: 'level',
    ord: 'ord',
    heading: 'heading',
    anchor: 'anchor'
  };

  export type ConceptSectionScalarFieldEnum = (typeof ConceptSectionScalarFieldEnum)[keyof typeof ConceptSectionScalarFieldEnum]


  export const EdgeScalarFieldEnum: {
    fromId: 'fromId',
    toId: 'toId',
    type: 'type'
  };

  export type EdgeScalarFieldEnum = (typeof EdgeScalarFieldEnum)[keyof typeof EdgeScalarFieldEnum]


  export const ConceptVisualScalarFieldEnum: {
    id: 'id',
    conceptId: 'conceptId',
    level: 'level',
    title: 'title',
    kind: 'kind',
    spec: 'spec',
    ord: 'ord'
  };

  export type ConceptVisualScalarFieldEnum = (typeof ConceptVisualScalarFieldEnum)[keyof typeof ConceptVisualScalarFieldEnum]


  export const PromptTemplateScalarFieldEnum: {
    id: 'id',
    name: 'name',
    body: 'body',
    updatedAt: 'updatedAt'
  };

  export type PromptTemplateScalarFieldEnum = (typeof PromptTemplateScalarFieldEnum)[keyof typeof PromptTemplateScalarFieldEnum]


  export const NoteScalarFieldEnum: {
    conceptId: 'conceptId',
    body: 'body',
    updatedAt: 'updatedAt'
  };

  export type NoteScalarFieldEnum = (typeof NoteScalarFieldEnum)[keyof typeof NoteScalarFieldEnum]


  export const SourceScalarFieldEnum: {
    id: 'id',
    conceptId: 'conceptId',
    label: 'label',
    url: 'url'
  };

  export type SourceScalarFieldEnum = (typeof SourceScalarFieldEnum)[keyof typeof SourceScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const TrackOrderByRelevanceFieldEnum: {
    id: 'id',
    title: 'title'
  };

  export type TrackOrderByRelevanceFieldEnum = (typeof TrackOrderByRelevanceFieldEnum)[keyof typeof TrackOrderByRelevanceFieldEnum]


  export const ChapterOrderByRelevanceFieldEnum: {
    id: 'id',
    trackId: 'trackId',
    title: 'title',
    summary: 'summary'
  };

  export type ChapterOrderByRelevanceFieldEnum = (typeof ChapterOrderByRelevanceFieldEnum)[keyof typeof ChapterOrderByRelevanceFieldEnum]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const ConceptOrderByRelevanceFieldEnum: {
    id: 'id',
    chapterId: 'chapterId',
    title: 'title',
    summary: 'summary',
    versionNote: 'versionNote'
  };

  export type ConceptOrderByRelevanceFieldEnum = (typeof ConceptOrderByRelevanceFieldEnum)[keyof typeof ConceptOrderByRelevanceFieldEnum]


  export const ConceptLevelOrderByRelevanceFieldEnum: {
    conceptId: 'conceptId',
    body: 'body'
  };

  export type ConceptLevelOrderByRelevanceFieldEnum = (typeof ConceptLevelOrderByRelevanceFieldEnum)[keyof typeof ConceptLevelOrderByRelevanceFieldEnum]


  export const ConceptSectionOrderByRelevanceFieldEnum: {
    conceptId: 'conceptId',
    heading: 'heading',
    anchor: 'anchor'
  };

  export type ConceptSectionOrderByRelevanceFieldEnum = (typeof ConceptSectionOrderByRelevanceFieldEnum)[keyof typeof ConceptSectionOrderByRelevanceFieldEnum]


  export const EdgeOrderByRelevanceFieldEnum: {
    fromId: 'fromId',
    toId: 'toId'
  };

  export type EdgeOrderByRelevanceFieldEnum = (typeof EdgeOrderByRelevanceFieldEnum)[keyof typeof EdgeOrderByRelevanceFieldEnum]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const ConceptVisualOrderByRelevanceFieldEnum: {
    id: 'id',
    conceptId: 'conceptId',
    title: 'title'
  };

  export type ConceptVisualOrderByRelevanceFieldEnum = (typeof ConceptVisualOrderByRelevanceFieldEnum)[keyof typeof ConceptVisualOrderByRelevanceFieldEnum]


  export const PromptTemplateOrderByRelevanceFieldEnum: {
    id: 'id',
    name: 'name',
    body: 'body'
  };

  export type PromptTemplateOrderByRelevanceFieldEnum = (typeof PromptTemplateOrderByRelevanceFieldEnum)[keyof typeof PromptTemplateOrderByRelevanceFieldEnum]


  export const NoteOrderByRelevanceFieldEnum: {
    conceptId: 'conceptId',
    body: 'body'
  };

  export type NoteOrderByRelevanceFieldEnum = (typeof NoteOrderByRelevanceFieldEnum)[keyof typeof NoteOrderByRelevanceFieldEnum]


  export const SourceOrderByRelevanceFieldEnum: {
    conceptId: 'conceptId',
    label: 'label',
    url: 'url'
  };

  export type SourceOrderByRelevanceFieldEnum = (typeof SourceOrderByRelevanceFieldEnum)[keyof typeof SourceOrderByRelevanceFieldEnum]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Level'
   */
  export type EnumLevelFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Level'>
    


  /**
   * Reference to a field of type 'EdgeType'
   */
  export type EnumEdgeTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'EdgeType'>
    


  /**
   * Reference to a field of type 'VisualKind'
   */
  export type EnumVisualKindFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'VisualKind'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'BigInt'
   */
  export type BigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type TrackWhereInput = {
    AND?: TrackWhereInput | TrackWhereInput[]
    OR?: TrackWhereInput[]
    NOT?: TrackWhereInput | TrackWhereInput[]
    id?: StringFilter<"Track"> | string
    title?: StringFilter<"Track"> | string
    ord?: IntFilter<"Track"> | number
    chapters?: ChapterListRelationFilter
  }

  export type TrackOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    ord?: SortOrder
    chapters?: ChapterOrderByRelationAggregateInput
    _relevance?: TrackOrderByRelevanceInput
  }

  export type TrackWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TrackWhereInput | TrackWhereInput[]
    OR?: TrackWhereInput[]
    NOT?: TrackWhereInput | TrackWhereInput[]
    title?: StringFilter<"Track"> | string
    ord?: IntFilter<"Track"> | number
    chapters?: ChapterListRelationFilter
  }, "id">

  export type TrackOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    ord?: SortOrder
    _count?: TrackCountOrderByAggregateInput
    _avg?: TrackAvgOrderByAggregateInput
    _max?: TrackMaxOrderByAggregateInput
    _min?: TrackMinOrderByAggregateInput
    _sum?: TrackSumOrderByAggregateInput
  }

  export type TrackScalarWhereWithAggregatesInput = {
    AND?: TrackScalarWhereWithAggregatesInput | TrackScalarWhereWithAggregatesInput[]
    OR?: TrackScalarWhereWithAggregatesInput[]
    NOT?: TrackScalarWhereWithAggregatesInput | TrackScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Track"> | string
    title?: StringWithAggregatesFilter<"Track"> | string
    ord?: IntWithAggregatesFilter<"Track"> | number
  }

  export type ChapterWhereInput = {
    AND?: ChapterWhereInput | ChapterWhereInput[]
    OR?: ChapterWhereInput[]
    NOT?: ChapterWhereInput | ChapterWhereInput[]
    id?: StringFilter<"Chapter"> | string
    trackId?: StringFilter<"Chapter"> | string
    title?: StringFilter<"Chapter"> | string
    summary?: StringFilter<"Chapter"> | string
    ord?: IntFilter<"Chapter"> | number
    track?: XOR<TrackScalarRelationFilter, TrackWhereInput>
    concepts?: ConceptListRelationFilter
  }

  export type ChapterOrderByWithRelationInput = {
    id?: SortOrder
    trackId?: SortOrder
    title?: SortOrder
    summary?: SortOrder
    ord?: SortOrder
    track?: TrackOrderByWithRelationInput
    concepts?: ConceptOrderByRelationAggregateInput
    _relevance?: ChapterOrderByRelevanceInput
  }

  export type ChapterWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ChapterWhereInput | ChapterWhereInput[]
    OR?: ChapterWhereInput[]
    NOT?: ChapterWhereInput | ChapterWhereInput[]
    trackId?: StringFilter<"Chapter"> | string
    title?: StringFilter<"Chapter"> | string
    summary?: StringFilter<"Chapter"> | string
    ord?: IntFilter<"Chapter"> | number
    track?: XOR<TrackScalarRelationFilter, TrackWhereInput>
    concepts?: ConceptListRelationFilter
  }, "id">

  export type ChapterOrderByWithAggregationInput = {
    id?: SortOrder
    trackId?: SortOrder
    title?: SortOrder
    summary?: SortOrder
    ord?: SortOrder
    _count?: ChapterCountOrderByAggregateInput
    _avg?: ChapterAvgOrderByAggregateInput
    _max?: ChapterMaxOrderByAggregateInput
    _min?: ChapterMinOrderByAggregateInput
    _sum?: ChapterSumOrderByAggregateInput
  }

  export type ChapterScalarWhereWithAggregatesInput = {
    AND?: ChapterScalarWhereWithAggregatesInput | ChapterScalarWhereWithAggregatesInput[]
    OR?: ChapterScalarWhereWithAggregatesInput[]
    NOT?: ChapterScalarWhereWithAggregatesInput | ChapterScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Chapter"> | string
    trackId?: StringWithAggregatesFilter<"Chapter"> | string
    title?: StringWithAggregatesFilter<"Chapter"> | string
    summary?: StringWithAggregatesFilter<"Chapter"> | string
    ord?: IntWithAggregatesFilter<"Chapter"> | number
  }

  export type ConceptWhereInput = {
    AND?: ConceptWhereInput | ConceptWhereInput[]
    OR?: ConceptWhereInput[]
    NOT?: ConceptWhereInput | ConceptWhereInput[]
    id?: StringFilter<"Concept"> | string
    chapterId?: StringFilter<"Concept"> | string
    title?: StringFilter<"Concept"> | string
    summary?: StringFilter<"Concept"> | string
    versionNote?: StringNullableFilter<"Concept"> | string | null
    ord?: IntFilter<"Concept"> | number
    updatedAt?: DateTimeFilter<"Concept"> | Date | string
    chapter?: XOR<ChapterScalarRelationFilter, ChapterWhereInput>
    levels?: ConceptLevelListRelationFilter
    sections?: ConceptSectionListRelationFilter
    visuals?: ConceptVisualListRelationFilter
    sources?: SourceListRelationFilter
    note?: XOR<NoteNullableScalarRelationFilter, NoteWhereInput> | null
    edgesOut?: EdgeListRelationFilter
    edgesIn?: EdgeListRelationFilter
  }

  export type ConceptOrderByWithRelationInput = {
    id?: SortOrder
    chapterId?: SortOrder
    title?: SortOrder
    summary?: SortOrder
    versionNote?: SortOrderInput | SortOrder
    ord?: SortOrder
    updatedAt?: SortOrder
    chapter?: ChapterOrderByWithRelationInput
    levels?: ConceptLevelOrderByRelationAggregateInput
    sections?: ConceptSectionOrderByRelationAggregateInput
    visuals?: ConceptVisualOrderByRelationAggregateInput
    sources?: SourceOrderByRelationAggregateInput
    note?: NoteOrderByWithRelationInput
    edgesOut?: EdgeOrderByRelationAggregateInput
    edgesIn?: EdgeOrderByRelationAggregateInput
    _relevance?: ConceptOrderByRelevanceInput
  }

  export type ConceptWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ConceptWhereInput | ConceptWhereInput[]
    OR?: ConceptWhereInput[]
    NOT?: ConceptWhereInput | ConceptWhereInput[]
    chapterId?: StringFilter<"Concept"> | string
    title?: StringFilter<"Concept"> | string
    summary?: StringFilter<"Concept"> | string
    versionNote?: StringNullableFilter<"Concept"> | string | null
    ord?: IntFilter<"Concept"> | number
    updatedAt?: DateTimeFilter<"Concept"> | Date | string
    chapter?: XOR<ChapterScalarRelationFilter, ChapterWhereInput>
    levels?: ConceptLevelListRelationFilter
    sections?: ConceptSectionListRelationFilter
    visuals?: ConceptVisualListRelationFilter
    sources?: SourceListRelationFilter
    note?: XOR<NoteNullableScalarRelationFilter, NoteWhereInput> | null
    edgesOut?: EdgeListRelationFilter
    edgesIn?: EdgeListRelationFilter
  }, "id">

  export type ConceptOrderByWithAggregationInput = {
    id?: SortOrder
    chapterId?: SortOrder
    title?: SortOrder
    summary?: SortOrder
    versionNote?: SortOrderInput | SortOrder
    ord?: SortOrder
    updatedAt?: SortOrder
    _count?: ConceptCountOrderByAggregateInput
    _avg?: ConceptAvgOrderByAggregateInput
    _max?: ConceptMaxOrderByAggregateInput
    _min?: ConceptMinOrderByAggregateInput
    _sum?: ConceptSumOrderByAggregateInput
  }

  export type ConceptScalarWhereWithAggregatesInput = {
    AND?: ConceptScalarWhereWithAggregatesInput | ConceptScalarWhereWithAggregatesInput[]
    OR?: ConceptScalarWhereWithAggregatesInput[]
    NOT?: ConceptScalarWhereWithAggregatesInput | ConceptScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Concept"> | string
    chapterId?: StringWithAggregatesFilter<"Concept"> | string
    title?: StringWithAggregatesFilter<"Concept"> | string
    summary?: StringWithAggregatesFilter<"Concept"> | string
    versionNote?: StringNullableWithAggregatesFilter<"Concept"> | string | null
    ord?: IntWithAggregatesFilter<"Concept"> | number
    updatedAt?: DateTimeWithAggregatesFilter<"Concept"> | Date | string
  }

  export type ConceptLevelWhereInput = {
    AND?: ConceptLevelWhereInput | ConceptLevelWhereInput[]
    OR?: ConceptLevelWhereInput[]
    NOT?: ConceptLevelWhereInput | ConceptLevelWhereInput[]
    conceptId?: StringFilter<"ConceptLevel"> | string
    level?: EnumLevelFilter<"ConceptLevel"> | $Enums.Level
    body?: StringFilter<"ConceptLevel"> | string
    minutes?: IntFilter<"ConceptLevel"> | number
    concept?: XOR<ConceptScalarRelationFilter, ConceptWhereInput>
  }

  export type ConceptLevelOrderByWithRelationInput = {
    conceptId?: SortOrder
    level?: SortOrder
    body?: SortOrder
    minutes?: SortOrder
    concept?: ConceptOrderByWithRelationInput
    _relevance?: ConceptLevelOrderByRelevanceInput
  }

  export type ConceptLevelWhereUniqueInput = Prisma.AtLeast<{
    conceptId_level?: ConceptLevelConceptIdLevelCompoundUniqueInput
    AND?: ConceptLevelWhereInput | ConceptLevelWhereInput[]
    OR?: ConceptLevelWhereInput[]
    NOT?: ConceptLevelWhereInput | ConceptLevelWhereInput[]
    conceptId?: StringFilter<"ConceptLevel"> | string
    level?: EnumLevelFilter<"ConceptLevel"> | $Enums.Level
    body?: StringFilter<"ConceptLevel"> | string
    minutes?: IntFilter<"ConceptLevel"> | number
    concept?: XOR<ConceptScalarRelationFilter, ConceptWhereInput>
  }, "conceptId_level">

  export type ConceptLevelOrderByWithAggregationInput = {
    conceptId?: SortOrder
    level?: SortOrder
    body?: SortOrder
    minutes?: SortOrder
    _count?: ConceptLevelCountOrderByAggregateInput
    _avg?: ConceptLevelAvgOrderByAggregateInput
    _max?: ConceptLevelMaxOrderByAggregateInput
    _min?: ConceptLevelMinOrderByAggregateInput
    _sum?: ConceptLevelSumOrderByAggregateInput
  }

  export type ConceptLevelScalarWhereWithAggregatesInput = {
    AND?: ConceptLevelScalarWhereWithAggregatesInput | ConceptLevelScalarWhereWithAggregatesInput[]
    OR?: ConceptLevelScalarWhereWithAggregatesInput[]
    NOT?: ConceptLevelScalarWhereWithAggregatesInput | ConceptLevelScalarWhereWithAggregatesInput[]
    conceptId?: StringWithAggregatesFilter<"ConceptLevel"> | string
    level?: EnumLevelWithAggregatesFilter<"ConceptLevel"> | $Enums.Level
    body?: StringWithAggregatesFilter<"ConceptLevel"> | string
    minutes?: IntWithAggregatesFilter<"ConceptLevel"> | number
  }

  export type ConceptSectionWhereInput = {
    AND?: ConceptSectionWhereInput | ConceptSectionWhereInput[]
    OR?: ConceptSectionWhereInput[]
    NOT?: ConceptSectionWhereInput | ConceptSectionWhereInput[]
    conceptId?: StringFilter<"ConceptSection"> | string
    level?: EnumLevelFilter<"ConceptSection"> | $Enums.Level
    ord?: IntFilter<"ConceptSection"> | number
    heading?: StringFilter<"ConceptSection"> | string
    anchor?: StringFilter<"ConceptSection"> | string
    concept?: XOR<ConceptScalarRelationFilter, ConceptWhereInput>
  }

  export type ConceptSectionOrderByWithRelationInput = {
    conceptId?: SortOrder
    level?: SortOrder
    ord?: SortOrder
    heading?: SortOrder
    anchor?: SortOrder
    concept?: ConceptOrderByWithRelationInput
    _relevance?: ConceptSectionOrderByRelevanceInput
  }

  export type ConceptSectionWhereUniqueInput = Prisma.AtLeast<{
    conceptId_level_ord?: ConceptSectionConceptIdLevelOrdCompoundUniqueInput
    AND?: ConceptSectionWhereInput | ConceptSectionWhereInput[]
    OR?: ConceptSectionWhereInput[]
    NOT?: ConceptSectionWhereInput | ConceptSectionWhereInput[]
    conceptId?: StringFilter<"ConceptSection"> | string
    level?: EnumLevelFilter<"ConceptSection"> | $Enums.Level
    ord?: IntFilter<"ConceptSection"> | number
    heading?: StringFilter<"ConceptSection"> | string
    anchor?: StringFilter<"ConceptSection"> | string
    concept?: XOR<ConceptScalarRelationFilter, ConceptWhereInput>
  }, "conceptId_level_ord">

  export type ConceptSectionOrderByWithAggregationInput = {
    conceptId?: SortOrder
    level?: SortOrder
    ord?: SortOrder
    heading?: SortOrder
    anchor?: SortOrder
    _count?: ConceptSectionCountOrderByAggregateInput
    _avg?: ConceptSectionAvgOrderByAggregateInput
    _max?: ConceptSectionMaxOrderByAggregateInput
    _min?: ConceptSectionMinOrderByAggregateInput
    _sum?: ConceptSectionSumOrderByAggregateInput
  }

  export type ConceptSectionScalarWhereWithAggregatesInput = {
    AND?: ConceptSectionScalarWhereWithAggregatesInput | ConceptSectionScalarWhereWithAggregatesInput[]
    OR?: ConceptSectionScalarWhereWithAggregatesInput[]
    NOT?: ConceptSectionScalarWhereWithAggregatesInput | ConceptSectionScalarWhereWithAggregatesInput[]
    conceptId?: StringWithAggregatesFilter<"ConceptSection"> | string
    level?: EnumLevelWithAggregatesFilter<"ConceptSection"> | $Enums.Level
    ord?: IntWithAggregatesFilter<"ConceptSection"> | number
    heading?: StringWithAggregatesFilter<"ConceptSection"> | string
    anchor?: StringWithAggregatesFilter<"ConceptSection"> | string
  }

  export type EdgeWhereInput = {
    AND?: EdgeWhereInput | EdgeWhereInput[]
    OR?: EdgeWhereInput[]
    NOT?: EdgeWhereInput | EdgeWhereInput[]
    fromId?: StringFilter<"Edge"> | string
    toId?: StringFilter<"Edge"> | string
    type?: EnumEdgeTypeFilter<"Edge"> | $Enums.EdgeType
    from?: XOR<ConceptScalarRelationFilter, ConceptWhereInput>
    to?: XOR<ConceptScalarRelationFilter, ConceptWhereInput>
  }

  export type EdgeOrderByWithRelationInput = {
    fromId?: SortOrder
    toId?: SortOrder
    type?: SortOrder
    from?: ConceptOrderByWithRelationInput
    to?: ConceptOrderByWithRelationInput
    _relevance?: EdgeOrderByRelevanceInput
  }

  export type EdgeWhereUniqueInput = Prisma.AtLeast<{
    fromId_toId_type?: EdgeFromIdToIdTypeCompoundUniqueInput
    AND?: EdgeWhereInput | EdgeWhereInput[]
    OR?: EdgeWhereInput[]
    NOT?: EdgeWhereInput | EdgeWhereInput[]
    fromId?: StringFilter<"Edge"> | string
    toId?: StringFilter<"Edge"> | string
    type?: EnumEdgeTypeFilter<"Edge"> | $Enums.EdgeType
    from?: XOR<ConceptScalarRelationFilter, ConceptWhereInput>
    to?: XOR<ConceptScalarRelationFilter, ConceptWhereInput>
  }, "fromId_toId_type">

  export type EdgeOrderByWithAggregationInput = {
    fromId?: SortOrder
    toId?: SortOrder
    type?: SortOrder
    _count?: EdgeCountOrderByAggregateInput
    _max?: EdgeMaxOrderByAggregateInput
    _min?: EdgeMinOrderByAggregateInput
  }

  export type EdgeScalarWhereWithAggregatesInput = {
    AND?: EdgeScalarWhereWithAggregatesInput | EdgeScalarWhereWithAggregatesInput[]
    OR?: EdgeScalarWhereWithAggregatesInput[]
    NOT?: EdgeScalarWhereWithAggregatesInput | EdgeScalarWhereWithAggregatesInput[]
    fromId?: StringWithAggregatesFilter<"Edge"> | string
    toId?: StringWithAggregatesFilter<"Edge"> | string
    type?: EnumEdgeTypeWithAggregatesFilter<"Edge"> | $Enums.EdgeType
  }

  export type ConceptVisualWhereInput = {
    AND?: ConceptVisualWhereInput | ConceptVisualWhereInput[]
    OR?: ConceptVisualWhereInput[]
    NOT?: ConceptVisualWhereInput | ConceptVisualWhereInput[]
    id?: StringFilter<"ConceptVisual"> | string
    conceptId?: StringFilter<"ConceptVisual"> | string
    level?: EnumLevelFilter<"ConceptVisual"> | $Enums.Level
    title?: StringFilter<"ConceptVisual"> | string
    kind?: EnumVisualKindFilter<"ConceptVisual"> | $Enums.VisualKind
    spec?: JsonFilter<"ConceptVisual">
    ord?: IntFilter<"ConceptVisual"> | number
    concept?: XOR<ConceptScalarRelationFilter, ConceptWhereInput>
  }

  export type ConceptVisualOrderByWithRelationInput = {
    id?: SortOrder
    conceptId?: SortOrder
    level?: SortOrder
    title?: SortOrder
    kind?: SortOrder
    spec?: SortOrder
    ord?: SortOrder
    concept?: ConceptOrderByWithRelationInput
    _relevance?: ConceptVisualOrderByRelevanceInput
  }

  export type ConceptVisualWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ConceptVisualWhereInput | ConceptVisualWhereInput[]
    OR?: ConceptVisualWhereInput[]
    NOT?: ConceptVisualWhereInput | ConceptVisualWhereInput[]
    conceptId?: StringFilter<"ConceptVisual"> | string
    level?: EnumLevelFilter<"ConceptVisual"> | $Enums.Level
    title?: StringFilter<"ConceptVisual"> | string
    kind?: EnumVisualKindFilter<"ConceptVisual"> | $Enums.VisualKind
    spec?: JsonFilter<"ConceptVisual">
    ord?: IntFilter<"ConceptVisual"> | number
    concept?: XOR<ConceptScalarRelationFilter, ConceptWhereInput>
  }, "id">

  export type ConceptVisualOrderByWithAggregationInput = {
    id?: SortOrder
    conceptId?: SortOrder
    level?: SortOrder
    title?: SortOrder
    kind?: SortOrder
    spec?: SortOrder
    ord?: SortOrder
    _count?: ConceptVisualCountOrderByAggregateInput
    _avg?: ConceptVisualAvgOrderByAggregateInput
    _max?: ConceptVisualMaxOrderByAggregateInput
    _min?: ConceptVisualMinOrderByAggregateInput
    _sum?: ConceptVisualSumOrderByAggregateInput
  }

  export type ConceptVisualScalarWhereWithAggregatesInput = {
    AND?: ConceptVisualScalarWhereWithAggregatesInput | ConceptVisualScalarWhereWithAggregatesInput[]
    OR?: ConceptVisualScalarWhereWithAggregatesInput[]
    NOT?: ConceptVisualScalarWhereWithAggregatesInput | ConceptVisualScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ConceptVisual"> | string
    conceptId?: StringWithAggregatesFilter<"ConceptVisual"> | string
    level?: EnumLevelWithAggregatesFilter<"ConceptVisual"> | $Enums.Level
    title?: StringWithAggregatesFilter<"ConceptVisual"> | string
    kind?: EnumVisualKindWithAggregatesFilter<"ConceptVisual"> | $Enums.VisualKind
    spec?: JsonWithAggregatesFilter<"ConceptVisual">
    ord?: IntWithAggregatesFilter<"ConceptVisual"> | number
  }

  export type PromptTemplateWhereInput = {
    AND?: PromptTemplateWhereInput | PromptTemplateWhereInput[]
    OR?: PromptTemplateWhereInput[]
    NOT?: PromptTemplateWhereInput | PromptTemplateWhereInput[]
    id?: StringFilter<"PromptTemplate"> | string
    name?: StringFilter<"PromptTemplate"> | string
    body?: StringFilter<"PromptTemplate"> | string
    updatedAt?: DateTimeFilter<"PromptTemplate"> | Date | string
  }

  export type PromptTemplateOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    body?: SortOrder
    updatedAt?: SortOrder
    _relevance?: PromptTemplateOrderByRelevanceInput
  }

  export type PromptTemplateWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PromptTemplateWhereInput | PromptTemplateWhereInput[]
    OR?: PromptTemplateWhereInput[]
    NOT?: PromptTemplateWhereInput | PromptTemplateWhereInput[]
    name?: StringFilter<"PromptTemplate"> | string
    body?: StringFilter<"PromptTemplate"> | string
    updatedAt?: DateTimeFilter<"PromptTemplate"> | Date | string
  }, "id">

  export type PromptTemplateOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    body?: SortOrder
    updatedAt?: SortOrder
    _count?: PromptTemplateCountOrderByAggregateInput
    _max?: PromptTemplateMaxOrderByAggregateInput
    _min?: PromptTemplateMinOrderByAggregateInput
  }

  export type PromptTemplateScalarWhereWithAggregatesInput = {
    AND?: PromptTemplateScalarWhereWithAggregatesInput | PromptTemplateScalarWhereWithAggregatesInput[]
    OR?: PromptTemplateScalarWhereWithAggregatesInput[]
    NOT?: PromptTemplateScalarWhereWithAggregatesInput | PromptTemplateScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PromptTemplate"> | string
    name?: StringWithAggregatesFilter<"PromptTemplate"> | string
    body?: StringWithAggregatesFilter<"PromptTemplate"> | string
    updatedAt?: DateTimeWithAggregatesFilter<"PromptTemplate"> | Date | string
  }

  export type NoteWhereInput = {
    AND?: NoteWhereInput | NoteWhereInput[]
    OR?: NoteWhereInput[]
    NOT?: NoteWhereInput | NoteWhereInput[]
    conceptId?: StringFilter<"Note"> | string
    body?: StringFilter<"Note"> | string
    updatedAt?: DateTimeFilter<"Note"> | Date | string
    concept?: XOR<ConceptScalarRelationFilter, ConceptWhereInput>
  }

  export type NoteOrderByWithRelationInput = {
    conceptId?: SortOrder
    body?: SortOrder
    updatedAt?: SortOrder
    concept?: ConceptOrderByWithRelationInput
    _relevance?: NoteOrderByRelevanceInput
  }

  export type NoteWhereUniqueInput = Prisma.AtLeast<{
    conceptId?: string
    AND?: NoteWhereInput | NoteWhereInput[]
    OR?: NoteWhereInput[]
    NOT?: NoteWhereInput | NoteWhereInput[]
    body?: StringFilter<"Note"> | string
    updatedAt?: DateTimeFilter<"Note"> | Date | string
    concept?: XOR<ConceptScalarRelationFilter, ConceptWhereInput>
  }, "conceptId">

  export type NoteOrderByWithAggregationInput = {
    conceptId?: SortOrder
    body?: SortOrder
    updatedAt?: SortOrder
    _count?: NoteCountOrderByAggregateInput
    _max?: NoteMaxOrderByAggregateInput
    _min?: NoteMinOrderByAggregateInput
  }

  export type NoteScalarWhereWithAggregatesInput = {
    AND?: NoteScalarWhereWithAggregatesInput | NoteScalarWhereWithAggregatesInput[]
    OR?: NoteScalarWhereWithAggregatesInput[]
    NOT?: NoteScalarWhereWithAggregatesInput | NoteScalarWhereWithAggregatesInput[]
    conceptId?: StringWithAggregatesFilter<"Note"> | string
    body?: StringWithAggregatesFilter<"Note"> | string
    updatedAt?: DateTimeWithAggregatesFilter<"Note"> | Date | string
  }

  export type SourceWhereInput = {
    AND?: SourceWhereInput | SourceWhereInput[]
    OR?: SourceWhereInput[]
    NOT?: SourceWhereInput | SourceWhereInput[]
    id?: BigIntFilter<"Source"> | bigint | number
    conceptId?: StringFilter<"Source"> | string
    label?: StringFilter<"Source"> | string
    url?: StringFilter<"Source"> | string
    concept?: XOR<ConceptScalarRelationFilter, ConceptWhereInput>
  }

  export type SourceOrderByWithRelationInput = {
    id?: SortOrder
    conceptId?: SortOrder
    label?: SortOrder
    url?: SortOrder
    concept?: ConceptOrderByWithRelationInput
    _relevance?: SourceOrderByRelevanceInput
  }

  export type SourceWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number
    AND?: SourceWhereInput | SourceWhereInput[]
    OR?: SourceWhereInput[]
    NOT?: SourceWhereInput | SourceWhereInput[]
    conceptId?: StringFilter<"Source"> | string
    label?: StringFilter<"Source"> | string
    url?: StringFilter<"Source"> | string
    concept?: XOR<ConceptScalarRelationFilter, ConceptWhereInput>
  }, "id">

  export type SourceOrderByWithAggregationInput = {
    id?: SortOrder
    conceptId?: SortOrder
    label?: SortOrder
    url?: SortOrder
    _count?: SourceCountOrderByAggregateInput
    _avg?: SourceAvgOrderByAggregateInput
    _max?: SourceMaxOrderByAggregateInput
    _min?: SourceMinOrderByAggregateInput
    _sum?: SourceSumOrderByAggregateInput
  }

  export type SourceScalarWhereWithAggregatesInput = {
    AND?: SourceScalarWhereWithAggregatesInput | SourceScalarWhereWithAggregatesInput[]
    OR?: SourceScalarWhereWithAggregatesInput[]
    NOT?: SourceScalarWhereWithAggregatesInput | SourceScalarWhereWithAggregatesInput[]
    id?: BigIntWithAggregatesFilter<"Source"> | bigint | number
    conceptId?: StringWithAggregatesFilter<"Source"> | string
    label?: StringWithAggregatesFilter<"Source"> | string
    url?: StringWithAggregatesFilter<"Source"> | string
  }

  export type TrackCreateInput = {
    id: string
    title: string
    ord: number
    chapters?: ChapterCreateNestedManyWithoutTrackInput
  }

  export type TrackUncheckedCreateInput = {
    id: string
    title: string
    ord: number
    chapters?: ChapterUncheckedCreateNestedManyWithoutTrackInput
  }

  export type TrackUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    ord?: IntFieldUpdateOperationsInput | number
    chapters?: ChapterUpdateManyWithoutTrackNestedInput
  }

  export type TrackUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    ord?: IntFieldUpdateOperationsInput | number
    chapters?: ChapterUncheckedUpdateManyWithoutTrackNestedInput
  }

  export type TrackCreateManyInput = {
    id: string
    title: string
    ord: number
  }

  export type TrackUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    ord?: IntFieldUpdateOperationsInput | number
  }

  export type TrackUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    ord?: IntFieldUpdateOperationsInput | number
  }

  export type ChapterCreateInput = {
    id: string
    title: string
    summary: string
    ord: number
    track: TrackCreateNestedOneWithoutChaptersInput
    concepts?: ConceptCreateNestedManyWithoutChapterInput
  }

  export type ChapterUncheckedCreateInput = {
    id: string
    trackId: string
    title: string
    summary: string
    ord: number
    concepts?: ConceptUncheckedCreateNestedManyWithoutChapterInput
  }

  export type ChapterUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    ord?: IntFieldUpdateOperationsInput | number
    track?: TrackUpdateOneRequiredWithoutChaptersNestedInput
    concepts?: ConceptUpdateManyWithoutChapterNestedInput
  }

  export type ChapterUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    trackId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    ord?: IntFieldUpdateOperationsInput | number
    concepts?: ConceptUncheckedUpdateManyWithoutChapterNestedInput
  }

  export type ChapterCreateManyInput = {
    id: string
    trackId: string
    title: string
    summary: string
    ord: number
  }

  export type ChapterUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    ord?: IntFieldUpdateOperationsInput | number
  }

  export type ChapterUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    trackId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    ord?: IntFieldUpdateOperationsInput | number
  }

  export type ConceptCreateInput = {
    id: string
    title: string
    summary: string
    versionNote?: string | null
    ord: number
    updatedAt: Date | string
    chapter: ChapterCreateNestedOneWithoutConceptsInput
    levels?: ConceptLevelCreateNestedManyWithoutConceptInput
    sections?: ConceptSectionCreateNestedManyWithoutConceptInput
    visuals?: ConceptVisualCreateNestedManyWithoutConceptInput
    sources?: SourceCreateNestedManyWithoutConceptInput
    note?: NoteCreateNestedOneWithoutConceptInput
    edgesOut?: EdgeCreateNestedManyWithoutFromInput
    edgesIn?: EdgeCreateNestedManyWithoutToInput
  }

  export type ConceptUncheckedCreateInput = {
    id: string
    chapterId: string
    title: string
    summary: string
    versionNote?: string | null
    ord: number
    updatedAt: Date | string
    levels?: ConceptLevelUncheckedCreateNestedManyWithoutConceptInput
    sections?: ConceptSectionUncheckedCreateNestedManyWithoutConceptInput
    visuals?: ConceptVisualUncheckedCreateNestedManyWithoutConceptInput
    sources?: SourceUncheckedCreateNestedManyWithoutConceptInput
    note?: NoteUncheckedCreateNestedOneWithoutConceptInput
    edgesOut?: EdgeUncheckedCreateNestedManyWithoutFromInput
    edgesIn?: EdgeUncheckedCreateNestedManyWithoutToInput
  }

  export type ConceptUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    versionNote?: NullableStringFieldUpdateOperationsInput | string | null
    ord?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chapter?: ChapterUpdateOneRequiredWithoutConceptsNestedInput
    levels?: ConceptLevelUpdateManyWithoutConceptNestedInput
    sections?: ConceptSectionUpdateManyWithoutConceptNestedInput
    visuals?: ConceptVisualUpdateManyWithoutConceptNestedInput
    sources?: SourceUpdateManyWithoutConceptNestedInput
    note?: NoteUpdateOneWithoutConceptNestedInput
    edgesOut?: EdgeUpdateManyWithoutFromNestedInput
    edgesIn?: EdgeUpdateManyWithoutToNestedInput
  }

  export type ConceptUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    chapterId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    versionNote?: NullableStringFieldUpdateOperationsInput | string | null
    ord?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    levels?: ConceptLevelUncheckedUpdateManyWithoutConceptNestedInput
    sections?: ConceptSectionUncheckedUpdateManyWithoutConceptNestedInput
    visuals?: ConceptVisualUncheckedUpdateManyWithoutConceptNestedInput
    sources?: SourceUncheckedUpdateManyWithoutConceptNestedInput
    note?: NoteUncheckedUpdateOneWithoutConceptNestedInput
    edgesOut?: EdgeUncheckedUpdateManyWithoutFromNestedInput
    edgesIn?: EdgeUncheckedUpdateManyWithoutToNestedInput
  }

  export type ConceptCreateManyInput = {
    id: string
    chapterId: string
    title: string
    summary: string
    versionNote?: string | null
    ord: number
    updatedAt: Date | string
  }

  export type ConceptUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    versionNote?: NullableStringFieldUpdateOperationsInput | string | null
    ord?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConceptUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    chapterId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    versionNote?: NullableStringFieldUpdateOperationsInput | string | null
    ord?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConceptLevelCreateInput = {
    level: $Enums.Level
    body: string
    minutes: number
    concept: ConceptCreateNestedOneWithoutLevelsInput
  }

  export type ConceptLevelUncheckedCreateInput = {
    conceptId: string
    level: $Enums.Level
    body: string
    minutes: number
  }

  export type ConceptLevelUpdateInput = {
    level?: EnumLevelFieldUpdateOperationsInput | $Enums.Level
    body?: StringFieldUpdateOperationsInput | string
    minutes?: IntFieldUpdateOperationsInput | number
    concept?: ConceptUpdateOneRequiredWithoutLevelsNestedInput
  }

  export type ConceptLevelUncheckedUpdateInput = {
    conceptId?: StringFieldUpdateOperationsInput | string
    level?: EnumLevelFieldUpdateOperationsInput | $Enums.Level
    body?: StringFieldUpdateOperationsInput | string
    minutes?: IntFieldUpdateOperationsInput | number
  }

  export type ConceptLevelCreateManyInput = {
    conceptId: string
    level: $Enums.Level
    body: string
    minutes: number
  }

  export type ConceptLevelUpdateManyMutationInput = {
    level?: EnumLevelFieldUpdateOperationsInput | $Enums.Level
    body?: StringFieldUpdateOperationsInput | string
    minutes?: IntFieldUpdateOperationsInput | number
  }

  export type ConceptLevelUncheckedUpdateManyInput = {
    conceptId?: StringFieldUpdateOperationsInput | string
    level?: EnumLevelFieldUpdateOperationsInput | $Enums.Level
    body?: StringFieldUpdateOperationsInput | string
    minutes?: IntFieldUpdateOperationsInput | number
  }

  export type ConceptSectionCreateInput = {
    level: $Enums.Level
    ord: number
    heading: string
    anchor: string
    concept: ConceptCreateNestedOneWithoutSectionsInput
  }

  export type ConceptSectionUncheckedCreateInput = {
    conceptId: string
    level: $Enums.Level
    ord: number
    heading: string
    anchor: string
  }

  export type ConceptSectionUpdateInput = {
    level?: EnumLevelFieldUpdateOperationsInput | $Enums.Level
    ord?: IntFieldUpdateOperationsInput | number
    heading?: StringFieldUpdateOperationsInput | string
    anchor?: StringFieldUpdateOperationsInput | string
    concept?: ConceptUpdateOneRequiredWithoutSectionsNestedInput
  }

  export type ConceptSectionUncheckedUpdateInput = {
    conceptId?: StringFieldUpdateOperationsInput | string
    level?: EnumLevelFieldUpdateOperationsInput | $Enums.Level
    ord?: IntFieldUpdateOperationsInput | number
    heading?: StringFieldUpdateOperationsInput | string
    anchor?: StringFieldUpdateOperationsInput | string
  }

  export type ConceptSectionCreateManyInput = {
    conceptId: string
    level: $Enums.Level
    ord: number
    heading: string
    anchor: string
  }

  export type ConceptSectionUpdateManyMutationInput = {
    level?: EnumLevelFieldUpdateOperationsInput | $Enums.Level
    ord?: IntFieldUpdateOperationsInput | number
    heading?: StringFieldUpdateOperationsInput | string
    anchor?: StringFieldUpdateOperationsInput | string
  }

  export type ConceptSectionUncheckedUpdateManyInput = {
    conceptId?: StringFieldUpdateOperationsInput | string
    level?: EnumLevelFieldUpdateOperationsInput | $Enums.Level
    ord?: IntFieldUpdateOperationsInput | number
    heading?: StringFieldUpdateOperationsInput | string
    anchor?: StringFieldUpdateOperationsInput | string
  }

  export type EdgeCreateInput = {
    type: $Enums.EdgeType
    from: ConceptCreateNestedOneWithoutEdgesOutInput
    to: ConceptCreateNestedOneWithoutEdgesInInput
  }

  export type EdgeUncheckedCreateInput = {
    fromId: string
    toId: string
    type: $Enums.EdgeType
  }

  export type EdgeUpdateInput = {
    type?: EnumEdgeTypeFieldUpdateOperationsInput | $Enums.EdgeType
    from?: ConceptUpdateOneRequiredWithoutEdgesOutNestedInput
    to?: ConceptUpdateOneRequiredWithoutEdgesInNestedInput
  }

  export type EdgeUncheckedUpdateInput = {
    fromId?: StringFieldUpdateOperationsInput | string
    toId?: StringFieldUpdateOperationsInput | string
    type?: EnumEdgeTypeFieldUpdateOperationsInput | $Enums.EdgeType
  }

  export type EdgeCreateManyInput = {
    fromId: string
    toId: string
    type: $Enums.EdgeType
  }

  export type EdgeUpdateManyMutationInput = {
    type?: EnumEdgeTypeFieldUpdateOperationsInput | $Enums.EdgeType
  }

  export type EdgeUncheckedUpdateManyInput = {
    fromId?: StringFieldUpdateOperationsInput | string
    toId?: StringFieldUpdateOperationsInput | string
    type?: EnumEdgeTypeFieldUpdateOperationsInput | $Enums.EdgeType
  }

  export type ConceptVisualCreateInput = {
    id: string
    level: $Enums.Level
    title: string
    kind: $Enums.VisualKind
    spec: JsonNullValueInput | InputJsonValue
    ord: number
    concept: ConceptCreateNestedOneWithoutVisualsInput
  }

  export type ConceptVisualUncheckedCreateInput = {
    id: string
    conceptId: string
    level: $Enums.Level
    title: string
    kind: $Enums.VisualKind
    spec: JsonNullValueInput | InputJsonValue
    ord: number
  }

  export type ConceptVisualUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    level?: EnumLevelFieldUpdateOperationsInput | $Enums.Level
    title?: StringFieldUpdateOperationsInput | string
    kind?: EnumVisualKindFieldUpdateOperationsInput | $Enums.VisualKind
    spec?: JsonNullValueInput | InputJsonValue
    ord?: IntFieldUpdateOperationsInput | number
    concept?: ConceptUpdateOneRequiredWithoutVisualsNestedInput
  }

  export type ConceptVisualUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    conceptId?: StringFieldUpdateOperationsInput | string
    level?: EnumLevelFieldUpdateOperationsInput | $Enums.Level
    title?: StringFieldUpdateOperationsInput | string
    kind?: EnumVisualKindFieldUpdateOperationsInput | $Enums.VisualKind
    spec?: JsonNullValueInput | InputJsonValue
    ord?: IntFieldUpdateOperationsInput | number
  }

  export type ConceptVisualCreateManyInput = {
    id: string
    conceptId: string
    level: $Enums.Level
    title: string
    kind: $Enums.VisualKind
    spec: JsonNullValueInput | InputJsonValue
    ord: number
  }

  export type ConceptVisualUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    level?: EnumLevelFieldUpdateOperationsInput | $Enums.Level
    title?: StringFieldUpdateOperationsInput | string
    kind?: EnumVisualKindFieldUpdateOperationsInput | $Enums.VisualKind
    spec?: JsonNullValueInput | InputJsonValue
    ord?: IntFieldUpdateOperationsInput | number
  }

  export type ConceptVisualUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    conceptId?: StringFieldUpdateOperationsInput | string
    level?: EnumLevelFieldUpdateOperationsInput | $Enums.Level
    title?: StringFieldUpdateOperationsInput | string
    kind?: EnumVisualKindFieldUpdateOperationsInput | $Enums.VisualKind
    spec?: JsonNullValueInput | InputJsonValue
    ord?: IntFieldUpdateOperationsInput | number
  }

  export type PromptTemplateCreateInput = {
    id: string
    name: string
    body: string
    updatedAt: Date | string
  }

  export type PromptTemplateUncheckedCreateInput = {
    id: string
    name: string
    body: string
    updatedAt: Date | string
  }

  export type PromptTemplateUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PromptTemplateUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PromptTemplateCreateManyInput = {
    id: string
    name: string
    body: string
    updatedAt: Date | string
  }

  export type PromptTemplateUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PromptTemplateUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NoteCreateInput = {
    body: string
    updatedAt: Date | string
    concept: ConceptCreateNestedOneWithoutNoteInput
  }

  export type NoteUncheckedCreateInput = {
    conceptId: string
    body: string
    updatedAt: Date | string
  }

  export type NoteUpdateInput = {
    body?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    concept?: ConceptUpdateOneRequiredWithoutNoteNestedInput
  }

  export type NoteUncheckedUpdateInput = {
    conceptId?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NoteCreateManyInput = {
    conceptId: string
    body: string
    updatedAt: Date | string
  }

  export type NoteUpdateManyMutationInput = {
    body?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NoteUncheckedUpdateManyInput = {
    conceptId?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SourceCreateInput = {
    id?: bigint | number
    label: string
    url: string
    concept: ConceptCreateNestedOneWithoutSourcesInput
  }

  export type SourceUncheckedCreateInput = {
    id?: bigint | number
    conceptId: string
    label: string
    url: string
  }

  export type SourceUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    label?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    concept?: ConceptUpdateOneRequiredWithoutSourcesNestedInput
  }

  export type SourceUncheckedUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    conceptId?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
  }

  export type SourceCreateManyInput = {
    id?: bigint | number
    conceptId: string
    label: string
    url: string
  }

  export type SourceUpdateManyMutationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    label?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
  }

  export type SourceUncheckedUpdateManyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    conceptId?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type ChapterListRelationFilter = {
    every?: ChapterWhereInput
    some?: ChapterWhereInput
    none?: ChapterWhereInput
  }

  export type ChapterOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TrackOrderByRelevanceInput = {
    fields: TrackOrderByRelevanceFieldEnum | TrackOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type TrackCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    ord?: SortOrder
  }

  export type TrackAvgOrderByAggregateInput = {
    ord?: SortOrder
  }

  export type TrackMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    ord?: SortOrder
  }

  export type TrackMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    ord?: SortOrder
  }

  export type TrackSumOrderByAggregateInput = {
    ord?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type TrackScalarRelationFilter = {
    is?: TrackWhereInput
    isNot?: TrackWhereInput
  }

  export type ConceptListRelationFilter = {
    every?: ConceptWhereInput
    some?: ConceptWhereInput
    none?: ConceptWhereInput
  }

  export type ConceptOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ChapterOrderByRelevanceInput = {
    fields: ChapterOrderByRelevanceFieldEnum | ChapterOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type ChapterCountOrderByAggregateInput = {
    id?: SortOrder
    trackId?: SortOrder
    title?: SortOrder
    summary?: SortOrder
    ord?: SortOrder
  }

  export type ChapterAvgOrderByAggregateInput = {
    ord?: SortOrder
  }

  export type ChapterMaxOrderByAggregateInput = {
    id?: SortOrder
    trackId?: SortOrder
    title?: SortOrder
    summary?: SortOrder
    ord?: SortOrder
  }

  export type ChapterMinOrderByAggregateInput = {
    id?: SortOrder
    trackId?: SortOrder
    title?: SortOrder
    summary?: SortOrder
    ord?: SortOrder
  }

  export type ChapterSumOrderByAggregateInput = {
    ord?: SortOrder
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type ChapterScalarRelationFilter = {
    is?: ChapterWhereInput
    isNot?: ChapterWhereInput
  }

  export type ConceptLevelListRelationFilter = {
    every?: ConceptLevelWhereInput
    some?: ConceptLevelWhereInput
    none?: ConceptLevelWhereInput
  }

  export type ConceptSectionListRelationFilter = {
    every?: ConceptSectionWhereInput
    some?: ConceptSectionWhereInput
    none?: ConceptSectionWhereInput
  }

  export type ConceptVisualListRelationFilter = {
    every?: ConceptVisualWhereInput
    some?: ConceptVisualWhereInput
    none?: ConceptVisualWhereInput
  }

  export type SourceListRelationFilter = {
    every?: SourceWhereInput
    some?: SourceWhereInput
    none?: SourceWhereInput
  }

  export type NoteNullableScalarRelationFilter = {
    is?: NoteWhereInput | null
    isNot?: NoteWhereInput | null
  }

  export type EdgeListRelationFilter = {
    every?: EdgeWhereInput
    some?: EdgeWhereInput
    none?: EdgeWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ConceptLevelOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ConceptSectionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ConceptVisualOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SourceOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type EdgeOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ConceptOrderByRelevanceInput = {
    fields: ConceptOrderByRelevanceFieldEnum | ConceptOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type ConceptCountOrderByAggregateInput = {
    id?: SortOrder
    chapterId?: SortOrder
    title?: SortOrder
    summary?: SortOrder
    versionNote?: SortOrder
    ord?: SortOrder
    updatedAt?: SortOrder
  }

  export type ConceptAvgOrderByAggregateInput = {
    ord?: SortOrder
  }

  export type ConceptMaxOrderByAggregateInput = {
    id?: SortOrder
    chapterId?: SortOrder
    title?: SortOrder
    summary?: SortOrder
    versionNote?: SortOrder
    ord?: SortOrder
    updatedAt?: SortOrder
  }

  export type ConceptMinOrderByAggregateInput = {
    id?: SortOrder
    chapterId?: SortOrder
    title?: SortOrder
    summary?: SortOrder
    versionNote?: SortOrder
    ord?: SortOrder
    updatedAt?: SortOrder
  }

  export type ConceptSumOrderByAggregateInput = {
    ord?: SortOrder
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumLevelFilter<$PrismaModel = never> = {
    equals?: $Enums.Level | EnumLevelFieldRefInput<$PrismaModel>
    in?: $Enums.Level[]
    notIn?: $Enums.Level[]
    not?: NestedEnumLevelFilter<$PrismaModel> | $Enums.Level
  }

  export type ConceptScalarRelationFilter = {
    is?: ConceptWhereInput
    isNot?: ConceptWhereInput
  }

  export type ConceptLevelOrderByRelevanceInput = {
    fields: ConceptLevelOrderByRelevanceFieldEnum | ConceptLevelOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type ConceptLevelConceptIdLevelCompoundUniqueInput = {
    conceptId: string
    level: $Enums.Level
  }

  export type ConceptLevelCountOrderByAggregateInput = {
    conceptId?: SortOrder
    level?: SortOrder
    body?: SortOrder
    minutes?: SortOrder
  }

  export type ConceptLevelAvgOrderByAggregateInput = {
    minutes?: SortOrder
  }

  export type ConceptLevelMaxOrderByAggregateInput = {
    conceptId?: SortOrder
    level?: SortOrder
    body?: SortOrder
    minutes?: SortOrder
  }

  export type ConceptLevelMinOrderByAggregateInput = {
    conceptId?: SortOrder
    level?: SortOrder
    body?: SortOrder
    minutes?: SortOrder
  }

  export type ConceptLevelSumOrderByAggregateInput = {
    minutes?: SortOrder
  }

  export type EnumLevelWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Level | EnumLevelFieldRefInput<$PrismaModel>
    in?: $Enums.Level[]
    notIn?: $Enums.Level[]
    not?: NestedEnumLevelWithAggregatesFilter<$PrismaModel> | $Enums.Level
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLevelFilter<$PrismaModel>
    _max?: NestedEnumLevelFilter<$PrismaModel>
  }

  export type ConceptSectionOrderByRelevanceInput = {
    fields: ConceptSectionOrderByRelevanceFieldEnum | ConceptSectionOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type ConceptSectionConceptIdLevelOrdCompoundUniqueInput = {
    conceptId: string
    level: $Enums.Level
    ord: number
  }

  export type ConceptSectionCountOrderByAggregateInput = {
    conceptId?: SortOrder
    level?: SortOrder
    ord?: SortOrder
    heading?: SortOrder
    anchor?: SortOrder
  }

  export type ConceptSectionAvgOrderByAggregateInput = {
    ord?: SortOrder
  }

  export type ConceptSectionMaxOrderByAggregateInput = {
    conceptId?: SortOrder
    level?: SortOrder
    ord?: SortOrder
    heading?: SortOrder
    anchor?: SortOrder
  }

  export type ConceptSectionMinOrderByAggregateInput = {
    conceptId?: SortOrder
    level?: SortOrder
    ord?: SortOrder
    heading?: SortOrder
    anchor?: SortOrder
  }

  export type ConceptSectionSumOrderByAggregateInput = {
    ord?: SortOrder
  }

  export type EnumEdgeTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.EdgeType | EnumEdgeTypeFieldRefInput<$PrismaModel>
    in?: $Enums.EdgeType[]
    notIn?: $Enums.EdgeType[]
    not?: NestedEnumEdgeTypeFilter<$PrismaModel> | $Enums.EdgeType
  }

  export type EdgeOrderByRelevanceInput = {
    fields: EdgeOrderByRelevanceFieldEnum | EdgeOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type EdgeFromIdToIdTypeCompoundUniqueInput = {
    fromId: string
    toId: string
    type: $Enums.EdgeType
  }

  export type EdgeCountOrderByAggregateInput = {
    fromId?: SortOrder
    toId?: SortOrder
    type?: SortOrder
  }

  export type EdgeMaxOrderByAggregateInput = {
    fromId?: SortOrder
    toId?: SortOrder
    type?: SortOrder
  }

  export type EdgeMinOrderByAggregateInput = {
    fromId?: SortOrder
    toId?: SortOrder
    type?: SortOrder
  }

  export type EnumEdgeTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.EdgeType | EnumEdgeTypeFieldRefInput<$PrismaModel>
    in?: $Enums.EdgeType[]
    notIn?: $Enums.EdgeType[]
    not?: NestedEnumEdgeTypeWithAggregatesFilter<$PrismaModel> | $Enums.EdgeType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumEdgeTypeFilter<$PrismaModel>
    _max?: NestedEnumEdgeTypeFilter<$PrismaModel>
  }

  export type EnumVisualKindFilter<$PrismaModel = never> = {
    equals?: $Enums.VisualKind | EnumVisualKindFieldRefInput<$PrismaModel>
    in?: $Enums.VisualKind[]
    notIn?: $Enums.VisualKind[]
    not?: NestedEnumVisualKindFilter<$PrismaModel> | $Enums.VisualKind
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue
    lte?: InputJsonValue
    gt?: InputJsonValue
    gte?: InputJsonValue
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type ConceptVisualOrderByRelevanceInput = {
    fields: ConceptVisualOrderByRelevanceFieldEnum | ConceptVisualOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type ConceptVisualCountOrderByAggregateInput = {
    id?: SortOrder
    conceptId?: SortOrder
    level?: SortOrder
    title?: SortOrder
    kind?: SortOrder
    spec?: SortOrder
    ord?: SortOrder
  }

  export type ConceptVisualAvgOrderByAggregateInput = {
    ord?: SortOrder
  }

  export type ConceptVisualMaxOrderByAggregateInput = {
    id?: SortOrder
    conceptId?: SortOrder
    level?: SortOrder
    title?: SortOrder
    kind?: SortOrder
    ord?: SortOrder
  }

  export type ConceptVisualMinOrderByAggregateInput = {
    id?: SortOrder
    conceptId?: SortOrder
    level?: SortOrder
    title?: SortOrder
    kind?: SortOrder
    ord?: SortOrder
  }

  export type ConceptVisualSumOrderByAggregateInput = {
    ord?: SortOrder
  }

  export type EnumVisualKindWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.VisualKind | EnumVisualKindFieldRefInput<$PrismaModel>
    in?: $Enums.VisualKind[]
    notIn?: $Enums.VisualKind[]
    not?: NestedEnumVisualKindWithAggregatesFilter<$PrismaModel> | $Enums.VisualKind
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumVisualKindFilter<$PrismaModel>
    _max?: NestedEnumVisualKindFilter<$PrismaModel>
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue
    lte?: InputJsonValue
    gt?: InputJsonValue
    gte?: InputJsonValue
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type PromptTemplateOrderByRelevanceInput = {
    fields: PromptTemplateOrderByRelevanceFieldEnum | PromptTemplateOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type PromptTemplateCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    body?: SortOrder
    updatedAt?: SortOrder
  }

  export type PromptTemplateMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    body?: SortOrder
    updatedAt?: SortOrder
  }

  export type PromptTemplateMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    body?: SortOrder
    updatedAt?: SortOrder
  }

  export type NoteOrderByRelevanceInput = {
    fields: NoteOrderByRelevanceFieldEnum | NoteOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type NoteCountOrderByAggregateInput = {
    conceptId?: SortOrder
    body?: SortOrder
    updatedAt?: SortOrder
  }

  export type NoteMaxOrderByAggregateInput = {
    conceptId?: SortOrder
    body?: SortOrder
    updatedAt?: SortOrder
  }

  export type NoteMinOrderByAggregateInput = {
    conceptId?: SortOrder
    body?: SortOrder
    updatedAt?: SortOrder
  }

  export type BigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[]
    notIn?: bigint[] | number[]
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type SourceOrderByRelevanceInput = {
    fields: SourceOrderByRelevanceFieldEnum | SourceOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type SourceCountOrderByAggregateInput = {
    id?: SortOrder
    conceptId?: SortOrder
    label?: SortOrder
    url?: SortOrder
  }

  export type SourceAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type SourceMaxOrderByAggregateInput = {
    id?: SortOrder
    conceptId?: SortOrder
    label?: SortOrder
    url?: SortOrder
  }

  export type SourceMinOrderByAggregateInput = {
    id?: SortOrder
    conceptId?: SortOrder
    label?: SortOrder
    url?: SortOrder
  }

  export type SourceSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type BigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[]
    notIn?: bigint[] | number[]
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type ChapterCreateNestedManyWithoutTrackInput = {
    create?: XOR<ChapterCreateWithoutTrackInput, ChapterUncheckedCreateWithoutTrackInput> | ChapterCreateWithoutTrackInput[] | ChapterUncheckedCreateWithoutTrackInput[]
    connectOrCreate?: ChapterCreateOrConnectWithoutTrackInput | ChapterCreateOrConnectWithoutTrackInput[]
    createMany?: ChapterCreateManyTrackInputEnvelope
    connect?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
  }

  export type ChapterUncheckedCreateNestedManyWithoutTrackInput = {
    create?: XOR<ChapterCreateWithoutTrackInput, ChapterUncheckedCreateWithoutTrackInput> | ChapterCreateWithoutTrackInput[] | ChapterUncheckedCreateWithoutTrackInput[]
    connectOrCreate?: ChapterCreateOrConnectWithoutTrackInput | ChapterCreateOrConnectWithoutTrackInput[]
    createMany?: ChapterCreateManyTrackInputEnvelope
    connect?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ChapterUpdateManyWithoutTrackNestedInput = {
    create?: XOR<ChapterCreateWithoutTrackInput, ChapterUncheckedCreateWithoutTrackInput> | ChapterCreateWithoutTrackInput[] | ChapterUncheckedCreateWithoutTrackInput[]
    connectOrCreate?: ChapterCreateOrConnectWithoutTrackInput | ChapterCreateOrConnectWithoutTrackInput[]
    upsert?: ChapterUpsertWithWhereUniqueWithoutTrackInput | ChapterUpsertWithWhereUniqueWithoutTrackInput[]
    createMany?: ChapterCreateManyTrackInputEnvelope
    set?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    disconnect?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    delete?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    connect?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    update?: ChapterUpdateWithWhereUniqueWithoutTrackInput | ChapterUpdateWithWhereUniqueWithoutTrackInput[]
    updateMany?: ChapterUpdateManyWithWhereWithoutTrackInput | ChapterUpdateManyWithWhereWithoutTrackInput[]
    deleteMany?: ChapterScalarWhereInput | ChapterScalarWhereInput[]
  }

  export type ChapterUncheckedUpdateManyWithoutTrackNestedInput = {
    create?: XOR<ChapterCreateWithoutTrackInput, ChapterUncheckedCreateWithoutTrackInput> | ChapterCreateWithoutTrackInput[] | ChapterUncheckedCreateWithoutTrackInput[]
    connectOrCreate?: ChapterCreateOrConnectWithoutTrackInput | ChapterCreateOrConnectWithoutTrackInput[]
    upsert?: ChapterUpsertWithWhereUniqueWithoutTrackInput | ChapterUpsertWithWhereUniqueWithoutTrackInput[]
    createMany?: ChapterCreateManyTrackInputEnvelope
    set?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    disconnect?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    delete?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    connect?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    update?: ChapterUpdateWithWhereUniqueWithoutTrackInput | ChapterUpdateWithWhereUniqueWithoutTrackInput[]
    updateMany?: ChapterUpdateManyWithWhereWithoutTrackInput | ChapterUpdateManyWithWhereWithoutTrackInput[]
    deleteMany?: ChapterScalarWhereInput | ChapterScalarWhereInput[]
  }

  export type TrackCreateNestedOneWithoutChaptersInput = {
    create?: XOR<TrackCreateWithoutChaptersInput, TrackUncheckedCreateWithoutChaptersInput>
    connectOrCreate?: TrackCreateOrConnectWithoutChaptersInput
    connect?: TrackWhereUniqueInput
  }

  export type ConceptCreateNestedManyWithoutChapterInput = {
    create?: XOR<ConceptCreateWithoutChapterInput, ConceptUncheckedCreateWithoutChapterInput> | ConceptCreateWithoutChapterInput[] | ConceptUncheckedCreateWithoutChapterInput[]
    connectOrCreate?: ConceptCreateOrConnectWithoutChapterInput | ConceptCreateOrConnectWithoutChapterInput[]
    createMany?: ConceptCreateManyChapterInputEnvelope
    connect?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
  }

  export type ConceptUncheckedCreateNestedManyWithoutChapterInput = {
    create?: XOR<ConceptCreateWithoutChapterInput, ConceptUncheckedCreateWithoutChapterInput> | ConceptCreateWithoutChapterInput[] | ConceptUncheckedCreateWithoutChapterInput[]
    connectOrCreate?: ConceptCreateOrConnectWithoutChapterInput | ConceptCreateOrConnectWithoutChapterInput[]
    createMany?: ConceptCreateManyChapterInputEnvelope
    connect?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
  }

  export type TrackUpdateOneRequiredWithoutChaptersNestedInput = {
    create?: XOR<TrackCreateWithoutChaptersInput, TrackUncheckedCreateWithoutChaptersInput>
    connectOrCreate?: TrackCreateOrConnectWithoutChaptersInput
    upsert?: TrackUpsertWithoutChaptersInput
    connect?: TrackWhereUniqueInput
    update?: XOR<XOR<TrackUpdateToOneWithWhereWithoutChaptersInput, TrackUpdateWithoutChaptersInput>, TrackUncheckedUpdateWithoutChaptersInput>
  }

  export type ConceptUpdateManyWithoutChapterNestedInput = {
    create?: XOR<ConceptCreateWithoutChapterInput, ConceptUncheckedCreateWithoutChapterInput> | ConceptCreateWithoutChapterInput[] | ConceptUncheckedCreateWithoutChapterInput[]
    connectOrCreate?: ConceptCreateOrConnectWithoutChapterInput | ConceptCreateOrConnectWithoutChapterInput[]
    upsert?: ConceptUpsertWithWhereUniqueWithoutChapterInput | ConceptUpsertWithWhereUniqueWithoutChapterInput[]
    createMany?: ConceptCreateManyChapterInputEnvelope
    set?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    disconnect?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    delete?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    connect?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    update?: ConceptUpdateWithWhereUniqueWithoutChapterInput | ConceptUpdateWithWhereUniqueWithoutChapterInput[]
    updateMany?: ConceptUpdateManyWithWhereWithoutChapterInput | ConceptUpdateManyWithWhereWithoutChapterInput[]
    deleteMany?: ConceptScalarWhereInput | ConceptScalarWhereInput[]
  }

  export type ConceptUncheckedUpdateManyWithoutChapterNestedInput = {
    create?: XOR<ConceptCreateWithoutChapterInput, ConceptUncheckedCreateWithoutChapterInput> | ConceptCreateWithoutChapterInput[] | ConceptUncheckedCreateWithoutChapterInput[]
    connectOrCreate?: ConceptCreateOrConnectWithoutChapterInput | ConceptCreateOrConnectWithoutChapterInput[]
    upsert?: ConceptUpsertWithWhereUniqueWithoutChapterInput | ConceptUpsertWithWhereUniqueWithoutChapterInput[]
    createMany?: ConceptCreateManyChapterInputEnvelope
    set?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    disconnect?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    delete?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    connect?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    update?: ConceptUpdateWithWhereUniqueWithoutChapterInput | ConceptUpdateWithWhereUniqueWithoutChapterInput[]
    updateMany?: ConceptUpdateManyWithWhereWithoutChapterInput | ConceptUpdateManyWithWhereWithoutChapterInput[]
    deleteMany?: ConceptScalarWhereInput | ConceptScalarWhereInput[]
  }

  export type ChapterCreateNestedOneWithoutConceptsInput = {
    create?: XOR<ChapterCreateWithoutConceptsInput, ChapterUncheckedCreateWithoutConceptsInput>
    connectOrCreate?: ChapterCreateOrConnectWithoutConceptsInput
    connect?: ChapterWhereUniqueInput
  }

  export type ConceptLevelCreateNestedManyWithoutConceptInput = {
    create?: XOR<ConceptLevelCreateWithoutConceptInput, ConceptLevelUncheckedCreateWithoutConceptInput> | ConceptLevelCreateWithoutConceptInput[] | ConceptLevelUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: ConceptLevelCreateOrConnectWithoutConceptInput | ConceptLevelCreateOrConnectWithoutConceptInput[]
    createMany?: ConceptLevelCreateManyConceptInputEnvelope
    connect?: ConceptLevelWhereUniqueInput | ConceptLevelWhereUniqueInput[]
  }

  export type ConceptSectionCreateNestedManyWithoutConceptInput = {
    create?: XOR<ConceptSectionCreateWithoutConceptInput, ConceptSectionUncheckedCreateWithoutConceptInput> | ConceptSectionCreateWithoutConceptInput[] | ConceptSectionUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: ConceptSectionCreateOrConnectWithoutConceptInput | ConceptSectionCreateOrConnectWithoutConceptInput[]
    createMany?: ConceptSectionCreateManyConceptInputEnvelope
    connect?: ConceptSectionWhereUniqueInput | ConceptSectionWhereUniqueInput[]
  }

  export type ConceptVisualCreateNestedManyWithoutConceptInput = {
    create?: XOR<ConceptVisualCreateWithoutConceptInput, ConceptVisualUncheckedCreateWithoutConceptInput> | ConceptVisualCreateWithoutConceptInput[] | ConceptVisualUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: ConceptVisualCreateOrConnectWithoutConceptInput | ConceptVisualCreateOrConnectWithoutConceptInput[]
    createMany?: ConceptVisualCreateManyConceptInputEnvelope
    connect?: ConceptVisualWhereUniqueInput | ConceptVisualWhereUniqueInput[]
  }

  export type SourceCreateNestedManyWithoutConceptInput = {
    create?: XOR<SourceCreateWithoutConceptInput, SourceUncheckedCreateWithoutConceptInput> | SourceCreateWithoutConceptInput[] | SourceUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: SourceCreateOrConnectWithoutConceptInput | SourceCreateOrConnectWithoutConceptInput[]
    createMany?: SourceCreateManyConceptInputEnvelope
    connect?: SourceWhereUniqueInput | SourceWhereUniqueInput[]
  }

  export type NoteCreateNestedOneWithoutConceptInput = {
    create?: XOR<NoteCreateWithoutConceptInput, NoteUncheckedCreateWithoutConceptInput>
    connectOrCreate?: NoteCreateOrConnectWithoutConceptInput
    connect?: NoteWhereUniqueInput
  }

  export type EdgeCreateNestedManyWithoutFromInput = {
    create?: XOR<EdgeCreateWithoutFromInput, EdgeUncheckedCreateWithoutFromInput> | EdgeCreateWithoutFromInput[] | EdgeUncheckedCreateWithoutFromInput[]
    connectOrCreate?: EdgeCreateOrConnectWithoutFromInput | EdgeCreateOrConnectWithoutFromInput[]
    createMany?: EdgeCreateManyFromInputEnvelope
    connect?: EdgeWhereUniqueInput | EdgeWhereUniqueInput[]
  }

  export type EdgeCreateNestedManyWithoutToInput = {
    create?: XOR<EdgeCreateWithoutToInput, EdgeUncheckedCreateWithoutToInput> | EdgeCreateWithoutToInput[] | EdgeUncheckedCreateWithoutToInput[]
    connectOrCreate?: EdgeCreateOrConnectWithoutToInput | EdgeCreateOrConnectWithoutToInput[]
    createMany?: EdgeCreateManyToInputEnvelope
    connect?: EdgeWhereUniqueInput | EdgeWhereUniqueInput[]
  }

  export type ConceptLevelUncheckedCreateNestedManyWithoutConceptInput = {
    create?: XOR<ConceptLevelCreateWithoutConceptInput, ConceptLevelUncheckedCreateWithoutConceptInput> | ConceptLevelCreateWithoutConceptInput[] | ConceptLevelUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: ConceptLevelCreateOrConnectWithoutConceptInput | ConceptLevelCreateOrConnectWithoutConceptInput[]
    createMany?: ConceptLevelCreateManyConceptInputEnvelope
    connect?: ConceptLevelWhereUniqueInput | ConceptLevelWhereUniqueInput[]
  }

  export type ConceptSectionUncheckedCreateNestedManyWithoutConceptInput = {
    create?: XOR<ConceptSectionCreateWithoutConceptInput, ConceptSectionUncheckedCreateWithoutConceptInput> | ConceptSectionCreateWithoutConceptInput[] | ConceptSectionUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: ConceptSectionCreateOrConnectWithoutConceptInput | ConceptSectionCreateOrConnectWithoutConceptInput[]
    createMany?: ConceptSectionCreateManyConceptInputEnvelope
    connect?: ConceptSectionWhereUniqueInput | ConceptSectionWhereUniqueInput[]
  }

  export type ConceptVisualUncheckedCreateNestedManyWithoutConceptInput = {
    create?: XOR<ConceptVisualCreateWithoutConceptInput, ConceptVisualUncheckedCreateWithoutConceptInput> | ConceptVisualCreateWithoutConceptInput[] | ConceptVisualUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: ConceptVisualCreateOrConnectWithoutConceptInput | ConceptVisualCreateOrConnectWithoutConceptInput[]
    createMany?: ConceptVisualCreateManyConceptInputEnvelope
    connect?: ConceptVisualWhereUniqueInput | ConceptVisualWhereUniqueInput[]
  }

  export type SourceUncheckedCreateNestedManyWithoutConceptInput = {
    create?: XOR<SourceCreateWithoutConceptInput, SourceUncheckedCreateWithoutConceptInput> | SourceCreateWithoutConceptInput[] | SourceUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: SourceCreateOrConnectWithoutConceptInput | SourceCreateOrConnectWithoutConceptInput[]
    createMany?: SourceCreateManyConceptInputEnvelope
    connect?: SourceWhereUniqueInput | SourceWhereUniqueInput[]
  }

  export type NoteUncheckedCreateNestedOneWithoutConceptInput = {
    create?: XOR<NoteCreateWithoutConceptInput, NoteUncheckedCreateWithoutConceptInput>
    connectOrCreate?: NoteCreateOrConnectWithoutConceptInput
    connect?: NoteWhereUniqueInput
  }

  export type EdgeUncheckedCreateNestedManyWithoutFromInput = {
    create?: XOR<EdgeCreateWithoutFromInput, EdgeUncheckedCreateWithoutFromInput> | EdgeCreateWithoutFromInput[] | EdgeUncheckedCreateWithoutFromInput[]
    connectOrCreate?: EdgeCreateOrConnectWithoutFromInput | EdgeCreateOrConnectWithoutFromInput[]
    createMany?: EdgeCreateManyFromInputEnvelope
    connect?: EdgeWhereUniqueInput | EdgeWhereUniqueInput[]
  }

  export type EdgeUncheckedCreateNestedManyWithoutToInput = {
    create?: XOR<EdgeCreateWithoutToInput, EdgeUncheckedCreateWithoutToInput> | EdgeCreateWithoutToInput[] | EdgeUncheckedCreateWithoutToInput[]
    connectOrCreate?: EdgeCreateOrConnectWithoutToInput | EdgeCreateOrConnectWithoutToInput[]
    createMany?: EdgeCreateManyToInputEnvelope
    connect?: EdgeWhereUniqueInput | EdgeWhereUniqueInput[]
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type ChapterUpdateOneRequiredWithoutConceptsNestedInput = {
    create?: XOR<ChapterCreateWithoutConceptsInput, ChapterUncheckedCreateWithoutConceptsInput>
    connectOrCreate?: ChapterCreateOrConnectWithoutConceptsInput
    upsert?: ChapterUpsertWithoutConceptsInput
    connect?: ChapterWhereUniqueInput
    update?: XOR<XOR<ChapterUpdateToOneWithWhereWithoutConceptsInput, ChapterUpdateWithoutConceptsInput>, ChapterUncheckedUpdateWithoutConceptsInput>
  }

  export type ConceptLevelUpdateManyWithoutConceptNestedInput = {
    create?: XOR<ConceptLevelCreateWithoutConceptInput, ConceptLevelUncheckedCreateWithoutConceptInput> | ConceptLevelCreateWithoutConceptInput[] | ConceptLevelUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: ConceptLevelCreateOrConnectWithoutConceptInput | ConceptLevelCreateOrConnectWithoutConceptInput[]
    upsert?: ConceptLevelUpsertWithWhereUniqueWithoutConceptInput | ConceptLevelUpsertWithWhereUniqueWithoutConceptInput[]
    createMany?: ConceptLevelCreateManyConceptInputEnvelope
    set?: ConceptLevelWhereUniqueInput | ConceptLevelWhereUniqueInput[]
    disconnect?: ConceptLevelWhereUniqueInput | ConceptLevelWhereUniqueInput[]
    delete?: ConceptLevelWhereUniqueInput | ConceptLevelWhereUniqueInput[]
    connect?: ConceptLevelWhereUniqueInput | ConceptLevelWhereUniqueInput[]
    update?: ConceptLevelUpdateWithWhereUniqueWithoutConceptInput | ConceptLevelUpdateWithWhereUniqueWithoutConceptInput[]
    updateMany?: ConceptLevelUpdateManyWithWhereWithoutConceptInput | ConceptLevelUpdateManyWithWhereWithoutConceptInput[]
    deleteMany?: ConceptLevelScalarWhereInput | ConceptLevelScalarWhereInput[]
  }

  export type ConceptSectionUpdateManyWithoutConceptNestedInput = {
    create?: XOR<ConceptSectionCreateWithoutConceptInput, ConceptSectionUncheckedCreateWithoutConceptInput> | ConceptSectionCreateWithoutConceptInput[] | ConceptSectionUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: ConceptSectionCreateOrConnectWithoutConceptInput | ConceptSectionCreateOrConnectWithoutConceptInput[]
    upsert?: ConceptSectionUpsertWithWhereUniqueWithoutConceptInput | ConceptSectionUpsertWithWhereUniqueWithoutConceptInput[]
    createMany?: ConceptSectionCreateManyConceptInputEnvelope
    set?: ConceptSectionWhereUniqueInput | ConceptSectionWhereUniqueInput[]
    disconnect?: ConceptSectionWhereUniqueInput | ConceptSectionWhereUniqueInput[]
    delete?: ConceptSectionWhereUniqueInput | ConceptSectionWhereUniqueInput[]
    connect?: ConceptSectionWhereUniqueInput | ConceptSectionWhereUniqueInput[]
    update?: ConceptSectionUpdateWithWhereUniqueWithoutConceptInput | ConceptSectionUpdateWithWhereUniqueWithoutConceptInput[]
    updateMany?: ConceptSectionUpdateManyWithWhereWithoutConceptInput | ConceptSectionUpdateManyWithWhereWithoutConceptInput[]
    deleteMany?: ConceptSectionScalarWhereInput | ConceptSectionScalarWhereInput[]
  }

  export type ConceptVisualUpdateManyWithoutConceptNestedInput = {
    create?: XOR<ConceptVisualCreateWithoutConceptInput, ConceptVisualUncheckedCreateWithoutConceptInput> | ConceptVisualCreateWithoutConceptInput[] | ConceptVisualUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: ConceptVisualCreateOrConnectWithoutConceptInput | ConceptVisualCreateOrConnectWithoutConceptInput[]
    upsert?: ConceptVisualUpsertWithWhereUniqueWithoutConceptInput | ConceptVisualUpsertWithWhereUniqueWithoutConceptInput[]
    createMany?: ConceptVisualCreateManyConceptInputEnvelope
    set?: ConceptVisualWhereUniqueInput | ConceptVisualWhereUniqueInput[]
    disconnect?: ConceptVisualWhereUniqueInput | ConceptVisualWhereUniqueInput[]
    delete?: ConceptVisualWhereUniqueInput | ConceptVisualWhereUniqueInput[]
    connect?: ConceptVisualWhereUniqueInput | ConceptVisualWhereUniqueInput[]
    update?: ConceptVisualUpdateWithWhereUniqueWithoutConceptInput | ConceptVisualUpdateWithWhereUniqueWithoutConceptInput[]
    updateMany?: ConceptVisualUpdateManyWithWhereWithoutConceptInput | ConceptVisualUpdateManyWithWhereWithoutConceptInput[]
    deleteMany?: ConceptVisualScalarWhereInput | ConceptVisualScalarWhereInput[]
  }

  export type SourceUpdateManyWithoutConceptNestedInput = {
    create?: XOR<SourceCreateWithoutConceptInput, SourceUncheckedCreateWithoutConceptInput> | SourceCreateWithoutConceptInput[] | SourceUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: SourceCreateOrConnectWithoutConceptInput | SourceCreateOrConnectWithoutConceptInput[]
    upsert?: SourceUpsertWithWhereUniqueWithoutConceptInput | SourceUpsertWithWhereUniqueWithoutConceptInput[]
    createMany?: SourceCreateManyConceptInputEnvelope
    set?: SourceWhereUniqueInput | SourceWhereUniqueInput[]
    disconnect?: SourceWhereUniqueInput | SourceWhereUniqueInput[]
    delete?: SourceWhereUniqueInput | SourceWhereUniqueInput[]
    connect?: SourceWhereUniqueInput | SourceWhereUniqueInput[]
    update?: SourceUpdateWithWhereUniqueWithoutConceptInput | SourceUpdateWithWhereUniqueWithoutConceptInput[]
    updateMany?: SourceUpdateManyWithWhereWithoutConceptInput | SourceUpdateManyWithWhereWithoutConceptInput[]
    deleteMany?: SourceScalarWhereInput | SourceScalarWhereInput[]
  }

  export type NoteUpdateOneWithoutConceptNestedInput = {
    create?: XOR<NoteCreateWithoutConceptInput, NoteUncheckedCreateWithoutConceptInput>
    connectOrCreate?: NoteCreateOrConnectWithoutConceptInput
    upsert?: NoteUpsertWithoutConceptInput
    disconnect?: NoteWhereInput | boolean
    delete?: NoteWhereInput | boolean
    connect?: NoteWhereUniqueInput
    update?: XOR<XOR<NoteUpdateToOneWithWhereWithoutConceptInput, NoteUpdateWithoutConceptInput>, NoteUncheckedUpdateWithoutConceptInput>
  }

  export type EdgeUpdateManyWithoutFromNestedInput = {
    create?: XOR<EdgeCreateWithoutFromInput, EdgeUncheckedCreateWithoutFromInput> | EdgeCreateWithoutFromInput[] | EdgeUncheckedCreateWithoutFromInput[]
    connectOrCreate?: EdgeCreateOrConnectWithoutFromInput | EdgeCreateOrConnectWithoutFromInput[]
    upsert?: EdgeUpsertWithWhereUniqueWithoutFromInput | EdgeUpsertWithWhereUniqueWithoutFromInput[]
    createMany?: EdgeCreateManyFromInputEnvelope
    set?: EdgeWhereUniqueInput | EdgeWhereUniqueInput[]
    disconnect?: EdgeWhereUniqueInput | EdgeWhereUniqueInput[]
    delete?: EdgeWhereUniqueInput | EdgeWhereUniqueInput[]
    connect?: EdgeWhereUniqueInput | EdgeWhereUniqueInput[]
    update?: EdgeUpdateWithWhereUniqueWithoutFromInput | EdgeUpdateWithWhereUniqueWithoutFromInput[]
    updateMany?: EdgeUpdateManyWithWhereWithoutFromInput | EdgeUpdateManyWithWhereWithoutFromInput[]
    deleteMany?: EdgeScalarWhereInput | EdgeScalarWhereInput[]
  }

  export type EdgeUpdateManyWithoutToNestedInput = {
    create?: XOR<EdgeCreateWithoutToInput, EdgeUncheckedCreateWithoutToInput> | EdgeCreateWithoutToInput[] | EdgeUncheckedCreateWithoutToInput[]
    connectOrCreate?: EdgeCreateOrConnectWithoutToInput | EdgeCreateOrConnectWithoutToInput[]
    upsert?: EdgeUpsertWithWhereUniqueWithoutToInput | EdgeUpsertWithWhereUniqueWithoutToInput[]
    createMany?: EdgeCreateManyToInputEnvelope
    set?: EdgeWhereUniqueInput | EdgeWhereUniqueInput[]
    disconnect?: EdgeWhereUniqueInput | EdgeWhereUniqueInput[]
    delete?: EdgeWhereUniqueInput | EdgeWhereUniqueInput[]
    connect?: EdgeWhereUniqueInput | EdgeWhereUniqueInput[]
    update?: EdgeUpdateWithWhereUniqueWithoutToInput | EdgeUpdateWithWhereUniqueWithoutToInput[]
    updateMany?: EdgeUpdateManyWithWhereWithoutToInput | EdgeUpdateManyWithWhereWithoutToInput[]
    deleteMany?: EdgeScalarWhereInput | EdgeScalarWhereInput[]
  }

  export type ConceptLevelUncheckedUpdateManyWithoutConceptNestedInput = {
    create?: XOR<ConceptLevelCreateWithoutConceptInput, ConceptLevelUncheckedCreateWithoutConceptInput> | ConceptLevelCreateWithoutConceptInput[] | ConceptLevelUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: ConceptLevelCreateOrConnectWithoutConceptInput | ConceptLevelCreateOrConnectWithoutConceptInput[]
    upsert?: ConceptLevelUpsertWithWhereUniqueWithoutConceptInput | ConceptLevelUpsertWithWhereUniqueWithoutConceptInput[]
    createMany?: ConceptLevelCreateManyConceptInputEnvelope
    set?: ConceptLevelWhereUniqueInput | ConceptLevelWhereUniqueInput[]
    disconnect?: ConceptLevelWhereUniqueInput | ConceptLevelWhereUniqueInput[]
    delete?: ConceptLevelWhereUniqueInput | ConceptLevelWhereUniqueInput[]
    connect?: ConceptLevelWhereUniqueInput | ConceptLevelWhereUniqueInput[]
    update?: ConceptLevelUpdateWithWhereUniqueWithoutConceptInput | ConceptLevelUpdateWithWhereUniqueWithoutConceptInput[]
    updateMany?: ConceptLevelUpdateManyWithWhereWithoutConceptInput | ConceptLevelUpdateManyWithWhereWithoutConceptInput[]
    deleteMany?: ConceptLevelScalarWhereInput | ConceptLevelScalarWhereInput[]
  }

  export type ConceptSectionUncheckedUpdateManyWithoutConceptNestedInput = {
    create?: XOR<ConceptSectionCreateWithoutConceptInput, ConceptSectionUncheckedCreateWithoutConceptInput> | ConceptSectionCreateWithoutConceptInput[] | ConceptSectionUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: ConceptSectionCreateOrConnectWithoutConceptInput | ConceptSectionCreateOrConnectWithoutConceptInput[]
    upsert?: ConceptSectionUpsertWithWhereUniqueWithoutConceptInput | ConceptSectionUpsertWithWhereUniqueWithoutConceptInput[]
    createMany?: ConceptSectionCreateManyConceptInputEnvelope
    set?: ConceptSectionWhereUniqueInput | ConceptSectionWhereUniqueInput[]
    disconnect?: ConceptSectionWhereUniqueInput | ConceptSectionWhereUniqueInput[]
    delete?: ConceptSectionWhereUniqueInput | ConceptSectionWhereUniqueInput[]
    connect?: ConceptSectionWhereUniqueInput | ConceptSectionWhereUniqueInput[]
    update?: ConceptSectionUpdateWithWhereUniqueWithoutConceptInput | ConceptSectionUpdateWithWhereUniqueWithoutConceptInput[]
    updateMany?: ConceptSectionUpdateManyWithWhereWithoutConceptInput | ConceptSectionUpdateManyWithWhereWithoutConceptInput[]
    deleteMany?: ConceptSectionScalarWhereInput | ConceptSectionScalarWhereInput[]
  }

  export type ConceptVisualUncheckedUpdateManyWithoutConceptNestedInput = {
    create?: XOR<ConceptVisualCreateWithoutConceptInput, ConceptVisualUncheckedCreateWithoutConceptInput> | ConceptVisualCreateWithoutConceptInput[] | ConceptVisualUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: ConceptVisualCreateOrConnectWithoutConceptInput | ConceptVisualCreateOrConnectWithoutConceptInput[]
    upsert?: ConceptVisualUpsertWithWhereUniqueWithoutConceptInput | ConceptVisualUpsertWithWhereUniqueWithoutConceptInput[]
    createMany?: ConceptVisualCreateManyConceptInputEnvelope
    set?: ConceptVisualWhereUniqueInput | ConceptVisualWhereUniqueInput[]
    disconnect?: ConceptVisualWhereUniqueInput | ConceptVisualWhereUniqueInput[]
    delete?: ConceptVisualWhereUniqueInput | ConceptVisualWhereUniqueInput[]
    connect?: ConceptVisualWhereUniqueInput | ConceptVisualWhereUniqueInput[]
    update?: ConceptVisualUpdateWithWhereUniqueWithoutConceptInput | ConceptVisualUpdateWithWhereUniqueWithoutConceptInput[]
    updateMany?: ConceptVisualUpdateManyWithWhereWithoutConceptInput | ConceptVisualUpdateManyWithWhereWithoutConceptInput[]
    deleteMany?: ConceptVisualScalarWhereInput | ConceptVisualScalarWhereInput[]
  }

  export type SourceUncheckedUpdateManyWithoutConceptNestedInput = {
    create?: XOR<SourceCreateWithoutConceptInput, SourceUncheckedCreateWithoutConceptInput> | SourceCreateWithoutConceptInput[] | SourceUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: SourceCreateOrConnectWithoutConceptInput | SourceCreateOrConnectWithoutConceptInput[]
    upsert?: SourceUpsertWithWhereUniqueWithoutConceptInput | SourceUpsertWithWhereUniqueWithoutConceptInput[]
    createMany?: SourceCreateManyConceptInputEnvelope
    set?: SourceWhereUniqueInput | SourceWhereUniqueInput[]
    disconnect?: SourceWhereUniqueInput | SourceWhereUniqueInput[]
    delete?: SourceWhereUniqueInput | SourceWhereUniqueInput[]
    connect?: SourceWhereUniqueInput | SourceWhereUniqueInput[]
    update?: SourceUpdateWithWhereUniqueWithoutConceptInput | SourceUpdateWithWhereUniqueWithoutConceptInput[]
    updateMany?: SourceUpdateManyWithWhereWithoutConceptInput | SourceUpdateManyWithWhereWithoutConceptInput[]
    deleteMany?: SourceScalarWhereInput | SourceScalarWhereInput[]
  }

  export type NoteUncheckedUpdateOneWithoutConceptNestedInput = {
    create?: XOR<NoteCreateWithoutConceptInput, NoteUncheckedCreateWithoutConceptInput>
    connectOrCreate?: NoteCreateOrConnectWithoutConceptInput
    upsert?: NoteUpsertWithoutConceptInput
    disconnect?: NoteWhereInput | boolean
    delete?: NoteWhereInput | boolean
    connect?: NoteWhereUniqueInput
    update?: XOR<XOR<NoteUpdateToOneWithWhereWithoutConceptInput, NoteUpdateWithoutConceptInput>, NoteUncheckedUpdateWithoutConceptInput>
  }

  export type EdgeUncheckedUpdateManyWithoutFromNestedInput = {
    create?: XOR<EdgeCreateWithoutFromInput, EdgeUncheckedCreateWithoutFromInput> | EdgeCreateWithoutFromInput[] | EdgeUncheckedCreateWithoutFromInput[]
    connectOrCreate?: EdgeCreateOrConnectWithoutFromInput | EdgeCreateOrConnectWithoutFromInput[]
    upsert?: EdgeUpsertWithWhereUniqueWithoutFromInput | EdgeUpsertWithWhereUniqueWithoutFromInput[]
    createMany?: EdgeCreateManyFromInputEnvelope
    set?: EdgeWhereUniqueInput | EdgeWhereUniqueInput[]
    disconnect?: EdgeWhereUniqueInput | EdgeWhereUniqueInput[]
    delete?: EdgeWhereUniqueInput | EdgeWhereUniqueInput[]
    connect?: EdgeWhereUniqueInput | EdgeWhereUniqueInput[]
    update?: EdgeUpdateWithWhereUniqueWithoutFromInput | EdgeUpdateWithWhereUniqueWithoutFromInput[]
    updateMany?: EdgeUpdateManyWithWhereWithoutFromInput | EdgeUpdateManyWithWhereWithoutFromInput[]
    deleteMany?: EdgeScalarWhereInput | EdgeScalarWhereInput[]
  }

  export type EdgeUncheckedUpdateManyWithoutToNestedInput = {
    create?: XOR<EdgeCreateWithoutToInput, EdgeUncheckedCreateWithoutToInput> | EdgeCreateWithoutToInput[] | EdgeUncheckedCreateWithoutToInput[]
    connectOrCreate?: EdgeCreateOrConnectWithoutToInput | EdgeCreateOrConnectWithoutToInput[]
    upsert?: EdgeUpsertWithWhereUniqueWithoutToInput | EdgeUpsertWithWhereUniqueWithoutToInput[]
    createMany?: EdgeCreateManyToInputEnvelope
    set?: EdgeWhereUniqueInput | EdgeWhereUniqueInput[]
    disconnect?: EdgeWhereUniqueInput | EdgeWhereUniqueInput[]
    delete?: EdgeWhereUniqueInput | EdgeWhereUniqueInput[]
    connect?: EdgeWhereUniqueInput | EdgeWhereUniqueInput[]
    update?: EdgeUpdateWithWhereUniqueWithoutToInput | EdgeUpdateWithWhereUniqueWithoutToInput[]
    updateMany?: EdgeUpdateManyWithWhereWithoutToInput | EdgeUpdateManyWithWhereWithoutToInput[]
    deleteMany?: EdgeScalarWhereInput | EdgeScalarWhereInput[]
  }

  export type ConceptCreateNestedOneWithoutLevelsInput = {
    create?: XOR<ConceptCreateWithoutLevelsInput, ConceptUncheckedCreateWithoutLevelsInput>
    connectOrCreate?: ConceptCreateOrConnectWithoutLevelsInput
    connect?: ConceptWhereUniqueInput
  }

  export type EnumLevelFieldUpdateOperationsInput = {
    set?: $Enums.Level
  }

  export type ConceptUpdateOneRequiredWithoutLevelsNestedInput = {
    create?: XOR<ConceptCreateWithoutLevelsInput, ConceptUncheckedCreateWithoutLevelsInput>
    connectOrCreate?: ConceptCreateOrConnectWithoutLevelsInput
    upsert?: ConceptUpsertWithoutLevelsInput
    connect?: ConceptWhereUniqueInput
    update?: XOR<XOR<ConceptUpdateToOneWithWhereWithoutLevelsInput, ConceptUpdateWithoutLevelsInput>, ConceptUncheckedUpdateWithoutLevelsInput>
  }

  export type ConceptCreateNestedOneWithoutSectionsInput = {
    create?: XOR<ConceptCreateWithoutSectionsInput, ConceptUncheckedCreateWithoutSectionsInput>
    connectOrCreate?: ConceptCreateOrConnectWithoutSectionsInput
    connect?: ConceptWhereUniqueInput
  }

  export type ConceptUpdateOneRequiredWithoutSectionsNestedInput = {
    create?: XOR<ConceptCreateWithoutSectionsInput, ConceptUncheckedCreateWithoutSectionsInput>
    connectOrCreate?: ConceptCreateOrConnectWithoutSectionsInput
    upsert?: ConceptUpsertWithoutSectionsInput
    connect?: ConceptWhereUniqueInput
    update?: XOR<XOR<ConceptUpdateToOneWithWhereWithoutSectionsInput, ConceptUpdateWithoutSectionsInput>, ConceptUncheckedUpdateWithoutSectionsInput>
  }

  export type ConceptCreateNestedOneWithoutEdgesOutInput = {
    create?: XOR<ConceptCreateWithoutEdgesOutInput, ConceptUncheckedCreateWithoutEdgesOutInput>
    connectOrCreate?: ConceptCreateOrConnectWithoutEdgesOutInput
    connect?: ConceptWhereUniqueInput
  }

  export type ConceptCreateNestedOneWithoutEdgesInInput = {
    create?: XOR<ConceptCreateWithoutEdgesInInput, ConceptUncheckedCreateWithoutEdgesInInput>
    connectOrCreate?: ConceptCreateOrConnectWithoutEdgesInInput
    connect?: ConceptWhereUniqueInput
  }

  export type EnumEdgeTypeFieldUpdateOperationsInput = {
    set?: $Enums.EdgeType
  }

  export type ConceptUpdateOneRequiredWithoutEdgesOutNestedInput = {
    create?: XOR<ConceptCreateWithoutEdgesOutInput, ConceptUncheckedCreateWithoutEdgesOutInput>
    connectOrCreate?: ConceptCreateOrConnectWithoutEdgesOutInput
    upsert?: ConceptUpsertWithoutEdgesOutInput
    connect?: ConceptWhereUniqueInput
    update?: XOR<XOR<ConceptUpdateToOneWithWhereWithoutEdgesOutInput, ConceptUpdateWithoutEdgesOutInput>, ConceptUncheckedUpdateWithoutEdgesOutInput>
  }

  export type ConceptUpdateOneRequiredWithoutEdgesInNestedInput = {
    create?: XOR<ConceptCreateWithoutEdgesInInput, ConceptUncheckedCreateWithoutEdgesInInput>
    connectOrCreate?: ConceptCreateOrConnectWithoutEdgesInInput
    upsert?: ConceptUpsertWithoutEdgesInInput
    connect?: ConceptWhereUniqueInput
    update?: XOR<XOR<ConceptUpdateToOneWithWhereWithoutEdgesInInput, ConceptUpdateWithoutEdgesInInput>, ConceptUncheckedUpdateWithoutEdgesInInput>
  }

  export type ConceptCreateNestedOneWithoutVisualsInput = {
    create?: XOR<ConceptCreateWithoutVisualsInput, ConceptUncheckedCreateWithoutVisualsInput>
    connectOrCreate?: ConceptCreateOrConnectWithoutVisualsInput
    connect?: ConceptWhereUniqueInput
  }

  export type EnumVisualKindFieldUpdateOperationsInput = {
    set?: $Enums.VisualKind
  }

  export type ConceptUpdateOneRequiredWithoutVisualsNestedInput = {
    create?: XOR<ConceptCreateWithoutVisualsInput, ConceptUncheckedCreateWithoutVisualsInput>
    connectOrCreate?: ConceptCreateOrConnectWithoutVisualsInput
    upsert?: ConceptUpsertWithoutVisualsInput
    connect?: ConceptWhereUniqueInput
    update?: XOR<XOR<ConceptUpdateToOneWithWhereWithoutVisualsInput, ConceptUpdateWithoutVisualsInput>, ConceptUncheckedUpdateWithoutVisualsInput>
  }

  export type ConceptCreateNestedOneWithoutNoteInput = {
    create?: XOR<ConceptCreateWithoutNoteInput, ConceptUncheckedCreateWithoutNoteInput>
    connectOrCreate?: ConceptCreateOrConnectWithoutNoteInput
    connect?: ConceptWhereUniqueInput
  }

  export type ConceptUpdateOneRequiredWithoutNoteNestedInput = {
    create?: XOR<ConceptCreateWithoutNoteInput, ConceptUncheckedCreateWithoutNoteInput>
    connectOrCreate?: ConceptCreateOrConnectWithoutNoteInput
    upsert?: ConceptUpsertWithoutNoteInput
    connect?: ConceptWhereUniqueInput
    update?: XOR<XOR<ConceptUpdateToOneWithWhereWithoutNoteInput, ConceptUpdateWithoutNoteInput>, ConceptUncheckedUpdateWithoutNoteInput>
  }

  export type ConceptCreateNestedOneWithoutSourcesInput = {
    create?: XOR<ConceptCreateWithoutSourcesInput, ConceptUncheckedCreateWithoutSourcesInput>
    connectOrCreate?: ConceptCreateOrConnectWithoutSourcesInput
    connect?: ConceptWhereUniqueInput
  }

  export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type ConceptUpdateOneRequiredWithoutSourcesNestedInput = {
    create?: XOR<ConceptCreateWithoutSourcesInput, ConceptUncheckedCreateWithoutSourcesInput>
    connectOrCreate?: ConceptCreateOrConnectWithoutSourcesInput
    upsert?: ConceptUpsertWithoutSourcesInput
    connect?: ConceptWhereUniqueInput
    update?: XOR<XOR<ConceptUpdateToOneWithWhereWithoutSourcesInput, ConceptUpdateWithoutSourcesInput>, ConceptUncheckedUpdateWithoutSourcesInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumLevelFilter<$PrismaModel = never> = {
    equals?: $Enums.Level | EnumLevelFieldRefInput<$PrismaModel>
    in?: $Enums.Level[]
    notIn?: $Enums.Level[]
    not?: NestedEnumLevelFilter<$PrismaModel> | $Enums.Level
  }

  export type NestedEnumLevelWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Level | EnumLevelFieldRefInput<$PrismaModel>
    in?: $Enums.Level[]
    notIn?: $Enums.Level[]
    not?: NestedEnumLevelWithAggregatesFilter<$PrismaModel> | $Enums.Level
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLevelFilter<$PrismaModel>
    _max?: NestedEnumLevelFilter<$PrismaModel>
  }

  export type NestedEnumEdgeTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.EdgeType | EnumEdgeTypeFieldRefInput<$PrismaModel>
    in?: $Enums.EdgeType[]
    notIn?: $Enums.EdgeType[]
    not?: NestedEnumEdgeTypeFilter<$PrismaModel> | $Enums.EdgeType
  }

  export type NestedEnumEdgeTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.EdgeType | EnumEdgeTypeFieldRefInput<$PrismaModel>
    in?: $Enums.EdgeType[]
    notIn?: $Enums.EdgeType[]
    not?: NestedEnumEdgeTypeWithAggregatesFilter<$PrismaModel> | $Enums.EdgeType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumEdgeTypeFilter<$PrismaModel>
    _max?: NestedEnumEdgeTypeFilter<$PrismaModel>
  }

  export type NestedEnumVisualKindFilter<$PrismaModel = never> = {
    equals?: $Enums.VisualKind | EnumVisualKindFieldRefInput<$PrismaModel>
    in?: $Enums.VisualKind[]
    notIn?: $Enums.VisualKind[]
    not?: NestedEnumVisualKindFilter<$PrismaModel> | $Enums.VisualKind
  }

  export type NestedEnumVisualKindWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.VisualKind | EnumVisualKindFieldRefInput<$PrismaModel>
    in?: $Enums.VisualKind[]
    notIn?: $Enums.VisualKind[]
    not?: NestedEnumVisualKindWithAggregatesFilter<$PrismaModel> | $Enums.VisualKind
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumVisualKindFilter<$PrismaModel>
    _max?: NestedEnumVisualKindFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue
    lte?: InputJsonValue
    gt?: InputJsonValue
    gte?: InputJsonValue
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedBigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[]
    notIn?: bigint[] | number[]
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type NestedBigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[]
    notIn?: bigint[] | number[]
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type ChapterCreateWithoutTrackInput = {
    id: string
    title: string
    summary: string
    ord: number
    concepts?: ConceptCreateNestedManyWithoutChapterInput
  }

  export type ChapterUncheckedCreateWithoutTrackInput = {
    id: string
    title: string
    summary: string
    ord: number
    concepts?: ConceptUncheckedCreateNestedManyWithoutChapterInput
  }

  export type ChapterCreateOrConnectWithoutTrackInput = {
    where: ChapterWhereUniqueInput
    create: XOR<ChapterCreateWithoutTrackInput, ChapterUncheckedCreateWithoutTrackInput>
  }

  export type ChapterCreateManyTrackInputEnvelope = {
    data: ChapterCreateManyTrackInput | ChapterCreateManyTrackInput[]
    skipDuplicates?: boolean
  }

  export type ChapterUpsertWithWhereUniqueWithoutTrackInput = {
    where: ChapterWhereUniqueInput
    update: XOR<ChapterUpdateWithoutTrackInput, ChapterUncheckedUpdateWithoutTrackInput>
    create: XOR<ChapterCreateWithoutTrackInput, ChapterUncheckedCreateWithoutTrackInput>
  }

  export type ChapterUpdateWithWhereUniqueWithoutTrackInput = {
    where: ChapterWhereUniqueInput
    data: XOR<ChapterUpdateWithoutTrackInput, ChapterUncheckedUpdateWithoutTrackInput>
  }

  export type ChapterUpdateManyWithWhereWithoutTrackInput = {
    where: ChapterScalarWhereInput
    data: XOR<ChapterUpdateManyMutationInput, ChapterUncheckedUpdateManyWithoutTrackInput>
  }

  export type ChapterScalarWhereInput = {
    AND?: ChapterScalarWhereInput | ChapterScalarWhereInput[]
    OR?: ChapterScalarWhereInput[]
    NOT?: ChapterScalarWhereInput | ChapterScalarWhereInput[]
    id?: StringFilter<"Chapter"> | string
    trackId?: StringFilter<"Chapter"> | string
    title?: StringFilter<"Chapter"> | string
    summary?: StringFilter<"Chapter"> | string
    ord?: IntFilter<"Chapter"> | number
  }

  export type TrackCreateWithoutChaptersInput = {
    id: string
    title: string
    ord: number
  }

  export type TrackUncheckedCreateWithoutChaptersInput = {
    id: string
    title: string
    ord: number
  }

  export type TrackCreateOrConnectWithoutChaptersInput = {
    where: TrackWhereUniqueInput
    create: XOR<TrackCreateWithoutChaptersInput, TrackUncheckedCreateWithoutChaptersInput>
  }

  export type ConceptCreateWithoutChapterInput = {
    id: string
    title: string
    summary: string
    versionNote?: string | null
    ord: number
    updatedAt: Date | string
    levels?: ConceptLevelCreateNestedManyWithoutConceptInput
    sections?: ConceptSectionCreateNestedManyWithoutConceptInput
    visuals?: ConceptVisualCreateNestedManyWithoutConceptInput
    sources?: SourceCreateNestedManyWithoutConceptInput
    note?: NoteCreateNestedOneWithoutConceptInput
    edgesOut?: EdgeCreateNestedManyWithoutFromInput
    edgesIn?: EdgeCreateNestedManyWithoutToInput
  }

  export type ConceptUncheckedCreateWithoutChapterInput = {
    id: string
    title: string
    summary: string
    versionNote?: string | null
    ord: number
    updatedAt: Date | string
    levels?: ConceptLevelUncheckedCreateNestedManyWithoutConceptInput
    sections?: ConceptSectionUncheckedCreateNestedManyWithoutConceptInput
    visuals?: ConceptVisualUncheckedCreateNestedManyWithoutConceptInput
    sources?: SourceUncheckedCreateNestedManyWithoutConceptInput
    note?: NoteUncheckedCreateNestedOneWithoutConceptInput
    edgesOut?: EdgeUncheckedCreateNestedManyWithoutFromInput
    edgesIn?: EdgeUncheckedCreateNestedManyWithoutToInput
  }

  export type ConceptCreateOrConnectWithoutChapterInput = {
    where: ConceptWhereUniqueInput
    create: XOR<ConceptCreateWithoutChapterInput, ConceptUncheckedCreateWithoutChapterInput>
  }

  export type ConceptCreateManyChapterInputEnvelope = {
    data: ConceptCreateManyChapterInput | ConceptCreateManyChapterInput[]
    skipDuplicates?: boolean
  }

  export type TrackUpsertWithoutChaptersInput = {
    update: XOR<TrackUpdateWithoutChaptersInput, TrackUncheckedUpdateWithoutChaptersInput>
    create: XOR<TrackCreateWithoutChaptersInput, TrackUncheckedCreateWithoutChaptersInput>
    where?: TrackWhereInput
  }

  export type TrackUpdateToOneWithWhereWithoutChaptersInput = {
    where?: TrackWhereInput
    data: XOR<TrackUpdateWithoutChaptersInput, TrackUncheckedUpdateWithoutChaptersInput>
  }

  export type TrackUpdateWithoutChaptersInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    ord?: IntFieldUpdateOperationsInput | number
  }

  export type TrackUncheckedUpdateWithoutChaptersInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    ord?: IntFieldUpdateOperationsInput | number
  }

  export type ConceptUpsertWithWhereUniqueWithoutChapterInput = {
    where: ConceptWhereUniqueInput
    update: XOR<ConceptUpdateWithoutChapterInput, ConceptUncheckedUpdateWithoutChapterInput>
    create: XOR<ConceptCreateWithoutChapterInput, ConceptUncheckedCreateWithoutChapterInput>
  }

  export type ConceptUpdateWithWhereUniqueWithoutChapterInput = {
    where: ConceptWhereUniqueInput
    data: XOR<ConceptUpdateWithoutChapterInput, ConceptUncheckedUpdateWithoutChapterInput>
  }

  export type ConceptUpdateManyWithWhereWithoutChapterInput = {
    where: ConceptScalarWhereInput
    data: XOR<ConceptUpdateManyMutationInput, ConceptUncheckedUpdateManyWithoutChapterInput>
  }

  export type ConceptScalarWhereInput = {
    AND?: ConceptScalarWhereInput | ConceptScalarWhereInput[]
    OR?: ConceptScalarWhereInput[]
    NOT?: ConceptScalarWhereInput | ConceptScalarWhereInput[]
    id?: StringFilter<"Concept"> | string
    chapterId?: StringFilter<"Concept"> | string
    title?: StringFilter<"Concept"> | string
    summary?: StringFilter<"Concept"> | string
    versionNote?: StringNullableFilter<"Concept"> | string | null
    ord?: IntFilter<"Concept"> | number
    updatedAt?: DateTimeFilter<"Concept"> | Date | string
  }

  export type ChapterCreateWithoutConceptsInput = {
    id: string
    title: string
    summary: string
    ord: number
    track: TrackCreateNestedOneWithoutChaptersInput
  }

  export type ChapterUncheckedCreateWithoutConceptsInput = {
    id: string
    trackId: string
    title: string
    summary: string
    ord: number
  }

  export type ChapterCreateOrConnectWithoutConceptsInput = {
    where: ChapterWhereUniqueInput
    create: XOR<ChapterCreateWithoutConceptsInput, ChapterUncheckedCreateWithoutConceptsInput>
  }

  export type ConceptLevelCreateWithoutConceptInput = {
    level: $Enums.Level
    body: string
    minutes: number
  }

  export type ConceptLevelUncheckedCreateWithoutConceptInput = {
    level: $Enums.Level
    body: string
    minutes: number
  }

  export type ConceptLevelCreateOrConnectWithoutConceptInput = {
    where: ConceptLevelWhereUniqueInput
    create: XOR<ConceptLevelCreateWithoutConceptInput, ConceptLevelUncheckedCreateWithoutConceptInput>
  }

  export type ConceptLevelCreateManyConceptInputEnvelope = {
    data: ConceptLevelCreateManyConceptInput | ConceptLevelCreateManyConceptInput[]
    skipDuplicates?: boolean
  }

  export type ConceptSectionCreateWithoutConceptInput = {
    level: $Enums.Level
    ord: number
    heading: string
    anchor: string
  }

  export type ConceptSectionUncheckedCreateWithoutConceptInput = {
    level: $Enums.Level
    ord: number
    heading: string
    anchor: string
  }

  export type ConceptSectionCreateOrConnectWithoutConceptInput = {
    where: ConceptSectionWhereUniqueInput
    create: XOR<ConceptSectionCreateWithoutConceptInput, ConceptSectionUncheckedCreateWithoutConceptInput>
  }

  export type ConceptSectionCreateManyConceptInputEnvelope = {
    data: ConceptSectionCreateManyConceptInput | ConceptSectionCreateManyConceptInput[]
    skipDuplicates?: boolean
  }

  export type ConceptVisualCreateWithoutConceptInput = {
    id: string
    level: $Enums.Level
    title: string
    kind: $Enums.VisualKind
    spec: JsonNullValueInput | InputJsonValue
    ord: number
  }

  export type ConceptVisualUncheckedCreateWithoutConceptInput = {
    id: string
    level: $Enums.Level
    title: string
    kind: $Enums.VisualKind
    spec: JsonNullValueInput | InputJsonValue
    ord: number
  }

  export type ConceptVisualCreateOrConnectWithoutConceptInput = {
    where: ConceptVisualWhereUniqueInput
    create: XOR<ConceptVisualCreateWithoutConceptInput, ConceptVisualUncheckedCreateWithoutConceptInput>
  }

  export type ConceptVisualCreateManyConceptInputEnvelope = {
    data: ConceptVisualCreateManyConceptInput | ConceptVisualCreateManyConceptInput[]
    skipDuplicates?: boolean
  }

  export type SourceCreateWithoutConceptInput = {
    id?: bigint | number
    label: string
    url: string
  }

  export type SourceUncheckedCreateWithoutConceptInput = {
    id?: bigint | number
    label: string
    url: string
  }

  export type SourceCreateOrConnectWithoutConceptInput = {
    where: SourceWhereUniqueInput
    create: XOR<SourceCreateWithoutConceptInput, SourceUncheckedCreateWithoutConceptInput>
  }

  export type SourceCreateManyConceptInputEnvelope = {
    data: SourceCreateManyConceptInput | SourceCreateManyConceptInput[]
    skipDuplicates?: boolean
  }

  export type NoteCreateWithoutConceptInput = {
    body: string
    updatedAt: Date | string
  }

  export type NoteUncheckedCreateWithoutConceptInput = {
    body: string
    updatedAt: Date | string
  }

  export type NoteCreateOrConnectWithoutConceptInput = {
    where: NoteWhereUniqueInput
    create: XOR<NoteCreateWithoutConceptInput, NoteUncheckedCreateWithoutConceptInput>
  }

  export type EdgeCreateWithoutFromInput = {
    type: $Enums.EdgeType
    to: ConceptCreateNestedOneWithoutEdgesInInput
  }

  export type EdgeUncheckedCreateWithoutFromInput = {
    toId: string
    type: $Enums.EdgeType
  }

  export type EdgeCreateOrConnectWithoutFromInput = {
    where: EdgeWhereUniqueInput
    create: XOR<EdgeCreateWithoutFromInput, EdgeUncheckedCreateWithoutFromInput>
  }

  export type EdgeCreateManyFromInputEnvelope = {
    data: EdgeCreateManyFromInput | EdgeCreateManyFromInput[]
    skipDuplicates?: boolean
  }

  export type EdgeCreateWithoutToInput = {
    type: $Enums.EdgeType
    from: ConceptCreateNestedOneWithoutEdgesOutInput
  }

  export type EdgeUncheckedCreateWithoutToInput = {
    fromId: string
    type: $Enums.EdgeType
  }

  export type EdgeCreateOrConnectWithoutToInput = {
    where: EdgeWhereUniqueInput
    create: XOR<EdgeCreateWithoutToInput, EdgeUncheckedCreateWithoutToInput>
  }

  export type EdgeCreateManyToInputEnvelope = {
    data: EdgeCreateManyToInput | EdgeCreateManyToInput[]
    skipDuplicates?: boolean
  }

  export type ChapterUpsertWithoutConceptsInput = {
    update: XOR<ChapterUpdateWithoutConceptsInput, ChapterUncheckedUpdateWithoutConceptsInput>
    create: XOR<ChapterCreateWithoutConceptsInput, ChapterUncheckedCreateWithoutConceptsInput>
    where?: ChapterWhereInput
  }

  export type ChapterUpdateToOneWithWhereWithoutConceptsInput = {
    where?: ChapterWhereInput
    data: XOR<ChapterUpdateWithoutConceptsInput, ChapterUncheckedUpdateWithoutConceptsInput>
  }

  export type ChapterUpdateWithoutConceptsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    ord?: IntFieldUpdateOperationsInput | number
    track?: TrackUpdateOneRequiredWithoutChaptersNestedInput
  }

  export type ChapterUncheckedUpdateWithoutConceptsInput = {
    id?: StringFieldUpdateOperationsInput | string
    trackId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    ord?: IntFieldUpdateOperationsInput | number
  }

  export type ConceptLevelUpsertWithWhereUniqueWithoutConceptInput = {
    where: ConceptLevelWhereUniqueInput
    update: XOR<ConceptLevelUpdateWithoutConceptInput, ConceptLevelUncheckedUpdateWithoutConceptInput>
    create: XOR<ConceptLevelCreateWithoutConceptInput, ConceptLevelUncheckedCreateWithoutConceptInput>
  }

  export type ConceptLevelUpdateWithWhereUniqueWithoutConceptInput = {
    where: ConceptLevelWhereUniqueInput
    data: XOR<ConceptLevelUpdateWithoutConceptInput, ConceptLevelUncheckedUpdateWithoutConceptInput>
  }

  export type ConceptLevelUpdateManyWithWhereWithoutConceptInput = {
    where: ConceptLevelScalarWhereInput
    data: XOR<ConceptLevelUpdateManyMutationInput, ConceptLevelUncheckedUpdateManyWithoutConceptInput>
  }

  export type ConceptLevelScalarWhereInput = {
    AND?: ConceptLevelScalarWhereInput | ConceptLevelScalarWhereInput[]
    OR?: ConceptLevelScalarWhereInput[]
    NOT?: ConceptLevelScalarWhereInput | ConceptLevelScalarWhereInput[]
    conceptId?: StringFilter<"ConceptLevel"> | string
    level?: EnumLevelFilter<"ConceptLevel"> | $Enums.Level
    body?: StringFilter<"ConceptLevel"> | string
    minutes?: IntFilter<"ConceptLevel"> | number
  }

  export type ConceptSectionUpsertWithWhereUniqueWithoutConceptInput = {
    where: ConceptSectionWhereUniqueInput
    update: XOR<ConceptSectionUpdateWithoutConceptInput, ConceptSectionUncheckedUpdateWithoutConceptInput>
    create: XOR<ConceptSectionCreateWithoutConceptInput, ConceptSectionUncheckedCreateWithoutConceptInput>
  }

  export type ConceptSectionUpdateWithWhereUniqueWithoutConceptInput = {
    where: ConceptSectionWhereUniqueInput
    data: XOR<ConceptSectionUpdateWithoutConceptInput, ConceptSectionUncheckedUpdateWithoutConceptInput>
  }

  export type ConceptSectionUpdateManyWithWhereWithoutConceptInput = {
    where: ConceptSectionScalarWhereInput
    data: XOR<ConceptSectionUpdateManyMutationInput, ConceptSectionUncheckedUpdateManyWithoutConceptInput>
  }

  export type ConceptSectionScalarWhereInput = {
    AND?: ConceptSectionScalarWhereInput | ConceptSectionScalarWhereInput[]
    OR?: ConceptSectionScalarWhereInput[]
    NOT?: ConceptSectionScalarWhereInput | ConceptSectionScalarWhereInput[]
    conceptId?: StringFilter<"ConceptSection"> | string
    level?: EnumLevelFilter<"ConceptSection"> | $Enums.Level
    ord?: IntFilter<"ConceptSection"> | number
    heading?: StringFilter<"ConceptSection"> | string
    anchor?: StringFilter<"ConceptSection"> | string
  }

  export type ConceptVisualUpsertWithWhereUniqueWithoutConceptInput = {
    where: ConceptVisualWhereUniqueInput
    update: XOR<ConceptVisualUpdateWithoutConceptInput, ConceptVisualUncheckedUpdateWithoutConceptInput>
    create: XOR<ConceptVisualCreateWithoutConceptInput, ConceptVisualUncheckedCreateWithoutConceptInput>
  }

  export type ConceptVisualUpdateWithWhereUniqueWithoutConceptInput = {
    where: ConceptVisualWhereUniqueInput
    data: XOR<ConceptVisualUpdateWithoutConceptInput, ConceptVisualUncheckedUpdateWithoutConceptInput>
  }

  export type ConceptVisualUpdateManyWithWhereWithoutConceptInput = {
    where: ConceptVisualScalarWhereInput
    data: XOR<ConceptVisualUpdateManyMutationInput, ConceptVisualUncheckedUpdateManyWithoutConceptInput>
  }

  export type ConceptVisualScalarWhereInput = {
    AND?: ConceptVisualScalarWhereInput | ConceptVisualScalarWhereInput[]
    OR?: ConceptVisualScalarWhereInput[]
    NOT?: ConceptVisualScalarWhereInput | ConceptVisualScalarWhereInput[]
    id?: StringFilter<"ConceptVisual"> | string
    conceptId?: StringFilter<"ConceptVisual"> | string
    level?: EnumLevelFilter<"ConceptVisual"> | $Enums.Level
    title?: StringFilter<"ConceptVisual"> | string
    kind?: EnumVisualKindFilter<"ConceptVisual"> | $Enums.VisualKind
    spec?: JsonFilter<"ConceptVisual">
    ord?: IntFilter<"ConceptVisual"> | number
  }

  export type SourceUpsertWithWhereUniqueWithoutConceptInput = {
    where: SourceWhereUniqueInput
    update: XOR<SourceUpdateWithoutConceptInput, SourceUncheckedUpdateWithoutConceptInput>
    create: XOR<SourceCreateWithoutConceptInput, SourceUncheckedCreateWithoutConceptInput>
  }

  export type SourceUpdateWithWhereUniqueWithoutConceptInput = {
    where: SourceWhereUniqueInput
    data: XOR<SourceUpdateWithoutConceptInput, SourceUncheckedUpdateWithoutConceptInput>
  }

  export type SourceUpdateManyWithWhereWithoutConceptInput = {
    where: SourceScalarWhereInput
    data: XOR<SourceUpdateManyMutationInput, SourceUncheckedUpdateManyWithoutConceptInput>
  }

  export type SourceScalarWhereInput = {
    AND?: SourceScalarWhereInput | SourceScalarWhereInput[]
    OR?: SourceScalarWhereInput[]
    NOT?: SourceScalarWhereInput | SourceScalarWhereInput[]
    id?: BigIntFilter<"Source"> | bigint | number
    conceptId?: StringFilter<"Source"> | string
    label?: StringFilter<"Source"> | string
    url?: StringFilter<"Source"> | string
  }

  export type NoteUpsertWithoutConceptInput = {
    update: XOR<NoteUpdateWithoutConceptInput, NoteUncheckedUpdateWithoutConceptInput>
    create: XOR<NoteCreateWithoutConceptInput, NoteUncheckedCreateWithoutConceptInput>
    where?: NoteWhereInput
  }

  export type NoteUpdateToOneWithWhereWithoutConceptInput = {
    where?: NoteWhereInput
    data: XOR<NoteUpdateWithoutConceptInput, NoteUncheckedUpdateWithoutConceptInput>
  }

  export type NoteUpdateWithoutConceptInput = {
    body?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NoteUncheckedUpdateWithoutConceptInput = {
    body?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EdgeUpsertWithWhereUniqueWithoutFromInput = {
    where: EdgeWhereUniqueInput
    update: XOR<EdgeUpdateWithoutFromInput, EdgeUncheckedUpdateWithoutFromInput>
    create: XOR<EdgeCreateWithoutFromInput, EdgeUncheckedCreateWithoutFromInput>
  }

  export type EdgeUpdateWithWhereUniqueWithoutFromInput = {
    where: EdgeWhereUniqueInput
    data: XOR<EdgeUpdateWithoutFromInput, EdgeUncheckedUpdateWithoutFromInput>
  }

  export type EdgeUpdateManyWithWhereWithoutFromInput = {
    where: EdgeScalarWhereInput
    data: XOR<EdgeUpdateManyMutationInput, EdgeUncheckedUpdateManyWithoutFromInput>
  }

  export type EdgeScalarWhereInput = {
    AND?: EdgeScalarWhereInput | EdgeScalarWhereInput[]
    OR?: EdgeScalarWhereInput[]
    NOT?: EdgeScalarWhereInput | EdgeScalarWhereInput[]
    fromId?: StringFilter<"Edge"> | string
    toId?: StringFilter<"Edge"> | string
    type?: EnumEdgeTypeFilter<"Edge"> | $Enums.EdgeType
  }

  export type EdgeUpsertWithWhereUniqueWithoutToInput = {
    where: EdgeWhereUniqueInput
    update: XOR<EdgeUpdateWithoutToInput, EdgeUncheckedUpdateWithoutToInput>
    create: XOR<EdgeCreateWithoutToInput, EdgeUncheckedCreateWithoutToInput>
  }

  export type EdgeUpdateWithWhereUniqueWithoutToInput = {
    where: EdgeWhereUniqueInput
    data: XOR<EdgeUpdateWithoutToInput, EdgeUncheckedUpdateWithoutToInput>
  }

  export type EdgeUpdateManyWithWhereWithoutToInput = {
    where: EdgeScalarWhereInput
    data: XOR<EdgeUpdateManyMutationInput, EdgeUncheckedUpdateManyWithoutToInput>
  }

  export type ConceptCreateWithoutLevelsInput = {
    id: string
    title: string
    summary: string
    versionNote?: string | null
    ord: number
    updatedAt: Date | string
    chapter: ChapterCreateNestedOneWithoutConceptsInput
    sections?: ConceptSectionCreateNestedManyWithoutConceptInput
    visuals?: ConceptVisualCreateNestedManyWithoutConceptInput
    sources?: SourceCreateNestedManyWithoutConceptInput
    note?: NoteCreateNestedOneWithoutConceptInput
    edgesOut?: EdgeCreateNestedManyWithoutFromInput
    edgesIn?: EdgeCreateNestedManyWithoutToInput
  }

  export type ConceptUncheckedCreateWithoutLevelsInput = {
    id: string
    chapterId: string
    title: string
    summary: string
    versionNote?: string | null
    ord: number
    updatedAt: Date | string
    sections?: ConceptSectionUncheckedCreateNestedManyWithoutConceptInput
    visuals?: ConceptVisualUncheckedCreateNestedManyWithoutConceptInput
    sources?: SourceUncheckedCreateNestedManyWithoutConceptInput
    note?: NoteUncheckedCreateNestedOneWithoutConceptInput
    edgesOut?: EdgeUncheckedCreateNestedManyWithoutFromInput
    edgesIn?: EdgeUncheckedCreateNestedManyWithoutToInput
  }

  export type ConceptCreateOrConnectWithoutLevelsInput = {
    where: ConceptWhereUniqueInput
    create: XOR<ConceptCreateWithoutLevelsInput, ConceptUncheckedCreateWithoutLevelsInput>
  }

  export type ConceptUpsertWithoutLevelsInput = {
    update: XOR<ConceptUpdateWithoutLevelsInput, ConceptUncheckedUpdateWithoutLevelsInput>
    create: XOR<ConceptCreateWithoutLevelsInput, ConceptUncheckedCreateWithoutLevelsInput>
    where?: ConceptWhereInput
  }

  export type ConceptUpdateToOneWithWhereWithoutLevelsInput = {
    where?: ConceptWhereInput
    data: XOR<ConceptUpdateWithoutLevelsInput, ConceptUncheckedUpdateWithoutLevelsInput>
  }

  export type ConceptUpdateWithoutLevelsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    versionNote?: NullableStringFieldUpdateOperationsInput | string | null
    ord?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chapter?: ChapterUpdateOneRequiredWithoutConceptsNestedInput
    sections?: ConceptSectionUpdateManyWithoutConceptNestedInput
    visuals?: ConceptVisualUpdateManyWithoutConceptNestedInput
    sources?: SourceUpdateManyWithoutConceptNestedInput
    note?: NoteUpdateOneWithoutConceptNestedInput
    edgesOut?: EdgeUpdateManyWithoutFromNestedInput
    edgesIn?: EdgeUpdateManyWithoutToNestedInput
  }

  export type ConceptUncheckedUpdateWithoutLevelsInput = {
    id?: StringFieldUpdateOperationsInput | string
    chapterId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    versionNote?: NullableStringFieldUpdateOperationsInput | string | null
    ord?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sections?: ConceptSectionUncheckedUpdateManyWithoutConceptNestedInput
    visuals?: ConceptVisualUncheckedUpdateManyWithoutConceptNestedInput
    sources?: SourceUncheckedUpdateManyWithoutConceptNestedInput
    note?: NoteUncheckedUpdateOneWithoutConceptNestedInput
    edgesOut?: EdgeUncheckedUpdateManyWithoutFromNestedInput
    edgesIn?: EdgeUncheckedUpdateManyWithoutToNestedInput
  }

  export type ConceptCreateWithoutSectionsInput = {
    id: string
    title: string
    summary: string
    versionNote?: string | null
    ord: number
    updatedAt: Date | string
    chapter: ChapterCreateNestedOneWithoutConceptsInput
    levels?: ConceptLevelCreateNestedManyWithoutConceptInput
    visuals?: ConceptVisualCreateNestedManyWithoutConceptInput
    sources?: SourceCreateNestedManyWithoutConceptInput
    note?: NoteCreateNestedOneWithoutConceptInput
    edgesOut?: EdgeCreateNestedManyWithoutFromInput
    edgesIn?: EdgeCreateNestedManyWithoutToInput
  }

  export type ConceptUncheckedCreateWithoutSectionsInput = {
    id: string
    chapterId: string
    title: string
    summary: string
    versionNote?: string | null
    ord: number
    updatedAt: Date | string
    levels?: ConceptLevelUncheckedCreateNestedManyWithoutConceptInput
    visuals?: ConceptVisualUncheckedCreateNestedManyWithoutConceptInput
    sources?: SourceUncheckedCreateNestedManyWithoutConceptInput
    note?: NoteUncheckedCreateNestedOneWithoutConceptInput
    edgesOut?: EdgeUncheckedCreateNestedManyWithoutFromInput
    edgesIn?: EdgeUncheckedCreateNestedManyWithoutToInput
  }

  export type ConceptCreateOrConnectWithoutSectionsInput = {
    where: ConceptWhereUniqueInput
    create: XOR<ConceptCreateWithoutSectionsInput, ConceptUncheckedCreateWithoutSectionsInput>
  }

  export type ConceptUpsertWithoutSectionsInput = {
    update: XOR<ConceptUpdateWithoutSectionsInput, ConceptUncheckedUpdateWithoutSectionsInput>
    create: XOR<ConceptCreateWithoutSectionsInput, ConceptUncheckedCreateWithoutSectionsInput>
    where?: ConceptWhereInput
  }

  export type ConceptUpdateToOneWithWhereWithoutSectionsInput = {
    where?: ConceptWhereInput
    data: XOR<ConceptUpdateWithoutSectionsInput, ConceptUncheckedUpdateWithoutSectionsInput>
  }

  export type ConceptUpdateWithoutSectionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    versionNote?: NullableStringFieldUpdateOperationsInput | string | null
    ord?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chapter?: ChapterUpdateOneRequiredWithoutConceptsNestedInput
    levels?: ConceptLevelUpdateManyWithoutConceptNestedInput
    visuals?: ConceptVisualUpdateManyWithoutConceptNestedInput
    sources?: SourceUpdateManyWithoutConceptNestedInput
    note?: NoteUpdateOneWithoutConceptNestedInput
    edgesOut?: EdgeUpdateManyWithoutFromNestedInput
    edgesIn?: EdgeUpdateManyWithoutToNestedInput
  }

  export type ConceptUncheckedUpdateWithoutSectionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    chapterId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    versionNote?: NullableStringFieldUpdateOperationsInput | string | null
    ord?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    levels?: ConceptLevelUncheckedUpdateManyWithoutConceptNestedInput
    visuals?: ConceptVisualUncheckedUpdateManyWithoutConceptNestedInput
    sources?: SourceUncheckedUpdateManyWithoutConceptNestedInput
    note?: NoteUncheckedUpdateOneWithoutConceptNestedInput
    edgesOut?: EdgeUncheckedUpdateManyWithoutFromNestedInput
    edgesIn?: EdgeUncheckedUpdateManyWithoutToNestedInput
  }

  export type ConceptCreateWithoutEdgesOutInput = {
    id: string
    title: string
    summary: string
    versionNote?: string | null
    ord: number
    updatedAt: Date | string
    chapter: ChapterCreateNestedOneWithoutConceptsInput
    levels?: ConceptLevelCreateNestedManyWithoutConceptInput
    sections?: ConceptSectionCreateNestedManyWithoutConceptInput
    visuals?: ConceptVisualCreateNestedManyWithoutConceptInput
    sources?: SourceCreateNestedManyWithoutConceptInput
    note?: NoteCreateNestedOneWithoutConceptInput
    edgesIn?: EdgeCreateNestedManyWithoutToInput
  }

  export type ConceptUncheckedCreateWithoutEdgesOutInput = {
    id: string
    chapterId: string
    title: string
    summary: string
    versionNote?: string | null
    ord: number
    updatedAt: Date | string
    levels?: ConceptLevelUncheckedCreateNestedManyWithoutConceptInput
    sections?: ConceptSectionUncheckedCreateNestedManyWithoutConceptInput
    visuals?: ConceptVisualUncheckedCreateNestedManyWithoutConceptInput
    sources?: SourceUncheckedCreateNestedManyWithoutConceptInput
    note?: NoteUncheckedCreateNestedOneWithoutConceptInput
    edgesIn?: EdgeUncheckedCreateNestedManyWithoutToInput
  }

  export type ConceptCreateOrConnectWithoutEdgesOutInput = {
    where: ConceptWhereUniqueInput
    create: XOR<ConceptCreateWithoutEdgesOutInput, ConceptUncheckedCreateWithoutEdgesOutInput>
  }

  export type ConceptCreateWithoutEdgesInInput = {
    id: string
    title: string
    summary: string
    versionNote?: string | null
    ord: number
    updatedAt: Date | string
    chapter: ChapterCreateNestedOneWithoutConceptsInput
    levels?: ConceptLevelCreateNestedManyWithoutConceptInput
    sections?: ConceptSectionCreateNestedManyWithoutConceptInput
    visuals?: ConceptVisualCreateNestedManyWithoutConceptInput
    sources?: SourceCreateNestedManyWithoutConceptInput
    note?: NoteCreateNestedOneWithoutConceptInput
    edgesOut?: EdgeCreateNestedManyWithoutFromInput
  }

  export type ConceptUncheckedCreateWithoutEdgesInInput = {
    id: string
    chapterId: string
    title: string
    summary: string
    versionNote?: string | null
    ord: number
    updatedAt: Date | string
    levels?: ConceptLevelUncheckedCreateNestedManyWithoutConceptInput
    sections?: ConceptSectionUncheckedCreateNestedManyWithoutConceptInput
    visuals?: ConceptVisualUncheckedCreateNestedManyWithoutConceptInput
    sources?: SourceUncheckedCreateNestedManyWithoutConceptInput
    note?: NoteUncheckedCreateNestedOneWithoutConceptInput
    edgesOut?: EdgeUncheckedCreateNestedManyWithoutFromInput
  }

  export type ConceptCreateOrConnectWithoutEdgesInInput = {
    where: ConceptWhereUniqueInput
    create: XOR<ConceptCreateWithoutEdgesInInput, ConceptUncheckedCreateWithoutEdgesInInput>
  }

  export type ConceptUpsertWithoutEdgesOutInput = {
    update: XOR<ConceptUpdateWithoutEdgesOutInput, ConceptUncheckedUpdateWithoutEdgesOutInput>
    create: XOR<ConceptCreateWithoutEdgesOutInput, ConceptUncheckedCreateWithoutEdgesOutInput>
    where?: ConceptWhereInput
  }

  export type ConceptUpdateToOneWithWhereWithoutEdgesOutInput = {
    where?: ConceptWhereInput
    data: XOR<ConceptUpdateWithoutEdgesOutInput, ConceptUncheckedUpdateWithoutEdgesOutInput>
  }

  export type ConceptUpdateWithoutEdgesOutInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    versionNote?: NullableStringFieldUpdateOperationsInput | string | null
    ord?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chapter?: ChapterUpdateOneRequiredWithoutConceptsNestedInput
    levels?: ConceptLevelUpdateManyWithoutConceptNestedInput
    sections?: ConceptSectionUpdateManyWithoutConceptNestedInput
    visuals?: ConceptVisualUpdateManyWithoutConceptNestedInput
    sources?: SourceUpdateManyWithoutConceptNestedInput
    note?: NoteUpdateOneWithoutConceptNestedInput
    edgesIn?: EdgeUpdateManyWithoutToNestedInput
  }

  export type ConceptUncheckedUpdateWithoutEdgesOutInput = {
    id?: StringFieldUpdateOperationsInput | string
    chapterId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    versionNote?: NullableStringFieldUpdateOperationsInput | string | null
    ord?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    levels?: ConceptLevelUncheckedUpdateManyWithoutConceptNestedInput
    sections?: ConceptSectionUncheckedUpdateManyWithoutConceptNestedInput
    visuals?: ConceptVisualUncheckedUpdateManyWithoutConceptNestedInput
    sources?: SourceUncheckedUpdateManyWithoutConceptNestedInput
    note?: NoteUncheckedUpdateOneWithoutConceptNestedInput
    edgesIn?: EdgeUncheckedUpdateManyWithoutToNestedInput
  }

  export type ConceptUpsertWithoutEdgesInInput = {
    update: XOR<ConceptUpdateWithoutEdgesInInput, ConceptUncheckedUpdateWithoutEdgesInInput>
    create: XOR<ConceptCreateWithoutEdgesInInput, ConceptUncheckedCreateWithoutEdgesInInput>
    where?: ConceptWhereInput
  }

  export type ConceptUpdateToOneWithWhereWithoutEdgesInInput = {
    where?: ConceptWhereInput
    data: XOR<ConceptUpdateWithoutEdgesInInput, ConceptUncheckedUpdateWithoutEdgesInInput>
  }

  export type ConceptUpdateWithoutEdgesInInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    versionNote?: NullableStringFieldUpdateOperationsInput | string | null
    ord?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chapter?: ChapterUpdateOneRequiredWithoutConceptsNestedInput
    levels?: ConceptLevelUpdateManyWithoutConceptNestedInput
    sections?: ConceptSectionUpdateManyWithoutConceptNestedInput
    visuals?: ConceptVisualUpdateManyWithoutConceptNestedInput
    sources?: SourceUpdateManyWithoutConceptNestedInput
    note?: NoteUpdateOneWithoutConceptNestedInput
    edgesOut?: EdgeUpdateManyWithoutFromNestedInput
  }

  export type ConceptUncheckedUpdateWithoutEdgesInInput = {
    id?: StringFieldUpdateOperationsInput | string
    chapterId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    versionNote?: NullableStringFieldUpdateOperationsInput | string | null
    ord?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    levels?: ConceptLevelUncheckedUpdateManyWithoutConceptNestedInput
    sections?: ConceptSectionUncheckedUpdateManyWithoutConceptNestedInput
    visuals?: ConceptVisualUncheckedUpdateManyWithoutConceptNestedInput
    sources?: SourceUncheckedUpdateManyWithoutConceptNestedInput
    note?: NoteUncheckedUpdateOneWithoutConceptNestedInput
    edgesOut?: EdgeUncheckedUpdateManyWithoutFromNestedInput
  }

  export type ConceptCreateWithoutVisualsInput = {
    id: string
    title: string
    summary: string
    versionNote?: string | null
    ord: number
    updatedAt: Date | string
    chapter: ChapterCreateNestedOneWithoutConceptsInput
    levels?: ConceptLevelCreateNestedManyWithoutConceptInput
    sections?: ConceptSectionCreateNestedManyWithoutConceptInput
    sources?: SourceCreateNestedManyWithoutConceptInput
    note?: NoteCreateNestedOneWithoutConceptInput
    edgesOut?: EdgeCreateNestedManyWithoutFromInput
    edgesIn?: EdgeCreateNestedManyWithoutToInput
  }

  export type ConceptUncheckedCreateWithoutVisualsInput = {
    id: string
    chapterId: string
    title: string
    summary: string
    versionNote?: string | null
    ord: number
    updatedAt: Date | string
    levels?: ConceptLevelUncheckedCreateNestedManyWithoutConceptInput
    sections?: ConceptSectionUncheckedCreateNestedManyWithoutConceptInput
    sources?: SourceUncheckedCreateNestedManyWithoutConceptInput
    note?: NoteUncheckedCreateNestedOneWithoutConceptInput
    edgesOut?: EdgeUncheckedCreateNestedManyWithoutFromInput
    edgesIn?: EdgeUncheckedCreateNestedManyWithoutToInput
  }

  export type ConceptCreateOrConnectWithoutVisualsInput = {
    where: ConceptWhereUniqueInput
    create: XOR<ConceptCreateWithoutVisualsInput, ConceptUncheckedCreateWithoutVisualsInput>
  }

  export type ConceptUpsertWithoutVisualsInput = {
    update: XOR<ConceptUpdateWithoutVisualsInput, ConceptUncheckedUpdateWithoutVisualsInput>
    create: XOR<ConceptCreateWithoutVisualsInput, ConceptUncheckedCreateWithoutVisualsInput>
    where?: ConceptWhereInput
  }

  export type ConceptUpdateToOneWithWhereWithoutVisualsInput = {
    where?: ConceptWhereInput
    data: XOR<ConceptUpdateWithoutVisualsInput, ConceptUncheckedUpdateWithoutVisualsInput>
  }

  export type ConceptUpdateWithoutVisualsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    versionNote?: NullableStringFieldUpdateOperationsInput | string | null
    ord?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chapter?: ChapterUpdateOneRequiredWithoutConceptsNestedInput
    levels?: ConceptLevelUpdateManyWithoutConceptNestedInput
    sections?: ConceptSectionUpdateManyWithoutConceptNestedInput
    sources?: SourceUpdateManyWithoutConceptNestedInput
    note?: NoteUpdateOneWithoutConceptNestedInput
    edgesOut?: EdgeUpdateManyWithoutFromNestedInput
    edgesIn?: EdgeUpdateManyWithoutToNestedInput
  }

  export type ConceptUncheckedUpdateWithoutVisualsInput = {
    id?: StringFieldUpdateOperationsInput | string
    chapterId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    versionNote?: NullableStringFieldUpdateOperationsInput | string | null
    ord?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    levels?: ConceptLevelUncheckedUpdateManyWithoutConceptNestedInput
    sections?: ConceptSectionUncheckedUpdateManyWithoutConceptNestedInput
    sources?: SourceUncheckedUpdateManyWithoutConceptNestedInput
    note?: NoteUncheckedUpdateOneWithoutConceptNestedInput
    edgesOut?: EdgeUncheckedUpdateManyWithoutFromNestedInput
    edgesIn?: EdgeUncheckedUpdateManyWithoutToNestedInput
  }

  export type ConceptCreateWithoutNoteInput = {
    id: string
    title: string
    summary: string
    versionNote?: string | null
    ord: number
    updatedAt: Date | string
    chapter: ChapterCreateNestedOneWithoutConceptsInput
    levels?: ConceptLevelCreateNestedManyWithoutConceptInput
    sections?: ConceptSectionCreateNestedManyWithoutConceptInput
    visuals?: ConceptVisualCreateNestedManyWithoutConceptInput
    sources?: SourceCreateNestedManyWithoutConceptInput
    edgesOut?: EdgeCreateNestedManyWithoutFromInput
    edgesIn?: EdgeCreateNestedManyWithoutToInput
  }

  export type ConceptUncheckedCreateWithoutNoteInput = {
    id: string
    chapterId: string
    title: string
    summary: string
    versionNote?: string | null
    ord: number
    updatedAt: Date | string
    levels?: ConceptLevelUncheckedCreateNestedManyWithoutConceptInput
    sections?: ConceptSectionUncheckedCreateNestedManyWithoutConceptInput
    visuals?: ConceptVisualUncheckedCreateNestedManyWithoutConceptInput
    sources?: SourceUncheckedCreateNestedManyWithoutConceptInput
    edgesOut?: EdgeUncheckedCreateNestedManyWithoutFromInput
    edgesIn?: EdgeUncheckedCreateNestedManyWithoutToInput
  }

  export type ConceptCreateOrConnectWithoutNoteInput = {
    where: ConceptWhereUniqueInput
    create: XOR<ConceptCreateWithoutNoteInput, ConceptUncheckedCreateWithoutNoteInput>
  }

  export type ConceptUpsertWithoutNoteInput = {
    update: XOR<ConceptUpdateWithoutNoteInput, ConceptUncheckedUpdateWithoutNoteInput>
    create: XOR<ConceptCreateWithoutNoteInput, ConceptUncheckedCreateWithoutNoteInput>
    where?: ConceptWhereInput
  }

  export type ConceptUpdateToOneWithWhereWithoutNoteInput = {
    where?: ConceptWhereInput
    data: XOR<ConceptUpdateWithoutNoteInput, ConceptUncheckedUpdateWithoutNoteInput>
  }

  export type ConceptUpdateWithoutNoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    versionNote?: NullableStringFieldUpdateOperationsInput | string | null
    ord?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chapter?: ChapterUpdateOneRequiredWithoutConceptsNestedInput
    levels?: ConceptLevelUpdateManyWithoutConceptNestedInput
    sections?: ConceptSectionUpdateManyWithoutConceptNestedInput
    visuals?: ConceptVisualUpdateManyWithoutConceptNestedInput
    sources?: SourceUpdateManyWithoutConceptNestedInput
    edgesOut?: EdgeUpdateManyWithoutFromNestedInput
    edgesIn?: EdgeUpdateManyWithoutToNestedInput
  }

  export type ConceptUncheckedUpdateWithoutNoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    chapterId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    versionNote?: NullableStringFieldUpdateOperationsInput | string | null
    ord?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    levels?: ConceptLevelUncheckedUpdateManyWithoutConceptNestedInput
    sections?: ConceptSectionUncheckedUpdateManyWithoutConceptNestedInput
    visuals?: ConceptVisualUncheckedUpdateManyWithoutConceptNestedInput
    sources?: SourceUncheckedUpdateManyWithoutConceptNestedInput
    edgesOut?: EdgeUncheckedUpdateManyWithoutFromNestedInput
    edgesIn?: EdgeUncheckedUpdateManyWithoutToNestedInput
  }

  export type ConceptCreateWithoutSourcesInput = {
    id: string
    title: string
    summary: string
    versionNote?: string | null
    ord: number
    updatedAt: Date | string
    chapter: ChapterCreateNestedOneWithoutConceptsInput
    levels?: ConceptLevelCreateNestedManyWithoutConceptInput
    sections?: ConceptSectionCreateNestedManyWithoutConceptInput
    visuals?: ConceptVisualCreateNestedManyWithoutConceptInput
    note?: NoteCreateNestedOneWithoutConceptInput
    edgesOut?: EdgeCreateNestedManyWithoutFromInput
    edgesIn?: EdgeCreateNestedManyWithoutToInput
  }

  export type ConceptUncheckedCreateWithoutSourcesInput = {
    id: string
    chapterId: string
    title: string
    summary: string
    versionNote?: string | null
    ord: number
    updatedAt: Date | string
    levels?: ConceptLevelUncheckedCreateNestedManyWithoutConceptInput
    sections?: ConceptSectionUncheckedCreateNestedManyWithoutConceptInput
    visuals?: ConceptVisualUncheckedCreateNestedManyWithoutConceptInput
    note?: NoteUncheckedCreateNestedOneWithoutConceptInput
    edgesOut?: EdgeUncheckedCreateNestedManyWithoutFromInput
    edgesIn?: EdgeUncheckedCreateNestedManyWithoutToInput
  }

  export type ConceptCreateOrConnectWithoutSourcesInput = {
    where: ConceptWhereUniqueInput
    create: XOR<ConceptCreateWithoutSourcesInput, ConceptUncheckedCreateWithoutSourcesInput>
  }

  export type ConceptUpsertWithoutSourcesInput = {
    update: XOR<ConceptUpdateWithoutSourcesInput, ConceptUncheckedUpdateWithoutSourcesInput>
    create: XOR<ConceptCreateWithoutSourcesInput, ConceptUncheckedCreateWithoutSourcesInput>
    where?: ConceptWhereInput
  }

  export type ConceptUpdateToOneWithWhereWithoutSourcesInput = {
    where?: ConceptWhereInput
    data: XOR<ConceptUpdateWithoutSourcesInput, ConceptUncheckedUpdateWithoutSourcesInput>
  }

  export type ConceptUpdateWithoutSourcesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    versionNote?: NullableStringFieldUpdateOperationsInput | string | null
    ord?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chapter?: ChapterUpdateOneRequiredWithoutConceptsNestedInput
    levels?: ConceptLevelUpdateManyWithoutConceptNestedInput
    sections?: ConceptSectionUpdateManyWithoutConceptNestedInput
    visuals?: ConceptVisualUpdateManyWithoutConceptNestedInput
    note?: NoteUpdateOneWithoutConceptNestedInput
    edgesOut?: EdgeUpdateManyWithoutFromNestedInput
    edgesIn?: EdgeUpdateManyWithoutToNestedInput
  }

  export type ConceptUncheckedUpdateWithoutSourcesInput = {
    id?: StringFieldUpdateOperationsInput | string
    chapterId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    versionNote?: NullableStringFieldUpdateOperationsInput | string | null
    ord?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    levels?: ConceptLevelUncheckedUpdateManyWithoutConceptNestedInput
    sections?: ConceptSectionUncheckedUpdateManyWithoutConceptNestedInput
    visuals?: ConceptVisualUncheckedUpdateManyWithoutConceptNestedInput
    note?: NoteUncheckedUpdateOneWithoutConceptNestedInput
    edgesOut?: EdgeUncheckedUpdateManyWithoutFromNestedInput
    edgesIn?: EdgeUncheckedUpdateManyWithoutToNestedInput
  }

  export type ChapterCreateManyTrackInput = {
    id: string
    title: string
    summary: string
    ord: number
  }

  export type ChapterUpdateWithoutTrackInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    ord?: IntFieldUpdateOperationsInput | number
    concepts?: ConceptUpdateManyWithoutChapterNestedInput
  }

  export type ChapterUncheckedUpdateWithoutTrackInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    ord?: IntFieldUpdateOperationsInput | number
    concepts?: ConceptUncheckedUpdateManyWithoutChapterNestedInput
  }

  export type ChapterUncheckedUpdateManyWithoutTrackInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    ord?: IntFieldUpdateOperationsInput | number
  }

  export type ConceptCreateManyChapterInput = {
    id: string
    title: string
    summary: string
    versionNote?: string | null
    ord: number
    updatedAt: Date | string
  }

  export type ConceptUpdateWithoutChapterInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    versionNote?: NullableStringFieldUpdateOperationsInput | string | null
    ord?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    levels?: ConceptLevelUpdateManyWithoutConceptNestedInput
    sections?: ConceptSectionUpdateManyWithoutConceptNestedInput
    visuals?: ConceptVisualUpdateManyWithoutConceptNestedInput
    sources?: SourceUpdateManyWithoutConceptNestedInput
    note?: NoteUpdateOneWithoutConceptNestedInput
    edgesOut?: EdgeUpdateManyWithoutFromNestedInput
    edgesIn?: EdgeUpdateManyWithoutToNestedInput
  }

  export type ConceptUncheckedUpdateWithoutChapterInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    versionNote?: NullableStringFieldUpdateOperationsInput | string | null
    ord?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    levels?: ConceptLevelUncheckedUpdateManyWithoutConceptNestedInput
    sections?: ConceptSectionUncheckedUpdateManyWithoutConceptNestedInput
    visuals?: ConceptVisualUncheckedUpdateManyWithoutConceptNestedInput
    sources?: SourceUncheckedUpdateManyWithoutConceptNestedInput
    note?: NoteUncheckedUpdateOneWithoutConceptNestedInput
    edgesOut?: EdgeUncheckedUpdateManyWithoutFromNestedInput
    edgesIn?: EdgeUncheckedUpdateManyWithoutToNestedInput
  }

  export type ConceptUncheckedUpdateManyWithoutChapterInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    versionNote?: NullableStringFieldUpdateOperationsInput | string | null
    ord?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConceptLevelCreateManyConceptInput = {
    level: $Enums.Level
    body: string
    minutes: number
  }

  export type ConceptSectionCreateManyConceptInput = {
    level: $Enums.Level
    ord: number
    heading: string
    anchor: string
  }

  export type ConceptVisualCreateManyConceptInput = {
    id: string
    level: $Enums.Level
    title: string
    kind: $Enums.VisualKind
    spec: JsonNullValueInput | InputJsonValue
    ord: number
  }

  export type SourceCreateManyConceptInput = {
    id?: bigint | number
    label: string
    url: string
  }

  export type EdgeCreateManyFromInput = {
    toId: string
    type: $Enums.EdgeType
  }

  export type EdgeCreateManyToInput = {
    fromId: string
    type: $Enums.EdgeType
  }

  export type ConceptLevelUpdateWithoutConceptInput = {
    level?: EnumLevelFieldUpdateOperationsInput | $Enums.Level
    body?: StringFieldUpdateOperationsInput | string
    minutes?: IntFieldUpdateOperationsInput | number
  }

  export type ConceptLevelUncheckedUpdateWithoutConceptInput = {
    level?: EnumLevelFieldUpdateOperationsInput | $Enums.Level
    body?: StringFieldUpdateOperationsInput | string
    minutes?: IntFieldUpdateOperationsInput | number
  }

  export type ConceptLevelUncheckedUpdateManyWithoutConceptInput = {
    level?: EnumLevelFieldUpdateOperationsInput | $Enums.Level
    body?: StringFieldUpdateOperationsInput | string
    minutes?: IntFieldUpdateOperationsInput | number
  }

  export type ConceptSectionUpdateWithoutConceptInput = {
    level?: EnumLevelFieldUpdateOperationsInput | $Enums.Level
    ord?: IntFieldUpdateOperationsInput | number
    heading?: StringFieldUpdateOperationsInput | string
    anchor?: StringFieldUpdateOperationsInput | string
  }

  export type ConceptSectionUncheckedUpdateWithoutConceptInput = {
    level?: EnumLevelFieldUpdateOperationsInput | $Enums.Level
    ord?: IntFieldUpdateOperationsInput | number
    heading?: StringFieldUpdateOperationsInput | string
    anchor?: StringFieldUpdateOperationsInput | string
  }

  export type ConceptSectionUncheckedUpdateManyWithoutConceptInput = {
    level?: EnumLevelFieldUpdateOperationsInput | $Enums.Level
    ord?: IntFieldUpdateOperationsInput | number
    heading?: StringFieldUpdateOperationsInput | string
    anchor?: StringFieldUpdateOperationsInput | string
  }

  export type ConceptVisualUpdateWithoutConceptInput = {
    id?: StringFieldUpdateOperationsInput | string
    level?: EnumLevelFieldUpdateOperationsInput | $Enums.Level
    title?: StringFieldUpdateOperationsInput | string
    kind?: EnumVisualKindFieldUpdateOperationsInput | $Enums.VisualKind
    spec?: JsonNullValueInput | InputJsonValue
    ord?: IntFieldUpdateOperationsInput | number
  }

  export type ConceptVisualUncheckedUpdateWithoutConceptInput = {
    id?: StringFieldUpdateOperationsInput | string
    level?: EnumLevelFieldUpdateOperationsInput | $Enums.Level
    title?: StringFieldUpdateOperationsInput | string
    kind?: EnumVisualKindFieldUpdateOperationsInput | $Enums.VisualKind
    spec?: JsonNullValueInput | InputJsonValue
    ord?: IntFieldUpdateOperationsInput | number
  }

  export type ConceptVisualUncheckedUpdateManyWithoutConceptInput = {
    id?: StringFieldUpdateOperationsInput | string
    level?: EnumLevelFieldUpdateOperationsInput | $Enums.Level
    title?: StringFieldUpdateOperationsInput | string
    kind?: EnumVisualKindFieldUpdateOperationsInput | $Enums.VisualKind
    spec?: JsonNullValueInput | InputJsonValue
    ord?: IntFieldUpdateOperationsInput | number
  }

  export type SourceUpdateWithoutConceptInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    label?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
  }

  export type SourceUncheckedUpdateWithoutConceptInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    label?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
  }

  export type SourceUncheckedUpdateManyWithoutConceptInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    label?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
  }

  export type EdgeUpdateWithoutFromInput = {
    type?: EnumEdgeTypeFieldUpdateOperationsInput | $Enums.EdgeType
    to?: ConceptUpdateOneRequiredWithoutEdgesInNestedInput
  }

  export type EdgeUncheckedUpdateWithoutFromInput = {
    toId?: StringFieldUpdateOperationsInput | string
    type?: EnumEdgeTypeFieldUpdateOperationsInput | $Enums.EdgeType
  }

  export type EdgeUncheckedUpdateManyWithoutFromInput = {
    toId?: StringFieldUpdateOperationsInput | string
    type?: EnumEdgeTypeFieldUpdateOperationsInput | $Enums.EdgeType
  }

  export type EdgeUpdateWithoutToInput = {
    type?: EnumEdgeTypeFieldUpdateOperationsInput | $Enums.EdgeType
    from?: ConceptUpdateOneRequiredWithoutEdgesOutNestedInput
  }

  export type EdgeUncheckedUpdateWithoutToInput = {
    fromId?: StringFieldUpdateOperationsInput | string
    type?: EnumEdgeTypeFieldUpdateOperationsInput | $Enums.EdgeType
  }

  export type EdgeUncheckedUpdateManyWithoutToInput = {
    fromId?: StringFieldUpdateOperationsInput | string
    type?: EnumEdgeTypeFieldUpdateOperationsInput | $Enums.EdgeType
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}