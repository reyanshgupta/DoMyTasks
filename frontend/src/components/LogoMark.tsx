import Image from "next/image";

type LogoMarkProps = {
  alt?: string;
  className?: string;
};

export function LogoMark({ alt = "", className = "h-9 w-9" }: LogoMarkProps) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`}>
      <Image
        src="/domytasks-icon-512.png"
        alt={alt}
        fill
        sizes="64px"
        className="object-contain"
      />
    </span>
  );
}
