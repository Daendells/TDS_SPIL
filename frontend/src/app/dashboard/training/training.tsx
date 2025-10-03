"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface IMateri {
  id: number;
  kode: string;
  topik: string;
  tools: string;
  referensi: string;
  attachment?: string;
}

export default function MateriTable() {
  // Dummy data
  const [data, setData] = useState<IMateri[]>([
    {
      id: 1,
      kode: "LAG",
      topik: "Knowledge Transformation",
      tools: "SECI Model (Nonaka & Takeuchi)",
      referensi: "https://reactjs.org/docs/getting-started.html",
      attachment: "https://example.com/file1.pdf",
    },
    {
      id: 2,
      kode: "DCM",
      topik: "Quick Decision Making",
      tools: "OODA Loop (Observe, Orient, Decide, Act)",
      referensi: "https://www.typescriptlang.org/docs/",
    },
    {
      id: 3,
      kode: "ING",
      topik: "Right vs Right Dilemmas in Leadership",
      tools: "Kidder’s Ethical Decision-Making Framework",
      referensi: "https://nextjs.org/docs/routing/introduction",
      attachment: "https://example.com/file3.pdf",
    },
  ]);

  // Handler Generate
  const handleGenerate = (item: IMateri) => {
    // Contoh: bisa diganti dengan logika API atau PDF generation
    alert(`Generate materi untuk ${item.topik} (${item.kode})`);
  };

  return (
    <div className="grid grid-cols-1 overflow-auto rounded-md border mt-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">Kode</TableHead>
            <TableHead className="text-center">Topik</TableHead>
            <TableHead className="text-center">Tools</TableHead>
            <TableHead className="text-center">Referensi</TableHead>
            <TableHead className="text-center">Generate</TableHead>
            <TableHead className="text-center">Attachment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data && data.length > 0 ? (
            data.map((item) => (
              <TableRow
                key={item.id}
                className="hover:bg-gray-100 cursor-pointer"
              >
                <TableCell className="text-center font-medium">
                  {item.kode}
                </TableCell>
                <TableCell className="text-center">{item.topik}</TableCell>
                <TableCell className="text-center">{item.tools}</TableCell>
                <TableCell className="text-center">
                  <a
                    href={item.referensi}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    Link
                  </a>
                </TableCell>
                <TableCell className="text-center">
                  <Button size="sm" onClick={() => handleGenerate(item)}>
                    Generate
                  </Button>
                </TableCell>
                <TableCell className="text-center">
                  {item.attachment ? (
                    <a
                      href={item.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline"
                    >
                      View
                    </a>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center font-bold text-gray-400"
              >
                No Data
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
