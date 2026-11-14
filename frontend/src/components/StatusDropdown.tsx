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
    color: "#0284c7",
    dotClass: "bg-sky-500",
  },
  INTERVIEWING: {
    label: "Interviewing",
    color: "#4f46e5",
    dotClass: "bg-indigo-500",
  },
  OFFER: {
    label: "Offer",
    color: "#059669",
    dotClass: "bg-emerald-500",
  },
  REJECTED: {
    label: "Rejected",
    color: "#e11d48",
    dotClass: "bg-rose-500",
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

  return (
    <div
      className={`inline-block w-full ${className}`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={disabled}
          className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer select-none outline-none focus:ring-1 ${
            isDark
              ? "bg-[#181818] border border-[#262626] hover:border-[#3D3D3D] text-[#CCCCCC] hover:text-[#FFFFFF] focus:ring-[#A855F7]"
              : "bg-zinc-50 border border-black/[0.08] hover:bg-zinc-100 text-zinc-700 focus:ring-indigo-500/20"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span className="flex items-center gap-2 truncate">
            <span className={`w-2 h-2 rounded-full shrink-0 ${current.dotClass}`} />
            <span className="truncate">{current.label}</span>
          </span>
          <ChevronDown className="w-3 h-3 text-[#737373] shrink-0" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className={
            `${dropUp ? "bottom-full mb-1" : ""} ${
              isDark
                ? "bg-[#181818] border-[#2A2A2A] text-zinc-900 min-w-[160px]"
                : "bg-white border-zinc-200 text-zinc-900 min-w-[160px]"
            }`
          }
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
            {STATUSES.map((status) => {
              const meta = STATUS_META[status] || { label: status, dotClass: "bg-zinc-400" };
              return (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={value === status}
                  onCheckedChange={() => onChange(status)}
                  className={
                    isDark
                      ? "hover:bg-zinc-100 text-zinc-800 hover:text-zinc-950"
                      : "hover:bg-zinc-100 text-zinc-800"
                  }
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dotClass}`} />
                  <span>{meta.label}</span>
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
export default StatusDropdown;
