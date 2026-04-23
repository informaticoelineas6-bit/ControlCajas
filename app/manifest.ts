import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Control de Cajas",
    short_name: "ControlCajas",
    description: "Una aplicación creada para el control de cajas",
    start_url: "/",
    display: "standalone",
    background_color: "#00a6f4",
    theme_color: "#ffffff",
    icons: [
      {
        src: "./icons/maskable_icon_x48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "./icons/maskable_icon_x72.png",
        sizes: "72x72",
        type: "image/png",
      },
      {
        src: "./icons/maskable_icon_x96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "./icons/maskable_icon_x128.png",
        sizes: "128x128",
        type: "image/png",
      },
      {
        src: "./icons/maskable_icon_x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "./icons/maskable_icon_x384.png",
        sizes: "384x384",
        type: "image/png",
      },
      {
        src: "./icons/maskable_icon_x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "./icons/maskable_icon.png",
        sizes: "800x800",
        type: "image/png",
      },
    ],
  };
}
