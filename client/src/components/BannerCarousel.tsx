import { useState, useEffect, useMemo } from "react";
import { Carousel } from "nuka-carousel";

interface BannerCarouselProps {
  images: string[];
  mode: "carousel" | "fixed";
  duration: number; // segundos
  isActive: boolean;
  className?: string;
}

export function BannerCarousel({
  images,
  mode,
  duration,
  isActive,
  className = "",
}: BannerCarouselProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Preload próxima imagem no carrossel
  useEffect(() => {
    if (mode === "carousel" && images.length > 1) {
      images.slice(1, 3).forEach((imageUrl) => {
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
          setLoadedImages((prev) => new Set(prev).add(imageUrl));
        };
      });
    }
  }, [images, mode]);

  const handleImageLoad = (imageUrl: string) => {
    setLoadedImages((prev) => new Set(prev).add(imageUrl));
  };

  const handleImageError = (imageUrl: string) => {
    setImageErrors((prev) => new Set(prev).add(imageUrl));
  };

  // Filtrar imagens válidas
  const validImages = useMemo(
    () => images.filter((img) => !imageErrors.has(img)),
    [images, imageErrors]
  );

  if (!isActive || validImages.length === 0) {
    return null;
  }

  // Modo fixo - exibir apenas primeira imagem
  if (mode === "fixed") {
    return (
      <div className={`relative overflow-hidden rounded-lg ${className}`}>
        <img
          src={validImages[0]}
          alt="Banner"
          className="w-full h-full object-cover"
          loading="lazy"
          onLoad={() => handleImageLoad(validImages[0])}
          onError={() => handleImageError(validImages[0])}
          style={{
            maxHeight: "200px",
            objectFit: "cover",
          }}
        />
      </div>
    );
  }

  // Modo carrossel
  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <Carousel
        autoplay={true}
        autoplayInterval={duration * 1000}
        wrapAround={true}
        withoutControls={false}
        defaultControlsConfig={{
          nextButtonStyle: {
            display: "none",
          },
          prevButtonStyle: {
            display: "none",
          },
          pagingDotsStyle: {
            fill: "#e91e63",
            opacity: 0.5,
          },
        }}
        renderBottomCenterControls={({ currentSlide, slideCount }) => {
          if (slideCount <= 1) return null;
          return (
            <div className="flex gap-1 justify-center py-2">
              {Array.from({ length: slideCount }).map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentSlide
                      ? "bg-pink-500 w-6"
                      : "bg-pink-300 w-1.5"
                  }`}
                />
              ))}
            </div>
          );
        }}
        className="banner-carousel"
      >
        {validImages.map((imageUrl, index) => (
          <div key={index} className="relative w-full">
            <img
              src={imageUrl}
              alt={`Banner ${index + 1}`}
              className="w-full h-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
              onLoad={() => handleImageLoad(imageUrl)}
              onError={() => handleImageError(imageUrl)}
              style={{
                maxHeight: "200px",
                objectFit: "cover",
                width: "100%",
              }}
            />
            {/* Placeholder enquanto carrega */}
            {!loadedImages.has(imageUrl) && index > 0 && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
          </div>
        ))}
      </Carousel>
    </div>
  );
}

