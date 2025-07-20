import { QueryClient } from "@tanstack/react-query";

export const refreshPool = (qc: QueryClient, pool: string, token: string) => {
  qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) &&
      q.queryKey[0] === "poolData" &&
      q.queryKey[1] === pool &&
      q.queryKey[2] === token,
  });
  qc.refetchQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) &&
      q.queryKey[0] === "poolData" &&
      q.queryKey[1] === pool &&
      q.queryKey[2] === token,
  });

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
