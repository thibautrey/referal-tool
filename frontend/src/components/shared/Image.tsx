import React from "react";
import { assetPath } from "@/lib/utils";

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
};

/**
 * Composant Image qui gère automatiquement les chemins d'accès aux assets
 */
export function Image({ src, alt, ...props }: ImageProps) {
  // Convertir le chemin de l'image en chemin absolu avec le bon basename
  const imageSrc = assetPath(src);

  return <img src={imageSrc} alt={alt} {...props} />;
}
