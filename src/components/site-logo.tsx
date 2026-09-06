import Image from "next/image";
import logo from "../../public/brand/andy-good-logo.png";

export function SiteLogo({ preload = false }: { preload?: boolean }) {
  return (
    <span className="site-logo">
      <Image
        src={logo}
        alt="Andy Good"
        className="site-logo-image"
        sizes="(max-width: 767px) 188px, 229px"
        preload={preload}
      />
    </span>
  );
}
