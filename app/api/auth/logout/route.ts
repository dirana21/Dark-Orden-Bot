import { authUseCases } from "../_shared/dependencies";
import {
  authErrorResponse,
  expiredSessionCookie,
  readSessionCookie,
  validateMutationRequest,
} from "../_shared/http";

export async function POST(request: Request) {
  const rejected = validateMutationRequest(request);
  if (rejected) {
    return rejected;
  }

  try {
    await authUseCases.logout.execute(readSessionCookie(request));
    return Response.json(
      { ok: true },
      {
        headers: {
          "Cache-Control": "no-store",
          "Set-Cookie": expiredSessionCookie(request),
        },
      },
    );
  } catch (error) {
    return authErrorResponse(error);
  }
}
