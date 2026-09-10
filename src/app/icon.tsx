import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export const alt = "Andy Good";

export default async function Icon() {
  const artwork = await readFile(join(process.cwd(), "public/brand/andy-good-logo.png"));

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#FFFFFF", overflow: "hidden", position: "relative" }}>
        {/* Frame out blank canvas while preserving the complete supplied artwork. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders native image elements. */}
        <img
          src={`data:image/png;base64,${artwork.toString("base64")}`}
          alt="Andy Good"
          width={80}
          height={80}
          style={{ position: "absolute", left: -8, top: -7.5 }}
        />
      </div>
    ),
    size,
  );
}
