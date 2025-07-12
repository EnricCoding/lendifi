/* ─ frontend/lib/refreshPool.ts ─ */
import { QueryClient } from "@tanstack/react-query";

/**
 * Invalida **y** vuelve a pedir los datos de:
 *   • poolData   ["poolData", pool, token]
 *   • userPosition ["userPosition", pool, token, <wallet>]
 *
 *  – Sin importar cuántas instancias de la key estén vivas.
 */
export const refreshPool = (qc: QueryClient, pool: string, token: string) => {
  // poolData
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

  // userPosition (ignoramos el índice-3 que es la wallet)
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
