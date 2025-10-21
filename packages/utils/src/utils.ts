import { isAxiosError } from "axios";
import { ZodError } from "zod";

export function getZodErrorMessage(error: ZodError<any>) {
  const errMessage = error.issues.map((issue) => {
    const path = issue.path;
    return `${path.join(", ")}: ${issue.message}`;
  });

  return errMessage.join(", ");
}

export function getAxiosErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    return error.response?.data.message ?? error.response?.data;
  } else {
    return error instanceof Error ? error.message : "Internal Error";
  }
}
