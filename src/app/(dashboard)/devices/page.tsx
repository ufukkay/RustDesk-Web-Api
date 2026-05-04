"use client";

import { useAppStore, Device } from "@/lib/store";
import { Search, Monitor, Laptop, Server, Play, Smartphone, Trash2, LayoutGrid, List as ListIcon, ChevronRight, Info } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";

type StatusFilter = "all" | "online" | "offline";
type ViewMode = "list" | "grouped";

export default function DevicesPage() {
  const { devices, deleteDevice, fetchDevices } = useAppStore();
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [collGrps, setCollGrps] = useState<Record<string, boolean>>({});

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  const handleConnect = (id: string) => {
    const cleanId = String(id).replace(/\s+/g, "");
    if (!cleanId) return;
    const host     = "192.168.0.184";
    const key      = "5XE+DKQ46fl1EgSLWqKV9qkV+nGT4VLBrhJKYUrFbD0=";
    const password = "Ban41kam5";
    window.open(`rustdesk://${cleanId}?password=${password}&host=${host}&key=${encodeURIComponent(key)}`, "_self");
  };

  const filteredDevices = useMemo(() =>
    devices.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.id.includes(search) ||
        (d.user || "").toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || d.status === filter;
      return matchesSearch && matchesFilter;
    }),
  [devices, search, filter]);

  const groupedDevices = useMemo(() => {
    const groups: Record<string, Device[]> = {};
    filteredDevices.forEach(d => {
      const g = d.group || "Genel";
      if (!groups[g]) groups[g] = [];
      groups[g].push(d);
    });
    return groups;
  }, [filteredDevices]);

  // ── Selection helpers ────────────────────────────────────────
  const allIds      = filteredDevices.map(d => d.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const someSelected = allIds.some(id => selected.has(id)) && !allSelected;
  const selCount    = allIds.filter(id => selected.has(id)).length;

  const toggleAll = () => {
    if (allSelected) {
      const s = new Set(selected);
      allIds.forEach(id => s.delete(id));
      setSelected(s);
    } else {
      setSelected(new Set([...selected, ...allIds]));
    }
  };

  const toggleOne = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const deleteSelected = async () => {
    const ids = [...selected].filter(id => allIds.includes(id));
    await Promise.all(ids.map(id => deleteDevice(id)));
    const s = new Set(selected);
    ids.forEach(id => s.delete(id));
    setSelected(s);
  };

  const toggleCollGrp = (g: string) =>
    setCollGrps(prev => ({ ...prev, [g]: !prev[g] }));

  return (
    <div className="rd2-devices-layout">
      {/* Filter Sidebar */}
      <aside className="rd2-filter-sidebar">
        <div className="rd2-filter-head">
          <span>Filtreler</span>
          {(search || filter !== "all") && (
            <button className="rd2-clear-btn" onClick={() => { setSearch(""); setFilter("all"); }}>
              Temizle
            </button>
          )}
        </div>

        <div className="rd2-filter-section">
          <div className="rd2-search" style={{ width: "100%" }}>
            <Search width="14" height="14" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cihaz, ID, kullanıcı…" />
          </div>
        </div>

        <div className="rd2-filter-section">
          <div className="rd2-filter-label">Durum</div>
          <div className="rd2-filter-pills">
            {([
              { k: "all",     label: "Tümü",   count: devices.length },
              { k: "online",  label: "Online",  count: devices.filter(d => d.status === "online").length },
              { k: "offline", label: "Offline", count: devices.filter(d => d.status === "offline").length },
            ] as const).map(o => (
              <button
                key={o.k}
                onClick={() => setFilter(o.k)}
                className={`rd2-fpill${filter === o.k ? " on" : ""}`}
                style={filter === o.k ? { background: "#FFCC00", color: "#0E1116", borderColor: "transparent" } : {}}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  {o.k === "online"  && <span className="rd2-dot rd2-dot-green" />}
                  {o.k === "offline" && <span className="rd2-dot rd2-dot-gray" />}
                  <span>{o.label}</span>
                </div>
                <span className="rd2-fpill-count">{o.count}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="rd2-devices-content">
        {/* Toolbar */}
        <div className="rd2-toolbar" style={{ flexWrap: "nowrap" }}>
          {selCount > 0 ? (
            <div className="rd2-bulk-bar">
              <span className="rd2-bulk-count" style={{ background: "#FFCC00", color: "#0E1116" }}>{selCount}</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{selCount} cihaz seçili</span>
              <button
                className="rd2-btn rd2-btn-sm"
                style={{ background: "#FCEAEA", color: "#C0392B", border: "1px solid #f5c6c6" }}
                onClick={deleteSelected}
              >
                <Trash2 width="13" height="13" /> Seçilenleri Sil
              </button>
              <button className="rd2-btn rd2-btn-sm rd2-btn-ghost" onClick={() => setSelected(new Set())}>
                İptal
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
              <b style={{ color: "var(--text)" }}>{filteredDevices.length}</b> / {devices.length} cihaz
            </div>
          )}
          <div style={{ flex: 1 }} />
          <div className="rd2-view-toggle">
            <button
              className={`rd2-icon-btn${viewMode === "list" ? " on" : ""}`}
              style={viewMode === "list" ? { background: "#FFCC00", color: "#0E1116", borderColor: "transparent" } : {}}
              onClick={() => setViewMode("list")}
              title="Liste"
            >
              <ListIcon width="15" height="15" />
            </button>
            <button
              className={`rd2-icon-btn${viewMode === "grouped" ? " on" : ""}`}
              style={viewMode === "grouped" ? { background: "#FFCC00", color: "#0E1116", borderColor: "transparent" } : {}}
              onClick={() => setViewMode("grouped")}
              title="Gruplu"
            >
              <LayoutGrid width="15" height="15" />
            </button>
          </div>
        </div>

        {/* List View */}
        {viewMode === "list" && (
          <section className="rd2-card rd2-card-flush">
            <table className="rd2-table">
              <thead>
                <tr>
                  <th style={{ width: 36, paddingRight: 0 }}>
                    <CheckboxAll
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={toggleAll}
                    />
                  </th>
                  <th>Durum</th>
                  <th>Cihaz</th>
                  <th>Kullanıcı</th>
                  <th>Grup</th>
                  <th className="rd2-tr">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map(d => (
                  <DeviceRow
                    key={d.id}
                    d={d}
                    checked={selected.has(d.id)}
                    onCheck={() => toggleOne(d.id)}
                    onConnect={handleConnect}
                  />
                ))}
                {filteredDevices.length === 0 && (
                  <tr><td colSpan={6} className="rd2-empty">Eşleşen cihaz bulunamadı.</td></tr>
                )}
              </tbody>
            </table>
            <div className="rd2-table-foot">
              <span>{filteredDevices.length} cihaz gösteriliyor</span>
            </div>
          </section>
        )}

        {/* Grouped View */}
        {viewMode === "grouped" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.entries(groupedDevices).map(([grp, devs]) => {
              const collapsed  = !!collGrps[grp];
              const grpIds     = devs.map(d => d.id);
              const grpAllSel  = grpIds.length > 0 && grpIds.every(id => selected.has(id));
              const grpSomeSel = grpIds.some(id => selected.has(id)) && !grpAllSel;
              const toggleGrpSel = () => {
                const s = new Set(selected);
                if (grpAllSel) grpIds.forEach(id => s.delete(id));
                else grpIds.forEach(id => s.add(id));
                setSelected(s);
              };
              return (
                <section key={grp}>
                  <div className="rd2-grp-header" style={{ borderBottom: collapsed ? "none" : "1px solid var(--line)" }}>
                    <CheckboxAll
                      checked={grpAllSel}
                      indeterminate={grpSomeSel}
                      onChange={toggleGrpSel}
                    />
                    <button className="rd2-grp-toggle" onClick={() => toggleCollGrp(grp)}>
                      <ChevronRight
                        width="14" height="14"
                        style={{ transform: collapsed ? "rotate(0deg)" : "rotate(90deg)", transition: "transform .15s" }}
                      />
                      <span className="rd2-grp-name">{grp}</span>
                      <span className="rd2-grp-count">{devs.length}</span>
                      <span className="rd2-grp-online">
                        <span className="rd2-dot rd2-dot-green" style={{ width: 6, height: 6 }} />
                        {devs.filter(d => d.status === "online").length} online
                      </span>
                    </button>
                  </div>
                  {!collapsed && (
                    <div className="rd2-card rd2-card-flush" style={{ borderTop: 0, borderRadius: "0 0 calc(var(--r) + 2px) calc(var(--r) + 2px)" }}>
                      <table className="rd2-table">
                        <tbody>
                          {devs.map(d => (
                            <DeviceRow
                              key={d.id}
                              d={d}
                              checked={selected.has(d.id)}
                              onCheck={() => toggleOne(d.id)}
                              onConnect={handleConnect}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              );
            })}
            {filteredDevices.length === 0 && (
              <div className="rd2-card" style={{ textAlign: "center", color: "var(--muted)", fontWeight: 600, padding: 32 }}>
                Eşleşen cihaz bulunamadı.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CheckboxAll({ checked, indeterminate, onChange }: { checked: boolean; indeterminate: boolean; onChange: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      style={{ accentColor: "#0E1116", cursor: "pointer" }}
    />
  );
}

function DeviceRow({ d, checked, onCheck, onConnect }: {
  d: Device;
  checked: boolean;
  onCheck: () => void;
  onConnect: (id: string) => void;
}) {
  return (
    <tr className="rd2-tr-hover">
      <td style={{ width: 36, paddingRight: 0 }} onClick={e => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onCheck}
          style={{ accentColor: "#0E1116", cursor: "pointer" }}
        />
      </td>
      <td>
        <span className={`rd2-pill ${d.status === "online" ? "rd2-pill-on" : "rd2-pill-off"}`}>
          <span className={`rd2-dot ${d.status === "online" ? "rd2-dot-green" : "rd2-dot-gray"}`} />
          {d.status === "online" ? "Online" : "Offline"}
        </span>
      </td>
      <td>
        <div className="rd2-device-cell">
          <div className="rd2-device-icon" style={{ background: d.status === "online" ? "#FFCC0033" : "#F1F2F4", color: "#0E1116" }}>
            {d.os.includes("Windows") ? <Monitor width="16" height="16" /> :
             d.os.includes("mac")     ? <Laptop   width="16" height="16" /> :
             d.os.includes("Android") ? <Smartphone width="16" height="16" /> :
             <Server width="16" height="16" />}
          </div>
          <div>
            <Link href={`/devices/${d.id}`}>
              <div className="rd2-device-name">ID: {d.id}</div>
              <div className="rd2-device-meta rd2-mono">{d.name} · {d.os}</div>
            </Link>
          </div>
        </div>
      </td>
      <td className="rd2-cell-muted">{d.user}</td>
      <td><span className="rd2-chip">{d.group}</span></td>
      <td className="rd2-tr">
        <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          <button
            disabled={d.status !== "online"}
            className="rd2-btn rd2-btn-sm"
            style={d.status === "online"
              ? { background: "#FFCC00", color: "#0E1116", border: "1px solid #0E111614" }
              : { background: "#F1F2F4", color: "#8B92A0" }}
            onClick={() => onConnect(d.id)}
          >
            <Play width="11" height="11" /> Bağlan
          </button>
          <Link href={`/devices/${d.id}`}>
            <button className="rd2-icon-btn rd2-icon-btn-sm">
              <Info width="14" height="14" />
            </button>
          </Link>
        </div>
      </td>
    </tr>
  );
}
