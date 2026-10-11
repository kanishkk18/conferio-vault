"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Slot } from "@radix-ui/react-slot";
import { AnimatePresence, motion } from "motion/react";
import useMeasure from "react-use-measure";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

type ViewComponent = React.ComponentType<Record<string, unknown>>;

interface ViewsRegistry {
  [viewName: string]: ViewComponent;
}

// ============================================================================
// Context
// ============================================================================

interface FamilyDrawerContextValue {
  isOpen: boolean;
  view: string;
  setView: (view: string) => void;
  opacityDuration: number;
  elementRef: ReturnType<typeof useMeasure>[0];
  bounds: ReturnType<typeof useMeasure>[1];
  views: ViewsRegistry | undefined;
}

const FamilyDrawerContext = createContext<FamilyDrawerContextValue | undefined>(
  undefined,
);

function useFamilyDrawer() {
  const context = useContext(FamilyDrawerContext);
  if (!context) {
    throw new Error(
      "FamilyDrawer components must be used within FamilyDrawerRoot",
    );
  }
  return context;
}

// ============================================================================
// Root
// ============================================================================

interface FamilyDrawerRootProps {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultView?: string;
  onViewChange?: (view: string) => void;
  views?: ViewsRegistry;
}

function FamilyDrawerRoot({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  defaultView = "default",
  onViewChange,
  views: customViews,
}: FamilyDrawerRootProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [view, setView] = useState(defaultView);
  const [elementRef, bounds] = useMeasure();
  const previousHeightRef = useRef<number>(0);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  const opacityDuration = useMemo(() => {
    const currentHeight = bounds.height;
    const previousHeight = previousHeightRef.current;
    const MIN_DURATION = 0.15;
    const MAX_DURATION = 0.27;

    if (!previousHeightRef.current) {
      previousHeightRef.current = currentHeight;
      return MIN_DURATION;
    }

    const heightDifference = Math.abs(currentHeight - previousHeight);
    previousHeightRef.current = currentHeight;
    return Math.min(Math.max(heightDifference / 500, MIN_DURATION), MAX_DURATION);
  }, [bounds.height]);

  const handleViewChange = (newView: string) => {
    setView(newView);
    onViewChange?.(newView);
  };

  const views =
    customViews && Object.keys(customViews).length > 0 ? customViews : undefined;

  const contextValue: FamilyDrawerContextValue = {
    isOpen,
    view,
    setView: handleViewChange,
    opacityDuration,
    elementRef,
    bounds,
    views,
  };

  return (
    <FamilyDrawerContext.Provider value={contextValue}>
      <Drawer.Root
        open={isOpen}
        onOpenChange={setIsOpen}
        shouldScaleBackground={false}
      >
        {children}
      </Drawer.Root>
    </FamilyDrawerContext.Provider>
  );
}

// ============================================================================
// Trigger
// ============================================================================

interface FamilyDrawerTriggerProps {
  children: ReactNode;
  asChild?: boolean;
  className?: string;
}

function FamilyDrawerTrigger({
  children,
  asChild = false,
  className,
}: FamilyDrawerTriggerProps) {
  if (asChild) {
    return (
      <Drawer.Trigger asChild>
        <Slot>{children}</Slot>
      </Drawer.Trigger>
    );
  }
  return (
    <Drawer.Trigger asChild>
      <button
        className={cn(
          "bg-background text-foreground hover:bg-accent fixed top-1/2 left-1/2 h-[44px] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border px-4 py-2 font-medium transition-colors",
          className,
        )}
        type="button"
      >
        {children}
      </button>
    </Drawer.Trigger>
  );
}

// ============================================================================
// Portal
// ============================================================================

function FamilyDrawerPortal({ children }: { children: ReactNode }) {
  return <Drawer.Portal>{children}</Drawer.Portal>;
}

// ============================================================================
// Overlay
// ============================================================================

interface FamilyDrawerOverlayProps {
  className?: string;
  onClick?: () => void;
}

function FamilyDrawerOverlay({ className, onClick }: FamilyDrawerOverlayProps) {
  const { setView } = useFamilyDrawer();
  return (
    <Drawer.Overlay
      className={cn("fixed inset-0 z-50 bg-black/60 backdrop-blur-sm", className)}
      onClick={onClick || (() => setView("default"))}
    />
  );
}

// ============================================================================
// Content — keyboard-aware, mobile-first
// ============================================================================

interface FamilyDrawerContentProps {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
}

function FamilyDrawerContent({
  children,
  className,
  asChild = false,
}: FamilyDrawerContentProps) {
  const { bounds } = useFamilyDrawer();

  /* ── Track the real visible area (shrinks when mobile keyboard opens) ── */
  const [visibleHeight, setVisibleHeight] = useState(() =>
    typeof window !== "undefined"
      ? (window.visualViewport?.height ?? window.innerHeight)
      : 800,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      setVisibleHeight(h);
    };

    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, []);

  /* ── Cap drawer at 85 % of visible area so it never hides behind keyboard ── */
  const maxDrawerPx = visibleHeight * 0.85;
  const targetHeight = bounds.height > 0 ? Math.min(bounds.height, maxDrawerPx) : undefined;

  const content = (
    <motion.div
      animate={{
        height: targetHeight,
        transition: { duration: 0.27, ease: [0.25, 1, 0.5, 1] },
      }}
      className="overflow-y-auto overscroll-contain"
    >
      {children}
    </motion.div>
  );

  const containerClass = cn(
    "fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md overflow-hidden rounded-t-[28px] outline-none",
    className,
  );

  if (asChild) {
    return (
      <Drawer.Content asChild className={containerClass}>
        <Slot>{content}</Slot>
      </Drawer.Content>
    );
  }

  return (
    <Drawer.Content asChild className={containerClass}>
      {content}
    </Drawer.Content>
  );
}

// ============================================================================
// Animated Wrapper
// ============================================================================

interface FamilyDrawerAnimatedWrapperProps {
  children: ReactNode;
  className?: string;
}

function FamilyDrawerAnimatedWrapper({
  children,
  className,
}: FamilyDrawerAnimatedWrapperProps) {
  const { elementRef } = useFamilyDrawer();
  return (
    <div
      ref={elementRef}
      className={cn("px-5 pt-2 pb-8 antialiased", className)}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Animated Content
// ============================================================================

interface FamilyDrawerAnimatedContentProps {
  children: ReactNode;
}

function FamilyDrawerAnimatedContent({
  children,
}: FamilyDrawerAnimatedContentProps) {
  const { view, opacityDuration } = useFamilyDrawer();
  return (
    <AnimatePresence initial={false} mode="popLayout" custom={view}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        key={view}
        transition={{ duration: opacityDuration, ease: [0.26, 0.08, 0.25, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// Close
// ============================================================================

interface FamilyDrawerCloseProps {
  children?: ReactNode;
  asChild?: boolean;
  className?: string;
}

function FamilyDrawerClose({
  children,
  asChild = false,
  className,
}: FamilyDrawerCloseProps) {
  const defaultClose = (
    <button
      data-vaul-no-drag=""
      className={cn(
        "absolute top-3 right-4 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/[0.08] text-white/50 transition-all hover:bg-white/[0.14] hover:text-white/80 active:scale-90",
        className,
      )}
      type="button"
    >
      {children || <CloseIcon />}
    </button>
  );

  if (asChild) {
    return (
      <Drawer.Close asChild>
        <Slot>{defaultClose}</Slot>
      </Drawer.Close>
    );
  }
  return <Drawer.Close asChild>{defaultClose}</Drawer.Close>;
}

// ============================================================================
// Helpers
// ============================================================================

type FamilyDrawerTitleProps = React.ComponentProps<typeof Drawer.Title>;

function FamilyDrawerTitle({ className, ...props }: FamilyDrawerTitleProps) {
  return (
    <Drawer.Title
      data-slot="family-drawer-title"
      className={cn("text-[22px] font-semibold", className)}
      {...props}
    />
  );
}

type FamilyDrawerDescriptionProps = React.ComponentProps<typeof Drawer.Description>;

function FamilyDrawerDescription({
  className,
  ...props
}: FamilyDrawerDescriptionProps) {
  return (
    <Drawer.Description
      data-slot="family-drawer-description"
      className={cn("text-[15px] leading-[22px] font-medium text-white/50", className)}
      {...props}
    />
  );
}

interface FamilyDrawerHeaderProps {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
}

function FamilyDrawerHeader({
  icon,
  title,
  description,
  className,
}: FamilyDrawerHeaderProps) {
  return (
    <header className={cn("mt-4", className)}>
      {icon}
      <FamilyDrawerTitle className="mt-2.5">{title}</FamilyDrawerTitle>
      <FamilyDrawerDescription className="mt-2">{description}</FamilyDrawerDescription>
    </header>
  );
}

interface FamilyDrawerButtonProps {
  children: ReactNode;
  onClick: () => void;
  className?: string;
  asChild?: boolean;
}

function FamilyDrawerButton({
  children,
  onClick,
  className,
  asChild = false,
}: FamilyDrawerButtonProps) {
  const button = (
    <button
      data-vaul-no-drag=""
      className={cn(
        "flex h-12 w-full cursor-pointer items-center gap-[15px] rounded-2xl bg-white/[0.06] px-4 text-[15px] font-semibold text-white transition-all hover:bg-white/[0.1] active:scale-[0.97]",
        className,
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
  if (asChild) return <Slot>{button}</Slot>;
  return button;
}

interface FamilyDrawerSecondaryButtonProps {
  children: ReactNode;
  onClick: () => void;
  className: string;
  asChild?: boolean;
}

function FamilyDrawerSecondaryButton({
  children,
  onClick,
  className,
  asChild = false,
}: FamilyDrawerSecondaryButtonProps) {
  const button = (
    <button
      data-vaul-no-drag=""
      type="button"
      className={cn(
        "flex h-12 w-full cursor-pointer items-center justify-center gap-[15px] rounded-full text-center text-[15px] font-semibold transition-all active:scale-[0.97]",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
  if (asChild) return <Slot>{button}</Slot>;
  return button;
}

// ============================================================================
// View Content Renderer
// ============================================================================

interface FamilyDrawerViewContentProps {
  views?: ViewsRegistry;
}

function FamilyDrawerViewContent(
  { views: propViews }: FamilyDrawerViewContentProps = {} as FamilyDrawerViewContentProps,
) {
  const { view, views: contextViews } = useFamilyDrawer();
  const views = propViews || contextViews;
  if (!views) throw new Error("FamilyDrawerViewContent requires views");
  const ViewComponent = views[view];
  if (!ViewComponent) {
    const DefaultComponent = views.default;
    return DefaultComponent ? <DefaultComponent /> : null;
  }
  return <ViewComponent />;
}

// ============================================================================
// Icons
// ============================================================================

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <title>Close</title>
      <path d="M10.5 2L2 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10.5 10.5L2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ============================================================================
// Exports
// ============================================================================

export {
  FamilyDrawerRoot,
  FamilyDrawerTrigger,
  FamilyDrawerPortal,
  FamilyDrawerOverlay,
  FamilyDrawerContent,
  FamilyDrawerAnimatedWrapper,
  FamilyDrawerAnimatedContent,
  FamilyDrawerClose,
  FamilyDrawerHeader,
  FamilyDrawerTitle,
  FamilyDrawerDescription,
  FamilyDrawerButton,
  FamilyDrawerSecondaryButton,
  FamilyDrawerViewContent,
  useFamilyDrawer,
  type ViewsRegistry,
  type ViewComponent,
};