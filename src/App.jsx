import { useState, useRef } from "react";

/* ═══════════════════════════════════════════════
   BASICTOOLS UK — Landing Page
   Lead tools: Scam Checker + Tax Calculator
   ═══════════════════════════════════════════════ */

const fmt = (n) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n);
const fmtBig = (n) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

/* ─── TAX CALCULATOR (EMBEDDED) ─── */
const TAX_YEARS = {
  "2025/26": { label:"2025/26", pa:12570, brl:50270, hrl:125140, br:0.20, hr:0.40, ar:0.45, c4l:12570, c4u:50270, c4m:0.06, c4a:0.02, c2w:3.50, c2a:182.00, pt:100000 },
  "2026/27": { label:"2026/27", pa:12570, brl:50270, hrl:125140, br:0.20, hr:0.40, ar:0.45, c4l:12570, c4u:50270, c4m:0.06, c4a:0.02, c2w:3.65, c2a:189.80, pt:100000 },
};

function calcTax(profit, yk, pc2) {
  const y = TAX_YEARS[yk];
  let pa = y.pa;
  if (profit > y.pt) pa = Math.max(0, pa - Math.floor((profit - y.pt) / 2));
  const ti = Math.max(0, profit - pa);
  let bt = 0, ht = 0, at = 0;
  if (profit > pa) {
    bt = Math.max(0, Math.min(profit, y.brl) - pa) * y.br;
    if (profit > y.brl) ht = Math.max(0, Math.min(profit, y.hrl) - y.brl) * y.hr;
    if (profit > y.hrl) at = (profit - y.hrl) * y.ar;
  }
  const it = bt + ht + at;
  let c4m = 0, c4a = 0;
  if (profit > y.c4l) {
    c4m = Math.max(0, Math.min(profit, y.c4u) - y.c4l) * y.c4m;
    if (profit > y.c4u) c4a = (profit - y.c4u) * y.c4a;
  }
  const c4 = c4m + c4a, c2 = pc2 ? y.c2a : 0, tot = it + c4 + c2;
  return { pa, ti, bt, ht, at, it, c4m, c4a, c4, c2, tot, th: profit - tot, er: profit > 0 ? (tot/profit)*100 : 0 };
}

function TaxTool({ onBack }) {
  const [inc, setInc] = useState("");
  const [exp, setExp] = useState("");
  const [yk, setYk] = useState("2025/26");
  const [pc2, setPc2] = useState(false);
  const [show, setShow] = useState(false);
  const profit = Math.max(0, (parseFloat(inc)||0) - (parseFloat(exp)||0));
  const r = calcTax(profit, yk, pc2);
  const ok = profit > 0;
  const inp = { width:"100%",padding:"11px 12px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"7px",color:"#fff",fontSize:"15px",fontFamily:"'JetBrains Mono',sans-serif",outline:"none" };
  const lbl = { fontSize:"11px",color:"#888",marginBottom:"5px",display:"block" };
  const sec = { background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"12px",padding:"22px",marginBottom:"14px" };
  const rw = { display:"flex",justifyContent:"space-between",padding:"7px 0",fontSize:"13px",borderBottom:"1px solid rgba(255,255,255,0.04)" };
  const stl = { fontSize:"11px",textTransform:"uppercase",letterSpacing:"1.8px",color:"#f59e0b",fontWeight:"700",marginBottom:"12px" };

  return (
    <div>
      <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"22px" }}>
        <button onClick={onBack} style={{ padding:"8px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"6px",color:"#ccc",fontSize:"13px",cursor:"pointer" }}>← Back</button>
        <div style={{ flex:1 }}><div style={{ fontSize:"19px",fontWeight:"700",color:"#fff" }}>Self-Employed Tax Calculator</div><div style={{ fontSize:"12px",color:"#888" }}>England, Wales & Northern Ireland · 2025/26 & 2026/27</div></div>
      </div>
      <div style={sec}>
        <div style={stl}>Tax Year</div>
        <div style={{ display:"flex",gap:"8px" }}>
          {Object.keys(TAX_YEARS).map(k=><button key={k} onClick={()=>{setYk(k);setShow(false)}} style={{ flex:1,padding:"9px",borderRadius:"7px",border:"1px solid",fontSize:"13px",fontWeight:"600",cursor:"pointer",background:yk===k?"rgba(245,158,11,0.15)":"rgba(255,255,255,0.03)",borderColor:yk===k?"#f59e0b":"rgba(255,255,255,0.08)",color:yk===k?"#f59e0b":"#888" }}>{k}</button>)}
        </div>
      </div>
      <div style={sec}>
        <div style={stl}>Your Numbers</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"14px" }}>
          <div><label style={lbl}>Total Income (£)</label><input style={inp} type="number" min="0" placeholder="e.g. 45000" value={inc} onChange={e=>{setInc(e.target.value);setShow(false)}} /></div>
          <div><label style={lbl}>Allowable Expenses (£)</label><input style={inp} type="number" min="0" placeholder="e.g. 5000" value={exp} onChange={e=>{setExp(e.target.value);setShow(false)}} /></div>
        </div>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 12px",background:"rgba(255,255,255,0.03)",borderRadius:"7px",marginBottom:"14px" }}>
          <div><div style={{ fontSize:"14px",fontWeight:"600",color:"#fff" }}>Taxable Profit</div></div>
          <div style={{ fontSize:"20px",fontWeight:"700",color:"#f59e0b",fontFamily:"'JetBrains Mono',monospace" }}>{fmt(profit)}</div>
        </div>
        <label style={{ display:"flex",alignItems:"center",gap:"8px",fontSize:"13px",color:"#ccc",cursor:"pointer",marginBottom:"14px" }}>
          <input type="checkbox" checked={pc2} onChange={e=>{setPc2(e.target.checked);setShow(false)}} style={{ accentColor:"#f59e0b" }} />
          Voluntary Class 2 NIC ({fmt(TAX_YEARS[yk].c2w)}/week — protects State Pension)
        </label>
        <button onClick={()=>ok&&setShow(true)} disabled={!ok} style={{ width:"100%",padding:"13px",border:"none",borderRadius:"8px",fontSize:"15px",fontWeight:"700",cursor:ok?"pointer":"not-allowed",background:ok?"linear-gradient(135deg,#f59e0b,#d97706)":"rgba(255,255,255,0.05)",color:ok?"#1a1a2e":"#555" }}>Calculate Tax</button>
      </div>
      {show && <>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"14px" }}>
          {[{l:"Total Tax",v:fmt(r.tot),c:"#ef4444"},{l:"Take Home",v:fmt(r.th),c:"#10b981"},{l:"Effective Rate",v:r.er.toFixed(1)+"%",c:"#f59e0b"}].map((c,i)=>
            <div key={i} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"10px",padding:"14px",textAlign:"center" }}>
              <div style={{ fontSize:"10px",color:"#888",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"5px" }}>{c.l}</div>
              <div style={{ fontSize:"17px",fontWeight:"700",color:c.c,fontFamily:"'JetBrains Mono',monospace" }}>{c.v}</div>
            </div>
          )}
        </div>
        <div style={sec}>
          <div style={stl}>Full Breakdown</div>
          <div style={{ fontSize:"11px",color:"#f59e0b",fontWeight:"600",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"1px" }}>Income Tax</div>
          <div style={rw}><span style={{ color:"#888" }}>Personal Allowance</span><span style={{ fontFamily:"'JetBrains Mono',monospace",color:"#10b981" }}>{fmt(r.pa)}</span></div>
          {r.pa<12570&&<div style={{ fontSize:"10px",color:"#ef4444",padding:"3px 0" }}>Reduced (income over £100,000)</div>}
          <div style={rw}><span style={{ color:"#888" }}>Basic rate (20%)</span><span style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmt(r.bt)}</span></div>
          {r.ht>0&&<div style={rw}><span style={{ color:"#888" }}>Higher rate (40%)</span><span style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmt(r.ht)}</span></div>}
          {r.at>0&&<div style={rw}><span style={{ color:"#888" }}>Additional rate (45%)</span><span style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmt(r.at)}</span></div>}
          <div style={{ ...rw,fontWeight:"600",borderBottom:"2px solid rgba(255,255,255,0.08)" }}><span>Income Tax</span><span style={{ fontFamily:"'JetBrains Mono',monospace",color:"#ef4444" }}>{fmt(r.it)}</span></div>
          <div style={{ height:"12px" }} />
          <div style={{ fontSize:"11px",color:"#f59e0b",fontWeight:"600",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"1px" }}>National Insurance</div>
          <div style={rw}><span style={{ color:"#888" }}>Class 4 at 6%</span><span style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmt(r.c4m)}</span></div>
          {r.c4a>0&&<div style={rw}><span style={{ color:"#888" }}>Class 4 at 2% (above £50,270)</span><span style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmt(r.c4a)}</span></div>}
          {r.c2>0&&<div style={rw}><span style={{ color:"#888" }}>Class 2 voluntary</span><span style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmt(r.c2)}</span></div>}
          <div style={{ ...rw,fontWeight:"600",borderBottom:"2px solid rgba(255,255,255,0.08)" }}><span>NIC Total</span><span style={{ fontFamily:"'JetBrains Mono',monospace",color:"#f97316" }}>{fmt(r.c4+r.c2)}</span></div>
          <div style={{ height:"12px" }} />
          <div style={{ display:"flex",justifyContent:"space-between",padding:"10px 0",fontSize:"17px",fontWeight:"700",borderTop:"2px solid rgba(245,158,11,0.3)" }}><span>Total Due to HMRC</span><span style={{ fontFamily:"'JetBrains Mono',monospace",color:"#ef4444" }}>{fmt(r.tot)}</span></div>
          <div style={{ display:"flex",justifyContent:"space-between",padding:"10px 0",fontSize:"19px",fontWeight:"700",color:"#10b981" }}><span>You Keep</span><span style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmt(r.th)}</span></div>
        </div>
        <div style={{ background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.15)",borderRadius:"10px",padding:"16px",marginBottom:"14px" }}>
          <div style={{ fontSize:"13px",fontWeight:"700",color:"#f59e0b",marginBottom:"6px" }}>Set aside each month</div>
          <div style={{ fontSize:"13px",color:"#ccc",lineHeight:"1.5" }}>Save <strong style={{ color:"#fff" }}>{fmt(r.tot/12)}</strong>/month ({r.er.toFixed(1)}% of profit) for your Self Assessment bill.</div>
        </div>
        <div style={{ fontSize:"10px",color:"#555",lineHeight:"1.5",padding:"8px 0" }}>
          <strong style={{ color:"#777" }}>Important:</strong> England, Wales & NI only. Does not include student loans, pensions, or dividends. Rates verified from GOV.UK & House of Commons Library, 31 Mar 2026. Not financial advice.
        </div>
      </>}
    </div>
  );
}

/* ─── INVOICE GENERATOR (EMBEDDED) ─── */
const defaultItem = () => ({ id: Date.now()+Math.random(), description:"", quantity:1, rate:0 });
const formatDate = (iso) => { if(!iso)return""; return new Date(iso+"T00:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}); };

function InvoiceTool({ onBack }) {
  const [step, setStep] = useState(0);
  const [biz, setBiz] = useState({ name:"",address:"",email:"",phone:"",vat:"" });
  const [client, setClient] = useState({ name:"",address:"",email:"" });
  const [items, setItems] = useState([defaultItem()]);
  const [invNo, setInvNo] = useState("INV-001");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState((() => { const d=new Date();d.setDate(d.getDate()+30);return d.toISOString().split("T")[0]; })());
  const [vatRate, setVatRate] = useState(20);
  const [inclVat, setInclVat] = useState(true);
  const [notes, setNotes] = useState("Payment due within 30 days.\nBank transfer preferred.");
  const printRef = useRef();
  const updateItem = (id,f,v) => setItems(p=>p.map(i=>i.id===id?{...i,[f]:v}:i));
  const sub = items.reduce((s,i)=>s+i.quantity*i.rate,0);
  const vat = inclVat ? sub*(vatRate/100) : 0;
  const tot = sub + vat;
  const ok = biz.name && client.name && items.some(i=>i.description&&i.rate>0);
  const inp = { width:"100%",padding:"10px 12px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"6px",color:"#fff",fontSize:"14px",fontFamily:"'DM Sans',sans-serif",outline:"none" };
  const lbl = { fontSize:"11px",color:"#888",marginBottom:"4px",display:"block" };
  const sec = { background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"12px",padding:"22px",marginBottom:"16px" };
  const stl = { fontSize:"11px",textTransform:"uppercase",letterSpacing:"1.8px",color:"#f59e0b",fontWeight:"700",marginBottom:"14px" };

  const handlePrint = () => {
    const w=window.open("","_blank");
    w.document.write(`<html><head><title>Invoice ${invNo}</title><style>@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',sans-serif;color:#1a1a2e;padding:40px;max-width:800px;margin:0 auto}.hd{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;padding-bottom:24px;border-bottom:3px solid #1a1a2e}.bn{font-size:28px;font-weight:700}.bd{font-size:12px;color:#555;margin-top:6px;line-height:1.6}.bg{background:#1a1a2e;color:#fff;padding:8px 20px;font-size:22px;font-weight:700;letter-spacing:1px}table{width:100%;border-collapse:collapse;margin-bottom:24px}th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#888;font-weight:600;padding:10px 12px;border-bottom:2px solid #e0e0e0}th:nth-child(n+2){text-align:right}td{padding:12px;font-size:14px;border-bottom:1px solid #f0f0f0}td:nth-child(n+2){text-align:right;font-family:'JetBrains Mono',monospace;font-size:13px}.ml{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#888;font-weight:600;margin-bottom:4px}.nt{background:#f8f8f8;padding:16px 20px;font-size:12px;color:#666;line-height:1.7;border-left:3px solid #1a1a2e;white-space:pre-wrap}.ft{margin-top:40px;text-align:center;font-size:10px;color:#aaa}@media print{body{padding:20px}}</style></head><body>${printRef.current.innerHTML}<div class="ft">Generated with BasicTools UK</div></body></html>`);
    w.document.close();setTimeout(()=>w.print(),400);
  };

  if (step===0) return (
    <div>
      <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"22px" }}>
        <button onClick={onBack} style={{ padding:"8px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"6px",color:"#ccc",fontSize:"13px",cursor:"pointer" }}>← Back</button>
        <div style={{ flex:1 }}><div style={{ fontSize:"19px",fontWeight:"700",color:"#fff" }}>Invoice Generator</div><div style={{ fontSize:"12px",color:"#888" }}>Professional UK invoices with VAT</div></div>
        <button onClick={()=>ok&&setStep(1)} style={{ padding:"9px 18px",background:ok?"linear-gradient(135deg,#f59e0b,#d97706)":"rgba(255,255,255,0.05)",border:"none",borderRadius:"6px",color:ok?"#1a1a2e":"#555",fontSize:"13px",fontWeight:"700",cursor:ok?"pointer":"not-allowed" }}>Preview →</button>
      </div>
      <div style={sec}><div style={stl}>Your Business</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px" }}>
          <div><label style={lbl}>Business Name *</label><input style={inp} placeholder="e.g. Smith Plumbing Ltd" value={biz.name} onChange={e=>setBiz({...biz,name:e.target.value})} /></div>
          <div><label style={lbl}>Email</label><input style={inp} placeholder="you@business.co.uk" value={biz.email} onChange={e=>setBiz({...biz,email:e.target.value})} /></div>
          <div><label style={lbl}>Address</label><input style={inp} placeholder="123 High Street, London" value={biz.address} onChange={e=>setBiz({...biz,address:e.target.value})} /></div>
          <div><label style={lbl}>Phone</label><input style={inp} placeholder="07xxx xxx xxx" value={biz.phone} onChange={e=>setBiz({...biz,phone:e.target.value})} /></div>
          <div><label style={lbl}>VAT Number</label><input style={inp} placeholder="GB 123 4567 89" value={biz.vat} onChange={e=>setBiz({...biz,vat:e.target.value})} /></div>
        </div>
      </div>
      <div style={sec}><div style={stl}>Bill To</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px" }}>
          <div><label style={lbl}>Client Name *</label><input style={inp} placeholder="Client or company" value={client.name} onChange={e=>setClient({...client,name:e.target.value})} /></div>
          <div><label style={lbl}>Client Email</label><input style={inp} placeholder="client@email.com" value={client.email} onChange={e=>setClient({...client,email:e.target.value})} /></div>
          <div style={{ gridColumn:"1/-1" }}><label style={lbl}>Client Address</label><input style={inp} placeholder="Address" value={client.address} onChange={e=>setClient({...client,address:e.target.value})} /></div>
        </div>
      </div>
      <div style={sec}><div style={stl}>Details</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px" }}>
          <div><label style={lbl}>Invoice #</label><input style={{...inp,fontFamily:"'JetBrains Mono',monospace"}} value={invNo} onChange={e=>setInvNo(e.target.value)} /></div>
          <div><label style={lbl}>Issue Date</label><input style={inp} type="date" value={issueDate} onChange={e=>setIssueDate(e.target.value)} /></div>
          <div><label style={lbl}>Due Date</label><input style={inp} type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} /></div>
        </div>
      </div>
      <div style={sec}><div style={stl}>Items</div>
        {items.map(item=>(
          <div key={item.id} style={{ display:"grid",gridTemplateColumns:"2fr 60px 80px 80px 32px",gap:"6px",alignItems:"center",marginBottom:"6px" }}>
            <input style={inp} placeholder="Description" value={item.description} onChange={e=>updateItem(item.id,"description",e.target.value)} />
            <input style={{...inp,textAlign:"right",fontFamily:"'JetBrains Mono',monospace"}} type="number" min="1" value={item.quantity} onChange={e=>updateItem(item.id,"quantity",Number(e.target.value))} />
            <input style={{...inp,textAlign:"right",fontFamily:"'JetBrains Mono',monospace"}} type="number" min="0" step="0.01" value={item.rate||""} onChange={e=>updateItem(item.id,"rate",Number(e.target.value))} />
            <div style={{ textAlign:"right",fontFamily:"'JetBrains Mono',monospace",fontSize:"13px",color:"#f59e0b",fontWeight:"600" }}>{fmt(item.quantity*item.rate)}</div>
            <button onClick={()=>items.length>1&&setItems(p=>p.filter(i=>i.id!==item.id))} style={{ width:"28px",height:"28px",borderRadius:"5px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",color:"#ef4444",cursor:"pointer",fontSize:"14px" }}>×</button>
          </div>
        ))}
        <button onClick={()=>setItems(p=>[...p,defaultItem()])} style={{ padding:"7px 14px",background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.3)",borderRadius:"6px",color:"#f59e0b",fontSize:"12px",fontWeight:"600",cursor:"pointer",marginTop:"4px" }}>+ Add</button>
        <div style={{ width:"220px",marginLeft:"auto",marginTop:"12px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:"13px",color:"#ccc" }}><span>Subtotal</span><span style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmt(sub)}</span></div>
          <div style={{ display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:"13px",color:"#ccc",alignItems:"center" }}><label style={{ display:"flex",alignItems:"center",gap:"6px",fontSize:"12px",cursor:"pointer" }}><input type="checkbox" checked={inclVat} onChange={e=>setInclVat(e.target.checked)} />VAT ({vatRate}%)</label><span style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmt(vat)}</span></div>
          {inclVat&&<input type="range" min="0" max="25" step="0.5" value={vatRate} onChange={e=>setVatRate(Number(e.target.value))} style={{ width:"100%",accentColor:"#f59e0b" }} />}
          <div style={{ display:"flex",justifyContent:"space-between",padding:"8px 0",fontSize:"20px",fontWeight:"700",color:"#f59e0b",borderTop:"2px solid rgba(245,158,11,0.3)",marginTop:"6px" }}><span>Total</span><span style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmt(tot)}</span></div>
        </div>
      </div>
      <div style={sec}><div style={stl}>Notes</div><textarea style={{...inp,resize:"vertical",minHeight:"50px"}} value={notes} onChange={e=>setNotes(e.target.value)} rows={2} /></div>
    </div>
  );

  // PREVIEW
  return (
    <div>
      <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"22px" }}>
        <button onClick={()=>setStep(0)} style={{ padding:"8px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"6px",color:"#ccc",fontSize:"13px",cursor:"pointer" }}>← Edit</button>
        <div style={{ flex:1,fontSize:"19px",fontWeight:"700",color:"#fff" }}>Invoice Preview</div>
        <button onClick={handlePrint} style={{ padding:"9px 18px",background:"linear-gradient(135deg,#f59e0b,#d97706)",border:"none",borderRadius:"6px",color:"#1a1a2e",fontSize:"13px",fontWeight:"700",cursor:"pointer" }}>Print / PDF</button>
      </div>
      <div ref={printRef} style={{ background:"#fff",color:"#1a1a2e",borderRadius:"12px",padding:"36px" }}>
        <div className="hd" style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"36px",paddingBottom:"20px",borderBottom:"3px solid #1a1a2e" }}>
          <div><div className="bn" style={{ fontSize:"26px",fontWeight:"700" }}>{biz.name}</div><div className="bd" style={{ fontSize:"11px",color:"#555",marginTop:"5px",lineHeight:"1.6" }}>{biz.address&&<>{biz.address}<br/></>}{biz.email&&<>{biz.email}<br/></>}{biz.phone&&<>{biz.phone}<br/></>}{biz.vat&&<>VAT: {biz.vat}</>}</div></div>
          <div className="bg" style={{ background:"#1a1a2e",color:"#fff",padding:"7px 18px",fontSize:"20px",fontWeight:"700",letterSpacing:"1px" }}>INVOICE</div>
        </div>
        <div style={{ display:"flex",gap:"36px",marginBottom:"32px" }}>
          <div style={{ flex:1 }}><div className="ml" style={{ fontSize:"10px",textTransform:"uppercase",letterSpacing:"1.5px",color:"#888",fontWeight:"600",marginBottom:"3px" }}>Bill To</div><div style={{ fontSize:"15px",fontWeight:"700",marginBottom:"3px" }}>{client.name}</div><div style={{ fontSize:"11px",color:"#555",lineHeight:"1.6" }}>{client.address&&<>{client.address}<br/></>}{client.email}</div></div>
          <div>{[["Invoice No.",invNo],["Issue Date",formatDate(issueDate)],["Due Date",formatDate(dueDate)]].map(([l,v],i)=><div key={i} style={{ marginBottom:"10px" }}><div className="ml" style={{ fontSize:"10px",textTransform:"uppercase",letterSpacing:"1.5px",color:"#888",fontWeight:"600",marginBottom:"3px" }}>{l}</div><div style={{ fontSize:"13px",fontWeight:"500",fontFamily:"'JetBrains Mono',monospace",color:i===2?"#dc2626":"#1a1a2e" }}>{v}</div></div>)}</div>
        </div>
        <table style={{ width:"100%",borderCollapse:"collapse",marginBottom:"20px" }}>
          <thead><tr>{["Description","Qty","Rate","Amount"].map((h,i)=><th key={i} style={{ textAlign:i?"right":"left",fontSize:"10px",textTransform:"uppercase",letterSpacing:"1.5px",color:"#888",fontWeight:"600",padding:"9px 11px",borderBottom:"2px solid #e0e0e0" }}>{h}</th>)}</tr></thead>
          <tbody>{items.filter(i=>i.description||i.rate>0).map((item,idx)=><tr key={idx}>{[item.description,item.quantity,fmt(item.rate),fmt(item.quantity*item.rate)].map((v,ci)=><td key={ci} style={{ padding:"10px 11px",fontSize:ci?"12px":"13px",textAlign:ci?"right":"left",borderBottom:"1px solid #f0f0f0",fontFamily:ci?"'JetBrains Mono',monospace":"inherit",fontWeight:ci===3?"600":"400" }}>{v}</td>)}</tr>)}</tbody>
        </table>
        <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:"32px" }}>
          <div style={{ width:"240px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:"12px",color:"#555" }}><span>Subtotal</span><span style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmt(sub)}</span></div>
            {inclVat&&<div style={{ display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:"12px",color:"#555" }}><span>VAT ({vatRate}%)</span><span style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmt(vat)}</span></div>}
            <div style={{ display:"flex",justifyContent:"space-between",padding:"9px 0",fontSize:"16px",fontWeight:"700",borderTop:"2px solid #1a1a2e",marginTop:"6px" }}><span>Total Due</span><span style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmt(tot)}</span></div>
          </div>
        </div>
        {notes&&<div className="nt" style={{ background:"#f8f8f8",padding:"14px 18px",fontSize:"11px",color:"#666",lineHeight:"1.7",borderLeft:"3px solid #1a1a2e",whiteSpace:"pre-wrap" }}>{notes}</div>}
      </div>
    </div>
  );
}

/* ─── NATIONAL WAGE CHECKER (EMBEDDED) ─── */
const NMW_CURRENT = { nlw21:12.71, nmw18:10.85, nmw16:8.00, app:8.00 };
const NMW_PREVIOUS = { nlw21:12.21, nmw18:10.00, nmw16:7.55, app:7.55 };
const NMW_BANDS = [
  { id:"nlw21", label:"Age 21 and over", short:"Age 21+" },
  { id:"nmw18", label:"Age 18 to 20", short:"Age 18-20" },
  { id:"nmw16", label:"Age 16 to 17", short:"Age 16-17" },
  { id:"app", label:"Apprentice (any age)", short:"Apprentice" },
];
const NMW_HISTORY = [
  { year:"2018/19", nlw:7.83, age:"25+", r18:5.90, r16:4.20, app:3.70 },
  { year:"2019/20", nlw:8.21, age:"25+", r18:6.15, r16:4.35, app:3.90 },
  { year:"2020/21", nlw:8.72, age:"25+", r18:6.45, r16:4.55, app:4.15 },
  { year:"2021/22", nlw:8.91, age:"23+", r18:6.56, r16:4.62, app:4.30 },
  { year:"2022/23", nlw:9.50, age:"23+", r18:6.83, r16:4.81, app:4.81 },
  { year:"2023/24", nlw:10.42, age:"23+", r18:7.49, r16:5.28, app:5.28 },
  { year:"2024/25", nlw:11.44, age:"21+", r18:8.60, r16:6.40, app:6.40 },
  { year:"2025/26", nlw:12.21, age:"21+", r18:10.00, r16:7.55, app:7.55 },
  { year:"2026/27", nlw:12.71, age:"21+", r18:10.85, r16:8.00, app:8.00 },
];

function getWageRate(age, isApp, appY1) {
  if (isApp) {
    if (age < 19) return { rate:NMW_CURRENT.app, band:"Apprentice rate (age under 19)" };
    if (appY1) return { rate:NMW_CURRENT.app, band:"Apprentice rate (age 19+, first year)" };
    if (age >= 21) return { rate:NMW_CURRENT.nlw21, band:"Age 21+ (apprentice past first year)" };
    if (age >= 18) return { rate:NMW_CURRENT.nmw18, band:"Age 18-20 (apprentice past first year)" };
    return { rate:NMW_CURRENT.nmw16, band:"Age 16-17 (apprentice past first year)" };
  }
  if (age >= 21) return { rate:NMW_CURRENT.nlw21, band:"Age 21+ (National Living Wage)" };
  if (age >= 18) return { rate:NMW_CURRENT.nmw18, band:"Age 18-20 rate" };
  return { rate:NMW_CURRENT.nmw16, band:"Age 16-17 rate" };
}

function WageTool({ onBack }) {
  const [tab,setTab]=useState("check");
  const [age,setAge]=useState(""); const [hours,setHours]=useState(""); const [pay,setPay]=useState(""); const [period,setPeriod]=useState("weekly"); const [isApp,setIsApp]=useState(false); const [appY1,setAppY1]=useState(true); const [result,setResult]=useState(null);
  const [band,setBand]=useState("nlw21"); const [wHours,setWHours]=useState("37.5"); const [showInc,setShowInc]=useState(false);
  const stl2 = { fontSize:"11px",textTransform:"uppercase",letterSpacing:"1.8px",color:"#3b82f6",fontWeight:"700",marginBottom:"12px" };
  const inp2 = { width:"100%",padding:"10px 12px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"7px",color:"#fff",fontSize:"14px",fontFamily:"'DM Sans',sans-serif",outline:"none" };
  const lbl2 = { fontSize:"11px",color:"#888",marginBottom:"4px",display:"block" };

  const doCheck = () => {
    const a=parseInt(age), h=parseFloat(hours), p=parseFloat(pay);
    if(!a||!h||!p||a<14||h<=0||p<=0) return;
    const {rate,band:b} = getWageRate(a,isApp,appY1);
    const wPay = period==="weekly" ? p : p/(52/12);
    const eff = wPay/h;
    const under = eff < rate - 0.005;
    const shortW = under ? (rate-eff)*h : 0;
    setResult({ band:b, rate, eff:Math.round(eff*100)/100, under, shortW:Math.round(shortW*100)/100, shortM:Math.round(shortW*(52/12)*100)/100, shortY:Math.round(shortW*52*100)/100, over:Math.round(Math.abs(eff-rate)*100)/100 });
  };

  const oR=NMW_PREVIOUS[band], nR=NMW_CURRENT[band], wH=parseFloat(wHours)||0;
  const dW=(nR-oR)*wH, dA=dW*52;
  const canCheck = age&&hours&&pay&&parseInt(age)>=14;

  return (
    <div>
      <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"18px" }}>
        <button onClick={onBack} style={{ padding:"8px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"6px",color:"#ccc",fontSize:"13px",cursor:"pointer" }}>← Back</button>
        <div style={{ flex:1 }}><div style={{ fontSize:"19px",fontWeight:"700",color:"#fff" }}>National Wage Checker</div><div style={{ fontSize:"12px",color:"#888" }}>UK rates from GOV.UK · April 2026</div></div>
      </div>

      {/* Current rates banner */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"6px",marginBottom:"16px" }}>
        {NMW_BANDS.map(b=>(
          <div key={b.id} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"8px",textAlign:"center" }}>
            <div style={{fontSize:"9px",color:"#888",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"2px"}}>{b.short}</div>
            <div style={{fontSize:"16px",fontWeight:"700",color:"#fff",fontFamily:"'JetBrains Mono',monospace"}}>{fmt(NMW_CURRENT[b.id])}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",gap:"4px",marginBottom:"14px" }}>
        {[{id:"check",label:"Check My Pay",icon:"✅"},{id:"increase",label:"Wage Rise",icon:"📈"},{id:"history",label:"All Rates",icon:"📊"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1,padding:"9px",borderRadius:"7px",border:"1px solid",fontSize:"12px",fontWeight:"600",cursor:"pointer",
            background:tab===t.id?"rgba(59,130,246,0.15)":"rgba(255,255,255,0.02)",borderColor:tab===t.id?"#3b82f6":"rgba(255,255,255,0.06)",color:tab===t.id?"#3b82f6":"#888" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* TAB: Check My Pay */}
      {tab==="check"&&(
        <div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"10px" }}>
            <div><label style={lbl2}>Your Age</label><input style={inp2} type="number" min="14" max="100" placeholder="e.g. 22" value={age} onChange={e=>{setAge(e.target.value);setResult(null)}} /></div>
            <div><label style={lbl2}>Hours/Week</label><input style={inp2} type="number" min="1" max="168" step="0.5" placeholder="e.g. 37.5" value={hours} onChange={e=>{setHours(e.target.value);setResult(null)}} /></div>
            <div><label style={lbl2}>Gross Pay (before tax)</label><input style={inp2} type="number" min="1" step="0.01" placeholder="e.g. 450" value={pay} onChange={e=>{setPay(e.target.value);setResult(null)}} /></div>
            <div><label style={lbl2}>Pay Period</label><select style={{...inp2,cursor:"pointer",appearance:"auto"}} value={period} onChange={e=>{setPeriod(e.target.value);setResult(null)}}><option value="weekly" style={{background:"#1a1a2e"}}>Weekly</option><option value="monthly" style={{background:"#1a1a2e"}}>Monthly</option></select></div>
          </div>
          <label style={{ display:"flex",alignItems:"center",gap:"8px",fontSize:"13px",color:"#ccc",cursor:"pointer",marginBottom:"6px" }}>
            <input type="checkbox" checked={isApp} onChange={e=>{setIsApp(e.target.checked);setResult(null)}} style={{accentColor:"#3b82f6",width:"16px",height:"16px"}} /> I'm an apprentice
          </label>
          {isApp&&<div style={{marginLeft:"24px",marginBottom:"8px",fontSize:"12px"}}>
            <label style={{display:"flex",alignItems:"center",gap:"6px",color:"#aaa",cursor:"pointer",marginBottom:"3px"}}><input type="radio" name="aw" checked={appY1} onChange={()=>{setAppY1(true);setResult(null)}} style={{accentColor:"#3b82f6"}} /> First year</label>
            <label style={{display:"flex",alignItems:"center",gap:"6px",color:"#aaa",cursor:"pointer"}}><input type="radio" name="aw" checked={!appY1} onChange={()=>{setAppY1(false);setResult(null)}} style={{accentColor:"#3b82f6"}} /> Past first year</label>
          </div>}
          <button onClick={doCheck} disabled={!canCheck} style={{ width:"100%",padding:"12px",border:"none",borderRadius:"7px",fontSize:"14px",fontWeight:"700",cursor:canCheck?"pointer":"not-allowed",background:canCheck?"linear-gradient(135deg,#3b82f6,#2563eb)":"rgba(255,255,255,0.05)",color:canCheck?"#fff":"#555",marginTop:"4px" }}>Check My Pay</button>

          {result&&(
            <div style={{ marginTop:"14px",background:result.under?"rgba(239,68,68,0.08)":"rgba(16,185,129,0.08)",border:`2px solid ${result.under?"#ef4444":"#10b981"}`,borderRadius:"10px",padding:"20px",textAlign:"center" }}>
              <div style={{fontSize:"36px",marginBottom:"6px"}}>{result.under?"⚠️":"✅"}</div>
              <div style={{fontSize:"18px",fontWeight:"700",color:result.under?"#ef4444":"#10b981",marginBottom:"6px"}}>{result.under?"YOU ARE BEING UNDERPAID":"YOUR PAY IS LEGAL"}</div>
              <div style={{fontSize:"12px",color:"#ccc",marginBottom:"10px"}}>Your rate: <strong style={{fontFamily:"'JetBrains Mono',monospace"}}>{fmt(result.eff)}/hr</strong> · Min: <strong style={{fontFamily:"'JetBrains Mono',monospace"}}>{fmt(result.rate)}/hr</strong> · {result.band}</div>
              {result.under&&(
                <div style={{background:"rgba(0,0,0,0.2)",borderRadius:"7px",padding:"12px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"12px"}}>
                  {[["Week",result.shortW],["Month",result.shortM],["Year",result.shortY]].map(([l,v],i)=>(
                    <div key={i}><div style={{fontSize:"9px",color:"#888",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"2px"}}>{l}</div><div style={{fontSize:"15px",fontWeight:"700",color:"#ef4444",fontFamily:"'JetBrains Mono',monospace"}}>{fmtBig(v)}</div></div>
                  ))}
                </div>
              )}
              {result.under&&<div style={{textAlign:"left",fontSize:"12px",color:"#ccc",lineHeight:"1.6"}}>Talk to your employer first. If nothing changes, call <strong style={{color:"#10b981"}}>ACAS: 0300 123 1100</strong> (free). Report to HMRC — fines up to 200% of underpayment. It's illegal to dismiss you for this.</div>}
              {!result.under&&<div style={{fontSize:"12px",color:"#888"}}>You're {fmt(result.over)} above minimum per hour.</div>}
            </div>
          )}
        </div>
      )}

      {/* TAB: Wage Rise */}
      {tab==="increase"&&(
        <div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px",marginBottom:"10px" }}>
            {NMW_BANDS.map(b=>(
              <button key={b.id} onClick={()=>{setBand(b.id);setShowInc(false)}} style={{ padding:"9px",borderRadius:"6px",border:"1px solid",fontSize:"11px",fontWeight:"600",cursor:"pointer",textAlign:"left",
                background:band===b.id?"rgba(59,130,246,0.15)":"rgba(255,255,255,0.03)",borderColor:band===b.id?"#3b82f6":"rgba(255,255,255,0.08)",color:band===b.id?"#3b82f6":"#888" }}>
                <div>{b.short}</div><div style={{fontSize:"10px",opacity:0.7,marginTop:"1px"}}>{fmt(NMW_PREVIOUS[b.id])} → {fmt(NMW_CURRENT[b.id])}</div>
              </button>
            ))}
          </div>
          <label style={lbl2}>Hours/Week</label>
          <input style={{...inp2,marginBottom:"6px"}} type="number" min="1" max="168" step="0.5" value={wHours} onChange={e=>{setWHours(e.target.value);setShowInc(false)}} />
          <div style={{display:"flex",gap:"4px",marginBottom:"10px"}}>
            {[16,20,25,30,37.5,40].map(v=><button key={v} onClick={()=>{setWHours(String(v));setShowInc(false)}} style={{padding:"4px 7px",borderRadius:"4px",border:"1px solid rgba(255,255,255,0.08)",background:parseFloat(wHours)===v?"rgba(59,130,246,0.15)":"rgba(255,255,255,0.03)",color:parseFloat(wHours)===v?"#3b82f6":"#888",fontSize:"11px",cursor:"pointer"}}>{v}h</button>)}
          </div>
          <button onClick={()=>wH>0&&setShowInc(true)} disabled={wH<=0} style={{ width:"100%",padding:"12px",border:"none",borderRadius:"7px",fontSize:"14px",fontWeight:"700",cursor:wH>0?"pointer":"not-allowed",background:wH>0?"linear-gradient(135deg,#3b82f6,#2563eb)":"rgba(255,255,255,0.05)",color:wH>0?"#fff":"#555" }}>Calculate My Raise</button>
          {showInc&&wH>0&&(
            <div style={{marginTop:"14px",background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:"10px",padding:"20px",textAlign:"center"}}>
              <div style={{fontSize:"12px",color:"#888",marginBottom:"4px"}}>From April 2026 you earn an extra</div>
              <div style={{fontSize:"30px",fontWeight:"700",color:"#3b82f6",fontFamily:"'JetBrains Mono',monospace"}}>{fmtBig(dA)}</div>
              <div style={{fontSize:"13px",color:"#ccc"}}>per year (+{((nR-oR)/oR*100).toFixed(1)}%)</div>
              <div style={{marginTop:"12px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px",fontSize:"11px"}}>
                {[["Weekly",fmt(dW)],["Monthly",fmt(dW*(52/12))],["Annual",fmtBig(dA)]].map(([l,v],i)=>(
                  <div key={i} style={{background:"rgba(0,0,0,0.2)",borderRadius:"6px",padding:"8px"}}><div style={{color:"#888",fontSize:"9px",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"2px"}}>{l}</div><div style={{color:"#10b981",fontWeight:"600",fontFamily:"'JetBrains Mono',monospace"}}>+{v}</div></div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: All Rates */}
      {tab==="history"&&(
        <div>
          <div style={stl2}>UK Minimum Wage Rates 2018–2026</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:"5px",height:"140px",marginBottom:"16px"}}>
            {NMW_HISTORY.map((h,i)=>{
              const barH=(h.nlw/12.71)*120;
              return (
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"3px"}}>
                  <div style={{fontSize:"9px",color:"#3b82f6",fontWeight:"600",fontFamily:"'JetBrains Mono',monospace"}}>{fmt(h.nlw)}</div>
                  <div style={{width:"100%",height:`${barH}px`,background:i===NMW_HISTORY.length-1?"#3b82f6":"rgba(59,130,246,0.3)",borderRadius:"3px 3px 0 0"}} />
                  <div style={{fontSize:"8px",color:"#888",textAlign:"center"}}>{h.year.split("/")[0]}</div>
                </div>
              );
            })}
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"11px"}}>
              <thead><tr>{["Year","NLW","Age","18-20","16-17","App"].map((h,i)=><th key={i} style={{textAlign:i?"right":"left",fontSize:"9px",textTransform:"uppercase",letterSpacing:"1px",color:"#888",fontWeight:"600",padding:"6px 5px",borderBottom:"2px solid rgba(255,255,255,0.08)"}}>{h}</th>)}</tr></thead>
              <tbody>{NMW_HISTORY.map((h,i)=>{
                const cur=i===NMW_HISTORY.length-1;
                return <tr key={i} style={{background:cur?"rgba(59,130,246,0.06)":"transparent"}}>
                  <td style={{padding:"5px",color:cur?"#3b82f6":"#ccc",fontWeight:cur?"700":"400",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>{h.year}</td>
                  <td style={{padding:"5px",textAlign:"right",fontFamily:"'JetBrains Mono',monospace",color:cur?"#3b82f6":"#fff",fontWeight:"600",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>{fmt(h.nlw)}</td>
                  <td style={{padding:"5px",textAlign:"right",color:"#888",fontSize:"10px",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>{h.age}</td>
                  <td style={{padding:"5px",textAlign:"right",fontFamily:"'JetBrains Mono',monospace",color:"#ccc",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>{fmt(h.r18)}</td>
                  <td style={{padding:"5px",textAlign:"right",fontFamily:"'JetBrains Mono',monospace",color:"#ccc",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>{fmt(h.r16)}</td>
                  <td style={{padding:"5px",textAlign:"right",fontFamily:"'JetBrains Mono',monospace",color:"#ccc",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>{fmt(h.app)}</td>
                </tr>;
              })}</tbody>
            </table>
          </div>
          <div style={{fontSize:"10px",color:"#555",marginTop:"8px",lineHeight:"1.5"}}>NLW age changed: 25+ (2016–2021) → 23+ (2021–2024) → 21+ (2024 onwards). Source: GOV.UK. ACAS helpline: 0300 123 1100.</div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════ */
const TOOLS = [
  { id:"scam", name:"Scam Checker", desc:"Paste a suspicious text, email or WhatsApp message. AI tells you instantly if it's a scam.", icon:"🛡️", status:"live", color:"#ef4444", link:"https://scamshield.org.uk" },
  { id:"tax", name:"Tax Calculator", desc:"Enter your income and expenses. See exactly what you owe HMRC — Income Tax + NIC, penny-accurate.", icon:"🧮", status:"live", color:"#10b981" },
  { id:"wages", name:"National Wage Checker", desc:"Check if you're being paid correctly, see your April 2026 wage increase, and view all UK rates since 2018.", icon:"💷", status:"live", color:"#3b82f6" },
  { id:"invoice", name:"Invoice Generator", desc:"Create professional UK invoices with VAT. Print or save as PDF. No sign-up.", icon:"📄", status:"live", color:"#f59e0b" },
];

export default function BasicToolsApp() {
  const [active, setActive] = useState(null);
  const [hovered, setHovered] = useState(null);

  const bg = { minHeight:"100vh",background:"linear-gradient(160deg,#0a0a14 0%,#12121f 40%,#0f1729 100%)",fontFamily:"'DM Sans',sans-serif",color:"#e0e0e0" };

  if (active === "tax") return (
    <div style={bg}><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={{ maxWidth:"640px",margin:"0 auto",padding:"24px 20px" }}><TaxTool onBack={()=>setActive(null)} /></div>
    </div>
  );

  if (active === "invoice") return (
    <div style={bg}><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={{ maxWidth:"860px",margin:"0 auto",padding:"24px 20px" }}><InvoiceTool onBack={()=>setActive(null)} /></div>
    </div>
  );

  if (active === "wages") return (
    <div style={bg}><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={{ maxWidth:"640px",margin:"0 auto",padding:"24px 20px" }}><WageTool onBack={()=>setActive(null)} /></div>
    </div>
  );

  return (
    <div style={bg}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <nav style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 28px",borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display:"flex",alignItems:"baseline",gap:"8px" }}>
          <span style={{ fontFamily:"'Syne',sans-serif",fontSize:"22px",fontWeight:"800",color:"#fff",letterSpacing:"-1px" }}>Basic<span style={{ color:"#f59e0b" }}>Tools</span></span>
          <span style={{ fontSize:"10px",color:"#f59e0b",fontWeight:"700",letterSpacing:"2px",background:"rgba(245,158,11,0.1)",padding:"2px 7px",borderRadius:"4px" }}>UK</span>
        </div>
        <span style={{ fontSize:"12px",color:"#555" }}>by <a href="https://scamshield.org.uk" target="_blank" rel="noopener noreferrer" style={{ color:"#f59e0b",textDecoration:"none" }}>ScamShield UK</a></span>
      </nav>

      <div style={{ textAlign:"center",padding:"64px 28px 48px",maxWidth:"680px",margin:"0 auto" }}>
        <div style={{ display:"inline-block",background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:"18px",padding:"5px 14px",fontSize:"11px",color:"#f59e0b",fontWeight:"600",letterSpacing:"0.5px",marginBottom:"20px" }}>100% FREE — NO SIGN-UP NEEDED</div>
        <h1 style={{ fontFamily:"'Syne',sans-serif",fontSize:"46px",fontWeight:"800",lineHeight:"1.1",letterSpacing:"-2px",marginBottom:"18px",color:"#fff" }}>The tools your<br/>business actually <span style={{ color:"#f59e0b" }}>needs</span></h1>
        <p style={{ fontSize:"17px",color:"#888",lineHeight:"1.6",maxWidth:"500px",margin:"0 auto 28px" }}>Simple, fast, free tools for UK freelancers, tradespeople, and small businesses. No accounts. No subscriptions. Just get things done.</p>
        <div style={{ display:"flex",gap:"12px",justifyContent:"center",flexWrap:"wrap" }}>
          {[{n:"No sign-up",i:"🔓"},{n:"UK-focused",i:"🇬🇧"},{n:"HMRC verified",i:"✅"},{n:"Print & download",i:"🖨️"}].map((b,i)=>
            <div key={i} style={{ display:"flex",alignItems:"center",gap:"5px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"7px 12px",fontSize:"12px",color:"#ccc" }}><span>{b.i}</span>{b.n}</div>
          )}
        </div>
      </div>

      <div style={{ maxWidth:"920px",margin:"0 auto",padding:"0 28px 64px" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"22px" }}>
          <div style={{ fontSize:"11px",textTransform:"uppercase",letterSpacing:"2px",color:"#f59e0b",fontWeight:"700" }}>Tools</div>
          <div style={{ fontSize:"12px",color:"#555" }}>{TOOLS.filter(t => t.status === "live").length} tools — all free</div>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:"14px" }}>
          {TOOLS.map(tool => {
            const live = tool.status==="live";
            const h = hovered===tool.id;
            return (
              <div key={tool.id} onMouseEnter={()=>setHovered(tool.id)} onMouseLeave={()=>setHovered(null)}
                onClick={()=>{ if(tool.link){window.open(tool.link,"_blank");return;} if(live)setActive(tool.id); }}
                style={{ background:h&&live?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.02)",border:`1px solid ${h&&live?tool.color+"44":"rgba(255,255,255,0.06)"}`,borderRadius:"12px",padding:"22px",cursor:live?"pointer":"default",transition:"all 0.2s",position:"relative",opacity:live?1:0.45 }}>
                {live&&<div style={{ position:"absolute",top:"11px",right:"11px",fontSize:"9px",textTransform:"uppercase",letterSpacing:"1px",color:tool.color,fontWeight:"700",background:tool.color+"15",padding:"2px 7px",borderRadius:"4px" }}>● Live</div>}
                {!live&&<div style={{ position:"absolute",top:"11px",right:"11px",fontSize:"9px",textTransform:"uppercase",letterSpacing:"1px",color:"#555",fontWeight:"600",background:"rgba(255,255,255,0.03)",padding:"2px 7px",borderRadius:"4px" }}>Soon</div>}
                <div style={{ fontSize:"28px",marginBottom:"10px",filter:live?"none":"grayscale(1)" }}>{tool.icon}</div>
                <div style={{ fontSize:"15px",fontWeight:"700",color:live?"#fff":"#888",marginBottom:"5px" }}>{tool.name}</div>
                <div style={{ fontSize:"12px",color:"#888",lineHeight:"1.5" }}>{tool.desc}</div>
                {live&&h&&<div style={{ marginTop:"10px",fontSize:"11px",color:tool.color,fontWeight:"600" }}>Open tool →</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* REQUEST A TOOL + DONATE */}
      <div style={{ maxWidth:"680px",margin:"0 auto",padding:"48px 28px 40px" }}>

        {/* Request a Tool */}
        <div style={{ background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"16px",padding:"32px",marginBottom:"20px" }}>
          <div style={{ fontSize:"28px",marginBottom:"12px",textAlign:"center" }}>💡</div>
          <h3 style={{ fontFamily:"'Syne',sans-serif",fontSize:"20px",fontWeight:"800",color:"#fff",textAlign:"center",marginBottom:"6px" }}>Need a tool we haven't built yet?</h3>
          <p style={{ fontSize:"13px",color:"#888",textAlign:"center",marginBottom:"20px" }}>Tell us what you need. If enough people ask for it, we'll build it — free.</p>
          
          <textarea
            id="toolRequest"
            placeholder="Describe the tool you need... e.g. 'A simple mileage calculator for self-employed drivers' or 'A tool to check if my landlord's deposit is protected'"
            style={{ width:"100%",padding:"14px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",color:"#fff",fontSize:"14px",fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"vertical",minHeight:"80px",lineHeight:"1.5" }}
          />
          
          <button
            onClick={() => {
              const text = document.getElementById('toolRequest').value;
              if (!text.trim()) return;
              const subject = encodeURIComponent('Tool Request — BasicTools UK');
              const body = encodeURIComponent('Hi Abbas,\n\nI\'d like to request a new tool:\n\n' + text.trim() + '\n\nThanks!');
              window.open('mailto:scamshield.org.uk@gmail.com?subject=' + subject + '&body=' + body);
            }}
            style={{ width:"100%",marginTop:"12px",padding:"13px",background:"linear-gradient(135deg,#8b5cf6,#7c3aed)",border:"none",borderRadius:"8px",color:"#fff",fontSize:"14px",fontWeight:"700",cursor:"pointer",letterSpacing:"0.3px" }}
          >
            Send Request →
          </button>
        </div>

        {/* Buy me a coffee */}
        <div style={{ background:"linear-gradient(135deg,rgba(245,158,11,0.06) 0%,rgba(245,158,11,0.02) 100%)",border:"1px solid rgba(245,158,11,0.12)",borderRadius:"16px",padding:"28px 32px",textAlign:"center" }}>
          <div style={{ fontSize:"13px",color:"#ccc",marginBottom:"12px",lineHeight:"1.5" }}>
            If you benefit from my work, you can support it.
          </div>
          <a
            href="https://ko-fi.com/scamshielduk"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display:"inline-flex",alignItems:"center",gap:"8px",padding:"12px 28px",
              background:"linear-gradient(135deg,#f59e0b,#d97706)",
              border:"none",borderRadius:"10px",color:"#1a1a2e",fontSize:"15px",fontWeight:"700",
              textDecoration:"none",letterSpacing:"0.3px",
              boxShadow:"0 4px 20px rgba(245,158,11,0.2)",
            }}
          >
            ☕ Buy me a coffee
          </a>
        </div>

      </div>

      <footer style={{ borderTop:"1px solid rgba(255,255,255,0.04)",padding:"20px 28px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div style={{ fontSize:"11px",color:"#555" }}>Built by Abbas · <a href="https://scamshield.org.uk" target="_blank" rel="noopener noreferrer" style={{ color:"#f59e0b",textDecoration:"none" }}>ScamShield UK</a></div>
        <div style={{ fontSize:"10px",color:"#444" }}>© 2026 BasicTools UK · Tax rates verified from GOV.UK</div>
      </footer>
    </div>
  );
}
