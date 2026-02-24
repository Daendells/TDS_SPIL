"use client";
import { useEffect, useState, useRef, startTransition, useDeferredValue } from "react";
import { toast } from "sonner";
import { api } from "@/app/lib/api";
import {
  IPaginationData,
  IPaginationRequest,
  IReport,
  IMentoringReport,
} from "@/types/global-types";
import { useDebounce } from "use-debounce";
import axios from "axios";

export function useMasterReports(initialPageSize = 10) {
  const [onCallApi, setOnCallApi] = useState(false);
  const [paginationData, setPaginationData] = useState<IPaginationData<IReport> | null>(null);
  const [availableMentoringReports, setAvailableMentoringReports] = useState<IMentoringReport[]>(
    []
  );
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [paginationRequest, setPaginationRequest] = useState<IPaginationRequest>({
    anchorId: 0,
    page: "next",
    pageSize: initialPageSize,
    filter: "",
    batchId: null,
  });
  const [searchName, setSearchName] = useState("");
  const [debouncedName] = useDebounce(searchName, 500);
  const lastQueryRef = useRef<string>("");
  const pendingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevDebouncedNameRef = useRef<string>("");

  const deferredData = useDeferredValue(paginationData);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setOnCallApi(true);
      const params = new URLSearchParams({
        page: paginationRequest.page,
        page_size: paginationRequest.pageSize.toString(),
      });

      if (paginationRequest.anchorId !== null && paginationRequest.anchorId !== undefined) {
        params.set("anchor_id", paginationRequest.anchorId.toString());
      } else {
        params.set("anchor_id", "0");
      }

      if (paginationRequest.batchId) {
        params.set("batch_id", paginationRequest.batchId.toString());
      }

      if (debouncedName) params.set("query", debouncedName);
      const queryKey = params.toString();
      lastQueryRef.current = queryKey;

      try {
        const response = await api.get(`/api/master-reports?${queryKey}`, {
          signal: controller.signal,
        });

        let apiData = [];

        // Handle the nested structure
        if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
          apiData = response.data.data.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          apiData = response.data.data;
        } else if (Array.isArray(response.data)) {
          apiData = response.data;
        }

        const parsedReports: IReport[] = apiData;

        // Extract pagination metadata safely
        const apiMeta = response.data?.data;

        // Build pagination object using backend data
        const paginationResult: IPaginationData<IReport> = {
          results: parsedReports,
          first_id: apiMeta?.first_id ?? parsedReports[0]?.id ?? null,
          last_id: apiMeta?.last_id ?? parsedReports.at(-1)?.id ?? null,
          page_size: apiMeta?.page_size ?? paginationRequest.pageSize,
          has_more: apiMeta?.has_more ?? parsedReports.length >= paginationRequest.pageSize,
          first_page: apiMeta?.first_page ?? false,
          total: apiMeta?.total ?? 0,
        };

        // Extract available mentoring reports from response
        if (
          apiMeta?.availableMentoringReports &&
          Array.isArray(apiMeta.availableMentoringReports)
        ) {
          setAvailableMentoringReports(apiMeta.availableMentoringReports);
        }

        // Outdated response check
        if (lastQueryRef.current !== queryKey) return;

        const minDelay = new Promise((resolve) => {
          pendingTimeoutRef.current = setTimeout(resolve, 150);
        });

        await minDelay;

        startTransition(() => {
          setPaginationData(paginationResult);
        });
      } catch (err) {
        if (!axios.isCancel(err)) {
          const error = err as { response?: { data?: { error?: string } }; message?: string };
          toast.error(error.response?.data?.error || error.message || "Failed to fetch data");
        }
      } finally {
        setOnCallApi(false);
      }
    };
    fetchData();

    return () => {
      controller.abort();
      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current);
      }
    };
  }, [paginationRequest, debouncedName]);

  useEffect(() => {
    // Only update pagination if the debouncedName actually changed
    if (prevDebouncedNameRef.current !== debouncedName) {
      prevDebouncedNameRef.current = debouncedName;
      startTransition(() => {
        setPaginationRequest((prev) => ({
          ...prev,
          anchorId: 0,
          page: "next",
        }));
      });
    }
  }, [debouncedName]);

  const createReport = async (report: Partial<IReport>) => {
    setOnCallApi(true);
    try {
      const payload = {
        ...report,
        batchId: paginationRequest.batchId,
      };
      const res = await api.post("/api/master-reports", payload);
      toast.success("Report added successfully!");
      startTransition(() => {
        setPaginationRequest((prev) => ({
          ...prev,
          anchorId: 0,
          page: "next",
        }));
      });
      return res.data;
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to add report");
      throw err;
    } finally {
      setOnCallApi(false);
    }
  };

  const deleteReport = async (id: number) => {
    setOnCallApi(true);
    try {
      const res = await api.delete(`/api/master-reports/${id}`);
      toast.success("Report deleted successfully!");

      startTransition(() => {
        setPaginationRequest((prev) => ({
          ...prev,
          anchorId: 0,
          page: "next",
        }));
      });

      return res.data;
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to delete report");
      throw err;
    } finally {
      setOnCallApi(false);
    }
  };

  const updateReport = async (id: number, updates: Partial<IReport>) => {
    setOnCallApi(true);
    try {
      const res = await api.put(`/api/master-reports/${id}`, updates);
      toast.success("Report updated successfully!");

      startTransition(() => {
        setPaginationRequest((prev) => ({
          ...prev,
          anchorId: 0,
          page: "next",
        }));
      });

      return res.data;
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to update report");
      throw err;
    } finally {
      setOnCallApi(false);
    }
  };

  const refreshAllReadiness = async () => {
    setOnCallApi(true);
    try {
      await api.post("/api/idp-tracking/refresh-all");
      toast.success("Readiness refreshed for all participants!");

      startTransition(() => {
        setPaginationRequest((prev) => ({
          ...prev,
          anchorId: 0,
          page: "next",
        }));
      });
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to refresh readiness");
      throw err;
    } finally {
      setOnCallApi(false);
    }
  };

  const bulkAssignBatch = async (reportIds: number[], batchId: number | null) => {
    setOnCallApi(true);
    try {
      const res = await api.post("/api/master-reports/bulk-assign-batch", {
        reportIds,
        batchId,
      });
      toast.success(`${reportIds.length} report(s) assigned to batch!`);
      startTransition(() => {
        setPaginationRequest((prev) => ({
          ...prev,
          anchorId: 0,
          page: "next",
        }));
      });
      return res.data;
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to assign batch");
      throw err;
    } finally {
      setOnCallApi(false);
    }
  };

  const refreshPersonalData = async () => {
    setOnCallApi(true);
    try {
      await api.post("/reports/refresh-personal-data");
      toast.success("Personal data refreshed successfully!");

      startTransition(() => {
        setPaginationRequest((prev) => ({
          ...prev,
          anchorId: 0,
          page: "next",
        }));
      });
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to refresh personal data");
      throw err;
    } finally {
      setOnCallApi(false);
    }
  };

  return {
    onCallApi,
    paginationData: deferredData,
    availableMentoringReports,
    paginationRequest,
    setPaginationRequest,
    pageSize,
    setPageSize,
    searchName,
    setSearchName,
    createReport,
    deleteReport,
    updateReport,
    bulkAssignBatch,
    refreshAllReadiness,
    refreshPersonalData,
  };
}
