import type { ComponentProps } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Add01Icon,
  Alert01Icon,
  ArrowDataTransferVerticalIcon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  ArrowUpRight01Icon,
  Cancel01Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  CircleIcon,
  CodeIcon,
  Copy01Icon,
  Delete02Icon,
  FileCodeIcon,
  Files01Icon,
  Folder01Icon,
  FolderOpenIcon,
  GitBranchIcon,
  GitForkIcon,
  InformationCircleIcon,
  Key01Icon,
  Loading03Icon,
  Moon02Icon,
  NeuralNetworkIcon,
  RefreshCwIcon,
  Search01Icon,
  SecurityCheckIcon,
  SquareArrowUpRightIcon,
  StopIcon,
  Sun03Icon,
  Tick02Icon,
  ViewIcon,
  ViewOffIcon,
  WorkflowIcon,
} from "@hugeicons/core-free-icons";

type IconProps = Omit<ComponentProps<typeof HugeiconsIcon>, "icon">;

function createIcon(icon: IconSvgElement) {
  return function Icon(props: IconProps) {
    return <HugeiconsIcon icon={icon} {...props} />;
  };
}

export const ArrowUp = createIcon(ArrowUp01Icon);
export const ArrowUpRight = createIcon(ArrowUpRight01Icon);
export const Braces = createIcon(CodeIcon);
export const Check = createIcon(Tick02Icon);
export const CheckIcon = createIcon(Tick02Icon);
export const ChevronDown = createIcon(ArrowDown01Icon);
export const ChevronRight = createIcon(ArrowRight01Icon);
export const ChevronRightIcon = createIcon(ArrowRight01Icon);
export const ChevronsUpDown = createIcon(ArrowDataTransferVerticalIcon);
export const Circle = createIcon(CircleIcon);
export const CircleCheckIcon = createIcon(CheckmarkCircle02Icon);
export const Copy = createIcon(Copy01Icon);
export const CopyIcon = createIcon(Copy01Icon);
export const ExternalLink = createIcon(SquareArrowUpRightIcon);
export const Eye = createIcon(ViewIcon);
export const EyeOff = createIcon(ViewOffIcon);
export const FileCode2 = createIcon(FileCodeIcon);
export const Files = createIcon(Files01Icon);
export const Folder = createIcon(Folder01Icon);
export const FolderOpen = createIcon(FolderOpenIcon);
export const GitBranch = createIcon(GitBranchIcon);
export const GitFork = createIcon(GitForkIcon);
export const InfoIcon = createIcon(InformationCircleIcon);
export const KeyRound = createIcon(Key01Icon);
export const Loader2Icon = createIcon(Loading03Icon);
export const Moon = createIcon(Moon02Icon);
export const Network = createIcon(NeuralNetworkIcon);
export const OctagonXIcon = createIcon(CancelCircleIcon);
export const Plus = createIcon(Add01Icon);
export const RefreshCw = createIcon(RefreshCwIcon);
export const Search = createIcon(Search01Icon);
export const ShieldCheck = createIcon(SecurityCheckIcon);
export const Stop = createIcon(StopIcon);
export const Sun = createIcon(Sun03Icon);
export const Trash2 = createIcon(Delete02Icon);
export const TriangleAlertIcon = createIcon(Alert01Icon);
export const Workflow = createIcon(WorkflowIcon);
export const XIcon = createIcon(Cancel01Icon);
