"use client";

import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchIcon } from "lucide-react";
import Image from "next/image";

interface VesselHistoryRecord {
  transactionDate: string;
  fromVessel: string;
  toVessel: string;
  fromRank: string;
  toRank: string;
  type: string;
}

interface VesselHistoryDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  vesselHistory: string;
  reportName?: string;
}

export default function VesselHistoryDialog({
  open,
  setOpen,
  vesselHistory,
  reportName = "Unknown",
}: VesselHistoryDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (open) {
      setSearchTerm("");
    }
  }, [open]);

  const parseVesselHistory = (data: string): VesselHistoryRecord[] => {
    if (!data) return [];

    // Try to parse as JSON array
    try {
      const history = JSON.parse(data);
      if (Array.isArray(history)) {
        return history.map(
          (item: {
            transaction_date?: string;
            from_vessel?: string;
            to_vessel?: string;
            from_rank?: string;
            to_rank?: string;
            type?: string;
          }) => ({
            transactionDate: item.transaction_date || "-",
            fromVessel: item.from_vessel || "-",
            toVessel: item.to_vessel || "-",
            fromRank: item.from_rank || "-",
            toRank: item.to_rank || "-",
            type: item.type || "-",
          })
        );
      }
    } catch {
      // If JSON parse fails, return empty array
      return [];
    }

    return [];
  };

  const vesselHistoryData = useMemo(() => {
    const parsed = parseVesselHistory(vesselHistory);
    // Sort by transaction_date DESC (newest first)
    return parsed.sort((a, b) => {
      if (a.transactionDate === "-" || b.transactionDate === "-") return 0;
      return new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();
    });
  }, [vesselHistory]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return vesselHistoryData;
    const searchLower = searchTerm.toLowerCase();
    return vesselHistoryData.filter(
      (record) =>
        record.toVessel.toLowerCase().includes(searchLower) ||
        record.fromVessel.toLowerCase().includes(searchLower) ||
        record.toRank.toLowerCase().includes(searchLower) ||
        record.fromRank.toLowerCase().includes(searchLower) ||
        record.type.toLowerCase().includes(searchLower)
    );
  }, [vesselHistoryData, searchTerm]);

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "-") return "-";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="!w-[90vw] !max-w-[1200px] !h-[80vh] top-[5vh] translate-y-0 flex flex-col"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Data History Vessel</DialogTitle>
          <div className="flex justify-between items-center border-b pb-4">
            <Image
              width={48}
              height={48}
              src="/images/logo1.png"
              alt="Logo Kiri"
              className="h-12"
            />
            <div className="text-center">
              <h1 className="text-2xl font-bold uppercase">Data History Vessel</h1>
              <p className="text-sm text-gray-600">{reportName}</p>
            </div>
            <Image
              width={48}
              height={48}
              src="/images/logo2.png"
              alt="Logo Kanan"
              className="h-12"
            />
          </div>
        </DialogHeader>

        <div className="pt-4 pb-2">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari vessel, rank, atau tipe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border rounded-lg">
          {filteredData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 text-lg mb-2">Tidak ada data vessel history</p>
                <p className="text-gray-400 text-sm">
                  {searchTerm
                    ? "Tidak ada history yang sesuai dengan pencarian"
                    : "Belum ada data vessel history yang tersedia"}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-100 text-black z-10">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold border border-gray-300">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-semibold border border-gray-300">
                      From Vessel
                    </th>
                    <th className="px-4 py-3 text-left font-semibold border border-gray-300">
                      To Vessel
                    </th>
                    <th className="px-4 py-3 text-left font-semibold border border-gray-300">
                      From Rank
                    </th>
                    <th className="px-4 py-3 text-left font-semibold border border-gray-300">
                      To Rank
                    </th>
                    <th className="px-4 py-3 text-left font-semibold border border-gray-300">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((record, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 border-b">
                      <td className="px-4 py-3 border whitespace-nowrap">
                        {formatDate(record.transactionDate)}
                      </td>
                      <td className="px-4 py-3 border">{record.fromVessel}</td>
                      <td className="px-4 py-3 border">{record.toVessel}</td>
                      <td className="px-4 py-3 border">{record.fromRank}</td>
                      <td className="px-4 py-3 border">{record.toRank}</td>
                      <td className="px-4 py-3 border">{record.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 pt-4 border-t">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              Showing {filteredData.length} of {vesselHistoryData.length} records
            </span>
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
