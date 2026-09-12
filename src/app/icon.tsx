import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export const alt = "Andy Good";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "#FFFFFF", color: "#121820", fontFamily: "Arial, sans-serif", fontSize: 34, fontWeight: 700, letterSpacing: -4, position: "relative" }}>
        <span style={{ marginTop: 2 }}>AG</span>
        <span style={{ position: "absolute", top: 8, left: 11, width: 13, height: 13, borderTop: "4px solid #FFD400", borderLeft: "4px solid #FFD400" }} />
        <span style={{ position: "absolute", right: 11, bottom: 8, width: 13, height: 13, borderRight: "4px solid #FFD400", borderBottom: "4px solid #FFD400" }} />
      </div>
    ),
    size,
  );
}
