import { useState } from "react";

const PLANS = [
{ id: "max_1g",    label: "ドコモMAX（～1GB）",       price: 5698, type: "max" },
{ id: "max_3g",    label: "ドコモMAX（1～3GB）",      price: 6798, type: "max" },
{ id: "max_ul",    label: "ドコモMAX（無制限）",      price: 8448, type: "max" },
{ id: "u22_30",    label: "U22割（～30GB）",          price: 2970, basePrice: 5698, uDisc: -2728, type: "max", uWari: "u22" },
{ id: "u22_over",  label: "U22割（30GB超）",          price: 7898, basePrice: 8448, uDisc: -550,  type: "max", uWari: "u22" },
{ id: "u29_30",    label: "U29割（～30GB）",          price: 2970, basePrice: 5698, uDisc: -2728, type: "max", uWari: "u29" },
{ id: "u29_over",  label: "U29割（30GB超）",          price: 7898, basePrice: 8448, uDisc: -550,  type: "max", uWari: "u29" },
{ id: "mini_4g",   label: "ドコモmini（4GB）",        price: 2750, type: "mini" },
{ id: "mini_10g",  label: "ドコモmini（10GB）",       price: 3850, type: "mini" },
{ id: "ahamo",     label: "ahamo（30GB）",            price: 2970, type: "ahamo" },
{ id: "ahamo_big", label: "ahamo大盛り（110GB）",     price: 4950, type: "ahamo" },
{ id: "u15_5g",    label: "U15はじめてスマホ（5GB）", price: 1815, basePrice: 1980, ispDisc: -165, type: "u15", dataGB: 5,  dataAfter19: 1 },
{ id: "u15_10g",   label: "U15はじめてスマホ（10GB）",price: 2695, basePrice: 2860, ispDisc: -165, type: "u15", dataGB: 10, dataAfter19: 2 },
];

const HIKARI = [
{ id: "none",             label: "なし",                                 price: 0 },
{ id: "family",           label: "家族の光回線あり（自分は契約しない）", price: 0, familyDisc: true, notAhamo: true },
{ id: "1g_kodate",        label: "1ギガ・戸建",                          price: 5720 },
{ id: "1g_mansion",       label: "1ギガ・マンション",                    price: 4400 },
{ id: "10g",              label: "10ギガ（戸建・マンション共通）",        price: 6380 },
{ id: "home5g",           label: "home 5G",                              price: 5280 },
{ id: "ahamo_1g_kodate",  label: "ahamo光・1ギガ戸建",                   price: 4950, ahamoOnly: true },
{ id: "ahamo_1g_mansion", label: "ahamo光・1ギガマンション",              price: 3630, ahamoOnly: true },
{ id: "ahamo_10g",        label: "ahamo光・10ギガ",                      price: 5610, ahamoOnly: true },
];

const PLAN_GROUPS = [
{ label: "ドコモMAX",        ids: ["max_1g","max_3g","max_ul"],  accent: "#e60012" },
{ label: "U22割",            ids: ["u22_30","u22_over"],         accent: "#cc88ff" },
{ label: "U29割",            ids: ["u29_30","u29_over"],         accent: "#88ccff" },
{ label: "ドコモmini",       ids: ["mini_4g","mini_10g"],        accent: "#22bb88" },
{ label: "ahamo",            ids: ["ahamo","ahamo_big"],         accent: "#4488ff" },
{ label: "U15はじめてスマホ", ids: ["u15_5g","u15_10g"],         accent: "#ffaa33" },
];

const DEVICES = [
{ id: "iphone16_128",  label: "iPhone 16（128GB）",  price: 145706, zankaValue: { mnp: 112728, kishu: 79200 }, welcomeDisc: { mnp: 44000, kishu: 0 } },
{ id: "iphone17_256",  label: "iPhone 17（256GB）",  price: 164197, zankaValue: { mnp: 120384, kishu: 87912 }, welcomeDisc: { mnp: 44000, kishu: 0 } },
{ id: "iphone17e_256", label: "iPhone 17e（256GB）", price: 131219, zankaValue: { mnp: 87384,  kishu: 72072 }, welcomeDisc: { mnp: 43307, kishu: 0 } },
];

const emptyLine = (id) => ({
id, plan: "", hikari: "none", card: "none", denki: false,
tvOption: false, telOption: "none", kakehoudai: "none",
useDevice: false, selectedDevice: "", contractType: "mnp", useKaedoki: false,
name: "",
});

function calcKaedoki(device, contractType) {
const zanka          = device.zankaValue[contractType];
const welcome        = device.welcomeDisc[contractType];
const payFor23       = device.price - zanka - welcome;
const monthly        = Math.max(1, Math.ceil(payFor23 / 23));
const zankaMonthly   = Math.ceil(zanka / 24);
const priceAfterDisc = device.price - welcome;
const totalIfReturn  = Math.max(monthly * 23, 23);
return { monthly, zanka, zankaMonthly, welcome, priceAfterDisc, payFor23, totalIfReturn };
}

function calcMinnaDisco(maxLineCount) {
if (maxLineCount >= 3) return -1210;
if (maxLineCount === 2) return -550;
return 0;
}

function calcItems({ planId, hikariId, card, denki, tvOption, telOption, kakehoudai, maxLineCount }) {
const plan = PLANS.find(p => p.id === planId);
if (!plan) return null;
const hikari        = HIKARI.find(h => h.id === hikariId);
const isAhamo       = plan.type === "ahamo";
const isU15         = plan.type === "u15";
const hasHikari     = hikariId !== "none";
const isHome5G      = hikariId === "home5g";
const isFamilyH     = hikariId === "family";
const isAhamoHikari = !!hikari?.ahamoOnly;
const hasUWari      = !!plan.uWari;

const monthly = [];
const initial = [];
let totalDiscount = 0;

initial.push({ label: "スマホ契約事務手数料", amount: 4950 });
if (hasHikari && !isFamilyH) {
const lbl = isAhamoHikari ? "ahamo光 契約事務手数料" : isHome5G ? "home 5G 契約事務手数料" : "ドコモ光 契約事務手数料";
initial.push({ label: lbl, amount: 4950 });
}

monthly.push({ label: hasUWari ? "ドコモMAX（無制限）" : plan.label, amount: hasUWari ? plan.basePrice : (plan.basePrice ?? plan.price), type: "base", hiwari: true });

if (isU15) {
monthly.push({ label: "U15はじめてスマホISP割（自動適用）", amount: plan.ispDisc, type: "discount", hiwari: true });
totalDiscount += plan.ispDisc;
if (card === "gold" || card === "normal") {
monthly.push({ label: "dカードお支払割", amount: -187, type: "discount", hiwari: false });
totalDiscount += -187;
}
if (kakehoudai === "unlimited") {
monthly.push({ label: "かけ放題オプション", amount: 1100, type: "option", hiwari: true });
} else {
monthly.push({ label: "5分かけ放題（プラン込み）", amount: 0, type: "base", hiwari: false });
}
} else if (isAhamo) {
if (kakehoudai === "unlimited") {
monthly.push({ label: "かけ放題オプション", amount: 1100, type: "option", hiwari: true });
} else {
monthly.push({ label: "5分かけ放題（標準込み）", amount: 0, type: "base", hiwari: false });
}
} else if (kakehoudai === "5min") {
monthly.push({ label: "5分通話無料オプション", amount: 880, type: "option", hiwari: true });
} else if (kakehoudai === "unlimited") {
monthly.push({ label: "かけ放題オプション", amount: 1980, type: "option", hiwari: true });
}

if (hasHikari && !isFamilyH) {
monthly.push({ label: `${hikari.label}（月額）`, amount: hikari.price, type: "base", hiwari: true });
if (isHome5G) {
monthly.push({ label: "月々サポート（端末代割引）", amount: -1980, type: "discount", hiwari: false });
totalDiscount += -1980;
}
}

if (hasHikari && !isHome5G && !isFamilyH && !isAhamoHikari && tvOption) {
monthly.push({ label: "テレビオプション", amount: 990, type: "option", hiwari: true });
}
if (hasHikari && !isHome5G && !isFamilyH && !isAhamoHikari && telOption !== "none") {
monthly.push({ label: telOption === "normal" ? "ドコモ光電話（通常）" : "ドコモ光電話（バリュー）", amount: telOption === "normal" ? 550 : 1650, type: "option", hiwari: true });
}

if (!isAhamo && !isU15) {
if (plan.type === "max") {
const disc = calcMinnaDisco(maxLineCount);
if (disc < 0) {
const label = maxLineCount >= 3 ? "みんなドコモ割（3回線以上）" : "みんなドコモ割（2回線）";
monthly.push({ label, amount: disc, type: "discount", hiwari: true });
totalDiscount += disc;
}
}
if (hasHikari && !isAhamoHikari) {
const discLabel = isFamilyH ? "ドコモ光セット割（家族契約）" : isHome5G ? "home 5Gセット割" : "ドコモ光セット割";
monthly.push({ label: discLabel, amount: -1210, type: "discount", hiwari: true });
totalDiscount += -1210;
}
if (card === "gold")        { monthly.push({ label: "dカードGOLD/PLATINUMお支払割", amount: -550,  type: "discount", hiwari: false }); totalDiscount += -550; }
else if (card === "normal") { monthly.push({ label: "dカードお支払割",               amount: -220,  type: "discount", hiwari: false }); totalDiscount += -220; }
if (denki && !isHome5G)     { monthly.push({ label: "ドコモでんきセット割",           amount: -110,  type: "discount", hiwari: true  }); totalDiscount += -110; }
if (hasUWari) {
const uLabel = plan.uWari === "u22"
? `ドコモU22割（${plan.id === "u22_30" ? "〜30GB" : "30GB超"}）`
: `ドコモU29割（${plan.id === "u29_30" ? "〜30GB" : "30GB超"}）`;
monthly.push({ label: uLabel, amount: plan.uDisc, type: "discount", hiwari: true });
totalDiscount += plan.uDisc;
}
}

const monthlyTotal = monthly.reduce((s, i) => s + i.amount, 0);
const initialTotal = initial.reduce((s, i) => s + i.amount, 0);

const notes = [];
if (isAhamo)       notes.push("ahamoは各種割引の対象外です。5分かけ放題は標準で含まれています。");
if (isAhamoHikari) notes.push("ahamo光はドコモ光セット割の対象外です。ahamoの解約・乗り換え時はahamo光も解約が必要です。");
if (plan.type === "mini") notes.push("ドコモminiはみんなドコモ割の対象外です。");
if (isU15) notes.push("U15はじめてスマホプランはみんなドコモ割・光セット割の対象外です（ファミリー割引カウントには含まれます）。");
if (isU15) notes.push(`19歳の誕生月翌月からデータ容量が${plan.dataAfter19}GBに減少します。`);
if (!hasHikari && !isAhamo && !isU15) notes.push("光回線を契約するとセット割が適用されます。");
if (isHome5G) notes.push("月々サポートはhome 5G HR02の端末代割引です。48か月未満解約時は残債一括請求。");
if (hasHikari && !isHome5G && !isFamilyH) notes.push("光回線の工事費は設備状況により異なります。");
notes.push("dカードお支払割は月末日時点での設定により適用。日割りなし。通話料・SMS料は別途。");

const uWariInfo = hasUWari ? {
type: plan.uWari,
months: plan.uWari === "u22" ? 7 : 3,
disc: Math.abs(plan.uDisc),
duringMonthly: monthlyTotal,
afterMonthly: monthlyTotal - plan.uDisc,
bonusGB: 27,
basePlanLabel: plan.id.endsWith("_30") ? "〜30GB" : "30GB超",
} : null;

const u15Info = isU15 ? { dataGB: plan.dataGB, dataAfter19: plan.dataAfter19, duringMonthly: monthlyTotal } : null;

return { monthly, monthlyTotal, initial, initialTotal, totalDiscount, notes, uWariInfo, u15Info };
}

function getDaysInCurrentMonth() {
const now = new Date();
return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

export default function DocomoSimulator() {
const [lineList, setLineList]           = useState([emptyLine(1)]);
const [activeLineId, setActiveLineId]   = useState(1);
const [results, setResults]             = useState({});
const [deviceResults, setDeviceResults] = useState({});
const [error, setError]                 = useState("");
const [nextId, setNextId]               = useState(2);
const [showHiwari, setShowHiwari]       = useState(false);
const [contractDay, setContractDay]     = useState(1);

const daysInMonth = getDaysInCurrentMonth();
const activeLine  = lineList.find(l => l.id === activeLineId) || lineList[0];

const setActive = (field, value) => {
setLineList(prev => prev.map(l => l.id === activeLineId ? { ...l, [field]: value } : l));
setResults({}); setDeviceResults({});
};

const addLine = () => {
if (lineList.length >= 5) return;
const newId = nextId;
setNextId(newId + 1);
setLineList(prev => [...prev, emptyLine(newId)]);
setActiveLineId(newId);
setResults({}); setDeviceResults({});
};

const removeLine = (id) => {
if (lineList.length <= 1) return;
const newList = lineList.filter(l => l.id !== id);
setLineList(newList);
if (activeLineId === id) setActiveLineId(newList[0].id);
setResults({}); setDeviceResults({});
};

const maxLineCount = lineList.filter(l => {
const p = PLANS.find(p => p.id === l.plan);
return p && p.type === "max";
}).length;

const calculate = () => {
for (const line of lineList) {
if (!line.plan) { setError(`回線${lineList.indexOf(line)+1}のスマホプランを選択してください`); return; }
if (line.useDevice && !line.selectedDevice) { setError(`回線${lineList.indexOf(line)+1}の端末を選択してください`); return; }
}
setError("");
const newResults = {}, newDevResults = {};
for (const line of lineList) {
newResults[line.id] = calcItems({ planId: line.plan, hikariId: line.hikari, card: line.card, denki: line.denki, tvOption: line.tvOption, telOption: line.telOption, kakehoudai: line.kakehoudai, maxLineCount });
if (line.useDevice && line.selectedDevice) {
const dev = DEVICES.find(d => d.id === line.selectedDevice);
newDevResults[line.id] = { device: dev, kaedoki: calcKaedoki(dev, line.contractType), contractType: line.contractType, useKaedoki: line.useKaedoki };
}
}
setResults(newResults); setDeviceResults(newDevResults);
};

const fmt = n => n === 0 ? "¥0（込み）" : (n < 0 ? "\u2212" : "") + "¥" + Math.abs(n).toLocaleString();

const calcHiwariItems = (items) => {
const remaining = daysInMonth - contractDay + 1;
return items.map(item => ({ ...item, hiwariAmount: item.hiwari ? Math.round(item.amount / daysInMonth * remaining) : item.amount }));
};

const selPlan    = PLANS.find(p => p.id === activeLine.plan);
const isAhamo    = selPlan?.type === "ahamo";
const isU15      = selPlan?.type === "u15";
const hasResults = Object.keys(results).length > 0;
const totalMonthly = Object.values(results).reduce((s, r) => s + (r?.monthlyTotal || 0), 0);
const totalInitial = Object.values(results).reduce((s, r) => s + (r?.initialTotal || 0), 0);
const totalDevice  = Object.values(deviceResults).reduce((s, dr) => s + (dr?.useKaedoki ? dr.kaedoki.monthly : 0), 0);

return (
<div style={{ minHeight: "100vh", background: "#08080e", fontFamily: "‘Noto Sans JP’,‘Hiragino Kaku Gothic ProN’,sans-serif", color: "#e4e4f0", padding: "20px 14px 48px" }}>
<div style={{ textAlign: "center", marginBottom: 20 }}>
<span style={{ display: "inline-block", background: "linear-gradient(135deg,#e60012,#cc0010)", color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", padding: "3px 12px", borderRadius: 2, marginBottom: 8 }}>NTT DOCOMO</span>
<h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>料金シミュレーター</h1>
<p style={{ margin: "4px 0 0", fontSize: 10, color: "#555" }}>2025年6月〜現行プラン対応 ／ 端末価格2026年4月17日以降</p>
</div>

  <div style={{ maxWidth: 460, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>

    {/* 回線管理 */}
    <div style={{ background: "#0f0f17", border: "1px solid #1c1c28", borderRadius: 12, padding: "12px 14px" }}>
      <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: "0.1em" }}>📋 回線管理</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {lineList.map((line, idx) => {
          const p = PLANS.find(p => p.id === line.plan);
          const isAct = line.id === activeLineId;
          return (
            <button key={line.id} onClick={() => setActiveLineId(line.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, cursor: "pointer", border: isAct ? "2px solid #e60012" : "2px solid #1c1c28", background: isAct ? "#1a0306" : "#080810", color: isAct ? "#fff" : "#555", fontSize: 12, fontWeight: isAct ? 700 : 400 }}>
              <span style={{ fontSize: 10, color: isAct ? "#e60012" : "#444" }}>回線{idx+1}</span>
              {line.name && <span style={{ fontSize: 11 }}>{line.name}</span>}
              {p && <span style={{ fontSize: 10, color: isAct ? "#ff8888" : "#333", marginLeft: 2 }}>{p.label.replace("ドコモ","").replace("はじめてスマホ","U15").slice(0,8)}</span>}
              {lineList.length > 1 && <span onClick={e => { e.stopPropagation(); removeLine(line.id); }} style={{ marginLeft: 4, color: "#555", fontSize: 13, cursor: "pointer" }}>x</span>}
            </button>
          );
        })}
        {lineList.length < 5 && (
          <button onClick={addLine} style={{ padding: "7px 14px", borderRadius: 8, border: "2px dashed #333344", background: "transparent", color: "#555", fontSize: 12, cursor: "pointer" }}>+ 回線追加</button>
        )}
      </div>
      <input
        placeholder={`回線${lineList.indexOf(activeLine)+1}の名前（例：パパ・ママ）`}
        value={activeLine.name}
        onChange={e => setActive("name", e.target.value)}
        style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", background: "#080810", border: "1px solid #1c1c28", borderRadius: 7, color: "#aaa", fontSize: 12, outline: "none", fontFamily: "inherit" }}
      />
      {maxLineCount >= 2 && (
        <p style={{ margin: "6px 0 0", fontSize: 10, color: "#44cc77" }}>
          ✓ ドコモMAX系が{maxLineCount}回線 → みんなドコモ割 {maxLineCount >= 3 ? "−¥1,210" : "−¥550"}/月 自動適用
        </p>
      )}
    </div>

    <div style={{ padding: "6px 14px", background: "#1a0306", border: "1px solid #3a0010", borderRadius: 8 }}>
      <p style={{ margin: 0, fontSize: 11, color: "#ff8888" }}>✏️ 回線{lineList.indexOf(activeLine)+1}{activeLine.name ? `（${activeLine.name}）` : ""} を設定中</p>
    </div>

    {/* スマホプラン */}
    <Card title="📱 スマホプラン">
      {PLAN_GROUPS.map(grp => (
        <div key={grp.label} style={{ marginBottom: 8 }}>
          <p style={{ margin: "0 0 4px", fontSize: 10, color: "#444", letterSpacing: "0.08em" }}>{grp.label}</p>
          {grp.ids.map(id => {
            const p = PLANS.find(x => x.id === id);
            return (
              <RadioRow key={p.id} label={p.label}
                sub={p.uWari ? `実質¥${p.price.toLocaleString()}` : `¥${p.price.toLocaleString()}`}
                selected={activeLine.plan === p.id} accent={grp.accent}
                onClick={() => setActive("plan", p.id)} />
            );
          })}
        </div>
      ))}
    </Card>

    {/* 通話オプション */}
    {selPlan && !isU15 && (
      <Card title="📞 通話オプション">
        {isAhamo ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ padding: "7px 12px", background: "#0d1420", borderRadius: 8, fontSize: 12, color: "#6688aa" }}>5分かけ放題はahamo標準で含まれています</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ id: "none", label: "5分無料のみ\n（標準）" }, { id: "unlimited", label: "かけ放題に\nアップ +1,100円" }].map(k => (
                <Chip key={k.id} label={k.label} selected={activeLine.kakehoudai === k.id} accent="#4488ff" onClick={() => setActive("kakehoudai", k.id)} />
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            {[{ id: "none", label: "なし" }, { id: "5min", label: "5分無料\n+880円" }, { id: "unlimited", label: "かけ放題\n+1,980円" }].map(k => (
              <Chip key={k.id} label={k.label} selected={activeLine.kakehoudai === k.id} accent="#ff8844" onClick={() => setActive("kakehoudai", k.id)} />
            ))}
          </div>
        )}
      </Card>
    )}

    {isU15 && selPlan && (
      <Card title="📞 通話オプション">
        <div style={{ padding: "7px 12px", background: "#1a1008", borderRadius: 8, fontSize: 12, color: "#aa7733", marginBottom: 8 }}>5分以内の国内通話が何度でも無料（プラン標準込み）</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ id: "none", label: "5分無料のみ\n（標準）" }, { id: "unlimited", label: "かけ放題に\nアップ +1,100円" }].map(k => (
            <Chip key={k.id} label={k.label} selected={activeLine.kakehoudai === k.id} accent="#ffaa33" onClick={() => setActive("kakehoudai", k.id)} />
          ))}
        </div>
      </Card>
    )}

    {/* インターネット回線 */}
    <Card title="🏠 インターネット回線">
      {HIKARI.filter(h => {
        if (isU15 && h.id === "family") return false;
        if (isAhamo && h.notAhamo) return false;
        if (!isAhamo && h.ahamoOnly) return false;
        return true;
      }).map(h => (
        <RadioRow key={h.id} label={h.label}
          sub={h.price ? `¥${h.price.toLocaleString()}/月` : h.familyDisc ? "セット割 −¥1,210/月" : "割引なし"}
          selected={activeLine.hikari === h.id} accent="#3388ff"
          onClick={() => setActive("hikari", h.id)} />
      ))}
    </Card>

    {/* 割引条件 */}
    {!isAhamo && !isU15 && selPlan && (
      <Card title="💳 割引条件">
        <p style={{ margin: "0 0 6px", fontSize: 11, color: "#555" }}>dカードお支払割</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {[{ id: "none", label: "なし" }, { id: "normal", label: "通常\n−220円" }, { id: "gold", label: "GOLD/\nPLATINUM\n−550円" }].map(d => (
            <Chip key={d.id} label={d.label} selected={activeLine.card === d.id} accent="#ffaa00" onClick={() => setActive("card", d.id)} />
          ))}
        </div>
        {activeLine.hikari !== "home5g" && (
          <Toggle label="ドコモでんきセット割" sub="−110円/月" checked={activeLine.denki} onChange={v => setActive("denki", v)} />
        )}
      </Card>
    )}

    {isU15 && selPlan && (
      <Card title="💳 割引条件（U15プラン）">
        <p style={{ margin: "0 0 6px", fontSize: 11, color: "#555" }}>dカードお支払割（−¥187/月）</p>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ id: "none", label: "なし" }, { id: "normal", label: "dカード払い\n−187円" }, { id: "gold", label: "GOLD/PLATINUM\n−187円" }].map(d => (
            <Chip key={d.id} label={d.label} selected={activeLine.card === d.id} accent="#ffaa00" onClick={() => setActive("card", d.id)} />
          ))}
        </div>
        <p style={{ margin: "8px 0 0", fontSize: 10, color: "#443322" }}>※ みんなドコモ割・光セット割・でんきセット割は対象外</p>
      </Card>
    )}

    {/* 光オプション */}
    {activeLine.hikari !== "none" && activeLine.hikari !== "family" && activeLine.hikari !== "home5g" && !isU15 && !HIKARI.find(h => h.id === activeLine.hikari)?.ahamoOnly && (
      <Card title="📺 光オプション">
        <Toggle label="テレビオプション" sub="+990円/月（地デジ・BS）" checked={activeLine.tvOption} onChange={v => setActive("tvOption", v)} />
        <div style={{ marginTop: 10 }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, color: "#555" }}>ドコモ光電話</p>
          <div style={{ display: "flex", gap: 8 }}>
            {[{ id: "none", label: "なし" }, { id: "normal", label: "通常\n+550円" }, { id: "value", label: "バリュー\n+1,650円" }].map(t => (
              <Chip key={t.id} label={t.label} selected={activeLine.telOption === t.id} accent="#22ccaa" onClick={() => setActive("telOption", t.id)} />
            ))}
          </div>
        </div>
      </Card>
    )}

    {/* 端末代 */}
    <Card title="📦 端末代（いつでもカエドキプログラム）">
      <Toggle label="端末代を計算に含める" sub="ドコモオンラインショップ価格（2026年4月以降）" checked={activeLine.useDevice} onChange={v => setActive("useDevice", v)} />
      {activeLine.useDevice && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 11, color: "#555" }}>機種を選択</p>
            {DEVICES.map(d => (
              <button key={d.id} onClick={() => setActive("selectedDevice", d.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "10px 12px", marginBottom: 5, borderRadius: 8, textAlign: "left", border: activeLine.selectedDevice === d.id ? "2px solid #e60012" : "2px solid #1c1c28", background: activeLine.selectedDevice === d.id ? "#1a0306" : "#080810", color: "#e4e4f0", cursor: "pointer" }}>
                <span style={{ fontSize: 13, fontWeight: activeLine.selectedDevice === d.id ? 600 : 400 }}>{d.label}</span>
                <span style={{ fontSize: 11, color: activeLine.selectedDevice === d.id ? "#e60012" : "#444", fontWeight: 600 }}>¥{d.price.toLocaleString()}</span>
              </button>
            ))}
          </div>
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 11, color: "#555" }}>契約種別</p>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ id: "mnp", label: "乗り換え（MNP）", sub: "5G WELCOME割あり" }, { id: "kishu", label: "機種変更（ドコモ内）", sub: "5G WELCOME割なし" }].map(c => (
                <button key={c.id} onClick={() => setActive("contractType", c.id)} style={{ flex: 1, padding: "9px 6px", borderRadius: 8, cursor: "pointer", border: activeLine.contractType === c.id ? "2px solid #e60012" : "2px solid #1c1c28", background: activeLine.contractType === c.id ? "#1a0306" : "#080810" }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: activeLine.contractType === c.id ? "#ff6666" : "#555" }}>{c.label}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 10, color: activeLine.contractType === c.id ? "#884444" : "#333" }}>{c.sub}</p>
                </button>
              ))}
            </div>
          </div>
          <Toggle label="いつでもカエドキプログラム適用" sub="23回目に返却 → 残価（24回目）免除" checked={activeLine.useKaedoki} onChange={v => setActive("useKaedoki", v)} />
          {activeLine.selectedDevice && (() => {
            const dev   = DEVICES.find(d => d.id === activeLine.selectedDevice);
            const disc  = dev.welcomeDisc[activeLine.contractType];
            const zanka = dev.zankaValue[activeLine.contractType];
            return (
              <div style={{ padding: "8px 12px", background: "#0a0a10", borderRadius: 8, border: "1px solid #1a1a28", fontSize: 10, color: "#444", lineHeight: 1.8 }}>
                <p style={{ margin: 0 }}>本体価格：¥{dev.price.toLocaleString()}</p>
                {disc > 0 && <p style={{ margin: 0, color: "#44cc77" }}>5G WELCOME割：−¥{disc.toLocaleString()}</p>}
                <p style={{ margin: 0 }}>残価（カエドキ返却で免除）：¥{zanka.toLocaleString()}</p>
              </div>
            );
          })()}
          {activeLine.useKaedoki && (
            <div style={{ padding: "8px 12px", background: "#080c12", borderRadius: 8, border: "1px solid #1c2a1a", fontSize: 10, color: "#445544", lineHeight: 1.7 }}>
              <p style={{ margin: 0 }}>※ 返却時にプログラム利用料¥22,000が別途発生</p>
              <p style={{ margin: 0 }}>※ ドコモで次の対象機種に買い替えれば利用料免除</p>
              <p style={{ margin: 0 }}>※ 返却しない場合は残価が25〜48回目に再分割</p>
            </div>
          )}
        </div>
      )}
    </Card>

    {/* 初月日割り */}
    <Card title="📅 初月日割り">
      <Toggle label="初月日割りを表示する" sub="新規契約・MNP同時申込みの場合" checked={showHiwari} onChange={v => { setShowHiwari(v); setResults({}); setDeviceResults({}); }} />
      {showHiwari && (
        <div style={{ marginTop: 10 }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, color: "#555" }}>契約日（今月は{daysInMonth}日まで）</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="range" min={1} max={daysInMonth} value={contractDay}
              onChange={e => { setContractDay(Number(e.target.value)); setResults({}); setDeviceResults({}); }}
              style={{ flex: 1, accentColor: "#e60012" }} />
            <span style={{ fontSize: 20, fontWeight: 700, color: "#e60012", minWidth: 42, textAlign: "right" }}>{contractDay}日</span>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 11, color: "#444" }}>残{daysInMonth - contractDay + 1}日 ÷ {daysInMonth}日で計算</p>
        </div>
      )}
    </Card>

    {error && <div style={{ background: "#1a0606", border: "1px solid #550000", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#ff6666" }}>{error}</div>}

    <button onClick={calculate} style={{ width: "100%", padding: "15px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#e60012,#cc0010)", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(230,0,18,0.35)" }}>
      {lineList.length > 1 ? `全${lineList.length}回線の料金を計算する` : "料金を計算する"}
    </button>

    {/* 結果エリア */}
    {hasResults && (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {lineList.length > 1 && (
          <div style={{ background: "#0e0e14", border: "2px solid #e6001244", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "10px 20px", background: "linear-gradient(135deg,#1a0306,#0e0e14)", borderBottom: "1px solid #2a1010" }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#e60012", letterSpacing: "0.08em" }}>🏠 家族合計</p>
            </div>
            <div style={{ padding: "14px 20px" }}>
              <p style={{ margin: "0 0 4px", fontSize: 11, color: "#555" }}>回線合計月額</p>
              <p style={{ margin: "0 0 4px", fontSize: 36, fontWeight: 800, color: "#ff3333", lineHeight: 1 }}>
                ¥{totalMonthly.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400, color: "#555", marginLeft: 4 }}>/月</span>
              </p>
              {totalDevice > 0 && <p style={{ margin: "0 0 10px", fontSize: 14, color: "#ff6666", fontWeight: 700 }}>端末代込み ¥{(totalMonthly + totalDevice).toLocaleString()}/月</p>}
              <div style={{ borderTop: "1px solid #1a1a24", paddingTop: 10, marginTop: 6 }}>
                {lineList.map((line, idx) => {
                  const r = results[line.id]; const dr = deviceResults[line.id];
                  if (!r) return null;
                  return (
                    <div key={line.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #111118" }}>
                      <span style={{ fontSize: 12, color: "#666" }}>回線{idx+1}{line.name ? `（${line.name}）` : ""}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#e4e4f0" }}>
                        ¥{r.monthlyTotal.toLocaleString()}
                        {dr?.useKaedoki && <span style={{ color: "#8888ff", marginLeft: 4 }}>+端末¥{dr.kaedoki.monthly.toLocaleString()}</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 10, padding: "8px 12px", background: "#0a0a10", borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "#555" }}>初期費用合計（事務手数料）</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#ffaa33" }}>¥{totalInitial.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {lineList.map((line, idx) => {
          const r = results[line.id]; const dr = deviceResults[line.id];
          if (!r) return null;
          const isAct = line.id === activeLineId;
          return (
            <div key={line.id}>
              {lineList.length > 1 && (
                <button onClick={() => setActiveLineId(line.id)} style={{ width: "100%", padding: "8px 14px", marginBottom: 6, borderRadius: 8, textAlign: "left", border: isAct ? "2px solid #e60012" : "2px solid #1c1c28", background: isAct ? "#1a0306" : "#0a0a10", color: isAct ? "#ff8888" : "#555", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                  回線{idx+1}{line.name ? `（${line.name}）` : ""} — ¥{r.monthlyTotal.toLocaleString()}/月
                  {!isAct && <span style={{ float: "right", fontSize: 10, color: "#333" }}>▼ 詳細</span>}
                </button>
              )}
              {(isAct || lineList.length === 1) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {dr && <KaedokiResultCard dr={dr} planMonthly={r.monthlyTotal} />}
                  <ResultCard title={lineList.length > 1 ? `回線${idx+1}${line.name ? `（${line.name}）` : ""} 月額料金` : "月額料金（税込）"}>
                    <div style={{ padding: "14px 20px 4px" }}>
                      <p style={{ margin: "0 0 4px", fontSize: 11, color: "#555" }}>通常月額（回線のみ）</p>
                      <p style={{ margin: "0 0 8px", fontSize: 34, fontWeight: 800, color: r.monthlyTotal <= 0 ? "#44cc77" : "#ff3333", lineHeight: 1 }}>
                        {r.monthlyTotal <= 0
                          ? <span>¥0<span style={{ fontSize: 13, fontWeight: 400, color: "#44cc77", marginLeft: 6 }}>（0円！）</span></span>
                          : <span>¥{r.monthlyTotal.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400, color: "#555", marginLeft: 4 }}>/月</span></span>}
                      </p>
                      {r.totalDiscount < 0 && <p style={{ margin: "0 0 10px", fontSize: 12, color: "#44cc77" }}>割引合計 {fmt(r.totalDiscount)}/月</p>}
                    </div>
                    <ItemList items={r.monthly} fmt={fmt} />
                  </ResultCard>
                  {showHiwari && (() => {
                    const hi = calcHiwariItems(r.monthly);
                    const ht = hi.reduce((s, i) => s + i.hiwariAmount, 0);
                    return (
                      <ResultCard title={`初月概算（${contractDay}日契約・残${daysInMonth - contractDay + 1}日）`} accent="#ff8800">
                        <div style={{ padding: "14px 20px 4px" }}>
                          <p style={{ margin: "0 0 4px", fontSize: 11, color: "#555" }}>初月概算</p>
                          <p style={{ margin: "0 0 8px", fontSize: 34, fontWeight: 800, color: "#ff8800", lineHeight: 1 }}>
                            ¥{ht.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400, color: "#555", marginLeft: 4 }}>（初月）</span>
                          </p>
                          <p style={{ margin: "0 0 10px", fontSize: 11, color: "#555" }}>通常との差額 {fmt(ht - r.monthlyTotal)}</p>
                        </div>
                        <div style={{ padding: "0 20px 8px" }}>
                          {hi.map((item, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < hi.length - 1 ? "1px solid #141420" : "none" }}>
                              <div style={{ flex: 1, paddingRight: 8 }}>
                                <span style={{ fontSize: 12, color: item.type === "discount" ? "#44cc77" : item.type === "option" ? "#88aaff" : "#bbbbd0" }}>
                                  {item.type === "discount" ? "▼ " : ""}{item.label}
                                </span>
                                {item.hiwari && item.amount !== 0 && <span style={{ fontSize: 10, color: "#444", marginLeft: 6 }}>（通常{fmt(item.amount)}）</span>}
                                {!item.hiwari && item.amount !== 0 && <span style={{ fontSize: 10, color: "#555", marginLeft: 6 }}>日割りなし</span>}
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 600, color: item.type === "discount" ? "#44cc77" : "#ff9944", whiteSpace: "nowrap" }}>{fmt(item.hiwariAmount)}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ padding: "0 20px 12px" }}>
                          <p style={{ margin: 0, fontSize: 10, color: "#333" }}>※ dカードお支払割は月末日判定のため日割りなし</p>
                          <p style={{ margin: "3px 0 0", fontSize: 10, color: "#333" }}>※ 月々サポートは日割り対象外</p>
                        </div>
                      </ResultCard>
                    );
                  })()}
                  {r.uWariInfo && <UWariTimelineCard info={r.uWariInfo} deviceMonthly={dr?.useKaedoki ? dr.kaedoki.monthly : 0} />}
                  {r.u15Info && <U15TimelineCard info={r.u15Info} deviceMonthly={dr?.useKaedoki ? dr.kaedoki.monthly : 0} />}
                  <ResultCard title={lineList.length > 1 ? `回線${idx+1} 初期費用` : "初期費用（事務手数料）"}>
                    <div style={{ padding: "14px 20px 4px" }}>
                      <p style={{ margin: "0 0 4px", fontSize: 11, color: "#555" }}>合計</p>
                      <p style={{ margin: "0 0 10px", fontSize: 28, fontWeight: 800, color: "#ffaa33", lineHeight: 1 }}>¥{r.initialTotal.toLocaleString()}</p>
                    </div>
                    <ItemList items={r.initial} fmt={fmt} isInit />
                  </ResultCard>
                  {r.notes.length > 0 && (
                    <div style={{ background: "#0a0a10", border: "1px solid #161620", borderRadius: 10, padding: "12px 16px" }}>
                      {r.notes.map((n, i) => <p key={i} style={{ margin: i === 0 ? 0 : "5px 0 0", fontSize: 10, color: "#444", lineHeight: 1.6 }}>※ {n}</p>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}

    <p style={{ textAlign: "center", fontSize: 10, color: "#2a2a2a", marginTop: 4 }}>※本シミュレーターは概算です。実際の料金は公式サイトでご確認ください。</p>
  </div>
</div>

);
}

function U15TimelineCard({ info, deviceMonthly }) {
const { dataGB, dataAfter19, duringMonthly } = info;
return (
<div style={{ background: "#0e0e14", border: "1px solid #2a1e08", borderRadius: 12, overflow: "hidden" }}>
<div style={{ padding: "10px 20px", borderBottom: "1px solid #221808", background: "#0d0c0a" }}>
<p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#ffaa33", letterSpacing: "0.08em" }}>⏱ U15プランの料金・データ変化</p>
</div>
<div style={{ padding: "14px 20px" }}>
<div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
<span style={{ padding: "3px 10px", borderRadius: 20, background: "#ffaa3322", border: "1px solid #ffaa3344", fontSize: 10, color: "#ffaa33", fontWeight: 700 }}>15歳以下で申込み</span>
<span style={{ padding: "3px 10px", borderRadius: 20, background: "#0d1a10", border: "1px solid #1a3322", fontSize: 10, color: "#44aa77", fontWeight: 700 }}>5分かけ放題込み</span>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
<div style={{ borderRadius: 10, overflow: "hidden", border: "2px solid #ffaa3355", background: "#ffaa330a" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#ffaa3318", borderBottom: "1px solid #ffaa3333" }}>
<span style={{ fontSize: 11, color: "#ffaa33", fontWeight: 700 }}>〜18歳の誕生月まで</span>
<span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "#ffaa3322", border: "1px solid #ffaa3344", color: "#ffaa33", fontWeight: 700 }}>申込み〜最長3年</span>
</div>
<div style={{ padding: "10px 12px" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
<span style={{ fontSize: 11, color: "#555" }}>回線月額</span>
<span style={{ fontSize: 22, fontWeight: 800, color: "#ffaa33", lineHeight: 1 }}>¥{duringMonthly.toLocaleString()}<span style={{ fontSize: 11, fontWeight: 400, color: "#444", marginLeft: 3 }}>/月</span></span>
</div>
{deviceMonthly > 0 && (
<div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderTop: "1px solid #1a1a24" }}>
<span style={{ fontSize: 11, color: "#444" }}>端末代込み合計</span>
<span style={{ fontSize: 14, fontWeight: 700, color: "#ffcc66" }}>¥{(duringMonthly + deviceMonthly).toLocaleString()}/月</span>
</div>
)}
<div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderTop: "1px solid #1a1a24" }}>
<span style={{ fontSize: 11, color: "#444" }}>データ容量</span>
<span style={{ fontSize: 11, fontWeight: 600, color: "#44cc88" }}>{dataGB}GB/月</span>
</div>
</div>
</div>
<div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 0 2px 16px" }}>
<div style={{ width: 2, height: 16, background: "#440000", borderRadius: 1 }} />
<span style={{ fontSize: 10, color: "#884444", fontWeight: 700 }}>▲ 19歳の誕生月翌月からデータ量が激減</span>
</div>
<div style={{ borderRadius: 10, overflow: "hidden", border: "2px solid #330000", background: "#150808" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#1a0808", borderBottom: "1px solid #2a1010" }}>
<span style={{ fontSize: 11, color: "#aa5555", fontWeight: 700 }}>19歳の誕生月翌月以降</span>
<span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "#2a0808", border: "1px solid #441010", color: "#aa5555", fontWeight: 700 }}>プラン変更を推奨</span>
</div>
<div style={{ padding: "10px 12px" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
<span style={{ fontSize: 11, color: "#555" }}>回線月額</span>
<span style={{ fontSize: 22, fontWeight: 800, color: "#ff4444", lineHeight: 1 }}>¥{duringMonthly.toLocaleString()}<span style={{ fontSize: 11, fontWeight: 400, color: "#444", marginLeft: 3 }}>/月</span></span>
</div>
<div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderTop: "1px solid #1a1a24" }}>
<span style={{ fontSize: 11, color: "#444" }}>データ容量</span>
<span style={{ fontSize: 11, fontWeight: 600, color: "#ff4444" }}>{dataAfter19}GB/月（{dataGB}GB→{dataAfter19}GB）</span>
</div>
<div style={{ marginTop: 8, padding: "6px 10px", background: "#200808", borderRadius: 8, border: "1px solid #3a1010" }}>
<p style={{ margin: 0, fontSize: 10, color: "#884444", lineHeight: 1.6 }}>同じ料金でデータが激減するため、19歳になる前にドコモMAXへの変更を検討してください。</p>
</div>
</div>
</div>
</div>
<p style={{ margin: "10px 0 0", fontSize: 10, color: "#333", lineHeight: 1.6 }}>※ 申込み時点で15歳以下が条件。みんなドコモ割・光セット割は対象外ですが、ファミリー割引の人数カウントには含まれます。</p>
</div>
</div>
);
}

function UWariTimelineCard({ info, deviceMonthly }) {
const { type, months, disc, duringMonthly, afterMonthly, bonusGB, basePlanLabel } = info;
const label = type === "u22" ? "U22割" : "U29割";
const ac = type === "u22" ? "#cc88ff" : "#88ccff";
const phases = [
{ range: `1〜${months}か月目`, tag: `${label}適用中`, monthly: duringMonthly, total: duringMonthly + deviceMonthly, data: basePlanLabel === "〜30GB" ? "30GB（27GBボーナス含む）" : "無制限", highlight: true },
{ range: `${months+1}か月目以降`, tag: `${label}終了後`, monthly: afterMonthly, total: afterMonthly + deviceMonthly, data: basePlanLabel === "〜30GB" ? "〜3GB（ボーナスなし）" : "無制限", highlight: false, isAfter: true },
];
return (
<div style={{ background: "#0e0e14", border: "1px solid #251828", borderRadius: 12, overflow: "hidden" }}>
<div style={{ padding: "10px 20px", borderBottom: "1px solid #1e1824", background: "#0d0b14" }}>
<p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: ac, letterSpacing: "0.08em" }}>⏱ {label}の料金変化タイムライン</p>
</div>
<div style={{ padding: "14px 20px" }}>
<div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
<span style={{ padding: "3px 10px", borderRadius: 20, background: `${ac}22`, border: `1px solid ${ac}44`, fontSize: 10, color: ac, fontWeight: 700 }}>最大{months}か月間</span>
<span style={{ padding: "3px 10px", borderRadius: 20, background: "#1a1a10", border: "1px solid #333322", fontSize: 10, color: "#aaa844", fontWeight: 700 }}>−¥{disc.toLocaleString()}/月</span>
{basePlanLabel === "〜30GB" && <span style={{ padding: "3px 10px", borderRadius: 20, background: "#0d1a10", border: "1px solid #1a3322", fontSize: 10, color: "#44aa77", fontWeight: 700 }}>+{bonusGB}GBボーナス</span>}
</div>
<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
{phases.map((ph, i) => (
<div key={i}>
{i > 0 && (
<div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 0 2px 16px" }}>
<div style={{ width: 2, height: 16, background: "#440000", borderRadius: 1 }} />
<span style={{ fontSize: 10, color: "#884444", fontWeight: 700 }}>▲ ここから料金アップ</span>
</div>
)}
<div style={{ borderRadius: 10, overflow: "hidden", border: ph.highlight ? `2px solid ${ac}55` : "2px solid #330000", background: ph.highlight ? `${ac}0a` : "#150808" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: ph.highlight ? `${ac}18` : "#1a0808", borderBottom: ph.highlight ? `1px solid ${ac}33` : "1px solid #2a1010" }}>
<span style={{ fontSize: 11, color: ph.highlight ? ac : "#884444", fontWeight: 700 }}>{ph.range}</span>
<span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700, background: ph.highlight ? `${ac}22` : "#2a0808", color: ph.highlight ? ac : "#aa5555",                   border: `1px solid ${ph.highlight ? ac + "44" : "#441010"}` }}>{ph.tag}</span>
</div>
<div style={{ padding: "10px 12px" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
<span style={{ fontSize: 11, color: "#555" }}>回線月額</span>
<span style={{ fontSize: 22, fontWeight: 800, color: ph.highlight ? ac : "#ff4444", lineHeight: 1 }}>¥{ph.monthly.toLocaleString()}<span style={{ fontSize: 11, fontWeight: 400, color: "#444", marginLeft: 3 }}>/月</span></span>
</div>
{deviceMonthly > 0 && (
<div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderTop: "1px solid #1a1a24" }}>
<span style={{ fontSize: 11, color: "#444" }}>端末代込み合計</span>
<span style={{ fontSize: 14, fontWeight: 700, color: ph.highlight ? "#aaffcc" : "#ff6666" }}>¥{ph.total.toLocaleString()}/月</span>
</div>
)}
<div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderTop: "1px solid #1a1a24", marginTop: 2 }}>
<span style={{ fontSize: 11, color: "#444" }}>データ容量</span>
<span style={{ fontSize: 11, fontWeight: 600, color: ph.highlight ? "#44cc88" : "#666" }}>{ph.data}</span>
</div>
{ph.isAfter && (
<div style={{ marginTop: 8, padding: "6px 10px", background: "#200808", borderRadius: 8, border: "1px solid #3a1010" }}>
<div style={{ display: "flex", justifyContent: "space-between" }}>
<span style={{ fontSize: 10, color: "#884444" }}>割引終了による月額アップ</span>
<span style={{ fontSize: 12, fontWeight: 700, color: "#ff6666" }}>+¥{disc.toLocaleString()}/月</span>
</div>
{basePlanLabel === "〜30GB" && (
<div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
<span style={{ fontSize: 10, color: "#664444" }}>ボーナスパケット終了</span>
<span style={{ fontSize: 11, fontWeight: 600, color: "#884444" }}>−{bonusGB}GB</span>
</div>
)}
</div>
)}
</div>
</div>
</div>
))}
</div>
<p style={{ margin: "10px 0 0", fontSize: 10, color: "#333", lineHeight: 1.6 }}>※ {label}は{type === "u22" ? "22歳以下" : "23〜29歳"}が対象。割引終了後も他の割引は継続適用されます。</p>
</div>
</div>
);
}

function KaedokiResultCard({ dr, planMonthly }) {
const { device, kaedoki, contractType, useKaedoki } = dr;
const disc = device.welcomeDisc[contractType];
return (
<div style={{ background: "#0e0e14", border: "1px solid #1e2030", borderRadius: 12, overflow: "hidden" }}>
<div style={{ padding: "10px 20px", borderBottom: "1px solid #1a1a24", background: "#0d0d1a" }}>
<p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#8888ff", letterSpacing: "0.08em" }}>📦 {device.label} — {contractType === "mnp" ? "乗り換え（MNP）" : "機種変更"}</p>
</div>
<div style={{ padding: "14px 20px" }}>
<div style={{ marginBottom: 14 }}>
<p style={{ margin: "0 0 6px", fontSize: 11, color: "#555" }}>端末価格の内訳</p>
<PriceRow label="本体価格（定価）" value={`¥${device.price.toLocaleString()}`} />
{disc > 0 && <PriceRow label="5G WELCOME割（MNP）" value={`−¥${disc.toLocaleString()}`} color="#44cc77" />}
{useKaedoki && <PriceRow label="残価（23回返却で免除）" value={`−¥${kaedoki.zanka.toLocaleString()}`} color="#44cc77" />}
<PriceRow label="1〜23回分の支払い合計" value={kaedoki.payFor23 <= 23 ? "¥23（月¥1×23回）" : `¥${kaedoki.totalIfReturn.toLocaleString()}`} bold />
</div>
{useKaedoki ? (
<>
<div style={{ background: "#0a0a18", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
<p style={{ margin: "0 0 10px", fontSize: 11, color: "#666" }}>月々の支払いイメージ</p>
<div style={{ marginBottom: 10 }}>
<div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
<span style={{ fontSize: 12, color: "#8888ff", fontWeight: 700 }}>1〜23回目</span>
<span style={{ fontSize: 10, color: "#444" }}>23ヶ月間</span>
</div>
<PhaseRow label="端末代" amount={kaedoki.monthly} color="#8888ff" />
<PhaseRow label="回線料金" amount={planMonthly} color="#aaaacc" />
<div style={{ borderTop: "1px solid #222230", marginTop: 4, paddingTop: 4 }}>
<PhaseRow label="月合計" amount={kaedoki.monthly + planMonthly} color="#ff5555" bold />
</div>
</div>
<div style={{ padding: "10px", background: "#0d1a0d", borderRadius: 8, marginBottom: 8, border: "1px solid #1a2a1a" }}>
<p style={{ margin: "0 0 5px", fontSize: 10, color: "#44cc77", fontWeight: 700 }}>✅ 23回目に返却した場合（24回目以降）</p>
<PhaseRow label="端末代" amount={0} color="#44cc77" zeroLabel="¥0（残価免除）" />
<PhaseRow label="回線料金" amount={planMonthly} color="#aaaacc" />
<div style={{ borderTop: "1px solid #1a2a1a", marginTop: 4, paddingTop: 4 }}>
<PhaseRow label="月合計" amount={planMonthly} color="#44cc77" bold />
</div>
<p style={{ margin: "6px 0 0", fontSize: 10, color: "#2a4a2a", lineHeight: 1.5 }}>※ プログラム利用料¥22,000が別途発生（次のドコモ機種買替えで免除）</p>
</div>
<div style={{ padding: "10px", background: "#1a100a", borderRadius: 8, border: "1px solid #2a1a0a" }}>
<p style={{ margin: "0 0 5px", fontSize: 10, color: "#ff9944", fontWeight: 700 }}>🔄 返却せずそのまま使う場合（25〜48回目）</p>
<PhaseRow label={`端末代（残価¥${kaedoki.zanka.toLocaleString()}を24分割）`} amount={kaedoki.zankaMonthly} color="#ff9944" />
<PhaseRow label="回線料金" amount={planMonthly} color="#aaaacc" />
<div style={{ borderTop: "1px solid #2a1a0a", marginTop: 4, paddingTop: 4 }}>
<PhaseRow label="月合計" amount={kaedoki.zankaMonthly + planMonthly} color="#ff9944" bold />
</div>
</div>
</div>
<div>
<p style={{ margin: "0 0 6px", fontSize: 11, color: "#555" }}>端末代の支払総額（比較）</p>
<PriceRow label="返却した場合（23回分）" value={kaedoki.payFor23 <= 23 ? "¥23（実質無料）" : `¥${kaedoki.totalIfReturn.toLocaleString()}`} color="#44cc77" />
<PriceRow label="返却しない場合（全額）" value={`¥${kaedoki.priceAfterDisc.toLocaleString()}`} color="#ff9944" />
<PriceRow label="差額（免除される残価）" value={`¥${kaedoki.zanka.toLocaleString()}`} />
</div>
</>
) : (
<div>
<p style={{ margin: "0 0 6px", fontSize: 11, color: "#555" }}>24回分割払い（カエドキなし）</p>
<div style={{ background: "#0a0a18", borderRadius: 10, padding: "12px 14px" }}>
<PhaseRow label={`端末代（¥${kaedoki.priceAfterDisc.toLocaleString()} ÷ 24回）`} amount={Math.ceil(kaedoki.priceAfterDisc / 24)} color="#8888ff" />
<PhaseRow label="回線料金" amount={planMonthly} color="#aaaacc" />
<div style={{ borderTop: "1px solid #222230", marginTop: 4, paddingTop: 4 }}>
<PhaseRow label="月合計" amount={Math.ceil(kaedoki.priceAfterDisc / 24) + planMonthly} color="#ff5555" bold />
</div>
</div>
<div style={{ marginTop: 8 }}><PriceRow label="支払総額（端末代）" value={`¥${kaedoki.priceAfterDisc.toLocaleString()}`} /></div>
</div>
)}
<p style={{ margin: "10px 0 0", fontSize: 10, color: "#333", lineHeight: 1.6 }}>※ 2026年4月17日以降のドコモオンラインショップ価格。最新情報は公式サイトでご確認ください。</p>
</div>
</div>
);
}

function PriceRow({ label, value, color, bold }) {
return (
<div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #111118" }}>
<span style={{ fontSize: 11, color: "#555" }}>{label}</span>
<span style={{ fontSize: 12, fontWeight: bold ? 700 : 600, color: color || "#e4e4f0", fontVariantNumeric: "tabular-nums" }}>{value}</span>
</div>
);
}

function PhaseRow({ label, amount, color, bold, zeroLabel }) {
return (
<div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
<span style={{ fontSize: 11, color: "#444", flex: 1, paddingRight: 8 }}>{label}</span>
<span style={{ fontSize: 12, fontWeight: bold ? 700 : 600, color: color || "#e4e4f0", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
{amount === 0 ? (zeroLabel || "¥0") : `¥${amount.toLocaleString()}`}
</span>
</div>
);
}

function ItemList({ items, fmt, isInit }) {
return (
<div style={{ padding: "0 20px 14px" }}>
{items.map((item, i) => (
<div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < items.length - 1 ? "1px solid #141420" : "none" }}>
<span style={{ fontSize: 12, flex: 1, paddingRight: 8, color: item.type === "discount" ? "#44cc77" : item.type === "option" ? "#88aaff" : isInit ? "#ffcc66" : "#bbbbd0" }}>
{item.type === "discount" ? "▼ " : ""}{item.label}
</span>
<span style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: item.type === "discount" ? "#44cc77" : "#e4e4f0", whiteSpace: "nowrap" }}>{fmt(item.amount)}</span>
</div>
))}
</div>
);
}

function ResultCard({ title, children, accent }) {
return (
<div style={{ background: "#0e0e14", border: `1px solid ${accent ? "#2a1a08" : "#1e1e28"}`, borderRadius: 12, overflow: "hidden" }}>
<div style={{ padding: "10px 20px", borderBottom: `1px solid ${accent ? "#1e1408" : "#1a1a24"}` }}>
<p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: accent || "#555", letterSpacing: "0.08em" }}>{title}</p>
</div>
{children}
</div>
);
}

function Card({ title, children }) {
return (
<div style={{ background: "#0f0f17", border: "1px solid #1c1c28", borderRadius: 12, padding: "14px 16px" }}>
<p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: "0.1em" }}>{title}</p>
{children}
</div>
);
}

function RadioRow({ label, sub, selected, accent, onClick }) {
return (
<button onClick={onClick} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "9px 12px", marginBottom: 5, borderRadius: 8, border: selected ? `2px solid ${accent}` : "2px solid #1c1c28", background: selected ? `${accent}14` : "#080810", color: selected ? "#fff" : "#777", cursor: "pointer", textAlign: "left", transition: "all 0.12s" }}>
<span style={{ fontSize: 13, fontWeight: selected ? 600 : 400 }}>{label}</span>
<span style={{ fontSize: 11, color: selected ? accent : "#444", fontWeight: 600 }}>{sub}</span>
</button>
);
}

function Chip({ label, selected, accent, onClick }) {
return (
<button onClick={onClick} style={{ flex: 1, padding: "9px 4px", borderRadius: 8, border: selected ? `2px solid ${accent}` : "2px solid #1c1c28", background: selected ? `${accent}18` : "#080810", color: selected ? accent : "#555", fontWeight: 700, fontSize: 11, cursor: "pointer", whiteSpace: "pre-line", lineHeight: 1.5, transition: "all 0.12s" }}>
{label}
</button>
);
}

function Toggle({ label, sub, checked, onChange }) {
return (
<div onClick={() => onChange(!checked)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", borderRadius: 8, cursor: "pointer", border: checked ? "2px solid #4466dd" : "2px solid #1c1c28", background: checked ? "#080d1a" : "#080810", transition: "all 0.15s" }}>
<div>
<p style={{ margin: 0, fontSize: 13, color: checked ? "#aaccff" : "#777" }}>{label}</p>
{sub && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#444" }}>{sub}</p>}
</div>
<div style={{ width: 36, height: 20, borderRadius: 10, background: checked ? "#4466dd" : "#2a2a3a", position: "relative", flexShrink: 0, transition: "all 0.2s" }}>
<div style={{ position: "absolute", top: 3, left: checked ? 18 : 3, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "all 0.2s" }} />
</div>
</div>
);
}
