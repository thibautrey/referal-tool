import React from "react";

interface AppLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const AppLogo: React.FC<AppLogoProps> = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-6 w-auto",
    md: "h-8 w-auto",
    lg: "h-12 w-auto",
  };

  return (
    <img
      src="https://astronomy-store.com/cdn/shop/files/logo-insta.png?v=1720279381&width=120"
      alt="Referal Optimizer Logo"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};

export default AppLogo;
