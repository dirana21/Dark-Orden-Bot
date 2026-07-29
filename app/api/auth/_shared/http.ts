import { AuthError } from "@/domain/auth/errors";

export const SESSION_COOKIE = "dark_orden_session";

export function readSessionCookie(request: Request): string {
  const cookie = request.headers.get("cookie") ?? "";
  const prefix = `${SESSION_COOKIE}=`;
  const value = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);

  return value ? decodeURIComponent(value) : "";
}

export function sessionCookie(
  request: Request,
  token: string,
  expiresAt: number,
): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function expiredSessionCookie(request: Request): string {
  return sessionCookie(request, "", 0);
}

export function validateMutationRequest(
  request: Request,
  maxBytes = 8_192,
): Response | null {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > maxBytes) {
    return Response.json(
      { error: "Запрос слишком большой." },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json(
      { error: "Запрос отклонён." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  return null;
}

export function authErrorResponse(error: unknown): Response {
  if (error instanceof AuthError) {
    const status =
      error.code === "USER_EXISTS"
        ? 409
        : error.code === "INVALID_IDENTIFIER"
          ? 403
          : error.code === "FORBIDDEN"
            ? 403
        : error.code === "INVALID_CREDENTIALS" ||
            error.code === "UNAUTHORIZED"
          ? 401
          : error.code === "SERVICE_UNAVAILABLE"
            ? 503
            : 400;

    return Response.json(
      { error: error.message },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }

  console.error("auth.request.failed", {
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  const message = error instanceof Error ? error.message : "";
  if (
    message.includes("D1") ||
    message.includes("database") ||
    message.includes("no such table")
  ) {
    return Response.json(
      { error: "Сервис авторизации временно недоступен." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    { error: "Не удалось выполнить запрос. Попробуйте ещё раз." },
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}
