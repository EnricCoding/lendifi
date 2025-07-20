import { QueryClient } from "@tanstack/react-query";

export const refreshPool = (qc: QueryClient, pool: string, token: string) => {
  /* ---------- poolData (3‑part key) ---------- */
  qc.invalidateQueries({
    queryKey: ["poolData", pool, token],
    exact: true,
  });
  qc.refetchQueries({
    queryKey: ["poolData", pool, token],
    exact: true,
  });

  /* ---------- userPosition (4‑part key) ---------- */
  qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) &&
      q.queryKey[0] === "userPosition" &&
      q.queryKey[1] === pool &&
      q.queryKey[2] === token,
  });
  qc.refetchQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) &&
      q.queryKey[0] === "userPosition" &&
      q.queryKey[1] === pool &&
      q.queryKey[2] === token,
  });
};
