import { ImageResponse } from "next/og";
import { EXPERIENCE_YEARS, site } from "@/content/site";

export const alt = `${site.brand} · ${site.city}, ${site.state}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#3a2140",
          color: "#f7f2ea",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, color: "#d9bf8c", fontSize: 24, letterSpacing: 6 }}>
          <div style={{ width: 56, height: 2, background: "#d9bf8c" }} />
          {`${site.city.toUpperCase()} · ${site.state}`}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, lineHeight: 1, letterSpacing: -2 }}>{site.name}</div>
          <div style={{ marginTop: 22, fontSize: 28, letterSpacing: 14, color: "#d9bf8c" }}>IMÓVEIS</div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "rgba(247,242,234,0.8)" }}>
          {`${EXPERIENCE_YEARS} anos de experiência · Venda, locação e avaliação · ${site.creci}`}
        </div>
      </div>
    ),
    size,
  );
}
