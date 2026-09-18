import React from "react";
import {twMerge} from "tailwind-merge";

export const IconLogo = ({
                           className,
                           fillColor = "dark:fill-[#7F7F7F] fill-light-2",
                         }: {
  className?: string;
  fillColor?: string;
}) => {
  return (
    <div className={twMerge("size-9 aspect-square border border-[#7F7F7F] p-[3px] rounded-sm flex justify-center items-center", className)}>
      <svg viewBox="0 0 360 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path className={fillColor} d="M0 80H120L280 0H160L0 80Z"/>
        <path className={fillColor} d="M80 160H200L360 80H240L80 160Z"/>
      </svg>
    </div>
  );
};
