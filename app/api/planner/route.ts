import { AuthError } from "@/domain/auth/errors";
import { PlannerError } from "@/domain/planner/errors";
import { authUseCases } from "../auth/_shared/dependencies";
import {
  authErrorResponse,
  readSessionCookie,
  validateMutationRequest,
} from "../auth/_shared/http";
import { plannerUseCases } from "./_shared/dependencies";

async function requireSessionUser(request: Request) {
  const user = await authUseCases.getSession.execute(readSessionCookie(request));
  if (!user) {
    throw new AuthError(
      "UNAUTHORIZED",
      "Войдите в аккаунт, чтобы открыть личный план.",
    );
  }
  return user;
}

function plannerErrorResponse(error: unknown): Response {
  if (error instanceof PlannerError) {
    return Response.json(
      { error: error.message },
      {
        status:
          error.code === "NOT_FOUND"
            ? 404
            : error.code === "FORBIDDEN"
              ? 403
              : 400,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  return authErrorResponse(error);
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser(request);
    const params = new URL(request.url).searchParams;
    const tasks = await plannerUseCases.list.execute(
      user.id,
      user.guildId,
      params.get("daily"),
      params.get("weekly"),
      params.get("monthly"),
    );

    return Response.json(
      { tasks },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return plannerErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const rejected = validateMutationRequest(request);
  if (rejected) {
    return rejected;
  }

  try {
    const user = await requireSessionUser(request);
    const input = (await request.json()) as {
      kind?: unknown;
      scope?: unknown;
      title?: unknown;
    };
    const task = await plannerUseCases.create.execute(user, input);

    return Response.json(
      { task },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return plannerErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const rejected = validateMutationRequest(request);
  if (rejected) {
    return rejected;
  }

  try {
    const user = await requireSessionUser(request);
    const input = (await request.json()) as {
      id?: unknown;
      completed?: unknown;
      dailyPeriod?: unknown;
      weeklyPeriod?: unknown;
      monthlyPeriod?: unknown;
    };
    const task = await plannerUseCases.setCompleted.execute(
      user.id,
      user.guildId,
      input.id,
      input.completed,
      input.dailyPeriod,
      input.weeklyPeriod,
      input.monthlyPeriod,
    );

    return Response.json(
      { task },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return plannerErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  const rejected = validateMutationRequest(request);
  if (rejected) {
    return rejected;
  }

  try {
    const user = await requireSessionUser(request);
    const taskId = new URL(request.url).searchParams.get("id");
    await plannerUseCases.delete.execute(user, taskId);

    return Response.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return plannerErrorResponse(error);
  }
}
