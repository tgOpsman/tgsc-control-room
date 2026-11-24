export const keyMismatch = (out?: number | null, back?: number | null) => out != null && back != null && Number(out) !== Number(back);
/** A faulty return needs fault notes. */
export const returnProblem = (inOrder: boolean, notes: string) => (!inOrder && !notes.trim() ? "Describe the fault" : null);
