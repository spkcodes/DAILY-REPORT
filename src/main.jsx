import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Clipboard, Copy, FileImage, Trash2, Calculator, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import "./styles.css";

function App() {
  const [excelImage, setExcelImage] = useState(null);
  const [previousImage, setPreviousImage] = useState(null);
  const [expenses, setExpenses] = useState("");
  const [closingBalance, setClosingBalance] = useState("");
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [excelValues, setExcelValues] = useState({ cash: "", bank: "", profit: "" });
  const [monthlyValues, setMonthlyValues] = useState({ cash: "", bank: "", profit: "", expense: "" });
  const [report, setReport] = useState("");
  const [checks, setChecks] = useState("");
  const [notice, setNotice] = useState("");
  const [savedReports, setSavedReports] = useState([]);
  const excelInput = useRef(null);
  const previousInput = useRef(null);

  useEffect(() => {
    if ("serviceWorker" in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const setImageFromFile = (file, kind) => {
    if (!file || !file.type.startsWith("image/")) {
      setNotice("Please choose an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = { data: reader.result, name: file.name || "Pasted screenshot" };
      kind === "excel" ? setExcelImage(image) : setPreviousImage(image);
      setNotice("");
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const onPaste = (event) => {
      const active = document.activeElement;
      const target = active?.closest?.("[data-paste-target]");
      const kind = target?.getAttribute("data-paste-target");
      if (!kind) return;
      const items = Array.from(event.clipboardData?.items || []);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      if (imageItem) {
        event.preventDefault();
        setImageFromFile(imageItem.getAsFile(), kind);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  const pasteFromClipboard = async (kind) => {
    try {
      if (!navigator.clipboard?.read) {
        setNotice("Clipboard image access is not available in this browser. Click the image area and press Ctrl+V, or upload the screenshot.");
        return;
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith("image/"));
        if (type) {
          const blob = await item.getType(type);
          setImageFromFile(new File([blob], "pasted-screenshot.png", { type }), kind);
          return;
        }
      }
      setNotice("No image found on the clipboard. Copy a screenshot first, then try again.");
    } catch {
      setNotice("Clipboard permission was blocked. Click the image area and press Ctrl+V, or upload the screenshot.");
    }
  };

  const parseExpenses = () => {
    const lines = expenses.split(/\n/).map((line) => line.trim()).filter(Boolean);
    const parsed = [];
    const invalid = [];
    for (const line of lines) {
      const match = line.match(/^(.*?)[\s:：\-–—]+(?:AED\s*)?([0-9]+(?:\.[0-9]{1,2})?)\s*$/i);
      if (!match || !match[1].trim()) invalid.push(line);
      else parsed.push({ name: match[1].trim(), amount: Number(match[2]) });
    }
    return { parsed, invalid, total: parsed.reduce((sum, item) => sum + item.amount, 0) };
  };

  const numeric = (value) => {
    if (String(value).trim() === "") return null;
    const n = Number(String(value).replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  };
  const fmt = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const generate = () => {
    setNotice("");
    const parsedExpenses = parseExpenses();
    const values = [excelValues.cash, excelValues.bank, excelValues.profit, monthlyValues.cash, monthlyValues.bank, monthlyValues.profit, monthlyValues.expense, closingBalance];
    if (!excelImage || !previousImage) {
      setNotice("Add both screenshots first: today's Excel and the previous WhatsApp report.");
      return;
    }
    if (values.some((v) => numeric(v) === null)) {
      setNotice("Enter all required figures in the manual verification fields. The app currently does not have OCR connected, so confirm the figures from the screenshots yourself.");
      return;
    }
    if (closingBalance.trim() === "") {
      setNotice("Enter today's Closing Balance.");
      return;
    }
    if (parsedExpenses.invalid.length) {
      setNotice(`Please correct these expense lines (use “Name: Amount”): ${parsedExpenses.invalid.join(", ")}`);
      return;
    }
    const cash = numeric(excelValues.cash), bank = numeric(excelValues.bank), profit = numeric(excelValues.profit);
    const prevCash = numeric(monthlyValues.cash), prevBank = numeric(monthlyValues.bank);
    const prevProfit = numeric(monthlyValues.profit), prevExpense = numeric(monthlyValues.expense);
    const monthCash = prevCash + cash, monthBank = prevBank + bank;
    const monthProfit = prevProfit + profit, monthExpense = prevExpense + parsedExpenses.total;
    const dateLabel = new Date(`${reportDate}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "numeric", year: "numeric" });
    const expenseLines = parsedExpenses.parsed.length
      ? parsedExpenses.parsed.map((e) => `${e.name}: ${fmt(e.amount)}`).join("\n")
      : "No expenses";
    const reportText = `DR TEC COMPUTERS – ALTALLAH BRANCH\n📅 Daily Report – ${dateLabel}\n\n━━━━━━━━━━━━━━\n\n🟢 CREDIT (SALES)\n\nTotal Cash: ${fmt(cash)}\nTotal Bank: ${fmt(bank)}\nTotal Profit: ${fmt(profit)}\n\n━━━━━━━━━━━━━━\n\n🔴 DEBIT (EXPENSE)\n\n${expenseLines}\n\nTOTAL: ${fmt(parsedExpenses.total)}\n\n------------------------------------------\n\n📆 MONTHLY TOTAL\n\nTotal Cash: ${fmt(monthCash)}\nTotal Bank: ${fmt(monthBank)}\nTotal Profit: ${fmt(monthProfit)}\nTotal Expense: ${fmt(monthExpense)}\n\nCLOSING BALANCE: ${closingBalance.trim()}`;
    const calculationText = `Cash: ${fmt(prevCash)} + ${fmt(cash)} = ${fmt(monthCash)}\nBank: ${fmt(prevBank)} + ${fmt(bank)} = ${fmt(monthBank)}\nProfit: ${fmt(prevProfit)} + ${fmt(profit)} = ${fmt(monthProfit)}\nExpense: ${fmt(prevExpense)} + ${fmt(parsedExpenses.total)} = ${fmt(monthExpense)}`;
    setReport(reportText);
    setChecks(calculationText);
    setNotice("Report generated from the figures you entered. Please cross-check them against both screenshots before copying.");
  };

  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(`${label} copied. Open WhatsApp and paste it manually.`);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      setNotice(ok ? `${label} copied.` : "Copy failed. Select the text and copy it manually.");
    }
  };

  const clearForm = () => {
    setExcelImage(null); setPreviousImage(null); setExpenses(""); setClosingBalance("");
    setExcelValues({ cash: "", bank: "", profit: "" });
    setMonthlyValues({ cash: "", bank: "", profit: "", expense: "" });
    setReport(""); setChecks(""); setNotice("");
    if (excelInput.current) excelInput.current.value = "";
    if (previousInput.current) previousInput.current.value = "";
  };

  const saveTextOnly = () => {
    if (!report) { setNotice("Generate a report before saving."); return; }
    const entry = { date: reportDate, report, checks, id: Date.now() };
    const next = [entry, ...savedReports];
    setSavedReports(next);
    setNotice("Saved in this page session only. It will not be retained after closing or refreshing the page.");
  };

  const ImageBox = ({ kind, title, image, inputRef }) => (
    <div className="image-section">
      <div className="section-heading"><FileImage size={18} /><h3>{title}</h3></div>
      <div className="paste-zone" data-paste-target={kind} tabIndex="0" role="button" aria-label={`${title}: click and press Ctrl+V to paste`}>
        {image ? <><img className="preview" src={image.data} alt={`${title} preview`} /><p className="muted">{image.name}</p></> :
          <><Upload size={24} /><strong>Click here, then press Ctrl + V</strong><span>Or upload a screenshot/photo</span></>}
      </div>
      <div className="button-row">
        <button className="secondary" onClick={() => inputRef.current?.click()}><Upload size={16} /> Upload image</button>
        <button className="secondary" onClick={() => pasteFromClipboard(kind)}><Clipboard size={16} /> Paste screenshot</button>
        {image && <button className="quiet" onClick={() => kind === "excel" ? setExcelImage(null) : setPreviousImage(null)}>Remove</button>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => setImageFromFile(e.target.files?.[0], kind)} />
    </div>
  );

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand-mark">DR</div>
      <div><p className="eyebrow">DAILY REPORT TOOL</p><h1>DR TEC COMPUTERS</h1><p className="subtitle">ALTALLAH BRANCH</p></div>
      <span className="privacy-pill">Images not saved</span>
    </header>

    <section className="intro card">
      <h2>Prepare today's report</h2>
      <p>Upload or paste both screenshots, enter the figures you read, add expenses and closing balance, then generate and copy the report.</p>
      <div className="notice"><AlertCircle size={17}/><span><strong>Important:</strong> Image OCR is not connected in this starter version. Enter and verify the figures below from your screenshots; the app will calculate monthly totals.</span></div>
    </section>

    <section className="card">
      <div className="section-title"><span className="step">1</span><div><h2>Add screenshots</h2><p>On a computer, click an image area and press Ctrl+V (Windows) or Cmd+V (Mac).</p></div></div>
      <div className="image-grid">
        <ImageBox kind="excel" title="Today's Excel screenshot" image={excelImage} inputRef={excelInput}/>
        <ImageBox kind="previous" title="Previous WhatsApp report" image={previousImage} inputRef={previousInput}/>
      </div>
    </section>

    <section className="card">
      <div className="section-title"><span className="step">2</span><div><h2>Enter and verify figures</h2><p>Read these values from the screenshots. No figures are guessed automatically.</p></div></div>
      <label className="field-label">Report date</label>
      <input className="text-input" type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
      <h3 className="subheading">Today's Excel figures</h3>
      <div className="form-grid three">
        <label><span>Total Cash</span><input className="text-input" inputMode="decimal" placeholder="e.g. 1250" value={excelValues.cash} onChange={(e) => setExcelValues({...excelValues, cash:e.target.value})}/></label>
        <label><span>Total Bank</span><input className="text-input" inputMode="decimal" placeholder="e.g. 800" value={excelValues.bank} onChange={(e) => setExcelValues({...excelValues, bank:e.target.value})}/></label>
        <label><span>Total Profit</span><input className="text-input" inputMode="decimal" placeholder="e.g. 300" value={excelValues.profit} onChange={(e) => setExcelValues({...excelValues, profit:e.target.value})}/></label>
      </div>
      <h3 className="subheading">Previous report — MONTHLY TOTAL section only</h3>
      <div className="form-grid two">
        <label><span>Previous monthly cash</span><input className="text-input" inputMode="decimal" placeholder="Previous monthly cash" value={monthlyValues.cash} onChange={(e) => setMonthlyValues({...monthlyValues, cash:e.target.value})}/></label>
        <label><span>Previous monthly bank</span><input className="text-input" inputMode="decimal" placeholder="Previous monthly bank" value={monthlyValues.bank} onChange={(e) => setMonthlyValues({...monthlyValues, bank:e.target.value})}/></label>
        <label><span>Previous monthly profit</span><input className="text-input" inputMode="decimal" placeholder="Previous monthly profit" value={monthlyValues.profit} onChange={(e) => setMonthlyValues({...monthlyValues, profit:e.target.value})}/></label>
        <label><span>Previous monthly expense</span><input className="text-input" inputMode="decimal" placeholder="Previous monthly expense" value={monthlyValues.expense} onChange={(e) => setMonthlyValues({...monthlyValues, expense:e.target.value})}/></label>
      </div>
      <div className="form-grid two bottom-fields">
        <label><span>Today's shop expenses (one per line: Name: Amount)</span><textarea className="text-input expense-box" rows="5" placeholder={"Tea: 5\nSafwan: 130\nShop Supplies: 20"} value={expenses} onChange={(e) => setExpenses(e.target.value)} /></label>
        <label><span>Closing Balance (type manually)</span><input className="text-input" inputMode="decimal" placeholder="Enter closing balance" value={closingBalance} onChange={(e) => setClosingBalance(e.target.value)}/><small>Used exactly as entered. Not extracted or calculated from Excel.</small></label>
      </div>
      <div className="action-row">
        <button className="primary" onClick={generate}><Calculator size={18}/> Generate Report</button>
        <button className="secondary" onClick={clearForm}><Trash2 size={17}/> Clear Form</button>
      </div>
    </section>

    {notice && <div className="notice status"><CheckCircle2 size={17}/><span>{notice}</span></div>}

    {report && <section className="card result-card">
      <div className="section-title"><span className="step">3</span><div><h2>WhatsApp report</h2><p>Check the figures, then copy and paste into WhatsApp manually.</p></div></div>
      <pre className="report-output">{report}</pre>
      <button className="primary full" onClick={() => copyText(report, "Report")}><Copy size={17}/> Copy Report</button>
      <h3 className="subheading">Cross-check calculations</h3>
      <pre className="report-output compact">{checks}</pre>
      <button className="secondary full" onClick={() => copyText(checks, "Calculations")}><Copy size={17}/> Copy Calculations</button>
      <button className="quiet save-button" onClick={saveTextOnly}>Save report text for this session</button>
      {savedReports.length > 0 && <div className="saved-note">Session saves: {savedReports.length}. These are not stored permanently.</div>}
    </section>}

    <footer>Simple daily reporting · No automatic WhatsApp sending · Screenshot images are held temporarily in this page only</footer>
  </main>;
}

createRoot(document.getElementById("root")).render(<App />);
