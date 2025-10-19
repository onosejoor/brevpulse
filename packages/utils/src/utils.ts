import { ZodError } from "zod";

export function getZodErrorMessage(error: ZodError<any>) {
  const errMessage = error.issues.map((issue) => {
    const path = issue.path;
    return `${path.join(", ")}: ${issue.message}`;
  });

  return errMessage.join(", ");
}
