import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DeliveryReg",
    short_name: "DeliveryReg",
    description: "Catálogo digital para comprar de novo na sua unidade.",
    start_url: "/catalogo",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f766e",
    lang: "pt-BR",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
