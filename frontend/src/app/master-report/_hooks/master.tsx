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
  
  const deferredData = useDeferredValue(paginationData);

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

        console.log("Raw response:", response.data);
        
        let apiData = [];
        
        // Handle the nested structure
        if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
          apiData = response.data.data.data;
        } 
        else if (response.data?.data && Array.isArray(response.data.data)) {
          apiData = response.data.data;
        }
        else if (Array.isArray(response.data)) {
          apiData = response.data;
        }

        console.log("Extracted apiData:", apiData);
        console.log("Number of records:", apiData.length);

        // FIX: parseReports expects an array, not individual items
        let parsedReports: IReport[] = [];
        
        try {
          // If parseReports expects an array, pass the whole array
          parsedReports = parseReports(apiData);
          console.log("Parsed reports (array method):", parsedReports);
        } catch (err) {
          console.error("Error parsing reports as array:", err);
          
          // Fallback: Try parsing individual items
        }

        console.log("Number of parsed reports:", parsedReports.length);

        // --- Extract pagination metadata safely ---
let apiMeta = response.data?.data;

// Build pagination object using backend data
const paginationResult: IPaginationData<IReport> = {
  data: parsedReports,
  firstId: apiMeta?.firstId ?? (parsedReports[0]?.id ?? null),
  lastId: apiMeta?.lastId ?? (parsedReports.at(-1)?.id ?? null),
  pageSize: apiMeta?.pageSize ?? paginationRequest.pageSize,
  hasMore: apiMeta?.hasMore ?? (parsedReports.length >= paginationRequest.pageSize),
  firstPage: apiMeta?.firstPage ?? false, // ✅ use backend flag
};

        console.log("Final pagination result:", paginationResult);

        // Outdated response check
        if (lastQueryRef.current !== queryKey) return;

        const minDelay = new Promise(resolve => {
          pendingTimeoutRef.current = setTimeout(resolve, 150);
        });
        
        await minDelay;

        startTransition(() => {
          setPaginationData(paginationResult);
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

  useEffect(() => {
    startTransition(() => {
      setPaginationRequest((prev) => ({
        ...prev,
        anchorId: 0,
        page: "next",
      }));
    });
  }, [debouncedName]);

  const createReport = async (report: Partial<IReport>) => {
    setOnCallApi(true);
    try {
      const res = await api.post("/api/master-reports", report);
      toast.success("Report added successfully!");
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
    } catch (err: any) {
      console.error("Failed to update report:", err);
      toast.error(err.response?.data?.error || "Failed to update report");
      throw err;
    } finally {
      setOnCallApi(false);
    }
  };

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
    updateReport,
  };
}