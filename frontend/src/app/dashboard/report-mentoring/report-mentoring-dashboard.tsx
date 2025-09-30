"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useApi } from "@/hooks/use-api";
import ReportMentoring from "./report-mentoring";
import ReportDetails from "./_components/report-details";

interface IMentoringReport {
  id: number;
  mentorName: string;
  menteeName: string;
  department: string;
  program: string;
  sessionNumber: string;
  date: string;
  duration: string;
  period?: string;
  goals?: string;
  observations?: string;
  reflections?: string;
  actionPlan?: string;
  additionalNotes?: string;
}

interface IPaginationData<T> {
  data: T[];
  hasMore: boolean;
  firstId: number;
  lastId: number;
  firstPage: boolean;
}

type PageType = "next" | "prev";

interface IPaginationRequest {
  anchorId: number;
  page: PageType;
  pageSize: number;
  filter: string;
}

const PAGE_SIZES = [10, 20, 50, 100];

// Dummy
const dummyReports: IMentoringReport[] = [
  {
    id: 1,
    mentorName: "Budi Santoso",
    menteeName: "Ahmad Rizki",
    department: "Engineering",
    program: "MDP",
    sessionNumber: "1",
    date: "2023-10-15",
    duration: "60 menit",
    period: "Oktober 2023",
    goals: "Meningkatkan kemampuan leadership dan pengambilan keputusan",
    observations: "Mentee menunjukkan antusiasme yang tinggi dan aktif bertanya. Memiliki potensi kepemimpinan yang baik namun masih perlu bimbingan dalam pengambilan keputusan yang kompleks.",
    reflections: "Sesi berjalan dengan baik. Mentee memiliki kemauan belajar yang tinggi dan terbuka terhadap masukan.",
    actionPlan: "1. Mentee akan mengambil peran lebih dalam project berikutnya\n2. Akan diberikan tugas untuk memimpin diskusi tim mingguan\n3. Pertemuan berikutnya akan fokus pada studi kasus pengambilan keputusan",
    additionalNotes: "Perlu mempertimbangkan untuk memberikan pelatihan formal tentang manajemen konflik"
  },
  {
    id: 2,
    mentorName: "Siti Rahayu",
    menteeName: "Dewi Putri",
    department: "Finance",
    program: "FDP",
    sessionNumber: "2",
    date: "2023-10-20",
    duration: "45 menit",
    period: "Oktober 2023",
    goals: "Review laporan keuangan dan analisis rasio keuangan",
    observations: "Mentee sudah menguasai dasar-dasar analisis laporan keuangan dengan baik. Masih perlu pengembangan dalam interpretasi hasil analisis untuk pengambilan keputusan strategis.",
    reflections: "Mentee memiliki kemampuan analitis yang kuat. Perlu lebih banyak latihan dalam mempresentasikan temuan analisis kepada stakeholder.",
    actionPlan: "1. Mentee akan menyiapkan analisis keuangan untuk meeting departemen\n2. Akan diberikan kesempatan untuk presentasi di rapat manajemen\n3. Pertemuan berikutnya akan membahas feedback dari presentasi",
    additionalNotes: "Pertimbangkan untuk mengikutsertakan dalam pelatihan komunikasi bisnis"
  },
  {
    id: 3,
    mentorName: "Joko Widodo",
    menteeName: "Rini Susanti",
    department: "HR",
    program: "SDP",
    sessionNumber: "3",
    date: "2023-10-25",
    duration: "90 menit",
    period: "Oktober 2023",
    goals: "Pengembangan strategi rekrutmen dan retensi karyawan",
    observations: "Mentee memiliki pemahaman yang baik tentang proses rekrutmen. Perlu pengembangan dalam strategi retensi karyawan dan analisis turnover.",
    reflections: "Diskusi sangat produktif. Mentee membawa perspektif baru yang berharga tentang employer branding.",
    actionPlan: "1. Mentee akan menganalisis data turnover 6 bulan terakhir\n2. Akan menyusun draft strategi retensi untuk departemen IT\n3. Pertemuan berikutnya akan membahas hasil analisis dan draft strategi",
    additionalNotes: "Rekomendasikan untuk berkolaborasi dengan tim Marketing untuk employer branding"
  },
  {
    id: 4,
    mentorName: "Anita Wijaya",
    menteeName: "Budi Hartono",
    department: "Marketing",
    program: "MDP",
    sessionNumber: "1",
    date: "2023-11-05",
    duration: "60 menit",
    period: "November 2023",
    goals: "Pengenalan digital marketing dan analisis data marketing",
    observations: "Mentee memiliki latar belakang marketing tradisional yang kuat. Perlu bimbingan dalam transisi ke digital marketing dan penggunaan tools analitik.",
    reflections: "Mentee sangat antusias mempelajari hal baru. Perlu waktu untuk adaptasi dengan tools digital marketing.",
    actionPlan: "1. Mentee akan mengikuti kursus online tentang Google Analytics\n2. Akan dilibatkan dalam kampanye digital marketing berikutnya\n3. Pertemuan berikutnya akan membahas hasil kursus dan pengalaman kampanye",
    additionalNotes: "Pertimbangkan untuk memberikan akses ke platform pembelajaran online untuk digital marketing"
  },
  {
    id: 5,
    mentorName: "Hendra Gunawan",
    menteeName: "Lia Permata",
    department: "Operations",
    program: "FDP",
    sessionNumber: "2",
    date: "2023-11-10",
    duration: "75 menit",
    period: "November 2023",
    goals: "Optimasi proses operasional dan manajemen rantai pasok",
    observations: "Mentee menunjukkan pemahaman yang baik tentang proses operasional saat ini. Memiliki ide-ide inovatif untuk optimasi tetapi perlu bimbingan dalam implementasi.",
    reflections: "Diskusi sangat produktif dengan banyak ide yang muncul. Mentee perlu bantuan dalam memprioritaskan ide dan membuat rencana implementasi yang realistis.",
    actionPlan: "1. Mentee akan membuat pemetaan proses untuk 2 area operasional utama\n2. Akan mengidentifikasi 3 area prioritas untuk optimasi\n3. Pertemuan berikutnya akan membahas rencana implementasi untuk area prioritas",
    additionalNotes: "Rekomendasikan untuk berkolaborasi dengan tim IT untuk solusi otomatisasi"
  },
];

export default function ReportMentoringDashboard() {
  const [onCallApi, setOnCallApi] = useState<boolean>(false);
  const api = useApi();

  // Pagination Data
  const [paginationData, setPaginationData] = useState<IPaginationData<IMentoringReport>>({
    data: dummyReports,
    hasMore: false,
    firstId: 1,
    lastId: 5,
    firstPage: true,
  });

  // PageSize
  const [pageSize, setPageSize] = useState(10);
  const [open, setOpen] = useState(false);

  const [openReportForm, setOpenReportForm] = useState(false);
  
  const [openReportDetails, setOpenReportDetails] = useState(false);
  const [selectedReport, setSelectedReport] = useState<IMentoringReport | null>(null);

  // Pagination Mechanism
  const [paginationRequest, setPaginationRequest] =
    useState<IPaginationRequest>({
      anchorId: 0,
      page: "next",
      pageSize: pageSize,
      filter: "",
    });

  // Fetch reports data
  useEffect(() => {
    console.log("Fetching data with params:", paginationRequest);
    
    setPaginationData({
      data: dummyReports,
      hasMore: false,
      firstId: 1,
      lastId: 5,
      firstPage: true,
    });
  }, [paginationRequest]);

  const navigatePage = (page: PageType) => {
    if (!paginationData) return;
    setPaginationRequest({
      ...paginationRequest,
      page: page,
      anchorId:
        page == "next" ? paginationData?.lastId : paginationData?.firstId,
    });
  };

  const handleAddReport = () => {
    setOpenReportForm(true);
  };

  const handleReportSubmitted = () => {
    setOpenReportForm(false);
    toast.success("Laporan mentoring berhasil ditambahkan!");
  };
  
  const handleRowClick = (report: IMentoringReport) => {
    setSelectedReport(report);
    setOpenReportDetails(true);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-bold text-2xl">Dashboard Report Mentoring</h1>
        <Button onClick={handleAddReport} className="flex items-center gap-2">
          <PlusCircle size={16} />
          <span>Add Report</span>
        </Button>
      </div>

      {/* Page Size */}
      <div className="mb-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[6.25rem] justify-between"
            >
              {pageSize}
              <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[6.25rem] p-0">
            <Command>
              <CommandList>
                <CommandGroup>
                  {PAGE_SIZES.map((size) => (
                    <CommandItem
                      key={size}
                      value={size.toString()}
                      onSelect={(currentValue) => {
                        setPageSize(parseInt(currentValue));
                        setPaginationRequest({
                          ...paginationRequest,
                          pageSize: parseInt(currentValue),
                          anchorId: 0,
                          page: "next",
                        });
                        setOpen(false);
                      }}
                    >
                      <CheckIcon
                        className={cn(
                          "mr-2 h-4 w-4",
                          pageSize === size ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {size}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <span className="ml-2">Pages</span>
      </div>

      {/* TABLE */}
      <div className="grid grid-cols-1 overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Nama Mentor</TableHead>
              <TableHead className="text-center">Nama Mentee</TableHead>
              <TableHead className="text-center">Departemen</TableHead>
              <TableHead className="text-center">Program</TableHead>
              <TableHead className="text-center">Sesi ke</TableHead>
              <TableHead className="text-center">Tanggal</TableHead>
              <TableHead className="text-center">Durasi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginationData?.data && paginationData.data.length > 0 ? (
              paginationData.data.map((report) => (
                <TableRow
                  key={report.id}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleRowClick(report)}
                >
                  <TableCell className="text-center">{report.mentorName}</TableCell>
                  <TableCell className="text-center">{report.menteeName}</TableCell>
                  <TableCell className="text-center">{report.department}</TableCell>
                  <TableCell className="text-center">{report.program}</TableCell>
                  <TableCell className="text-center">{report.sessionNumber}</TableCell>
                  <TableCell className="text-center">{report.date}</TableCell>
                  <TableCell className="text-center">{report.duration}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center font-bold text-gray-400"
                >
                  No Data
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <Pagination className="mt-6">
        <PaginationContent className="flex justify-between w-full">
          <PaginationItem>
            <Button
              className="cursor-pointer transition duration-300 active:scale-95 disabled:cursor-not-allowed"
              disabled={paginationData?.firstPage}
              onClick={() => navigatePage("prev")}
            >
              <ChevronLeftIcon />
              Previous
            </Button>
          </PaginationItem>
          <PaginationItem>
            <Button
              className="cursor-pointer transition duration-300 active:scale-95 disabled:cursor-not-allowed"
              disabled={!paginationData?.hasMore}
              onClick={() => navigatePage("next")}
            >
              Next
              <ChevronRightIcon />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Dialog Form Report Mentoring */}
      <Dialog open={openReportForm} onOpenChange={setOpenReportForm}>
        <DialogContent className="!w-[85vw] !max-w-[1400px] !h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Form Report Mentoring</DialogTitle>
          <ReportMentoring />
        </DialogContent>
      </Dialog>
      
      {/* Dialog Detail Report Mentoring */}
      {selectedReport && (
        <ReportDetails
          open={openReportDetails}
          setOpen={setOpenReportDetails}
          report={selectedReport}
        />
      )}
    </>
  );
}