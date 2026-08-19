import type { ComponentType } from "react";
import type { Platform } from "./mock-data";
import {
  AndroidMark,
  AppleMark,
  ExtensionPuzzleMark,
  LinuxMark,
  UnityMark,
  UnrealEngineMark,
  WebGlobeMark,
  WindowsMark,
} from "@/app/components/PlatformIcons";

export const PLATFORM_META: Record<Platform, { label: string; Icon: ComponentType<{ className?: string }> }> = {
  iOS: { label: "iOS", Icon: AppleMark },
  Android: { label: "Android", Icon: AndroidMark },
  Windows: { label: "Windows", Icon: WindowsMark },
  macOS: { label: "macOS", Icon: AppleMark },
  Linux: { label: "Linux", Icon: LinuxMark },
  Web: { label: "Web", Icon: WebGlobeMark },
  拡張機能: { label: "拡張機能", Icon: ExtensionPuzzleMark },
  Unity: { label: "Unity", Icon: UnityMark },
  "Unreal Engine": { label: "Unreal Engine", Icon: UnrealEngineMark },
};

export const PLATFORM_ORDER: Platform[] = [
  "Web",
  "iOS",
  "Android",
  "Windows",
  "macOS",
  "Linux",
  "拡張機能",
  "Unity",
  "Unreal Engine",
];
