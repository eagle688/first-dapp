"use client";

interface GradientButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  fromColor: string;
  toColor: string;
  disabled?: boolean;
  className?: string;
}

export default function GradientButton({
  children,
  onClick,
  fromColor,
  toColor,
  disabled = false,
  className = "",
}: GradientButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full bg-gradient-to-r ${fromColor} ${toColor} 
        disabled:from-gray-600 disabled:to-gray-700 
        text-white font-semibold py-3 px-6 rounded-xl 
        transition-all duration-200 transform hover:scale-105 
        shadow-lg flex items-center justify-center
        disabled:cursor-not-allowed disabled:transform-none
        ${className}
      `}
    >
      {children}
    </button>
  );
}
