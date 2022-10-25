export interface Env {}

type RequestMethod = "get" | "put" | "patch" | "post" | "delete" | "options";

const REQUEST_HANDLERS: RequestHandler = {
  get: [],
  put: [],
  patch: [],
  post: [],
  delete: [],
  options: [],
};

export type RoutePath = URLPatternURLPatternInit | string;

type RouteParams = Record<string, string | undefined>;
interface RouteHandler<T extends RouteParams = Record<string, string>> {
  (params: T, req: Request, env: unknown, ctx: ExecutionContext):
    | Response
    | Promise<Response>;
}

type Router<T extends RequestMethod> = {
  [k in T as `${Lowercase<k>}`]: <U extends RouteParams>(
    path: RoutePath,
    handler: RouteHandler<U>
  ) => void;
};

type RequestMethodHandler = [URLPattern, RouteHandler];

type RequestHandler = {
  [method in RequestMethod]: RequestMethodHandler[];
};

function getRequestMethodsWithHandlers(methodHandlers: RequestHandler) {
  return Object.entries(methodHandlers)
    .filter(([k, v]) => v.length > 0)
    .map(([k, v]) => k as RequestMethod);
}

function addRoute(method: RequestMethod) {
  return (path: RoutePath, handler: RouteHandler) => {
    REQUEST_HANDLERS[method].push([routePathToUrlPattern(path), handler]);
  };
}

function routePathToUrlPattern(path: RoutePath) {
  return typeof path === "string"
    ? new URLPattern({ pathname: path })
    : new URLPattern(path);
}

export function createRouter<T extends RequestMethod>(...methods: T[]) {
  return Object.fromEntries(methods.map((m) => [m, addRoute(m)])) as Router<T>;
}

function sortPatternByPathLength(
  a: [URLPattern, RouteHandler],
  b: [URLPattern, RouteHandler]
) {
  return a[0].pathname.length - b[0].pathname.length;
}

function patternResultNotNull(
  pattern: [URLPatternURLPatternResult | null, RouteHandler]
): pattern is [URLPatternURLPatternResult, RouteHandler] {
  return pattern[0] !== null;
}

function findMatchingRoute(method: RequestMethod, url: string) {
  const match = REQUEST_HANDLERS[method]
    .sort(sortPatternByPathLength)
    .map(([pattern, handler]) => {
      const result: [URLPatternURLPatternResult | null, RouteHandler] = [
        pattern.exec(url),
        handler,
      ];
      return result;
    })
    .filter(patternResultNotNull)
    .pop();

  return !match ? [null, null] : match;
}

const isSupportedMethod = (
  method: RequestMethod | string
): method is RequestMethod =>
  getRequestMethodsWithHandlers(REQUEST_HANDLERS).includes(
    method as RequestMethod
  );

export function createFetchHandler<E = unknown>(
  defaultHandler: ExportedHandlerFetchHandler<E>
) {
  return {
    async fetch(
      req: Request,
      env: E,
      ctx: ExecutionContext
    ): Promise<Response> {
      const method = req.method.toLowerCase();
      if (!isSupportedMethod(method)) return defaultHandler(req, env, ctx);
      const [params, handler] = findMatchingRoute(
        method as RequestMethod,
        req.url
      );
      if (params && handler) {
        return handler(params.pathname.groups, req, env, ctx);
      } else {
        return defaultHandler(req, env, ctx);
      }
    },
  };
}
