import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";

/* ---------------------------------------------------------
   TOKENS — bg #0A0D12 panel #12161D line #1C222D
   text #E7EAEE muted #7C8798  bull #26D97C bear #FF4D6A
   signal (algo readout only) #E8B44C
--------------------------------------------------------- */

// Backend proxy adresi — anahtarlar artık burada, sunucu tarafında.
// Aynı WiFi'daki telefonda test ederken "localhost" yerine
// bilgisayarının IP'sini yaz (örn. http://192.168.1.6/piyasa-api)
const API_BASE = "http://192.168.1.6/piyasa-api";

const MARKETS = {
  crypto: {
    label: "Kripto",
    symbols: [
      { v: "BTCUSDT", l: "BTC/USDT" },
      { v: "ETHUSDT", l: "ETH/USDT" },
      { v: "SOLUSDT", l: "SOL/USDT" },
      { v: "BNBUSDT", l: "BNB/USDT" },
      { v: "XRPUSDT", l: "XRP/USDT" },
      { v: "ADAUSDT", l: "ADA/USDT" },
      { v: "DOGEUSDT", l: "DOGE/USDT" },
      { v: "AVAXUSDT", l: "AVAX/USDT" },
      { v: "DOTUSDT", l: "DOT/USDT" },
      { v: "LINKUSDT", l: "LINK/USDT" },
      { v: "TRXUSDT", l: "TRX/USDT" },
      { v: "LTCUSDT", l: "LTC/USDT" },
      { v: "ATOMUSDT", l: "ATOM/USDT" },
      { v: "NEARUSDT", l: "NEAR/USDT" },
      { v: "ARBUSDT", l: "ARB/USDT" },
      { v: "OPUSDT", l: "OP/USDT" },
      { v: "SUIUSDT", l: "SUI/USDT" },
      { v: "TONUSDT", l: "TON/USDT" },
      { v: "SHIBUSDT", l: "SHIB/USDT" },
      { v: "PEPEUSDT", l: "PEPE/USDT" },
    ],
  },
  forex: {
    label: "Forex",
    symbols: [
      { v: "USDTRY", l: "USD/TRY" },
      { v: "EURTRY", l: "EUR/TRY" },
      { v: "GBPTRY", l: "GBP/TRY" },
      { v: "EURUSD", l: "EUR/USD" },
      { v: "GBPUSD", l: "GBP/USD" },
    ],
  },
  bist: {
    label: "BIST",
    symbols: [
      { v: "THYAO", l: "THYAO" },
      { v: "ASELS", l: "ASELS" },
      { v: "GARAN", l: "GARAN" },
      { v: "SISE", l: "SISE" },
      { v: "AKBNK", l: "AKBNK" },
      { v: "KCHOL", l: "KCHOL" },
      { v: "EREGL", l: "EREGL" },
      { v: "BIMAS", l: "BIMAS" },
      { v: "TUPRS", l: "TUPRS" },
      { v: "SASA", l: "SASA" },
      { v: "PGSUS", l: "PGSUS" },
      { v: "FROTO", l: "FROTO" },
      { v: "TCELL", l: "TCELL" },
      { v: "YKBNK", l: "YKBNK" },
      { v: "ISCTR", l: "ISCTR" },
      { v: "PETKM", l: "PETKM" },
      { v: "TOASO", l: "TOASO" },
      { v: "ARCLK", l: "ARCLK" },
      { v: "SAHOL", l: "SAHOL" },
      { v: "MGROS", l: "MGROS" },
    ],
  },
  madenler: {
    label: "Madenler",
    symbols: [
      { v: "XAUUSD", l: "Ons Altın", kind: "gold-oz" },
      { v: "XAGUSD", l: "Ons Gümüş", kind: "silver-oz" },
      { v: "GRAM", l: "Gram Altın", kind: "gold-gram" },
      { v: "CEYREK", l: "Çeyrek Altın", kind: "gold-ceyrek" },
      { v: "TAM", l: "Tam Altın", kind: "gold-tam" },
      { v: "KG", l: "Kg Altın", kind: "gold-kg" },
      { v: "PLATIN", l: "Platin", kind: "metalsdev-XPT" },
      { v: "PALADYUM", l: "Paladyum", kind: "metalsdev-XPD" },
    ],
  },
};

const TIMEFRAMES = [
  { v: "15m", l: "15dk" },
  { v: "1h", l: "1s" },
  { v: "4h", l: "4s" },
  { v: "1d", l: "1g" },
];

/* ---------------- synthetic fallback (used only when a market has no keyless history source) ---------------- */
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
function genDemoCandles(seedStr, n = 110, anchor = null) {
  const rnd = seededRandom(seedStr.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + n);
  let price = anchor || 100 + rnd() * 400;
  const candles = [];
  const legs = [
    { n: 22, bias: -0.6 },
    { n: 14, bias: 0.55 },
    { n: 10, bias: -0.7 },
    { n: 14, bias: 0.6 },
    { n: 50, bias: -0.15 },
  ];
  let t = Date.now() - n * 3600000;
  legs.forEach((leg) => {
    for (let i = 0; i < leg.n && candles.length < n; i++) {
      const vol = price * 0.012;
      const drift = leg.bias * vol * (0.4 + rnd() * 0.8);
      const open = price;
      const close = open + drift + (rnd() - 0.5) * vol * 0.6;
      const high = Math.max(open, close) + rnd() * vol * 0.5;
      const low = Math.min(open, close) - rnd() * vol * 0.5;
      candles.push({ t, open, high, low, close });
      price = close;
      t += 3600000;
    }
  });
  return candles.slice(-n);
}

/* ---------------- CRYPTO — Binance public klines (no key), CoinGecko yedek ---------------- */
async function fetchCrypto(symbol, interval) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=110`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Binance isteği başarısız (" + res.status + ")");
  const raw = await res.json();
  return raw.map((k) => ({
    t: k[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
  }));
}

const COINGECKO_IDS = {
  BTCUSDT: "bitcoin", ETHUSDT: "ethereum", SOLUSDT: "solana", BNBUSDT: "binancecoin", XRPUSDT: "ripple",
  ADAUSDT: "cardano", DOGEUSDT: "dogecoin", AVAXUSDT: "avalanche-2", DOTUSDT: "polkadot", LINKUSDT: "chainlink",
  TRXUSDT: "tron", LTCUSDT: "litecoin", ATOMUSDT: "cosmos", NEARUSDT: "near", ARBUSDT: "arbitrum",
  OPUSDT: "optimism", SUIUSDT: "sui", TONUSDT: "the-open-network", SHIBUSDT: "shiba-inu", PEPEUSDT: "pepe",
};

async function fetchCryptoCoinGecko(symbol) {
  const id = COINGECKO_IDS[symbol];
  if (!id) throw new Error("CoinGecko eşlemesi yok: " + symbol);
  const res = await fetch(`https://api.coingecko.com/api/v3/coins/${id}/ohlc?vs_currency=usd&days=14`);
  if (!res.ok) throw new Error("CoinGecko isteği başarısız (" + res.status + ")");
  const raw = await res.json();
  if (!Array.isArray(raw) || !raw.length) throw new Error("CoinGecko boş veri döndürdü");
  return raw.map((k) => ({ t: k[0], open: k[1], high: k[2], low: k[3], close: k[4] }));
}

/* ---------------- FOREX — Frankfurter (ECB, daily, no key) + open.er-api (canlı kur, no key) ---------------- */
async function fetchForexHistory(pair) {
  const from = pair.slice(0, 3);
  const to = pair.slice(3);
  const end = new Date();
  const start = new Date(end.getTime() - 130 * 86400000);
  const f = (d) => d.toISOString().slice(0, 10);
  const symbols = Array.from(new Set([from, to].filter((c) => c !== "EUR"))).join(",");
  const url = `https://api.frankfurter.dev/v1/${f(start)}..${f(end)}?symbols=${symbols}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Frankfurter isteği başarısız (" + res.status + ")");
  const data = await res.json();
  const dates = Object.keys(data.rates || {}).sort();
  if (!dates.length) throw new Error("Forex geçmişi boş döndü");
  let prevClose = null;
  const candles = dates.map((d) => {
    const day = data.rates[d];
    let close;
    if (from === "EUR") close = day[to];
    else if (to === "EUR") close = 1 / day[from];
    else close = day[to] / day[from];
    const open = prevClose == null ? close : prevClose;
    const high = Math.max(open, close) * 1.0006;
    const low = Math.min(open, close) * 0.9994;
    prevClose = close;
    return { t: new Date(d).getTime(), open, high, low, close };
  });
  return candles;
}

async function fetchForexLive(pair) {
  const from = pair.slice(0, 3);
  const to = pair.slice(3);
  const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
  if (!res.ok) throw new Error("Canlı kur isteği başarısız");
  const data = await res.json();
  const rate = data?.rates?.[to];
  if (!rate) throw new Error("Kur bulunamadı");
  return rate;
}

/* ---------------- BIST — artık kendi PHP proxy'miz üzerinden (anahtarlar sunucuda, tarayıcıya hiç gelmez) ---------------- */
async function fetchBistQuote(code) {
  const res = await fetch(`${API_BASE}/financebird.php?code=${encodeURIComponent(code)}`);
  if (!res.ok) throw new Error("FinanceBird proxy isteği başarısız (" + res.status + ")");
  const j = await res.json();
  const price = j.regularMarketPrice || j.currentPrice || j.price || j.summary?.price;
  if (!price) throw new Error("Fiyat alanı bulunamadı");
  return {
    price,
    open: j.regularMarketOpen || j.openPrice || price,
    high: j.regularMarketDayHigh || j.dayHigh || price,
    low: j.regularMarketDayLow || j.dayLow || price,
    chg: j.regularMarketChangePercent || j.changePercent || 0,
  };
}

async function fetchBist100List() {
  const res = await fetch(`${API_BASE}/bist100.php`);
  if (!res.ok) throw new Error("BIST100 proxy isteği başarısız (" + res.status + ")");
  const j = await res.json();
  const list = Array.isArray(j) ? j : Array.isArray(j.data) ? j.data : Array.isArray(j.prices) ? j.prices : Array.isArray(j.result) ? j.result : Object.values(j).find(Array.isArray);
  if (!list || !list.length) throw new Error("Liste formatı tanınamadı: " + JSON.stringify(j).slice(0, 140));
  return list;
}

function extractBistEntry(list, code) {
  const entry = list.find((item) => String(item.code).toUpperCase() === code.toUpperCase());
  if (!entry) throw new Error(code + " listede bulunamadı (liste " + list.length + " kayıt içeriyor)");
  const price = entry.last ?? entry.close;
  if (!price) throw new Error("Fiyat alanı bulunamadı");
  return {
    price,
    open: entry.open ?? price,
    high: entry.high || price,
    low: entry.low || price,
    chg: entry.daily_change_percent || 0,
  };
}

async function fetchBistQuoteNosy(code) {
  const url = `${API_BASE}/nosyapi.php?code=${encodeURIComponent(code)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("NosyAPI proxy isteği başarısız (" + res.status + ")");
  const j = await res.json();
  if (j.status !== "success" || !j.data || !j.data.length) throw new Error(j.messageTR || "NosyAPI veri döndürmedi");
  const d = j.data[0];
  return {
    price: d.latest,
    open: d.latest - (d.change || 0),
    high: d.dayMax ?? d.latest,
    low: d.dayMin ?? d.latest,
    chg: d.changeRate || 0,
  };
}

/* ---------------- header ticker — anahtarsız canlı kur / kripto / altın ---------------- */
const TROY_OUNCE_G = 31.1034768;

/* ---------------- MADENLER — gold/silver via tokenized-metal OHLC (CoinGecko), platinum/palladium via proxy ---------------- */
async function fetchUsdTryRate() {
  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!res.ok) throw new Error("USD/TRY kuru alınamadı (" + res.status + ")");
  const data = await res.json();
  const rate = data?.rates?.TRY;
  if (!rate) throw new Error("USD/TRY kuru yanıtta bulunamadı");
  return rate;
}

async function fetchMetalOHLC(coingeckoId) {
  const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coingeckoId}/ohlc?vs_currency=usd&days=14`);
  if (!res.ok) throw new Error("CoinGecko isteği başarısız (" + res.status + ")");
  const raw = await res.json();
  if (!Array.isArray(raw) || !raw.length) throw new Error("CoinGecko boş veri döndürdü");
  return raw.map((k) => ({ t: k[0], open: k[1], high: k[2], low: k[3], close: k[4] }));
}

function scaleCandles(candles, factor) {
  return candles.map((c) => ({ t: c.t, open: c.open * factor, high: c.high * factor, low: c.low * factor, close: c.close * factor }));
}

// Son mumu doğrulanmış canlı fiyatla eşitler — farklı kaynaklardan gelen
// "anlık fiyat" ile "grafikteki son değer" arasında çelişki oluşmasını engeller.
function reconcileLastClose(candles, livePrice) {
  if (!candles?.length || livePrice == null || isNaN(livePrice)) return candles;
  const out = candles.slice();
  const last = { ...out[out.length - 1] };
  last.close = livePrice;
  last.high = Math.max(last.high, livePrice);
  last.low = Math.min(last.low, livePrice);
  out[out.length - 1] = last;
  return out;
}

async function fetchMetalsDevSpot(metalName) {
  const res = await fetch(`${API_BASE}/metalsdev.php?metal=${encodeURIComponent(metalName)}`);
  const j = await res.json();
  if (!res.ok || j.error) throw new Error(j.message || "Metals.Dev proxy isteği başarısız (" + res.status + ")");
  const price = j?.metals?.[metalName.toLowerCase()];
  if (!price) throw new Error("Metals.Dev yanıtında " + metalName + " bulunamadı");
  return price;
}

/* ---------------- Groq AI market analysis — proxy üzerinden ---------------- */
async function fetchGroqAnalysis({ symbolLabel, price, trend, bias, score, zone, bos, sweep, targets, stop, forecast, atrPct }) {
  const context = `
Sembol: ${symbolLabel}
Anlık fiyat: ${price}
Trend: ${trend}
Yönelim: ${bias}
Kural tabanlı skor: ${score}/100
Likidite bölgesi: ${zone ? zone.min.toFixed(4) + " - " + zone.max.toFixed(4) : "yok"}
BOS (break of structure): ${bos ? bos.dir + " @ " + bos.level.toFixed(4) : "yok"}
Likidite sweep: ${sweep ? "tespit edildi" : "yok"}
Önerilen stop seviyesi: ${stop ? stop.toFixed(4) : "yok"}
Hedef seviyeleri: ${targets && targets.length ? targets.map((t) => t.toFixed(4)).join(", ") : "yok"}
AI tahmin dağılımı: artış %${forecast.up}, yatay %${forecast.flat}, azalış %${forecast.down}
Volatilite (ATR): %${atrPct}
`.trim();

  const res = await fetch(`${API_BASE}/groq.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "Sen deneyimli bir teknik analiz uzmanısın. Sana verilen kural-tabanlı grafik verilerini yorumlayarak kısa, net, Türkçe bir piyasa analizi yaz. 4-6 cümle. Kesin yatırım tavsiyesi verme, olası senaryoları ve risk noktalarını belirt. Jargonu gerektiğinde kısaca açıkla.",
        },
        { role: "user", content: context },
      ],
      temperature: 0.4,
      max_tokens: 400,
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error("Groq proxy isteği başarısız (" + res.status + ") " + errText.slice(0, 160));
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq yanıtında metin bulunamadı");
  return text.trim();
}

async function fetchTickerData() {
  const [usdtryR, eurtryR, btcR, ethR, cgR] = await Promise.allSettled([
    fetch("https://open.er-api.com/v6/latest/USD").then((r) => r.json()),
    fetch("https://open.er-api.com/v6/latest/EUR").then((r) => r.json()),
    fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT").then((r) => r.json()),
    fetch("https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT").then((r) => r.json()),
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=pax-gold,bitcoin,ethereum&vs_currencies=usd").then((r) => r.json()),
  ]);

  const usdtry = usdtryR.status === "fulfilled" ? usdtryR.value?.rates?.TRY : null;
  const eurtry = eurtryR.status === "fulfilled" ? eurtryR.value?.rates?.TRY : null;
  const cg = cgR.status === "fulfilled" ? cgR.value : null;
  const btc = (btcR.status === "fulfilled" ? parseFloat(btcR.value?.price) : null) || cg?.bitcoin?.usd || null;
  const eth = (ethR.status === "fulfilled" ? parseFloat(ethR.value?.price) : null) || cg?.ethereum?.usd || null;
  const paxgUsd = cg?.["pax-gold"]?.usd || null;

  let gramAltin = null;
  if (paxgUsd && usdtry) gramAltin = (paxgUsd / TROY_OUNCE_G) * usdtry;

  return {
    usdtry,
    eurtry,
    btc,
    eth,
    gramAltin,
    ceyrekAltin: gramAltin ? gramAltin * 1.75 : null,
    tamAltin: gramAltin ? gramAltin * 7.0 : null,
    kgAltin: gramAltin ? gramAltin * 1000 : null,
    ok: !!(usdtry && btc && gramAltin),
  };
}

/* ---------------- pattern algorithm (unchanged logic) ---------------- */
function findPivots(candles, side = 2) {
  const highs = [];
  const lows = [];
  for (let i = side; i < candles.length - side; i++) {
    const c = candles[i];
    let isHigh = true;
    let isLow = true;
    for (let j = i - side; j <= i + side; j++) {
      if (j === i) continue;
      if (candles[j].high >= c.high) isHigh = false;
      if (candles[j].low <= c.low) isLow = false;
    }
    if (isHigh) highs.push({ i, price: c.high });
    if (isLow) lows.push({ i, price: c.low });
  }
  return { highs, lows };
}
function getTrend(highs, lows) {
  if (highs.length < 2 || lows.length < 2) return "belirsiz";
  const h1 = highs[highs.length - 2].price;
  const h2 = highs[highs.length - 1].price;
  const l1 = lows[lows.length - 2].price;
  const l2 = lows[lows.length - 1].price;
  if (h2 < h1 && l2 < l1) return "bearish";
  if (h2 > h1 && l2 > l1) return "bullish";
  return "yatay";
}
function findZone(pivots, tolerancePct = 0.006) {
  if (pivots.length < 1) return null;
  const last = pivots[pivots.length - 1];
  const near = pivots.filter((p) => Math.abs(p.price - last.price) / last.price <= tolerancePct);
  const prices = near.map((p) => p.price).concat(last.price);
  return { min: Math.min(...prices), max: Math.max(...prices), at: last.i, count: near.length };
}
function findBOS(candles, lows, highs, trend) {
  if (trend === "bearish" && lows.length >= 2) {
    const structural = lows[lows.length - 2];
    for (let i = structural.i + 1; i < candles.length; i++) {
      if (candles[i].close < structural.price) return { index: i, level: structural.price, dir: "bearish" };
    }
  }
  if (trend === "bullish" && highs.length >= 2) {
    const structural = highs[highs.length - 2];
    for (let i = structural.i + 1; i < candles.length; i++) {
      if (candles[i].close > structural.price) return { index: i, level: structural.price, dir: "bullish" };
    }
  }
  return null;
}
function findSweep(candles, zone, dir) {
  if (!zone) return null;
  for (let i = zone.at + 1; i < candles.length; i++) {
    const c = candles[i];
    if (dir === "bearish" && c.high > zone.max && c.close < zone.max) return { index: i, price: c.high };
    if (dir === "bullish" && c.low < zone.min && c.close > zone.min) return { index: i, price: c.low };
  }
  return null;
}
function buildAnalysis(candles) {
  if (!candles || candles.length < 20) return null;
  const { highs, lows } = findPivots(candles, 2);
  const trend = getTrend(highs, lows);
  const zoneSide = trend === "bearish" ? highs : trend === "bullish" ? lows : [];
  const zone = findZone(zoneSide);
  const bos = findBOS(candles, lows, highs, trend);
  const sweep = zone ? findSweep(candles, zone, trend) : null;
  const last = candles[candles.length - 1];
  const recentIdx = candles.length - 1;
  const sweepIsRecent = sweep && recentIdx - sweep.index <= 8;

  let score = 35;
  let bias = "nötr";
  if (trend === "bearish" || trend === "bullish") {
    bias = trend === "bearish" ? "aşağı yönlü (short bias)" : "yukarı yönlü (long bias)";
    score += 15;
    if (bos) score += 15;
    if (sweep) score += 15;
    if (sweepIsRecent) score += 10;
  }
  score = Math.min(92, score);

  let targets = [];
  if (trend === "bearish") targets = lows.map((p) => p.price).filter((p) => p < last.close).sort((a, b) => b - a).slice(0, 3);
  else if (trend === "bullish") targets = highs.map((p) => p.price).filter((p) => p > last.close).sort((a, b) => a - b).slice(0, 3);

  const stop = zone ? (trend === "bearish" ? zone.max : zone.min) : null;
  return { highs, lows, trend, zone, bos, sweep, sweepIsRecent, score, bias, targets, stop, last };
}

function calcATRPct(candles, period = 14) {
  const recent = candles.slice(-(period + 1));
  if (recent.length < 3) return 1.5;
  let trs = [];
  for (let i = 1; i < recent.length; i++) {
    const c = recent[i];
    const p = recent[i - 1];
    trs.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)));
  }
  const atr = trs.reduce((a, b) => a + b, 0) / trs.length;
  return (atr / recent[recent.length - 1].close) * 100;
}

function buildForecast(candles, analysis) {
  if (!analysis) return null;
  const atrPct = calcATRPct(candles);
  const { trend, score } = analysis;

  let up, down, flat;
  if (trend === "bullish") {
    up = score;
    down = 100 - score - 6;
    flat = 6;
  } else if (trend === "bearish") {
    down = score;
    up = 100 - score - 6;
    flat = 6;
  } else {
    up = 40;
    down = 40;
    flat = 20;
  }
  up = Math.max(4, Math.round(up));
  down = Math.max(4, Math.round(down));
  flat = Math.max(2, 100 - up - down);

  const dir = up >= down ? "artış" : "azalış";
  const dirColor = up >= down ? "#26D97C" : "#FF4D6A";
  const confidence = Math.max(up, down);
  const low = +(atrPct * 0.5).toFixed(2);
  const high = +(atrPct * 1.6).toFixed(2);

  return { up, down, flat, dir, dirColor, confidence, low, high, atrPct: +atrPct.toFixed(2) };
}

/* ---------------- shared TR number formatting (nokta=binlik, virgül=ondalık) ---------------- */
function fmtNum(p) {
  if (p == null || isNaN(p)) return "—";
  const abs = Math.abs(p);
  let maxFrac;
  if (abs >= 10000) maxFrac = 0;
  else if (abs >= 100) maxFrac = 2;
  else if (abs >= 1) maxFrac = 2;
  else maxFrac = 4;
  return p.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: maxFrac });
}

/* ---------------- chart ---------------- */
function Candlestick({ candles, analysis, height = 380 }) {
  if (!candles.length) return null;
  const pad = 28;
  const spacing = 9;
  const width = candles.length * spacing + pad * 2;
  const allHigh = Math.max(...candles.map((c) => c.high));
  const allLow = Math.min(...candles.map((c) => c.low));
  const range = allHigh - allLow || 1;
  const y = (price) => pad + (1 - (price - allLow) / range) * (height - pad * 2);
  const x = (i) => pad + i * spacing + spacing / 2;
  const fmt = fmtNum;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="xMidYMid meet">
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={0} x2={width} y1={pad + f * (height - pad * 2)} y2={pad + f * (height - pad * 2)} stroke="#1C222D" strokeWidth="1" />
      ))}
      {analysis?.zone && (
        <>
          <rect x={0} y={y(analysis.zone.max)} width={width} height={Math.max(2, y(analysis.zone.min) - y(analysis.zone.max))} fill="#E8B44C" opacity="0.14" />
          <text x={width - pad} y={y(analysis.zone.max) - 5} textAnchor="end" fontSize="9" fill="#E8B44C" fontFamily="ui-monospace, monospace">LİKİDİTE BÖLGESİ</text>
        </>
      )}
      {analysis?.bos && (
        <>
          <line x1={x(analysis.bos.index) - spacing} x2={width} y1={y(analysis.bos.level)} y2={y(analysis.bos.level)} stroke={analysis.bos.dir === "bearish" ? "#FF4D6A" : "#26D97C"} strokeDasharray="4 3" strokeWidth="1.3" />
          <text x={width - pad} y={y(analysis.bos.level) - 5} textAnchor="end" fontSize="9" fill={analysis.bos.dir === "bearish" ? "#FF4D6A" : "#26D97C"} fontFamily="ui-monospace, monospace">BOS</text>
        </>
      )}
      {analysis?.targets?.map((t, idx) => (
        <line key={idx} x1={0} x2={width} y1={y(t)} y2={y(t)} stroke="#26D97C" strokeDasharray="2 4" strokeWidth="1" opacity="0.55" />
      ))}
      {candles.map((c, i) => {
        const up = c.close >= c.open;
        const color = up ? "#26D97C" : "#FF4D6A";
        const bodyTop = y(Math.max(c.open, c.close));
        const bodyBot = y(Math.min(c.open, c.close));
        return (
          <g key={i}>
            <line x1={x(i)} x2={x(i)} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth="1" />
            <rect x={x(i) - spacing * 0.32} y={bodyTop} width={spacing * 0.64} height={Math.max(1, bodyBot - bodyTop)} fill={color} />
          </g>
        );
      })}
      {analysis?.sweep && (
        <g>
          <circle cx={x(analysis.sweep.index)} cy={y(analysis.sweep.price)} r="4.5" fill="none" stroke="#E8B44C" strokeWidth="1.6" />
          <text x={x(analysis.sweep.index)} y={y(analysis.sweep.price) - 9} textAnchor="middle" fontSize="9" fill="#E8B44C" fontFamily="ui-monospace, monospace">SWEEP</text>
        </g>
      )}
      <line x1={0} x2={width} y1={y(analysis.last.close)} y2={y(analysis.last.close)} stroke="#7C8798" strokeDasharray="1 3" strokeWidth="1" />
      <text x={pad} y={y(analysis.last.close) - 5} fontSize="9" fill="#E7EAEE" fontFamily="ui-monospace, monospace">{fmt(analysis.last.close)}</text>
    </svg>
  );
}

/* ---------------- Sirius star mark ---------------- */
function SiriusStar({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
      <circle cx="16" cy="16" r="15" fill="#E8B44C" />
      <circle cx="16" cy="16" r="11.2" fill="#0A0D12" />
      <polygon points="16,4.5 17,14.5 16,16 15,14.5" fill="#FDE68A" />
      <polygon points="16,27.5 17,17.5 16,16 15,17.5" fill="#FDE68A" />
      <polygon points="4.5,16 14.5,17 16,16 14.5,15" fill="#FDE68A" />
      <polygon points="27.5,16 17.5,17 16,16 17.5,15" fill="#FDE68A" />
      <circle cx="16" cy="16" r="1.9" fill="#fff" />
    </svg>
  );
}

function TickerChip({ label, value, sub }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1, paddingRight: 16, borderRight: "1px solid #1C222D" }}>
      <span className="mono" style={{ fontSize: 9, color: "#7C8798", letterSpacing: "0.03em" }}>{label}</span>
      <span className="mono" style={{ fontSize: 12.5, color: "#E7EAEE", fontWeight: 500 }}>
        {value} {sub && <span style={{ color: "#5B6472", fontSize: 10 }}>{sub}</span>}
      </span>
    </div>
  );
}

function PriceStat({ label, value, color, sub }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span className="mono" style={{ fontSize: 9.5, color: "#7C8798", letterSpacing: "0.04em" }}>{label}</span>
      <span className="disp" style={{ fontSize: 18, fontWeight: 700, color }}>
        {value} {sub && <span className="mono" style={{ fontSize: 9.5, color: "#5B6472", fontWeight: 400 }}>{sub}</span>}
      </span>
    </div>
  );
}

/* ---------------- space background ---------------- */
function SpaceBackground() {
  const stars = useMemo(() => {
    const rnd = seededRandom(42);
    return Array.from({ length: 90 }, (_, i) => ({
      id: i,
      x: rnd() * 100,
      y: rnd() * 100,
      size: 0.6 + rnd() * 1.6,
      delay: rnd() * 6,
      dur: 2.5 + rnd() * 3.5,
    }));
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        background: "radial-gradient(ellipse at 30% 20%, #0d1220 0%, #060810 55%, #020305 100%)",
        pointerEvents: "none",
      }}
    >
      <style>{`
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes sirius-pulse {
          0%, 100% { opacity: 0.75; transform: scale(1); filter: drop-shadow(0 0 6px #cfe8ff) drop-shadow(0 0 14px #8fb8ff); }
          50% { opacity: 1; transform: scale(1.25); filter: drop-shadow(0 0 14px #eaf4ff) drop-shadow(0 0 34px #a9caff); }
        }
        @keyframes shooting-star {
          0% { transform: translate(0, 0) rotate(35deg); opacity: 0; }
          3% { opacity: 1; }
          14% { transform: translate(340px, 480px) rotate(35deg); opacity: 0; }
          100% { transform: translate(340px, 480px) rotate(35deg); opacity: 0; }
        }
      `}</style>

      {stars.map((s) => (
        <div
          key={s.id}
          style={{
            position: "absolute",
            left: s.x + "%",
            top: s.y + "%",
            width: s.size + "px",
            height: s.size + "px",
            borderRadius: "50%",
            background: "#ffffff",
            animation: `star-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          left: "78%",
          top: "16%",
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: "#eaf4ff",
          animation: "sirius-pulse 2.4s ease-in-out infinite",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "18%",
          top: "-4%",
          width: "2px",
          height: "90px",
          background: "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0))",
          borderRadius: "2px",
          animation: "shooting-star 15s linear infinite",
        }}
      />
    </div>
  );
}

/* ---------------- main app ---------------- */
export default function App() {
  const [market, setMarket] = useState("crypto");
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1h");
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ kind: "live", note: "" });
  const [liveQuote, setLiveQuote] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [ticker, setTicker] = useState(null);
  const [groqAnalysis, setGroqAnalysis] = useState("");
  const [groqLoading, setGroqLoading] = useState(false);
  const [groqError, setGroqError] = useState("");
  const bist100CacheRef = useRef({ list: null, ts: 0 });

  const getBist100List = useCallback(async () => {
    const now = Date.now();
    if (bist100CacheRef.current.list && now - bist100CacheRef.current.ts < 60000) {
      return bist100CacheRef.current.list;
    }
    const list = await fetchBist100List();
    bist100CacheRef.current = { list, ts: now };
    return list;
  }, []);

  useEffect(() => {
    let alive = true;
    const load = () => fetchTickerData().then((d) => alive && setTicker(d)).catch(() => {});
    load();
    const id = setInterval(load, 90000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLiveQuote(null);
    try {
      if (market === "crypto") {
        try {
          const data = await fetchCrypto(symbol, timeframe);
          setCandles(data);
          setStatus({ kind: "live", note: "Binance — gerçek zamanlı mum verisi" });
        } catch (e1) {
          try {
            const data = await fetchCryptoCoinGecko(symbol);
            setCandles(data);
            setStatus({ kind: "live", note: "CoinGecko (yedek kaynak) — Binance'e ulaşılamadı: " + e1.message });
          } catch (e2) {
            setCandles(genDemoCandles(symbol));
            setStatus({ kind: "demo", note: "Binance: " + e1.message + " | CoinGecko: " + e2.message });
          }
        }
      } else if (market === "forex") {
        const [hist, live] = await Promise.allSettled([fetchForexHistory(symbol), fetchForexLive(symbol)]);
        const liveRate = live.status === "fulfilled" ? live.value : null;
        if (hist.status === "fulfilled") {
          setCandles(reconcileLastClose(hist.value, liveRate));
          setStatus({ kind: "live", note: "Frankfurter (ECB, geçmiş) + open.er-api (anlık) — son mum doğrulanmış anlık kura eşitlendi" });
        } else {
          setCandles(reconcileLastClose(genDemoCandles(symbol, 110, liveRate), liveRate));
          setStatus({ kind: liveRate ? "mixed" : "demo", note: "Forex geçmişi alınamadı (" + hist.reason?.message + ")" + (liveRate ? ", anlık kur gerçek" : ", demo veri gösteriliyor") });
        }
        if (liveRate != null) setLiveQuote(liveRate);
      } else if (market === "bist") {
        const errors = [];
        let done = false;

        if (!done) {
          try {
            const q = await fetchBistQuoteNosy(symbol);
            setLiveQuote(q.price);
            setCandles(reconcileLastClose(genDemoCandles(symbol, 110, q.price), q.price));
            setStatus({ kind: "mixed", note: "NosyAPI (proxy) — canlı anlık fiyat gerçek, geçmiş mum verisi sentetik" });
            done = true;
          } catch (e) {
            errors.push("NosyAPI: " + e.message);
          }
        }
        if (!done) {
          try {
            const list = await getBist100List();
            const q = extractBistEntry(list, symbol);
            setLiveQuote(q.price);
            setCandles(reconcileLastClose(genDemoCandles(symbol, 110, q.price), q.price));
            setStatus({ kind: "mixed", note: "BIST100 (proxy, 15dk gecikmeli) — canlı fiyat gerçek, geçmiş mum verisi sentetik" });
            done = true;
          } catch (e) {
            errors.push("BIST100: " + e.message);
          }
        }
        if (!done) {
          try {
            const q = await fetchBistQuote(symbol);
            setLiveQuote(q.price);
            setCandles(reconcileLastClose(genDemoCandles(symbol, 110, q.price), q.price));
            setStatus({ kind: "mixed", note: "FinanceBird (proxy) — canlı anlık fiyat gerçek, geçmiş mum verisi sentetik" });
            done = true;
          } catch (e) {
            errors.push("FinanceBird: " + e.message);
          }
        }
        if (!done) {
          setCandles(genDemoCandles(symbol));
          setStatus({
            kind: "demo",
            note: errors.length ? errors.join(" | ") + " — proxy'nin (XAMPP) çalıştığından emin ol" : "DEMO VERİ",
          });
        }
      } else if (market === "madenler") {
        const cfg = MARKETS.madenler.symbols.find((s) => s.v === symbol);
        if (cfg.kind === "gold-oz" || cfg.kind.startsWith("gold-")) {
          try {
            const oz = await fetchMetalOHLC("pax-gold");
            let scaled = oz;
            let note = "PAX Gold (CoinGecko) — 1 ons altına sabit token, gerçek zamanlı, $ (USD)";
            if (cfg.kind !== "gold-oz") {
              const usdtry = await fetchUsdTryRate();
              const weightG = cfg.kind === "gold-gram" ? 1 : cfg.kind === "gold-ceyrek" ? 1.75 : cfg.kind === "gold-tam" ? 7 : 1000;
              scaled = scaleCandles(oz, (usdtry * weightG) / TROY_OUNCE_G);
              const label = cfg.kind === "gold-gram" ? "Gram" : cfg.kind === "gold-ceyrek" ? "Çeyrek" : cfg.kind === "gold-tam" ? "Tam" : "Kg";
              const approx = cfg.kind === "gold-ceyrek" || cfg.kind === "gold-tam" ? ", yaklaşık (işçilik farkı içermez)" : "";
              note = `${label} altın — ons altın (USD) × güncel USD/TRY (${usdtry.toFixed(2)}) ile ₺ olarak hesaplanır${approx}`;
            }
            setCandles(scaled);
            setLiveQuote(scaled[scaled.length - 1].close);
            setStatus({ kind: "live", note });
          } catch (e) {
            setCandles(genDemoCandles(symbol));
            setStatus({ kind: "demo", note: "Altın verisi alınamadı: " + e.message });
          }
        } else if (cfg.kind === "silver-oz") {
          try {
            const oz = await fetchMetalOHLC("kinesis-silver");
            setCandles(oz);
            setLiveQuote(oz[oz.length - 1].close);
            setStatus({ kind: "live", note: "Kinesis Silver (CoinGecko) — 1 ons gümüşe sabit token, gerçek zamanlı" });
          } catch (e) {
            setCandles(genDemoCandles(symbol));
            setStatus({ kind: "demo", note: "Gümüş verisi alınamadı: " + e.message });
          }
        } else if (cfg.kind.startsWith("metalsdev-")) {
          const metalCode = cfg.kind.split("-")[1];
          const nameMap = { XPT: "platinum", XPD: "palladium" };
          try {
            const price = await fetchMetalsDevSpot(nameMap[metalCode]);
            setLiveQuote(price);
            setCandles(reconcileLastClose(genDemoCandles(symbol, 110, price), price));
            setStatus({ kind: "mixed", note: "Metals.Dev (proxy) — canlı anlık fiyat gerçek, geçmiş mum verisi sentetik" });
          } catch (e) {
            setCandles(genDemoCandles(symbol));
            setStatus({ kind: "demo", note: "Metals.Dev: " + e.message + " — config.php'ye METALS_DEV_KEY eklemen gerekebilir" });
          }
        }
      }
    } catch (e) {
      setCandles(genDemoCandles(symbol));
      setStatus({ kind: "demo", note: "Veri alınamadı, demo veri gösteriliyor" });
    } finally {
      setLoading(false);
    }
  }, [market, symbol, timeframe, getBist100List]);

  useEffect(() => {
    load();
  }, [load]);

  const [symbolQuery, setSymbolQuery] = useState("");

  const handleMarket = (m) => {
    setMarket(m);
    setSymbol(MARKETS[m].symbols[0].v);
    setSymbolQuery("");
  };

  const analysis = useMemo(() => buildAnalysis(candles), [candles]);
  const forecast = useMemo(() => buildForecast(candles, analysis), [candles, analysis]);

  useEffect(() => {
    setGroqAnalysis("");
    setGroqError("");
  }, [market, symbol]);

  const runGroqAnalysis = async () => {
    if (!analysis || !forecast) return;
    setGroqLoading(true);
    setGroqError("");
    setGroqAnalysis("");
    try {
      const symbolLabel = MARKETS[market].symbols.find((s) => s.v === symbol)?.l || symbol;
      const text = await fetchGroqAnalysis({
        symbolLabel,
        price: liveQuote ?? analysis.last.close,
        trend: analysis.trend,
        bias: analysis.bias,
        score: analysis.score,
        zone: analysis.zone,
        bos: analysis.bos,
        sweep: analysis.sweep,
        targets: analysis.targets,
        stop: analysis.stop,
        forecast,
        atrPct: forecast.atrPct,
      });
      setGroqAnalysis(text);
    } catch (e) {
      setGroqError(e.message);
    } finally {
      setGroqLoading(false);
    }
  };
  const fmt = fmtNum;

  // Madenler'de bazı semboller $ (USD) bazında (ons altın/gümüş, platin, paladyum),
  // bazıları ₺ (TRY) bazında (gram/çeyrek/tam/kg altın) — karışmasın diye ön ek ekliyoruz.
  const currentCfg = market === "madenler" ? MARKETS.madenler.symbols.find((s) => s.v === symbol) : null;
  const currencyPrefix = currentCfg
    ? currentCfg.kind === "gold-oz" || currentCfg.kind === "silver-oz" || currentCfg.kind.startsWith("metalsdev-")
      ? "$"
      : "₺"
    : "";
  const fmtC = (p) => (p == null ? "—" : currencyPrefix + fmt(p));

  const trendLabel = { bearish: "AŞAĞI TREND", bullish: "YUKARI TREND", yatay: "YATAY", belirsiz: "BELİRSİZ" };
  const trendColor = { bearish: "#FF4D6A", bullish: "#26D97C", yatay: "#7C8798", belirsiz: "#7C8798" };
  const statusColor = { live: "#26D97C", mixed: "#E8B44C", demo: "#FF4D6A" };

  return (
    <div style={{ position: "relative", minHeight: "100vh", color: "#E7EAEE", fontFamily: "'Inter', ui-sans-serif, system-ui" }}>
      <SpaceBackground />
      <div style={{ position: "relative", zIndex: 1 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .disp{font-family:'Space Grotesk',ui-sans-serif,system-ui;}
        .mono{font-family:'IBM Plex Mono',ui-monospace,monospace;}
        .pill{transition:all .15s ease;}
        .pill:hover{transform:translateY(-1px);}
        ::-webkit-scrollbar{height:6px;width:6px;}
        ::-webkit-scrollbar-thumb{background:#232A36;border-radius:4px;}
      `}</style>

      <div style={{ borderBottom: "1px solid #1C222D", padding: "18px 22px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SiriusStar />
            <div>
              <div className="disp" style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.01em" }}>
                Sirius <span style={{ color: "#E8B44C" }}>Piyasa Analizi</span>
              </div>
              <div className="mono" style={{ fontSize: 11, color: "#7C8798", marginTop: 2 }}>
                likidite / BOS / trend — kural tabanlı grafik okuma
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="mono" style={{ fontSize: 10, color: "#26D97C", border: "1px solid #26D97C55", padding: "5px 9px", borderRadius: 6 }}>
              PROXY BAĞLI
            </span>
            <button
              onClick={() => setShowInfo((s) => !s)}
              className="pill mono"
              style={{ fontSize: 11, color: "#7C8798", border: "1px solid #232A36", borderRadius: 6, padding: "6px 10px", background: "transparent", cursor: "pointer" }}
            >
              {showInfo ? "kapat" : "veri kaynakları"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 14, paddingTop: 12, borderTop: "1px solid #161B24" }}>
          {ticker ? (
            <>
              <TickerChip label="USD/TRY" value={ticker.usdtry ? fmtNum(ticker.usdtry) : "—"} />
              <TickerChip label="EUR/TRY" value={ticker.eurtry ? fmtNum(ticker.eurtry) : "—"} />
              <TickerChip label="BTC/USDT" value={ticker.btc ? fmtNum(ticker.btc) : "—"} />
              <TickerChip label="ETH/USDT" value={ticker.eth ? fmtNum(ticker.eth) : "—"} />
              <TickerChip label="GRAM ALTIN" value={ticker.gramAltin ? "₺" + fmtNum(ticker.gramAltin) : "—"} />
              <TickerChip label="ÇEYREK ALTIN" value={ticker.ceyrekAltin ? "₺" + fmtNum(ticker.ceyrekAltin) : "—"} sub="yaklaşık" />
              <TickerChip label="TAM ALTIN" value={ticker.tamAltin ? "₺" + fmtNum(ticker.tamAltin) : "—"} sub="yaklaşık" />
              <TickerChip label="KG ALTIN" value={ticker.kgAltin ? "₺" + fmtNum(ticker.kgAltin) : "—"} sub="yaklaşık" />
            </>
          ) : (
            <span className="mono" style={{ fontSize: 11, color: "#5B6472" }}>kur/altın verisi yükleniyor…</span>
          )}
        </div>

        {showInfo && (
          <div className="mono" style={{ marginTop: 14, fontSize: 11.5, lineHeight: 1.75, color: "#9AA4B2", background: "#12161D", border: "1px solid #1C222D", borderRadius: 8, padding: 14 }}>
            <div style={{ color: "#E7EAEE", marginBottom: 6 }}>Mimari</div>
            RapidAPI, NosyAPI ve Groq anahtarları artık bu kodun içinde değil — <code>{API_BASE}</code> adresindeki
            PHP proxy'nde (XAMPP) saklanıyor. Bu ekran/uygulama o anahtarları hiç görmüyor.<br /><br />
            <div style={{ color: "#E7EAEE", marginBottom: 6 }}>Kripto</div>
            Binance genel klines API — anahtarsız, gerçek zamanlı mum verisi. Erişilemezse CoinGecko'ya otomatik geçilir.<br /><br />
            <div style={{ color: "#E7EAEE", marginBottom: 6 }}>Forex</div>
            Geçmiş: Frankfurter (ECB, anahtarsız). Anlık kur: open.er-api.com (anahtarsız). Son mum her zaman anlık kura eşitlenir.<br /><br />
            <div style={{ color: "#E7EAEE", marginBottom: 6 }}>BIST</div>
            Proxy sırasıyla NosyAPI → BIST100 → FinanceBird dener. Proxy çalışmıyorsa (XAMPP kapalıysa) demo veriye düşer.<br /><br />
            <div style={{ color: "#E7EAEE", marginBottom: 6 }}>Madenler</div>
            Ons altın/gümüş: CoinGecko üzerindeki PAX Gold / Kinesis Silver, anahtarsız. Gram/çeyrek/tam/kg altın bunlardan türetilir.
            Platin/paladyum: proxy üzerinden Metals.Dev — <code>config.php</code>'ye kendi <code>METALS_DEV_KEY</code>'ini eklersen çalışır.
          </div>
        )}
      </div>

      <div style={{ padding: "16px 22px 0", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {Object.entries(MARKETS).map(([k, v]) => (
          <button key={k} onClick={() => handleMarket(k)} className="pill mono"
            style={{ fontSize: 12, padding: "7px 13px", borderRadius: 7, border: `1px solid ${market === k ? "#E8B44C" : "#232A36"}`, background: market === k ? "rgba(232,180,76,0.1)" : "transparent", color: market === k ? "#E8B44C" : "#9AA4B2", cursor: "pointer" }}>
            {v.label}
          </button>
        ))}
        <div style={{ width: 1, height: 20, background: "#232A36", margin: "0 4px" }} />
        <input
          className="mono"
          value={symbolQuery}
          onChange={(e) => setSymbolQuery(e.target.value)}
          placeholder="ara…"
          style={{ fontSize: 12, background: "#12161D", border: "1px solid #1C222D", borderRadius: 7, padding: "7px 10px", color: "#E7EAEE", width: 100, outline: "none" }}
        />
        {MARKETS[market].symbols
          .filter((s) => s.l.toLowerCase().includes(symbolQuery.trim().toLowerCase()))
          .map((s) => (
          <button key={s.v} onClick={() => setSymbol(s.v)} className="pill mono"
            style={{ fontSize: 12, padding: "7px 13px", borderRadius: 7, border: `1px solid ${symbol === s.v ? "#3A4356" : "#1C222D"}`, background: symbol === s.v ? "#171C25" : "transparent", color: symbol === s.v ? "#E7EAEE" : "#7C8798", cursor: "pointer" }}>
            {s.l}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {market === "crypto" &&
          TIMEFRAMES.map((t) => (
            <button key={t.v} onClick={() => setTimeframe(t.v)} className="pill mono"
              style={{ fontSize: 12, padding: "7px 11px", borderRadius: 7, border: `1px solid ${timeframe === t.v ? "#3A4356" : "#1C222D"}`, background: timeframe === t.v ? "#171C25" : "transparent", color: timeframe === t.v ? "#E7EAEE" : "#7C8798", cursor: "pointer" }}>
              {t.l}
            </button>
          ))}
      </div>

      <div style={{ padding: 22, display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 18 }}>
        <div style={{ background: "#12161D", border: "1px solid #1C222D", borderRadius: 10, padding: 14, minHeight: 420 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
            <div className="disp" style={{ fontSize: 15, fontWeight: 600 }}>
              {MARKETS[market].symbols.find((s) => s.v === symbol)?.l}{" "}
              {market === "crypto" && <span className="mono" style={{ fontSize: 11, color: "#7C8798", fontWeight: 400 }}>{timeframe}</span>}
            </div>
            <span className="mono" style={{ fontSize: 10, color: statusColor[status.kind], border: `1px solid ${statusColor[status.kind]}55`, padding: "3px 8px", borderRadius: 5 }}>
              {status.kind === "live" ? "GERÇEK VERİ" : status.kind === "mixed" ? "KISMEN GERÇEK" : "DEMO VERİ"}
            </span>
          </div>

          {analysis && (
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap", padding: "10px 2px 14px", marginBottom: 10, borderBottom: "1px solid #1C222D" }}>
              <PriceStat label="ANLIK FİYAT" value={fmtC(liveQuote ?? analysis.last.close)} color="#E7EAEE" />
              <PriceStat
                label="EN DÜŞÜK"
                value={fmtC(Math.min(...candles.slice(-20).map((c) => c.low)))}
                color="#FF4D6A"
                sub="son dönem"
              />
              <PriceStat
                label="BEKLENEN EN YÜKSEK"
                value={forecast ? fmtC((liveQuote ?? analysis.last.close) * (1 + forecast.high / 100)) : "—"}
                color="#26D97C"
                sub="AI tahmini"
              />
            </div>
          )}

          {loading ? (
            <div style={{ display: "grid", placeItems: "center", height: 380, color: "#7C8798" }} className="mono">yükleniyor…</div>
          ) : (
            <Candlestick candles={candles} analysis={analysis} />
          )}
          <div className="mono" style={{ fontSize: 10.5, color: "#5B6472", marginTop: 8 }}>{status.note}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#12161D", border: "1px solid #1C222D", borderRadius: 10, padding: 16 }}>
            <div className="mono" style={{ fontSize: 10, color: "#7C8798", marginBottom: 8, letterSpacing: "0.04em" }}>TREND</div>
            {analysis && <div className="disp" style={{ fontSize: 16, fontWeight: 700, color: trendColor[analysis.trend] }}>{trendLabel[analysis.trend]}</div>}
          </div>

          <div style={{ background: "#12161D", border: "1px solid #E8B44C40", borderRadius: 10, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div className="mono" style={{ fontSize: 10, color: "#E8B44C", letterSpacing: "0.04em" }}>AI DESTEKLİ TAHMİN</div>
              <span className="mono" style={{ fontSize: 9, color: "#5B6472" }}>sezgisel model</span>
            </div>
            {forecast && (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
                  <span className="disp" style={{ fontSize: 20, fontWeight: 700, color: forecast.dirColor }}>
                    {forecast.dir === "artış" ? "▲ Artış" : "▼ Azalış"}
                  </span>
                  <span className="mono" style={{ fontSize: 12, color: "#9AA4B2" }}>%{forecast.confidence} olasılık</span>
                </div>

                <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ width: `${forecast.up}%`, background: "#26D97C" }} />
                  <div style={{ width: `${forecast.flat}%`, background: "#3A4356" }} />
                  <div style={{ width: `${forecast.down}%`, background: "#FF4D6A" }} />
                </div>
                <div className="mono" style={{ fontSize: 10.5, color: "#7C8798", display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ color: "#26D97C" }}>Artış %{forecast.up}</span>
                  <span>Yatay %{forecast.flat}</span>
                  <span style={{ color: "#FF4D6A" }}>Azalış %{forecast.down}</span>
                </div>

                <div className="mono" style={{ fontSize: 11.5, color: "#9AA4B2", lineHeight: 1.6, borderTop: "1px solid #1C222D", paddingTop: 10 }}>
                  Beklenen hareket genişliği (sonraki periyot):{" "}
                  <span style={{ color: "#E7EAEE" }}>%{forecast.low} – %{forecast.high}</span>
                  <br />
                  Volatilite (ATR): <span style={{ color: "#E7EAEE" }}>%{forecast.atrPct}</span>
                </div>
                <div className="mono" style={{ fontSize: 9.5, color: "#5B6472", lineHeight: 1.5, marginTop: 10 }}>
                  Bu, trend + likidite yapısı + oynaklıktan üretilen kural tabanlı bir sezgisel tahmindir; eğitilmiş bir makine öğrenmesi modelinin çıktısı değildir ve yatırım tavsiyesi oluşturmaz.
                </div>
              </>
            )}
          </div>

          <div style={{ background: "#12161D", border: "1px solid #1C222D", borderRadius: 10, padding: 16 }}>
            <div className="mono" style={{ fontSize: 10, color: "#7C8798", marginBottom: 10, letterSpacing: "0.04em" }}>KURAL TABANLI SKOR</div>
            {analysis && (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
                  <span className="disp" style={{ fontSize: 30, fontWeight: 700, color: "#E8B44C" }}>{analysis.score}</span>
                  <span className="mono" style={{ fontSize: 11, color: "#7C8798" }}>/ 100</span>
                </div>
                <div style={{ height: 5, background: "#1C222D", borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
                  <div style={{ width: `${analysis.score}%`, height: "100%", background: "#E8B44C" }} />
                </div>
                <div className="mono" style={{ fontSize: 11.5, color: "#9AA4B2", lineHeight: 1.6 }}>
                  Yönelim: <span style={{ color: "#E7EAEE" }}>{analysis.bias}</span>
                </div>
              </>
            )}
          </div>

          <div style={{ background: "#12161D", border: "1px solid #1C222D", borderRadius: 10, padding: 16 }}>
            <div className="mono" style={{ fontSize: 10, color: "#7C8798", marginBottom: 10, letterSpacing: "0.04em" }}>YAPI OLAYLARI</div>
            <div className="mono" style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <Row label="BOS" value={analysis?.bos ? fmt(analysis.bos.level) : "tespit edilmedi"} ok={!!analysis?.bos} />
              <Row label="Likidite bölgesi" value={analysis?.zone ? `${fmt(analysis.zone.min)} – ${fmt(analysis.zone.max)}` : "tespit edilmedi"} ok={!!analysis?.zone} />
              <Row label="Sweep" value={analysis?.sweep ? (analysis.sweepIsRecent ? "yakın zamanda gerçekleşti" : "geçmişte gerçekleşti") : "tespit edilmedi"} ok={!!analysis?.sweep} />
              <Row label="Önerilen stop" value={analysis?.stop ? fmt(analysis.stop) : "—"} ok={!!analysis?.stop} />
            </div>
          </div>

          <div style={{ background: "#12161D", border: "1px solid #1C222D", borderRadius: 10, padding: 16 }}>
            <div className="mono" style={{ fontSize: 10, color: "#7C8798", marginBottom: 10, letterSpacing: "0.04em" }}>HEDEF MERDİVENİ</div>
            {analysis?.targets?.length ? (
              <div className="mono" style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                {analysis.targets.map((t, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", color: "#9AA4B2" }}>
                    <span>Hedef {i + 1}</span>
                    <span style={{ color: "#26D97C" }}>{fmt(t)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mono" style={{ fontSize: 12, color: "#7C8798" }}>yeterli likidite noktası yok</div>
            )}
          </div>

          <div style={{ background: "#12161D", border: "1px solid #6C4FE0", borderRadius: 10, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div className="mono" style={{ fontSize: 10, color: "#B39CFF", letterSpacing: "0.04em" }}>GROQ AI PİYASA ANALİZİ</div>
              <span className="mono" style={{ fontSize: 9, color: "#5B6472" }}>llama-3.3-70b · proxy</span>
            </div>
            <button
              onClick={runGroqAnalysis}
              disabled={groqLoading || !analysis}
              className="pill mono"
              style={{
                fontSize: 11.5,
                padding: "8px 12px",
                borderRadius: 7,
                border: "1px solid #6C4FE0",
                background: groqLoading ? "transparent" : "rgba(108,79,224,0.15)",
                color: "#B39CFF",
                cursor: !groqLoading && analysis ? "pointer" : "not-allowed",
                width: "100%",
                opacity: !analysis ? 0.5 : 1,
              }}
            >
              {groqLoading ? "analiz ediliyor…" : "Seçili sembolü analiz et"}
            </button>

            {groqError && (
              <div className="mono" style={{ fontSize: 11, color: "#FF4D6A", marginTop: 10, lineHeight: 1.5 }}>{groqError}</div>
            )}
            {groqAnalysis && (
              <div className="mono" style={{ fontSize: 12, color: "#D6D2F0", marginTop: 12, lineHeight: 1.65, borderTop: "1px solid #1C222D", paddingTop: 10, whiteSpace: "pre-wrap" }}>
                {groqAnalysis}
              </div>
            )}
            <div className="mono" style={{ fontSize: 9.5, color: "#5B6472", lineHeight: 1.5, marginTop: 10 }}>
              Anahtar bu ekranda hiç yok — istek {API_BASE}/groq.php üzerinden sunucuna gidiyor, Groq'a oradan bağlanılıyor.
            </div>
          </div>
        </div>
      </div>

      <div className="mono" style={{ padding: "0 22px 22px", fontSize: 10.5, color: "#5B6472", lineHeight: 1.6 }}>
        SİRİUS YAZILIM BİLİŞİM TEKNOLOJİLERİ © TÜM HAKLARI SAKLIDIR V.S2.1 Ümüt ÇAĞLAR
      </div>
      </div>
    </div>
  );
}

function Row({ label, value, ok }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
      <span style={{ color: "#7C8798" }}>{label}</span>
      <span style={{ color: ok ? "#E7EAEE" : "#5B6472" }}>{value}</span>
    </div>
  );
}
