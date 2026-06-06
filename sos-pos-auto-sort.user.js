// ==UserScript==
// @name         SOS POS – Auto Sort v17.1
// @namespace    http://tampermonkey.net/
// @version      17.1
// @description  Auto-sorts Ticket Storage by Status priority then Ticket # on every page load.
// @author       You
// @match        *://app.sospos.com.au/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const BATCH_URL = 'https://app.sospos.com.au/api/entities/Ticket/batch';
  const BOARD_URL = 'https://app.sospos.com.au/api/entities/Ticket/board';

  const STATUS_ORDER = {
    'pick up ready':        0,
    'part arrived':         1,
    'part paid':            2,
    'part ordered':         3,
    'part not ordered':     4,
    'waiting on parts':     5,
    'waiting on cx':        6,
    'repairing':            7,
    'repair':               7,
    'no fix - in store':    8,
    'no fix in store':      8,
    'quote sent':           9,
    'on hold':              10,
    'dispose':              11,
    'paid & collected':     12,
    'paid':                 13,
    'collected':            14,
    'no fix - collected':   15,
    'no fix collected':     15,
    'warranty':             16,
    'enquiry':              17,
    'refunded':             18,
    'cancelled':            19,
  };

  function statusRank(t) {
    const s = (t.status || t.repair_status || t.ticket_status || t.state || '').toLowerCase().trim();
    return s in STATUS_ORDER ? STATUS_ORDER[s] : 50;
  }
  function statusLabel(t) {
    return (t.status || t.repair_status || t.ticket_status || t.state || '').toLowerCase().trim();
  }
  function ticketNum(t) {
    return parseInt((t.ticket_number || t.id || '').replace(/\D/g, ''), 10) || 0;
  }
  function isOnStorage(t) {
    return (t.board || t.section || '').toLowerCase() === 'storage';
  }

  let capturedStoreId = null;
  const _fetch = window.fetch.bind(window);
  window.fetch = async function (input, init = {}) {
    const url = (typeof input === 'string' ? input : input?.url) ?? '';
    const m = url.match(/store_id=([^&]+)/);
    if (m) capturedStoreId = m[1];
    return _fetch(input, init);
  };

  function getStoreId() {
    if (capturedStoreId) return capturedStoreId;
    const m = document.documentElement.innerHTML.match(/store_id[=:]["']?([a-f0-9]{20,})/);
    return m ? m[1] : null;
  }

  async function fetchBoard() {
    const storeId = getStoreId();
    if (!storeId) { console.warn('[SOS-Sort] No store_id'); return []; }
    const res = await _fetch(`${BOARD_URL}?store_id=${storeId}`, { credentials: 'include' });
    if (!res.ok) { console.warn('[SOS-Sort] Board fetch failed', res.status); return []; }
    const data = await res.json();
    const flat = [];
    if (Array.isArray(data)) flat.push(...data);
    else if (data && typeof data === 'object') Object.values(data).forEach(v => Array.isArray(v) && flat.push(...v));
    return flat;
  }

  async function sortStorage() {
    const all     = await fetchBoard();
    const storage = all.filter(isOnStorage);
    if (!storage.length) return;

    const sorted = [...storage].sort((a, b) => {
      const rankA = statusRank(a), rankB = statusRank(b);
      if (rankA !== rankB) return rankA - rankB;
      if (rankA === 50) {
        const la = statusLabel(a), lb = statusLabel(b);
        if (la !== lb) return la.localeCompare(lb);
      }
      return ticketNum(a) - ticketNum(b);
    });

    const changed = sorted.some((t, i) => t.id !== storage[i]?.id);
    if (!changed) { console.log('[SOS-Sort] Already sorted'); return; }

    const updates = sorted.map((t, i) => ({ id: t.id, board: 'storage', sort_index: i }));
    console.log('[SOS-Sort] Sorting', sorted.length, 'tickets');
    await _fetch(BATCH_URL, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
  }

  window.addEventListener('load', () => {
    setTimeout(async () => {
      try { await sortStorage(); }
      catch (e) { console.warn('[SOS-Sort] Failed:', e); }
    }, 2000);
  });

})();