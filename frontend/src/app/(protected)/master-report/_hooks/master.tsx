"use client";

import { useEffect, useState } from "react";
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
  const [searchCode, setSearchCode] = useState("");

  const [debouncedName] = useDebounce(searchName, 500);

  // ✅ Fetch list data
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

      try {
        const response = await api.get(`/api/master-reports?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = response.data.data;
        setPaginationData(parsePaginationData<IReport>(data, parseReports));
      } catch (err: any) {
        if (!axios.isCancel(err)) toast.error(err.message);
      } finally {
        setOnCallApi(false);
      }
    };

    fetchData();
    return () => controller.abort(); // ✅ cancel old requests
  }, [paginationRequest, debouncedName]);

  // ✅ Reset pagination on new search
  useEffect(() => {
    setPaginationRequest((prev) => ({
      ...prev,
      anchorId: 0,
      page: "next",
    }));
  }, [debouncedName]);

  // ✅ POST new report
  const createReport = async (report: Partial<IReport>) => {
    setOnCallApi(true);
    try {
      const res = await api.post("/api/master-reports", report);
      toast.success("Report added successfully!");

      // Optional: refresh list after insert
      setPaginationRequest((prev) => ({
        ...prev,
        anchorId: 0,
        page: "next",
      }));

      return res.data;
    } catch (err: any) {
      console.error("Failed to create report:", err);
      toast.error(err.response?.data?.error || "Failed to add report");
      throw err;
    } finally {
      setOnCallApi(false);
    }
  };

  return {
    onCallApi,
    paginationData,
    paginationRequest,
    setPaginationRequest,
    pageSize,
    setPageSize,
    searchName,
    setSearchName,
    searchCode,
    setSearchCode,
    createReport, // ✅ exposed here
  };
}
