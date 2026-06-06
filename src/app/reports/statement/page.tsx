"use client";

import { useRouter } from "next/navigation";
import { shopInfo, statementEntries, statementSummary } from "@/lib/mock-data";
import { formatCurrencyFull } from "@/lib/utils";

// Helper to calculate running balance safely outside of render to prevent lint errors
const calculateRunningBalances = (entries: typeof statementEntries) => {
  let runningBalance = 0;
  return entries.map((entry) => {
    runningBalance = runningBalance - entry.debit + entry.credit;
    return { ...entry, balance: runningBalance };
  });
};

export default function StatementPreviewPage() {
  const router = useRouter();

  const entriesWithBalance = calculateRunningBalances(statementEntries);

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-[var(--font-body)] text-[14px] leading-[20px] overflow-x-hidden">
      {/* Top App Bar — matching statement_with_upi_qr/code.html */}
      <header className="fixed top-0 w-full z-50 bg-surface flex justify-between items-center px-[16px] h-14">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-transform duration-150 scale-95">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-[var(--font-heading)] text-[20px] leading-[28px] font-bold text-primary">Statement Preview</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-transform duration-150 scale-95 text-on-surface-variant">
            <span className="material-symbols-outlined">print</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-transform duration-150 scale-95 text-on-surface-variant">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>
      </header>

      <main className="mt-14 mb-32 flex-grow p-[16px] w-full">
        <section className="bg-surface-container-lowest rounded-xl shadow-lg overflow-hidden border border-outline-variant paper-texture">
          <div className="p-[24px] space-y-[24px]">
            {/* Shop Info & Statement Header */}
            <div className="flex flex-col justify-between gap-[16px] border-b border-outline-variant pb-[24px]">
              <div className="space-y-[4px]">
                <h2 className="font-[var(--font-heading)] text-[24px] leading-[32px] font-semibold text-primary font-bold">Shop Name</h2>
                <p className="text-on-surface-variant">123, Market Street, Civil Lines</p>
                <p className="text-on-surface-variant">Nagpur, Maharashtra - 440001</p>
                <p className="text-on-surface-variant font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold">Contact: +91 98765 43210</p>
              </div>
              <div className="text-left space-y-[4px]">
                <div className="inline-block px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium">
                  Account Statement
                </div>
                <p className="text-on-surface-variant font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium pt-2">Date: {statementSummary.date}</p>
                <p className="text-on-surface-variant font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium">Time: {statementSummary.time}</p>
                <p className="text-error font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium font-bold">Next Due Date: {statementSummary.nextDueDate}</p>
              </div>
            </div>

            {/* Balance Summary Grid */}
            <div className="grid grid-cols-2 gap-[12px] bg-surface-container-low p-[16px] rounded-xl border border-outline-variant">
              <div className="space-y-[4px]">
                <p className="text-on-surface-variant font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium uppercase tracking-wider">Prev. Balance</p>
                <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold">{formatCurrencyFull(statementSummary.prevBalance)}</p>
              </div>
              <div className="space-y-[4px]">
                <p className="text-on-surface-variant font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium uppercase tracking-wider">Total Udhar</p>
                <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-error">{formatCurrencyFull(statementSummary.totalUdhar)}</p>
              </div>
              <div className="space-y-[4px]">
                <p className="text-on-surface-variant font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium uppercase tracking-wider">Total Paid</p>
                <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-primary">{formatCurrencyFull(statementSummary.totalPaid)}</p>
              </div>
              <div className="space-y-[4px]">
                <p className="text-on-surface-variant font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium uppercase tracking-wider">Net Balance</p>
                <p className="font-[var(--font-heading)] text-[20px] leading-[28px] font-semibold font-bold text-on-surface">{formatCurrencyFull(statementSummary.netBalance)}</p>
                <button className="mt-2 flex items-center gap-1 px-2 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[10px] font-bold uppercase tracking-tighter hover:brightness-110 active:scale-95 transition-all">
                  <span className="material-symbols-outlined text-[14px]">chat</span>
                  WhatsApp Reminder
                </button>
              </div>
            </div>

            {/* Transaction Table */}
            <div className="overflow-x-auto -mx-[24px] px-[24px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-surface-container border-y border-outline-variant">
                    <th className="py-[12px] px-[16px] text-left font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface-variant whitespace-nowrap">Date</th>
                    <th className="py-[12px] px-[16px] text-left font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface-variant">Particulars</th>
                    <th className="py-[12px] px-[16px] text-right font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface-variant">Debit (In)</th>
                    <th className="py-[12px] px-[16px] text-right font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface-variant">Credit (Out)</th>
                    <th className="py-[12px] px-[16px] text-right font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-on-surface-variant">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {entriesWithBalance.map((entry, i) => (
                    <tr key={i}>
                      <td className="py-[16px] px-[16px] whitespace-nowrap text-on-surface-variant">{entry.date}</td>
                      <td className="py-[16px] px-[16px] font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold">{entry.particulars}</td>
                      <td className="py-[16px] px-[16px] text-right text-primary">{formatCurrencyFull(entry.debit)}</td>
                      <td className="py-[16px] px-[16px] text-right text-error">{entry.credit > 0 ? formatCurrencyFull(entry.credit) : formatCurrencyFull(0)}</td>
                      <td className="py-[16px] px-[16px] text-right font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-bold text-on-surface">{formatCurrencyFull(entry.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* QR Code Section */}
            <div className="flex flex-col items-center justify-center py-[24px] bg-surface-container-lowest border-y border-dashed border-outline-variant gap-[12px]">
              <p className="font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold text-primary uppercase tracking-widest">Scan to Pay</p>
              <div className="p-2 bg-white border-2 border-primary rounded-xl shadow-sm">
                <img
                  alt="UPI QR Code"
                  className="w-32 h-32"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAmPenhNPVIk1WFYM1YUnmT8cM-0n6kN0eNRXoesvOOU5FoY8Ui52FOnsgY9xrlAHP8MIP572ydyv6gSKaoyUPnvm06PRG4V3t1cVhpiNQRLgw1Tw2f9owPO8sdrDr2j19DNW0qSnib8XXVHtJGeeBP66MgPt2-NUk5-72jHmlD3TyFz7e-O_CIsr-_ZHGBUQHPKzI7U8rykp4_KwmZYXYzcSScF09WTl1I4nriIWdxdVD-FqGE4DkJPLnE_oluZ0aG9zikQAjWhdL"
                />
              </div>
              <p className="text-on-surface-variant font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium">
                UPI ID: {shopInfo.upiId}
              </p>
            </div>

            {/* Footer */}
            <div className="flex flex-col items-center justify-center pt-[32px] border-t border-dashed border-outline-variant">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary-container text-[18px]">receipt_long</span>
                </div>
                <span className="font-[var(--font-heading)] text-on-surface-variant text-base">Generated via KhataFlow</span>
              </div>
              <p className="text-on-surface-variant font-[var(--font-body)] text-[12px] leading-[16px] tracking-[0.5px] font-medium">
                Manage your business finance efficiently.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Fixed Bottom Actions — matching code.html */}
      <div className="fixed bottom-0 left-0 w-full bg-surface p-[16px] flex flex-col gap-[12px] border-t border-outline-variant shadow-[0_-4px_16px_rgba(0,0,0,0.04)] z-50">
        <button className="w-full px-[24px] py-[12px] bg-primary text-on-primary rounded-full font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold flex items-center justify-center gap-2 shadow-md hover:brightness-110 active:scale-95 transition-all">
          <span className="material-symbols-outlined">share</span>
          Share on WhatsApp
        </button>
        <button className="w-full px-[24px] py-[12px] bg-surface-container-high border border-outline text-on-surface-variant rounded-full font-[var(--font-body)] text-[14px] leading-[20px] tracking-[0.1px] font-semibold flex items-center justify-center gap-2 hover:bg-surface-container-highest active:scale-95 transition-all">
          <span className="material-symbols-outlined">picture_as_pdf</span>
          Download PDF
        </button>
      </div>
    </div>
  );
}
