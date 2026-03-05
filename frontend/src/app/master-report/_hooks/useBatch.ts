import { useState } from "react";
import useSWR, { mutate } from "swr";
import { api } from "../../lib/api";
import { toast } from "sonner";

type ApiError = { response?: { data?: { error?: string } } };

export interface Batch {
  id: number;
  batchNo: number;
  startDate: string;
  endDate: string;
  status: string;
  snapshotAt?: string;
  reportCount: number;
}

export function useBatches() {
  const { data, error, isLoading } = useSWR<Batch[]>("/api/batches", async (url: string) => {
    const res = await api.get(url);
    return res.data.data;
  });

  const [creating, setCreating] = useState(false);

  const createBatch = async (startDate: Date, endDate: Date) => {
    setCreating(true);
    try {
      await api.post("/api/batches", {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      await mutate("/api/batches");
      toast.success("Batch created successfully!");
      return true;
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error(error.response?.data?.error || "Failed to create batch");
      return false;
    } finally {
      setCreating(false);
    }
  };

  return {
    batches: data || [],
    loading: isLoading,
    error,
    createBatch,
    isCreating: creating,
  };
}
