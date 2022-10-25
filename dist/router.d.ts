/// <reference types="@cloudflare/workers-types" />
export interface Env {
}
declare type RequestMethod = "get" | "put" | "patch" | "post" | "delete" | "options";
export declare type RoutePath = URLPatternURLPatternInit | string;
declare type RouteParams = Record<string, string | undefined>;
interface RouteHandler<T extends RouteParams = Record<string, string>> {
    (params: T, req: Request, env: unknown, ctx: ExecutionContext): Response | Promise<Response>;
}
declare type Router<T extends RequestMethod> = {
    [k in T as `${Lowercase<k>}`]: <U extends RouteParams>(path: RoutePath, handler: RouteHandler<U>) => void;
};
export declare function createRouter<T extends RequestMethod>(...methods: T[]): Router<T>;
export declare function createFetchHandler<E = unknown>(defaultHandler: ExportedHandlerFetchHandler<E>): {
    fetch(req: Request, env: E, ctx: ExecutionContext): Promise<Response>;
};
export {};
