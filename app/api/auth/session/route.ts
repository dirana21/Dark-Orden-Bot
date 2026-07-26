import { authUseCases } from "../_shared/dependencies";
import {
  authErrorResponse,
  expiredSessionCookie,
  readSessionCookie,
} from "../_shared/http";

export async function GET(request: Request) {
  try {
    const user = await authUseCases.getSession.execute(readSessionCookie(request));
    if (!user) {
      return Response.json(
        { user: null },
        {
          headers: {
            "Cache-Control": "no-store",
            "Set-Cookie": expiredSessionCookie(request),
          },
        },
      );
    }

    return Response.json(
      { user },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return authErrorResponse(error);
  }
}
