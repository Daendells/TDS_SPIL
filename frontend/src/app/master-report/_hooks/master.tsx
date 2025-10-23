"use client";
import { useEffect, useState, useRef, startTransition, useDeferredValue } from "react";
import { toast } from "sonner";
import { useApi } from "@/hooks/use-api";
import { IPaginationData, IPaginationRequest, IReport } from "@/types/global-types";
import { parsePaginationData, parseReports } from "@/lib/utils";
import { useDebounce } from "use-debounce";
import axios from "axios";

export function useMasterReports(initialPageSize = 10) {
  const api = useApi();
  const [onCallApi, setOnCallApi] = useState(false);
  const [paginationData, setPaginationData] = useState<IPaginationData<IReport> | null>(null);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [paginationRequest, setPaginationRequest] = useState<IPaginationRequest>({
    anchorId: 0,
    page: "next",
    pageSize: initialPageSize,
    filter: "",
  });
  const [searchName, setSearchName] = useState("");
  const [debouncedName] = useDebounce(searchName, 500);
  const lastQueryRef = useRef<string>("");
  const pendingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  //  Use deferred value to keep old data visible during loading
  const deferredData = useDeferredValue(paginationData);

  //  Fetch data
  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setOnCallApi(true);
      const params = new URLSearchParams({
        anchor_id: paginationRequest.anchorId!.toString(),
        page: paginationRequest.page,
        page_size: paginationRequest.pageSize.toString(),
      });
      if (debouncedName) params.set("query", debouncedName);
      const queryKey = params.toString();
      lastQueryRef.current = queryKey;

      try {
        const response = await api.get(`/api/master-reports?${queryKey}`, {
          signal: controller.signal,
        });
        const data = response.data.data;
        const parsed = parsePaginationData<IReport>(data, parseReports);

        // Outdated response check
        if (lastQueryRef.current !== queryKey) return;

        //  Add minimum 300ms delay for smooth transition
        const minDelay = new Promise(resolve => {
          pendingTimeoutRef.current = setTimeout(resolve, 150);
        });
        
        await minDelay;

        // Update data in transition for smooth UI
        startTransition(() => {
          setPaginationData(parsed);
        });
      } catch (err: any) {
        if (!axios.isCancel(err)) {
          console.error("Fetch error:", err);
          toast.error(err.response?.data?.error || err.message);
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

  //  Reset pagination on search
  useEffect(() => {
    startTransition(() => {
      setPaginationRequest((prev) => ({
        ...prev,
        anchorId: 0,
        page: "next",
      }));
    });
  }, [debouncedName]);



  //  POST new report
  const createReport = async (report: Partial<IReport>) => {
    setOnCallApi(true);
    try {
      const res = await api.post("/api/master-reports", report);
      toast.success("Report added successfully!");
      // Refresh without flicker
      startTransition(() => {
        setPaginationRequest((prev) => ({
          ...prev,
          anchorId: 0,
          page: "next",
        }));
      });
      return res.data;
    } catch (err: any) {
      console.error("Failed to create report:", err);
      toast.error(err.response?.data?.error || "Failed to add report");
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
    
    // Refresh UI
    startTransition(() => {
      setPaginationRequest((prev) => ({
        ...prev,
        anchorId: 0,
        page: "next",
      }));
    });

    return res.data;
  } catch (err: any) {
    console.error("Failed to delete report:", err);
    toast.error(err.response?.data?.error || "Failed to delete report");
    throw err;
  } finally {
    setOnCallApi(false);
  }
};


  //  Return deferred data (shows old data while loading new)
  return {
    onCallApi,
    paginationData: deferredData,
    paginationRequest,
    setPaginationRequest,
    pageSize,
    setPageSize,
    searchName,
    setSearchName,
    createReport,
    deleteReport,
  };
}