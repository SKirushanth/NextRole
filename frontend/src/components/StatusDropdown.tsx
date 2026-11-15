import { useEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { STATUSES } from "../lib/api";
import type { ApplicationStatus } from "../types";
import { ChevronDown } from "lucide-react";

export const STATUS_META: Record<
  ApplicationStatus,
  { label: string; color: string; dotClass: string }
> = {
  APPLIED: {
    label: "Applied",
    color: "#0ea5e9",
    dotClass: "bg-sky-500",
  },
  INTERVIEWING: {
    label: "Interviewing",
    color: "#4f46e5",
    dotClass: "bg-indigo-600",
  },
  OFFER: {
    label: "Offer",
    color: "#059669",
    dotClass: "bg-emerald-600",
  },
  REJECTED: {
    label: "Rejected",
    color: "#e11d48",
    dotClass: "bg-rose-600",
  },
};

export interface StatusDropdownProps {
  value: ApplicationStatus;
  onChange: (value: ApplicationStatus) => void;
  theme?: "dark" | "light";
  className?: string;
  disabled?: boolean;
  dropUp?: boolean;
}

export function StatusDropdown({
  value,
  onChange,
  theme = "dark",
  className = "",
  disabled = false,
  dropUp = false,
}: StatusDropdownProps) {
  const current = STATUS_META[value] || { label: value, dotClass: "bg-zinc-400" };
  const isDark = theme === "dark";
  const isBoardCard = className.includes("board-card-status");
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const selectedIndex = Math.max(0, STATUSES.indexOf(value));

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => optionRefs.current[selectedIndex]?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open, selectedIndex]);

  function focusOption(index: number) {
    optionRefs.current[(index + STATUSES.length) % STATUSES.length]?.focus();
  }

  function selectStatus(status: ApplicationStatus) {
    onChange(status);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      {StatusDropdownAnimation}
      <div
        className={`inline-block w-full ${className}`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          ref={triggerRef}
          disabled={disabled}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              if (!open) setOpen(true);
              focusOption(event.key === "ArrowDown" ? selectedIndex : selectedIndex - 1);
            }
          }}
          className={`w-full ${
            isBoardCard
              ? "h-[37px] gap-[6px] px-[7px] text-[13px] rounded-[9px]"
              : "h-[41px] gap-2 px-2 text-[14.5px] rounded-[10px]"
          } flex items-center justify-between font-medium transition-all duration-150 cursor-pointer select-none outline-none ${
            isDark
              ? "bg-[#181818] border border-[#262626] text-[#CCCCCC] focus:border-[#A855F7] focus:ring-4 focus:ring-[#A855F7]/20"
              : "bg-white border border-[#e6e6ee] text-[#17171c] focus:border-[1.5px] focus:border-[#4f46e5] focus:ring-4 focus:ring-[rgba(79,70,229,0.18)]"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span className={`flex items-center truncate ${isBoardCard ? "gap-[6px]" : "gap-[7px]"}`}>
            <span
            className={`${isBoardCard ? "h-[7px] w-[7px]" : "h-2 w-2"} rounded-full shrink-0 ${current.dotClass}`}
              style={"color" in current ? { backgroundColor: current.color } : undefined}
            />
            <span className="truncate">{current.label}</span>
          </span>
          <ChevronDown
            className={`${isBoardCard ? "h-[15px] w-[15px]" : "h-[17px] w-[17px]"} shrink-0 transition-transform duration-150 ${
              open ? "rotate-180 text-[#4f46e5]" : "text-[#8a8a94]"
            }`}
          />
        </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            role="listbox"
            style={{ animation: "status-dropdown-in 120ms ease-out" }}
            className={`!w-full !min-w-0 !overflow-visible ${
              isBoardCard
                ? "!rounded-[12px] !p-[6px] !shadow-[0_8px_21px_rgba(30,27,75,0.16)]"
                : "!rounded-[14px] !p-[7px] !shadow-[0_9px_24px_rgba(30,27,75,0.16)]"
            } !border-[#e6e6ee] !bg-white !text-zinc-900 ${
              dropUp ? "!bottom-full !mb-1.5 !mt-0" : "!mt-1.5"
            }`}
          >
            <DropdownMenuGroup className={isBoardCard ? "!space-y-[3px]" : "!space-y-[3px]"}>
            <DropdownMenuLabel className={`${isBoardCard ? "!px-2 !pb-1 !pt-1 !text-[9px]" : "!px-[10px] !pb-1 !pt-1.5 !text-[10px]"} !font-bold !tracking-[0.12em] !text-[#9a9aa8]`}>
              SELECT STATUS
            </DropdownMenuLabel>
            {STATUSES.map((status) => {
              const meta = STATUS_META[status] || { label: status, dotClass: "bg-zinc-400" };
              const selected = value === status;
              const index = STATUSES.indexOf(status);
              return (
                <DropdownMenuCheckboxItem
                  key={status}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  checked={value === status}
                  role="option"
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                      event.preventDefault();
                      focusOption(index + (event.key === "ArrowDown" ? 1 : -1));
                    } else if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      selectStatus(status);
                    }
                  }}
                  onCheckedChange={() => selectStatus(status)}
                  className={`${isBoardCard ? "!h-[32px] !rounded-[8px] !px-[11px] !text-[13px]" : "!h-[36px] !rounded-[9px] !px-3 !text-sm"} !w-full !py-0 !text-[#2a2a34] ${
                    selected
                      ? "!bg-[#eef0ff] !font-semibold !text-[#17171c] hover:!bg-[#eef0ff] focus:!bg-[#eef0ff]"
                      : "!bg-transparent hover:!bg-[#f6f6fa] focus:!bg-[#f6f6fa]"
                  } [&>span:first-child]:!left-auto [&>span:first-child]:!right-2.5 ${
                    isBoardCard
                      ? "[&>span:first-child]:!h-[14px] [&>span:first-child]:!w-[14px] [&>span:first-child>svg]:!h-[14px] [&>span:first-child>svg]:!w-[14px]"
                      : "[&>span:first-child]:!h-[15px] [&>span:first-child]:!w-[15px] [&>span:first-child>svg]:!h-[15px] [&>span:first-child>svg]:!w-[15px]"
                  } [&>span:first-child]:!text-[#4f46e5]`}
                >
                  <span
                    className={`${isBoardCard ? "h-[7px] w-[7px]" : "h-2 w-2"} rounded-full shrink-0 ${meta.dotClass}`}
                    style={"color" in meta ? { backgroundColor: meta.color } : undefined}
                  />
                  <span>{meta.label}</span>
                </DropdownMenuCheckboxItem>
              );
            })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

const StatusDropdownAnimation = (
  <style>{`@keyframes status-dropdown-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}`}</style>
);

export default StatusDropdown;
