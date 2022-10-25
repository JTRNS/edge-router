const REQUEST_HANDLERS = {
    get: [],
    put: [],
    patch: [],
    post: [],
    delete: [],
    options: [],
};
function getRequestMethodsWithHandlers(methodHandlers) {
    return Object.entries(methodHandlers)
        .filter(([k, v]) => v.length > 0)
        .map(([k, v]) => k);
}
function addRoute(method) {
    return (path, handler) => {
        REQUEST_HANDLERS[method].push([routePathToUrlPattern(path), handler]);
    };
}
function routePathToUrlPattern(path) {
    return typeof path === "string"
        ? new URLPattern({ pathname: path })
        : new URLPattern(path);
}
export function createRouter(...methods) {
    return Object.fromEntries(methods.map((m) => [m, addRoute(m)]));
}
function sortPatternByPathLength(a, b) {
    return a[0].pathname.length - b[0].pathname.length;
}
function patternResultNotNull(pattern) {
    return pattern[0] !== null;
}
function findMatchingRoute(method, url) {
    const match = REQUEST_HANDLERS[method]
        .sort(sortPatternByPathLength)
        .map(([pattern, handler]) => {
        const result = [
            pattern.exec(url),
            handler,
        ];
        return result;
    })
        .filter(patternResultNotNull)
        .pop();
    return !match ? [null, null] : match;
}
const isSupportedMethod = (method) => getRequestMethodsWithHandlers(REQUEST_HANDLERS).includes(method);
export function createFetchHandler(defaultHandler) {
    return {
        async fetch(req, env, ctx) {
            const method = req.method.toLowerCase();
            if (!isSupportedMethod(method))
                return defaultHandler(req, env, ctx);
            const [params, handler] = findMatchingRoute(method, req.url);
            if (params && handler) {
                return handler(params.pathname.groups, req, env, ctx);
            }
            else {
                return defaultHandler(req, env, ctx);
            }
        },
    };
}
