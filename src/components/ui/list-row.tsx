import type { ComponentProps, ReactNode } from "react";
import { cn } from "cn";
import { ArrowUpRight } from "@/components/ui/icons";

type ListRowProps = ComponentProps<"button"> & {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
};

export function ListRow({ icon, title, description, className, ...props }: ListRowProps) {
  return (
    <button
      type="button"
      className={cn(
        "group/row flex w-full min-w-0 items-center gap-4 rounded-[14px] py-1.5 pe-1 text-left transition-[scale] duration-200 ease-out-quint outline-none focus-visible:ring-3 focus-visible:ring-ring active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-[13px] bg-secondary text-card-foreground transition-colors duration-200 ease-out-quint group-hover/row:bg-accent">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-card-foreground">{title}</span>
        <span className="block truncate text-[13px] text-muted-foreground">{description}</span>
      </span>
      <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition-[translate,color] duration-200 ease-out-quint group-hover/row:translate-x-0.5 group-hover/row:-translate-y-0.5 group-hover/row:text-card-foreground" />
    </button>
  );
}
