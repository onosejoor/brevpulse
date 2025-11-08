"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "../lib/utils";

type Props = {
  className?: string;
  alt: string;
  src: string;
} & ImageProps;

export default function Img({ className, src, alt, ...props }: Props) {
  const [loading, setLoading] = useState(true);

  return (
    <>
      {loading && (
        <div
          className={cn(
            "bg-light-gray animate-pulse border-2 h-50 border-transparent rounded-[10px]",
            className
          )}
        ></div>
      )}

      <Image
        src={src}
        alt={alt}
        className={cn(
          className,
          loading ? "absolute -z-1000 opacity-0" : "opacity-100"
        )}
        width={1080}
        height={1080}
        loading="lazy"
        onLoad={() => setLoading(false)}
        {...props}
      />
    </>
  );
}
