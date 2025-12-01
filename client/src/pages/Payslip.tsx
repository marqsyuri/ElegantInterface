import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Calendar, User, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TopHeader from "@/components/TopHeader";
import PageLayout from "@/components/PageLayout";
import { useLocale } from "@/contexts/LocaleContext";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface PayslipData {
  staffId: number;
  staffName: string;
  totalDuration: number;
  appointmentCount: number;
  procedures: Array<{
    procedureName: string;
    procedureCategory: string;
    count: number;
    totalDuration: number;
  }>;
  appointments: Array<{
    id: number;
    appointmentDate: Date;
    clientName: string;
    procedures: Array<{
      procedureName: string;
      duration: number;
    }>;
    totalDuration: number;
  }>;
}

export default function Payslip() {
  const { t, formatCurrency } = useLocale();
  const { user } = useAuth();
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );

  // Fetch staff list
  const { data: staffList = [], isLoading: staffLoading, error: staffError } = useQuery({
    queryKey: ["/api/staff"],
    retry: false,
  });

  // Fetch payslip data
  const { data: payslipData = [], isLoading, error: payslipError } = useQuery<PayslipData[]>({
    queryKey: ["/api/payslip", selectedStaffId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStaffId) params.append("staffId", selectedStaffId);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/payslip?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch payslip data" }));
        throw new Error(errorData.message || "Failed to fetch payslip data");
      }
      return response.json();
    },
    retry: false,
    enabled: true, // Always enabled, even if no filters
  });

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  // Função para adicionar cabeçalho em cada página
  const addHeader = (doc: jsPDF, pageWidth: number) => {
    const clinicName = user?.clinicName || "Clínica";
    const clinicAddress = user?.clinicAddress || "";
    const clinicPhone = user?.clinicPhone || "";
    const clinicWhatsapp = user?.clinicWhatsapp || "";
    const clinicCnpj = user?.clinicCnpj || "";

    // Linha superior decorativa
    doc.setFillColor(236, 72, 153);
    doc.rect(0, 0, pageWidth, 8, "F");

    // Nome da clínica
    doc.setFontSize(18);
    doc.setTextColor(236, 72, 153);
    doc.setFont("helvetica", "bold");
    doc.text(clinicName, pageWidth / 2, 20, { align: "center" });

    // Informações de contato
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    let infoY = 26;
    
    if (clinicAddress) {
      doc.text(clinicAddress, pageWidth / 2, infoY, { align: "center" });
      infoY += 5;
    }
    
    const contactInfo: string[] = [];
    if (clinicPhone) contactInfo.push(`Tel: ${clinicPhone}`);
    if (clinicWhatsapp) contactInfo.push(`WhatsApp: ${clinicWhatsapp}`);
    if (contactInfo.length > 0) {
      doc.text(contactInfo.join(" | "), pageWidth / 2, infoY, { align: "center" });
      infoY += 5;
    }
    
    if (clinicCnpj) {
      doc.text(`CNPJ: ${clinicCnpj}`, pageWidth / 2, infoY, { align: "center" });
      infoY += 5;
    }

    // Linha separadora
    doc.setDrawColor(236, 72, 153);
    doc.setLineWidth(0.5);
    doc.line(14, infoY + 2, pageWidth - 14, infoY + 2);

    return infoY + 8; // Retorna a posição Y após o cabeçalho
  };

  // Função para adicionar rodapé em cada página
  const addFooter = (doc: jsPDF, pageWidth: number, pageHeight: number, pageNumber: number, totalPages: number) => {
    const clinicName = user?.clinicName || "Clínica";
    const clinicPhone = user?.clinicPhone || "";
    const clinicEmail = user?.email || "";
    const generatedDate = format(new Date(), "dd/MM/yyyy HH:mm");

    // Linha separadora
    doc.setDrawColor(236, 72, 153);
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);

    // Informações do rodapé
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");

    const footerY = pageHeight - 12;
    const footerInfo: string[] = [];
    if (clinicPhone) footerInfo.push(`Tel: ${clinicPhone}`);
    if (clinicEmail) footerInfo.push(`Email: ${clinicEmail}`);
    
    if (footerInfo.length > 0) {
      doc.text(footerInfo.join(" | "), pageWidth / 2, footerY - 6, { align: "center" });
    }

    // Data de geração e número da página
    doc.text(
      `${t("generated_on")} ${generatedDate} | ${t("page")} ${pageNumber} ${t("of")} ${totalPages}`,
      pageWidth / 2,
      footerY,
      { align: "center" }
    );

    // Nome da clínica no rodapé
    doc.setFont("helvetica", "bold");
    doc.setTextColor(236, 72, 153);
    doc.text(clinicName, pageWidth / 2, footerY + 4, { align: "center" });
  };

  const generatePDF = () => {
    try {
      if (payslipData.length === 0) {
        alert(t("no_data_for_pdf"));
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Função para atualizar rodapé em todas as páginas
      const updateFooter = () => {
        // Obter número total de páginas atual
        const totalPagesCount = (doc as any).internal.getNumberOfPages();
        // Atualizar rodapé em todas as páginas
        for (let i = 1; i <= totalPagesCount; i++) {
          doc.setPage(i);
          addFooter(doc, pageWidth, pageHeight, i, totalPagesCount);
        }
      };

      // Adicionar cabeçalho na primeira página
      let yPos = addHeader(doc, pageWidth);

      // Título do relatório
      doc.setFontSize(16);
      doc.setTextColor(236, 72, 153);
      doc.setFont("helvetica", "bold");
      doc.text(t("payslip_report"), pageWidth / 2, yPos, { align: "center" });
      yPos += 8;

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      try {
        const startDateFormatted = format(new Date(startDate), "dd/MM/yyyy");
        const endDateFormatted = format(new Date(endDate), "dd/MM/yyyy");
        doc.text(`${t("period")} ${startDateFormatted} - ${endDateFormatted}`, pageWidth / 2, yPos, { align: "center" });
      } catch (dateError) {
        doc.text(`${t("period")} ${startDate} - ${endDate}`, pageWidth / 2, yPos, { align: "center" });
      }
      yPos += 12;

      // Generate PDF for each staff member
      payslipData.forEach((staff, staffIndex) => {
        if (staffIndex > 0) {
          doc.addPage();
          yPos = addHeader(doc, pageWidth);
        }

        // Staff header
        doc.setFontSize(16);
        doc.setTextColor(236, 72, 153);
        doc.text(`${t("professional")}: ${staff.staffName || "N/A"}`, 14, yPos);
        yPos += 10;

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`${t("total_appointments")} ${staff.appointmentCount || 0}`, 14, yPos);
        yPos += 7;
        doc.text(`${t("total_hours_worked")} ${formatDuration(staff.totalDuration || 0)}`, 14, yPos);
        yPos += 15;

        // Procedures summary table
        if (staff.procedures && staff.procedures.length > 0) {
          doc.setFontSize(12);
          doc.setTextColor(236, 72, 153);
          doc.text(t("procedures_summary"), 14, yPos);
          yPos += 8;

          const proceduresTableData = staff.procedures.map((proc: any) => [
            proc.procedureName || "N/A",
            proc.procedureCategory || "N/A",
            (proc.count || 0).toString(),
            formatDuration(proc.totalDuration || 0),
          ]);

          try {
            (doc as any).autoTable({
              startY: yPos,
              head: [[t("procedure"), t("category"), t("quantity"), t("total_duration")]],
              body: proceduresTableData,
              theme: "striped",
              headStyles: { fillColor: [236, 72, 153], textColor: 255 },
              styles: { fontSize: 9 },
              margin: { left: 14, right: 14 },
            });

            yPos = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : yPos + 50;
          } catch (tableError) {
            console.error("Error creating procedures table:", tableError);
            yPos += 20;
          }
        }

        // Appointments detail table
        if (staff.appointments && staff.appointments.length > 0) {
          // Check if we need a new page
          if (yPos > pageHeight - 80) {
            doc.addPage();
            yPos = addHeader(doc, pageWidth);
          }

          doc.setFontSize(12);
          doc.setTextColor(236, 72, 153);
          doc.text(t("appointment_details"), 14, yPos);
          yPos += 8;

          const appointmentsTableData = staff.appointments.map((apt: any) => {
            let dateStr = "N/A";
            try {
              const aptDate = apt.appointmentDate ? new Date(apt.appointmentDate) : null;
              if (aptDate && !isNaN(aptDate.getTime())) {
                dateStr = format(aptDate, "dd/MM/yyyy HH:mm");
              }
            } catch (e) {
              dateStr = String(apt.appointmentDate || "N/A");
            }

            const proceduresStr = (apt.procedures && Array.isArray(apt.procedures))
              ? apt.procedures.map((p: any) => p.procedureName || "N/A").join(", ")
              : "N/A";

            return [
              dateStr,
              apt.clientName || "N/A",
              proceduresStr,
              formatDuration(apt.totalDuration || 0),
            ];
          });

          try {
            (doc as any).autoTable({
              startY: yPos,
              head: [[t("date_time"), t("client"), t("procedures_label"), t("duration")]],
              body: appointmentsTableData,
              theme: "striped",
              headStyles: { fillColor: [236, 72, 153], textColor: 255 },
              styles: { fontSize: 8 },
              margin: { left: 14, right: 14 },
            });
          } catch (tableError) {
            console.error("Error creating appointments table:", tableError);
          }
        }
      });

      // Atualizar rodapé em todas as páginas com o número correto
      updateFooter();

      // Save PDF
      try {
        const startDateFormatted = format(new Date(startDate), "yyyy-MM-dd");
        const endDateFormatted = format(new Date(endDate), "yyyy-MM-dd");
        const fileName = `payslip_${startDateFormatted}_${endDateFormatted}.pdf`;
        doc.save(fileName);
      } catch (dateError) {
        const fileName = `payslip_${Date.now()}.pdf`;
        doc.save(fileName);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(`${t("error_generating_pdf")} ${error instanceof Error ? error.message : t("unexpected_error")}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopHeader />
      <PageLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{t("payslip_report")}</h1>
              <p className="text-slate-600 mt-1">{t("payslip_report_subtitle")}</p>
            </div>
            <Button
              onClick={generatePDF}
              disabled={payslipData.length === 0}
              className="bg-pink-600 hover:bg-pink-700"
            >
              <Download className="w-4 h-4 mr-2" />
              {t("download_pdf")}
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>{t("filters")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="staff">{t("professional")}</Label>
                  <Select value={selectedStaffId || "all"} onValueChange={(value) => setSelectedStaffId(value === "all" ? "" : value)}>
                    <SelectTrigger id="staff">
                      <SelectValue placeholder={t("all_professionals")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("all_professionals")}</SelectItem>
                      {Array.isArray(staffList) && staffList.map((staff: any) => (
                        <SelectItem key={staff.id} value={staff.id.toString()}>
                          {staff.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="startDate">{t("start_date")}</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">{t("end_date")}</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Messages */}
          {(staffError || payslipError) && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-red-500 mb-4">
                  <p className="font-semibold">{t("error_loading_data")}</p>
                  <p className="text-sm mt-2">
                    {staffError?.message || payslipError?.message || t("unexpected_error")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {isLoading || staffLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="w-8 h-8 animate-spin mx-auto mb-4 border-2 border-pink-600 border-t-transparent rounded-full"></div>
                <p className="text-slate-500">{t("loading_data")}</p>
              </CardContent>
            </Card>
          ) : payslipError ? null : payslipData.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">{t("no_data_for_period")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {payslipData.map((staff) => (
                <Card key={staff.staffId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-pink-600" />
                        <CardTitle>{staff.staffName}</CardTitle>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{staff.appointmentCount} {t("appointments_count")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatDuration(staff.totalDuration)}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Procedures Summary */}
                    {staff.procedures.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4 text-slate-900">{t("procedures_summary")}</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-pink-50">
                                <th className="border border-slate-200 px-4 py-2 text-left font-semibold text-slate-900">{t("procedure")}</th>
                                <th className="border border-slate-200 px-4 py-2 text-left font-semibold text-slate-900">{t("category")}</th>
                                <th className="border border-slate-200 px-4 py-2 text-center font-semibold text-slate-900">{t("quantity")}</th>
                                <th className="border border-slate-200 px-4 py-2 text-center font-semibold text-slate-900">{t("total_duration")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {staff.procedures.map((proc, index) => (
                                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                  <td className="border border-slate-200 px-4 py-2 text-slate-700">{proc.procedureName}</td>
                                  <td className="border border-slate-200 px-4 py-2 text-slate-600">{proc.procedureCategory}</td>
                                  <td className="border border-slate-200 px-4 py-2 text-center text-slate-700">{proc.count}</td>
                                  <td className="border border-slate-200 px-4 py-2 text-center text-slate-700">{formatDuration(proc.totalDuration)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Appointments Detail */}
                    {staff.appointments.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-slate-900">{t("appointment_details")}</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-pink-50">
                                <th className="border border-slate-200 px-4 py-2 text-left font-semibold text-slate-900">{t("date_time")}</th>
                                <th className="border border-slate-200 px-4 py-2 text-left font-semibold text-slate-900">{t("client")}</th>
                                <th className="border border-slate-200 px-4 py-2 text-left font-semibold text-slate-900">{t("procedures_label")}</th>
                                <th className="border border-slate-200 px-4 py-2 text-center font-semibold text-slate-900">{t("duration")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {staff.appointments.map((apt) => (
                                <tr key={apt.id} className="bg-white hover:bg-pink-50 transition-colors">
                                  <td className="border border-slate-200 px-4 py-2 text-slate-700">
                                    {format(new Date(apt.appointmentDate), "dd/MM/yyyy HH:mm")}
                                  </td>
                                  <td className="border border-slate-200 px-4 py-2 text-slate-700">{apt.clientName}</td>
                                  <td className="border border-slate-200 px-4 py-2 text-slate-600">
                                    {apt.procedures.map((p) => p.procedureName).join(", ")}
                                  </td>
                                  <td className="border border-slate-200 px-4 py-2 text-center text-slate-700">
                                    {formatDuration(apt.totalDuration)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageLayout>
    </div>
  );
}

